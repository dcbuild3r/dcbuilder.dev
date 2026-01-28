import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

type JobBlock = { start: number; end: number; text: string };

const toAscii = (input: string) =>
	input
		.replace(/[\u2013\u2014]/g, "-")
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");

const decodeEntities = (input: string) =>
	input
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

const stripHtml = (html: string) => {
	const withoutScripts = html
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ");
	const withBreaks = withoutScripts
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n")
		.replace(/<\/li>/gi, "\n")
		.replace(/<\/h[1-6]>/gi, "\n");
	const text = withBreaks.replace(/<[^>]+>/g, " ");
	return toAscii(decodeEntities(text))
		.replace(/\r/g, "")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
};

const parseJobs = (content: string) => {
	const start = content.indexOf("export const jobs");
	if (start === -1) throw new Error("Jobs array not found");
	const assignment = content.indexOf("=", start);
	if (assignment === -1) throw new Error("Jobs array assignment not found");
	const arrayStart = content.indexOf("[", assignment);
	if (arrayStart === -1) throw new Error("Jobs array opening not found");

	let i = arrayStart + 1;
	let inString: string | null = null;
	let escape = false;
	let braceDepth = 0;
	let objectStart = -1;
	const blocks: JobBlock[] = [];

	while (i < content.length) {
		const char = content[i];
		if (inString) {
			if (escape) {
				escape = false;
			} else if (char === "\\") {
				escape = true;
			} else if (char === inString) {
				inString = null;
			}
			i += 1;
			continue;
		}

		if (char === '"' || char === "'" || char === "`") {
			inString = char;
			i += 1;
			continue;
		}

		if (char === "{") {
			if (braceDepth === 0) {
				objectStart = i;
			}
			braceDepth += 1;
		} else if (char === "}") {
			braceDepth -= 1;
			if (braceDepth === 0 && objectStart !== -1) {
				const end = i + 1;
				blocks.push({ start: objectStart, end, text: content.slice(objectStart, end) });
				objectStart = -1;
			}
		} else if (char === "]" && braceDepth === 0) {
			break;
		}
		i += 1;
	}

	return blocks;
};

const formatAmount = (raw: string) => {
	const hasEuro = raw.includes("€") || /eur/i.test(raw);
	const currencySymbol = hasEuro ? "€" : "$";
	const cleaned = raw
		.replace(/eur/gi, "")
		.replace(/[€, $]/g, "")
		.replace(/\s+/g, "")
		.replace(/k$/i, "");
	const value = Number(cleaned);
	if (!Number.isFinite(value)) return null;
	const multiplier = /k$/i.test(raw) ? 1000 : 1;
	const finalValue = Math.round(value * multiplier);
	return `${currencySymbol}${finalValue.toLocaleString("en-US")}`;
};

const extractSalary = (text: string) => {
	const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
	const amountRegex = /[$€]\s*\d[\d,]*(?:\.\d+)?\s*k?|eur\s*\d[\d,]*(?:\.\d+)?\s*k?/gi;
	const salaryKeywords = ["salary", "compensation", "pay range", "base pay", "range"];

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const lower = line.toLowerCase();
		if (!salaryKeywords.some((keyword) => lower.includes(keyword))) continue;

		const candidates = [line, lines[i + 1] ?? "", lines[i + 2] ?? ""].join(" ");
		const amounts = candidates.match(amountRegex) ?? [];
		if (amounts.length >= 2) {
			const low = formatAmount(amounts[0]);
			const high = formatAmount(amounts[1]);
			if (low && high) return `${low} - ${high}`;
		}
		if (amounts.length === 1) {
			const single = formatAmount(amounts[0]);
			if (single) return single;
		}
	}

	const fallbackAmounts = text.match(amountRegex) ?? [];
	if (fallbackAmounts.length >= 2) {
		const low = formatAmount(fallbackAmounts[0]);
		const high = formatAmount(fallbackAmounts[1]);
		if (low && high) return `${low} - ${high}`;
	}
	if (fallbackAmounts.length === 1) {
		const single = formatAmount(fallbackAmounts[0]);
		if (single) return single;
	}
	return null;
};

const insertSalary = (blockText: string, salary: string) => {
	const salaryLine = `\t\tsalary: "${salary}",`;
	const insertAfterCandidates = ["department", "type", "location"];
	let insertPos = -1;
	for (const key of insertAfterCandidates) {
		const match = blockText.match(new RegExp(`\\b${key}\\s*:[^\\n]*`));
		if (match && match.index !== undefined) {
			const lineEnd = blockText.indexOf("\n", match.index);
			insertPos = lineEnd === -1 ? blockText.length : lineEnd + 1;
			break;
		}
	}

	if (insertPos === -1) return blockText;
	return blockText.slice(0, insertPos) + salaryLine + "\n" + blockText.slice(insertPos);
};

const removeSalary = (blockText: string) =>
	blockText.replace(/\n\t\tsalary:\s*"[^"]+",?/g, "");

const fetchSalary = async (page: { goto: Function; waitForSelector: Function; evaluate: Function }, url: string) => {
	try {
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
		await page.waitForSelector("h1", { timeout: 15000 });
		const text = await page.evaluate(() => document.body.innerText);
		return extractSalary(text ?? "");
	} catch {
		return null;
	}
};

const run = async () => {
	const filePath = path.resolve("src/data/jobs.ts");
	const content = await fs.readFile(filePath, "utf8");
	const blocks = parseJobs(content);

	const worldBlocks = blocks.filter((block) =>
		block.text.includes("company: companies.world"),
	);
	console.log(`Found ${worldBlocks.length} World jobs.`);

	const updates = new Map<number, string>();
	const queue = worldBlocks.filter((block) => {
		const salaryMatch = block.text.match(/\bsalary:\s*"([^"]+)"/);
		if (!salaryMatch) return true;
		const value = salaryMatch[1];
		const looksInvalid =
			value.endsWith(",") ||
			(!value.includes("-") && value.replace(/[^0-9]/g, "").length < 5);
		return looksInvalid;
	});
	console.log(`Checking salary for ${queue.length} World jobs.`);

	const concurrency = 2;
	let cursor = 0;
	const workers: Array<Promise<void>> = [];

	const browser = await chromium.launch({ headless: true });

	const worker = async () => {
		const page = await browser.newPage();
		while (cursor < queue.length) {
			const current = queue[cursor];
			cursor += 1;
			const linkMatch = current.text.match(/\blink:\s*"([^"]+)"/);
			if (!linkMatch) continue;
			const link = linkMatch[1];
			const salary = await fetchSalary(page, link);
			if (!salary) {
				if (/\bsalary\s*:/.test(current.text)) {
					const updated = removeSalary(current.text);
					updates.set(current.start, updated);
					console.log(`Removed invalid salary: ${link}`);
				} else {
					console.log(`No salary found: ${link}`);
				}
				continue;
			}
			const updated = insertSalary(removeSalary(current.text), salary);
			updates.set(current.start, updated);
			console.log(`Set salary ${salary}`);
		}
		await page.close();
	};

	for (let i = 0; i < concurrency; i += 1) {
		workers.push(worker());
	}
	await Promise.all(workers);
	await browser.close();

	if (updates.size === 0) {
		console.log("No updates needed.");
		return;
	}

	let nextIndex = 0;
	let output = "";
	for (const block of blocks) {
		const updated = updates.get(block.start);
		output += content.slice(nextIndex, block.start);
		output += updated ?? block.text;
		nextIndex = block.end;
	}
	output += content.slice(nextIndex);

	await fs.writeFile(filePath, output);
	console.log(`Wrote updates to ${filePath}`);
};

void run();
