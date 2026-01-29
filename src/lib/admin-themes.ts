// Centralized color themes for admin sections

export type AdminSection =
  | "jobs"
  | "candidates"
  | "investments"
  | "affiliations"
  | "blog"
  | "news-curated"
  | "news-announcements";

export type ButtonVariant =
  | "blue"
  | "green"
  | "amber"
  | "pink"
  | "indigo"
  | "purple"
  | "orange"
  | "red"
  | "sky";

interface SectionTheme {
  headerBg: string;
  buttonVariant: ButtonVariant;
  addButtonBg: string;
}

export const ADMIN_THEMES: Record<AdminSection, SectionTheme> = {
  jobs: {
    headerBg: "bg-blue-100 dark:bg-blue-900/30",
    buttonVariant: "blue",
    addButtonBg: "bg-blue-600 hover:bg-blue-700",
  },
  candidates: {
    headerBg: "bg-green-100 dark:bg-green-900/30",
    buttonVariant: "green",
    addButtonBg: "bg-green-600 hover:bg-green-700",
  },
  investments: {
    headerBg: "bg-amber-100 dark:bg-amber-900/30",
    buttonVariant: "amber",
    addButtonBg: "bg-amber-600 hover:bg-amber-700",
  },
  affiliations: {
    headerBg: "bg-pink-100 dark:bg-pink-900/30",
    buttonVariant: "pink",
    addButtonBg: "bg-pink-600 hover:bg-pink-700",
  },
  blog: {
    headerBg: "bg-sky-100 dark:bg-sky-900/30",
    buttonVariant: "indigo",
    addButtonBg: "bg-indigo-600 hover:bg-indigo-700",
  },
  "news-curated": {
    headerBg: "bg-purple-100 dark:bg-purple-900/30",
    buttonVariant: "purple",
    addButtonBg: "bg-purple-600 hover:bg-purple-700",
  },
  "news-announcements": {
    headerBg: "bg-orange-100 dark:bg-orange-900/30",
    buttonVariant: "orange",
    addButtonBg: "bg-orange-600 hover:bg-orange-700",
  },
};

// Button variant styles for action buttons
export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  blue: "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40",
  green: "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/40",
  amber: "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-800/40",
  pink: "bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:hover:bg-pink-800/40",
  purple: "bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-800/40",
  indigo: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-800/40",
  orange: "bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-800/40",
  red: "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40",
  sky: "bg-sky-100 text-sky-600 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-800/40",
};
