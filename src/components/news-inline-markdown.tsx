import type { ReactNode } from "react";

function findClosingMarker(value: string, marker: string, start: number): number {
  const closingIndex = value.indexOf(marker, start);
  return closingIndex > start ? closingIndex : -1;
}

export function renderInlineNewsMarkdown(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const boldIndex = value.indexOf("**", cursor);
    const rawItalicIndex = value.indexOf("*", cursor);
    const italicIndex =
      rawItalicIndex !== -1 &&
      value[rawItalicIndex + 1] !== "*" &&
      value[rawItalicIndex - 1] !== "*"
        ? rawItalicIndex
        : -1;
    const nextIndex =
      boldIndex !== -1 && (italicIndex === -1 || boldIndex <= italicIndex) ? boldIndex : italicIndex;

    if (nextIndex === -1) {
      nodes.push(value.slice(cursor));
      break;
    }

    if (nextIndex > cursor) {
      nodes.push(value.slice(cursor, nextIndex));
    }

    if (nextIndex === boldIndex) {
      const contentStart = nextIndex + 2;
      const contentEnd = findClosingMarker(value, "**", contentStart);
      if (contentEnd === -1) {
        nodes.push(value.slice(nextIndex));
        break;
      }

      nodes.push(<strong key={`strong-${nodes.length}`}>{value.slice(contentStart, contentEnd)}</strong>);
      cursor = contentEnd + 2;
      continue;
    }

    const contentStart = nextIndex + 1;
    const contentEnd = findClosingMarker(value, "*", contentStart);
    if (contentEnd === -1) {
      nodes.push(value.slice(nextIndex));
      break;
    }

    nodes.push(<em key={`em-${nodes.length}`}>{value.slice(contentStart, contentEnd)}</em>);
    cursor = contentEnd + 1;
  }

  return nodes;
}
