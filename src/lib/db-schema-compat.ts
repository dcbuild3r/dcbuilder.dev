type ErrorLike = {
  cause?: unknown;
  code?: unknown;
  message?: unknown;
  query?: unknown;
};

function collectErrorMetadata(error: unknown) {
  const texts: string[] = [];
  const codes: string[] = [];
  const queue: unknown[] = [error];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || seen.has(current)) {
      continue;
    }

    if (typeof current === "string") {
      texts.push(current);
      continue;
    }

    if (typeof current !== "object") {
      continue;
    }

    seen.add(current);

    const candidate = current as ErrorLike;

    if (typeof candidate.message === "string") {
      texts.push(candidate.message);
    }

    if (typeof candidate.query === "string") {
      texts.push(candidate.query);
    }

    if (typeof candidate.code === "string") {
      codes.push(candidate.code);
    }

    if (candidate.cause) {
      queue.push(candidate.cause);
    }
  }

  return { texts, codes };
}

export function isMissingColumnError(error: unknown, columnName: string): boolean {
  const { texts, codes } = collectErrorMetadata(error);

  const referencesColumn = texts.some(
    (text) =>
      text.includes(`"${columnName}"`) ||
      text.includes(`.${columnName}`) ||
      text.includes(`"${columnName}" does not exist`)
  );

  const missingColumn =
    codes.includes("42703") || texts.some((text) => text.includes("does not exist"));

  return missingColumn && referencesColumn;
}
