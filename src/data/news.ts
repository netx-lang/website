import type { Lang } from "../i18n/ui";

export interface NewsItem {
  date: string;
  href?: string;
  text: Record<Lang, string>;
}

// Shown in the hero. Add or edit entries here.
export const news: NewsItem[] = [
  {
    date: "2026-06",
    text: {
      en: "NetX 0.1.0: compiler, simulator, and package manager.",
      zh: "NetX 0.1.0：编译器、仿真器与包管理器。",
    },
  },
  {
    date: "2026-06",
    text: {
      en: "Website and online language specification are live.",
      zh: "网站与在线语言规范已上线。",
    },
  },
];
