/**
 * Feature switches.
 *
 * The site is English-only for now: the Chinese content stays in the repository
 * (src/content/docs/zh) but nothing links to it and its routes are not served.
 * Flip ENABLE_I18N to true to bring back the language menu, the hreflang
 * alternates and the /zh/ routes.
 */
export const ENABLE_I18N = false;
