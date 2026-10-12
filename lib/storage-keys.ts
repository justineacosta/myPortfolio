/** One place for every storage key, so the boot script and the libs agree. */
export const THEME_KEY = 'kraft-theme'
export const PERF_KEY = 'kraft-perf'
export const A11Y_KEY = 'kraft-a11y'
export const SCROLL_KEY = 'kraft-scroll'
/** Lumen's conversation, kept in the browser for three days after its last message. */
export const CHAT_KEY = 'kraft-chat'
/** Set once Lumen's greeting bubble has shown this visit, so it shows only once. */
export const CHAT_NUDGE_KEY = 'kraft-chat-nudge'
/** "off" when the visitor has muted Lumen's sounds; kept for the browser, not just the tab. */
export const CHAT_SOUND_KEY = 'kraft-chat-sound'
/** "wide" when the visitor has expanded Lumen's panel on desktop. */
export const CHAT_WIDE_KEY = 'kraft-chat-wide'
