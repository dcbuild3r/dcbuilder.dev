function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function decodeHtmlEntities(input = ""): string {
  return input
    .replace(/&#(\d+);/g, (_, value: string) =>
      String.fromCodePoint(Number(value))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
      String.fromCodePoint(parseInt(value, 16))
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanInlineText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\s+/g, " ")
    .replace(/^[:\-\s]+|[:\-\s]+$/g, "")
    .trim();
}

function cleanMevHeadline(text: string): string {
  let cleaned = cleanInlineText(text).replace(/[.!?]+$/g, "");

  const colonParts = cleaned.split(":").map((part) => part.trim()).filter(Boolean);
  if (colonParts.length >= 2 && colonParts[1]?.includes(",")) {
    cleaned = colonParts[0];
  }

  return cleaned;
}

function formatReadableList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function extractMevLetterIssueNumber(title: string): string | null {
  const match = title.match(/the mev letter #(\d+)/i);
  return match?.[1] ?? null;
}

function isMevLetterUrl(url: string): boolean {
  return /^https?:\/\/collective\.flashbots\.net\/t\/the-mev-letter-\d+\/\d+/i.test(
    url.trim()
  );
}

function extractFirstSection(html: string): string {
  const contentIndex = html.search(
    /<div\b[^>]*(class=["'][^"']*\bcooked\b[^"']*["'][^>]*|itemprop=["']text["'])[^>]*>/i
  );
  const contentHtml = contentIndex === -1 ? html : html.slice(contentIndex);

  const firstHeadingIndex = contentHtml.search(/<h1\b/i);
  if (firstHeadingIndex === -1) {
    return "";
  }

  const firstHeadingCloseIndex = contentHtml.indexOf("</h1>", firstHeadingIndex);
  if (firstHeadingCloseIndex === -1) {
    return "";
  }

  const sectionStart = firstHeadingCloseIndex + "</h1>".length;
  const remainingHtml = contentHtml.slice(sectionStart);
  const nextHeadingOffset = remainingHtml.search(/<h1\b/i);

  return remainingHtml.slice(0, nextHeadingOffset === -1 ? undefined : nextHeadingOffset);
}

function extractTopLevelAnchorTitlesFromSection(sectionHtml: string): string[] {
  const items: string[] = [];
  const tokenPattern = /<\/?([a-z0-9]+)\b[^>]*>|([^<]+)/gi;

  let ulDepth = 0;
  let inTopLevelLi = false;
  let captureAnchorText = false;
  let currentAnchorText = "";

  for (const match of sectionHtml.matchAll(tokenPattern)) {
    const [token, rawTagName, textChunk = ""] = match;
    if (!rawTagName) {
      if (captureAnchorText && textChunk) {
        currentAnchorText += textChunk;
      }
      continue;
    }

    const tagName = rawTagName.toLowerCase();
    const isClosingTag = token.startsWith("</");

    if (!isClosingTag) {
      if (tagName === "ul") {
        ulDepth += 1;
        continue;
      }

      if (tagName === "li" && ulDepth === 1 && !inTopLevelLi) {
        inTopLevelLi = true;
        currentAnchorText = "";
        captureAnchorText = false;
        continue;
      }

      if (tagName === "a" && inTopLevelLi && ulDepth === 1 && !currentAnchorText) {
        captureAnchorText = true;
      }

      continue;
    }

    if (tagName === "a") {
      captureAnchorText = false;
      continue;
    }

    if (tagName === "li" && inTopLevelLi && ulDepth === 1) {
      const cleanedTitle = cleanMevHeadline(currentAnchorText);
      if (cleanedTitle) {
        items.push(cleanedTitle);
      }
      inTopLevelLi = false;
      currentAnchorText = "";
      captureAnchorText = false;
      continue;
    }

    if (tagName === "ul") {
      ulDepth = Math.max(ulDepth - 1, 0);
    }
  }

  return items;
}

export function buildFallbackNewsDescription(title: string): string {
  const normalized = title.trim().replace(/[.!?]+$/g, "");
  const lower = normalized.toLowerCase();

  if (!normalized) {
    return "";
  }

  if (lower.startsWith("announcing ")) {
    return ensureSentence(`${normalized.slice(11)} is being announced`);
  }

  if (lower.startsWith("introducing ")) {
    return ensureSentence(`${normalized.slice(12)} is being introduced`);
  }

  return ensureSentence(normalized);
}

export function buildMevLetterDescriptionFromHtml(
  title: string,
  html: string
): string | null {
  const issueNumber = extractMevLetterIssueNumber(title);
  if (!issueNumber) {
    return null;
  }

  const firstSection = extractFirstSection(html);
  if (!firstSection) {
    return null;
  }

  const headliners = extractTopLevelAnchorTitlesFromSection(firstSection).slice(0, 4);
  if (headliners.length === 0) {
    return null;
  }

  return ensureSentence(`Issue #${issueNumber} covers ${formatReadableList(headliners)}`);
}

export function isGenericMevLetterDescription(description: string): boolean {
  const normalized = cleanInlineText(description);
  if (!normalized) {
    return true;
  }

  return [
    /^The weekly MEV Letter summarizes the latest MEV research, discussions, and developments, with links for further reading\.?$/i,
    /^The MEV Letter is a weekly collection of papers, articles and resources related to MEV\./i,
    /^Flashbots publishes issue #\d+ of The MEV Letter, a weekly roundup of MEV papers, articles, threads, talks, and ecosystem resources\.?$/i,
  ].some((pattern) => pattern.test(normalized));
}

export function isMevLetterItem(title: string, url: string): boolean {
  return Boolean(extractMevLetterIssueNumber(title)) || isMevLetterUrl(url);
}

export function shouldRefreshMevLetterDescription(
  title: string,
  url: string,
  description?: string | null
): boolean {
  return isMevLetterItem(title, url) && (!description || isGenericMevLetterDescription(description));
}

export function resolveMevLetterDescription({
  title,
  url,
  description,
  html,
}: {
  title: string;
  url: string;
  description?: string | null;
  html: string;
}): string | undefined {
  const normalizedDescription = description?.trim() || undefined;
  if (!shouldRefreshMevLetterDescription(title, url, normalizedDescription)) {
    return normalizedDescription;
  }

  return buildMevLetterDescriptionFromHtml(title, html) ?? normalizedDescription;
}
