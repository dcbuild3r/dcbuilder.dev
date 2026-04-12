export function isMissingColumnError(error: unknown, columnName: string): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (!message) return false;

  return (
    message.includes("does not exist") &&
    (message.includes(`"${columnName}"`) || message.includes(`.${columnName}`))
  );
}
