// Source display names and colors for blog posts

// Map internal source names to display names
const sourceDisplayMap: Record<string, string> = {
  Mirror: "Paragraph",
  mirror: "Paragraph",
};

// Source-specific colors (brand colors where applicable)
const sourceColors: Record<string, string> = {
  // Paragraph (formerly Mirror) - light blue
  Paragraph: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  paragraph: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  Mirror: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  mirror: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",

  // Substack - orange brand color
  Substack: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  substack: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

// Fallback colors for other sources
const fallbackColors = [
  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getSourceDisplay(source: string): string {
  return sourceDisplayMap[source] || source;
}

export function getSourceColor(source: string): string {
  // Check for specific source colors first
  if (sourceColors[source]) {
    return sourceColors[source];
  }

  // Fall back to hash-based color for unknown sources
  const index = hashString(source.toLowerCase()) % fallbackColors.length;
  return fallbackColors[index];
}
