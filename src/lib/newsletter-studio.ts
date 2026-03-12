export type NewsletterStudioMode = "compose" | "queue" | "subscribers" | "templates";

export function canAutoRenderComposePreview(input: {
  loading: boolean;
  mode: NewsletterStudioMode;
  draft: {
    contentMode: "template" | "markdown" | "manual";
    markdownContent: string;
    manualHtml: string;
    manualText: string;
  };
}) {
  if (input.loading || input.mode !== "compose") {
    return false;
  }

  if (input.draft.contentMode === "template") {
    return true;
  }

  if (input.draft.contentMode === "markdown") {
    return input.draft.markdownContent.trim().length > 0;
  }

  return input.draft.manualHtml.trim().length > 0 && input.draft.manualText.trim().length > 0;
}

export function shouldLoadSubscribersOnModeChange(input: {
  nextMode: NewsletterStudioMode;
  subscribersLoaded: boolean;
  subscribersLoading: boolean;
}) {
  return (
    input.nextMode === "subscribers" &&
    !input.subscribersLoaded &&
    !input.subscribersLoading
  );
}

export function nextAvailabilityErrorAfterSubscribersRefresh(input: {
  previousAvailabilityError: string | null;
  subscriberAvailabilityReason: string | null;
}) {
  return input.subscriberAvailabilityReason ?? null;
}
