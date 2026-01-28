import { chromium } from "@playwright/test";

const links = [
	"https://jobs.ashbyhq.com/category-labs/ea8cf4f7-0db7-43e9-afa0-b4317db024ff",
	"https://jobs.ashbyhq.com/category-labs/45f674b2-d904-482e-a5e6-ece40b972e5a",
	"https://jobs.ashbyhq.com/category-labs/e5c34899-cea1-4d25-beae-56e21acef3dd",
	"https://jobs.ashbyhq.com/category-labs/776ce314-aa12-471b-921a-98e93d3a8584",
	"https://jobs.ashbyhq.com/category-labs/bdfe89a6-83f6-4ab3-b642-180b7e2814a9",
	"https://jobs.ashbyhq.com/category-labs/96ffb6ca-8c66-4570-9bd0-f8f0eb57c969",
	"https://jobs.ashbyhq.com/category-labs/015934c5-66e5-4042-94bb-aae0502cfea2",
];

const normalize = (text: string) =>
	text
		.replace(/\r/g, "")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

const extractSections = (text: string) => {
	const lines = normalize(text)
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	const sections: Record<string, string[]> = {};
	let current = "intro";
	sections[current] = [];

	for (const line of lines) {
		const lower = line.toLowerCase();
		if (
			[
				"about the role",
				"about the position",
				"job description",
				"role overview",
				"the role",
				"responsibilities",
				"what you'll do",
				"what you will do",
				"what we are looking for",
				"requirements",
				"qualifications",
				"what we offer",
				"benefits",
				"compensation",
				"nice to have",
			].includes(lower)
		) {
			current = lower;
			sections[current] = [];
			continue;
		}
		sections[current].push(line);
	}

	return sections;
};

const run = async () => {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	for (const link of links) {
		await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });
		await page.waitForSelector("h1", { timeout: 15000 });
		const title = await page.locator("h1").first().innerText();
		const text = await page.evaluate(() => document.body.innerText);
		const sections = extractSections(text || "");
		console.log(JSON.stringify({ link, title, sections }, null, 2));
	}

	await page.close();
	await browser.close();
};

void run();
