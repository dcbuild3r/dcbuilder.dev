export type NewsletterStudioMode = "compose" | "queue" | "subscribers" | "templates";

export const NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME = "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8";

export function getNewsletterStarterHeadingClassName(level: number) {
  if (level === 2) {
    return "mb-6 mt-0 border-b border-neutral-900 pb-4 text-4xl font-black tracking-tight text-neutral-950 dark:border-neutral-100 dark:text-neutral-50";
  }

  if (level === 3) {
    return "mb-4 mt-8 text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50";
  }

  return "text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50";
}

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
