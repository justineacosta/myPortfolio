import type { Icon } from '@phosphor-icons/react'
import {
  ArrowsOutSimpleIcon, BookOpenIcon, BriefcaseIcon, ChatCircleDotsIcon, ClosedCaptioningIcon, FileArrowUpIcon, FilePdfIcon, HouseIcon,
  ImageSquareIcon, KanbanIcon, LightningIcon, MagicWandIcon, MagnifyingGlassIcon, MapPinLineIcon, MicrophoneIcon, QrCodeIcon,
  ScissorsIcon, SparkleIcon, SquaresFourIcon, TextAaIcon, ToolboxIcon, UsersThreeIcon,
} from '@phosphor-icons/react/ssr'

/**
 * /showcase: kape's Flagship (reference/kapeportfolio/src/components/Flagship.tsx)
 * in Kraft's tokens (spec §6, §9). The product is a PLACEHOLDER, and so is
 * what its mock shows. Replace the mock with your product's real screens so
 * the preview is honest. The mock is decorative (aria-hidden): the captions
 * carry the meaning.
 */
export type MockScreen = 'home' | 'board' | 'listings' | 'features' | 'search'
export type MockNav = 'home' | 'board' | 'community' | 'listings' | 'features' | 'docs' | 'learn' | 'premium'
export type ShowcaseTab = { id: MockScreen; label: string; path: string; nav: MockNav; icon: Icon; caption: string }
export type Quote = { name: string; context: string; date: string; rating: number; quote: string }
type NavRow = { id: MockNav; label: string; icon: Icon; sub?: boolean; pro?: boolean }
type Task = { title: string; tag: string; mine?: boolean }
type Tile = { name: string; note: string; icon: Icon; pro?: boolean }
type Row = { source: string; tone: 0 | 1 | 2; title: string; meta: string; state: 'Applied' | 'Saved' | 'New' }
type Result = { name: string; place: string; rating: string; reviews: string; score: number; tag: string }

export const showcase = {
  title: ['Your flagship product,', 'and the people using it.'] as const,
  lede: 'PLACEHOLDER - one line on what this product is and why a visitor should look at it.',
  flagship: {
    eyebrow: 'FLAGSHIP BUILD',
    name: 'PLACEHOLDER - product name',
    desc: 'PLACEHOLDER - two to four sentences on your flagship product: who it is for, the main things it does, and one detail on how you built or run it (stack, hosting, how many people use it).',
    cta: { label: 'Open product', href: 'PLACEHOLDER - product URL', soon: 'Link coming soon' },
    /** Shown in the mock's address bar; decorative. */
    host: 'yourproduct.com',
    tabsLabel: 'Product screens',
    /** How long each screen shows before the next (kape's AUTO_ADVANCE_MS). */
    ms: 6000,
  },
  feedback: {
    kicker: 'WHAT PEOPLE SAY ABOUT IT',
    title: 'PLACEHOLDER - a heading for what your users say',
    pause: 'Pause',
    play: 'Play',
    pauseLabel: 'Pause the scrolling quotes',
    playLabel: 'Play the scrolling quotes',
    stars: 'out of 5 stars',
    /** Names the scrolling strip itself (the section is named by its heading). */
    reelLabel: 'What people say, scrolling',
    /** Seconds for one full pass of the quotes. */
    seconds: 60,
  },
}

export const TABS: ShowcaseTab[] = [
  { id: 'home', label: 'Home', path: '/home', nav: 'home', icon: HouseIcon, caption: 'PLACEHOLDER - one or two sentences on the first screen people land on in your product, and what it tells them at a glance.' },
  { id: 'board', label: 'Board', path: '/board', nav: 'board', icon: KanbanIcon, caption: 'PLACEHOLDER - one or two sentences on your product’s main workspace (a board, editor or dashboard) and what people do there every day.' },
  { id: 'listings', label: 'Listings', path: '/listings', nav: 'listings', icon: BriefcaseIcon, caption: 'PLACEHOLDER - one or two sentences on a list or feed your product pulls together, where the data comes from and what it saves the user.' },
  { id: 'features', label: 'Features', path: '/features', nav: 'features', icon: ToolboxIcon, caption: 'PLACEHOLDER - one or two sentences on the set of features or tools inside your product, how many there are and which plan they are on.' },
  { id: 'search', label: 'Search', path: '/search', nav: 'board', icon: MapPinLineIcon, caption: 'PLACEHOLDER - one or two sentences on a search or finder feature: what goes in, what comes out and why the results are useful.' },
]

const task = (title: string, mine = false): Task => ({ title, tag: 'Tag', mine })
const NAV: NavRow[] = [
  { id: 'home', label: 'Home', icon: HouseIcon },
  { id: 'board', label: 'Board', icon: SquaresFourIcon, sub: true },
  { id: 'community', label: 'Community', icon: UsersThreeIcon, sub: true },
  { id: 'listings', label: 'Listings', icon: MagnifyingGlassIcon, sub: true },
  { id: 'features', label: 'Features', icon: ToolboxIcon, sub: true },
  { id: 'docs', label: 'Docs', icon: BookOpenIcon, sub: true },
  { id: 'learn', label: 'Learn', icon: LightningIcon, sub: true },
  { id: 'premium', label: 'Premium', icon: SparkleIcon, pro: true },
]
const TILES: Tile[] = [
  { name: 'Feature one', note: 'Short description', icon: FileArrowUpIcon },
  { name: 'Feature two', note: 'Short description', icon: ImageSquareIcon },
  { name: 'Feature three', note: 'Short description', icon: FilePdfIcon },
  { name: 'Feature four', note: 'Short description', icon: TextAaIcon },
  { name: 'Feature five', note: 'Short description', icon: QrCodeIcon },
  { name: 'Feature six', note: 'Short description', icon: ScissorsIcon },
  { name: 'Feature seven', note: 'Short description', icon: ArrowsOutSimpleIcon },
  { name: 'Feature eight', note: 'Short description', icon: MicrophoneIcon },
  { name: 'Feature nine', note: 'Short description', icon: ClosedCaptioningIcon, pro: true },
  { name: 'Feature ten', note: 'Short description', icon: MagicWandIcon },
]
const ROWS: Row[] = [
  { source: 'Src A', tone: 0, title: 'PLACEHOLDER listing one', meta: 'Detail · posted 2h ago', state: 'Applied' },
  { source: 'Src B', tone: 1, title: 'PLACEHOLDER listing two', meta: 'Detail · posted 5h ago', state: 'Saved' },
  { source: 'Src C', tone: 2, title: 'PLACEHOLDER listing three', meta: 'Detail · posted 6h ago', state: 'New' },
  { source: 'Src A', tone: 0, title: 'PLACEHOLDER listing four', meta: 'Detail · posted 9h ago', state: 'Saved' },
  { source: 'Src B', tone: 1, title: 'PLACEHOLDER listing five', meta: 'Detail · posted 1d ago', state: 'New' },
]
const RESULTS: Result[] = [
  { name: 'PLACEHOLDER result one', place: 'Location', rating: '4.8', reviews: '212', score: 91, tag: 'Tag' },
  { name: 'PLACEHOLDER result two', place: 'Location', rating: '4.6', reviews: '148', score: 84, tag: 'Tag' },
  { name: 'PLACEHOLDER result three', place: 'Location', rating: '4.4', reviews: '96', score: 72, tag: 'Tag' },
  { name: 'PLACEHOLDER result four', place: 'Location', rating: '4.9', reviews: '61', score: 65, tag: 'Tag' },
  { name: 'PLACEHOLDER result five', place: 'Location', rating: '4.2', reviews: '44', score: 58, tag: 'Tag' },
]

/** What the product mock shows, screen by screen (kape's mock data, renamed to neutral stand-ins). */
export const MOCK = {
  product: ['Product', 'Name'] as const,
  nav: NAV,
  footLink: { label: 'Feedback', icon: ChatCircleDotsIcon },
  chrome: { search: 'Search…', kbd: 'Ctrl K', status: 'All systems normal' },
  home: {
    head: { kicker: 'Monday, January 5', title: 'Good morning, User.', sub: 'PLACEHOLDER status line.' },
    today: 'Today',
    viewAll: 'View all',
    status: 'PLACEHOLDER - the main status message your dashboard shows.',
    goTo: 'Go to',
    links: ['Board', 'Features', 'Search', 'Settings'],
    news: 'What’s new',
    newUpdate: 'New update',
    updates: [
      { date: 'Jan 5', year: '2026', ago: '2 days ago', kind: 'New', title: 'PLACEHOLDER - newest update title', text: 'PLACEHOLDER - a real changelog entry: what shipped and why it matters to the people using it.' },
      { date: 'Jan 3', year: '2026', ago: '4 days ago', kind: 'Improved', title: 'PLACEHOLDER - earlier update title', text: 'PLACEHOLDER - an improvement to an existing feature and what changed for the user.' },
      { date: 'Jan 1', year: '2026', ago: '6 days ago', kind: 'New', title: 'PLACEHOLDER - older update title', text: 'PLACEHOLDER - another shipped feature, in one or two plain sentences.' },
    ] as { date: string; year: string; ago: string; kind: 'New' | 'Improved'; title: string; text: string }[],
  },
  board: {
    head: { kicker: 'Monday, January 5', title: 'PLACEHOLDER board heading.', sub: 'PLACEHOLDER - one line on what this board holds.' },
    add: 'Add task',
    columns: [
      { name: 'To do', tasks: [task('PLACEHOLDER task one', true), task('PLACEHOLDER task two'), task('PLACEHOLDER task three', true)] },
      { name: 'In progress', tasks: [task('PLACEHOLDER task four'), task('PLACEHOLDER task five', true), task('PLACEHOLDER task six')] },
      { name: 'Review', tasks: [task('PLACEHOLDER task seven'), task('PLACEHOLDER task eight'), task('PLACEHOLDER task nine', true)] },
      { name: 'Done', tasks: [task('PLACEHOLDER task ten', true), task('PLACEHOLDER task eleven'), task('PLACEHOLDER task twelve')] },
    ],
  },
  listings: {
    head: { kicker: 'Listings', title: 'PLACEHOLDER listings heading.', sub: 'PLACEHOLDER - one line on where these listings come from.' },
    filters: ['All sources', 'Source A', 'Source B', 'Source C'],
    rows: ROWS,
    foot: 'Showing 5 of 100 · Synced 3 minutes ago',
  },
  features: {
    head: { kicker: 'Features', title: 'PLACEHOLDER features heading.', sub: 'PLACEHOLDER - one line on what the features have in common.' },
    filters: ['All 10', 'Group A', 'Group B', 'Group C', 'Group D'],
    tiles: TILES,
    pro: 'Pro',
  },
  search: {
    fields: [
      { label: 'Category', value: 'PLACEHOLDER' },
      { label: 'Location', value: 'PLACEHOLDER' },
    ],
    go: 'Search',
    meta: '30 results found · 19 with a detail · 7 with another detail',
    results: RESULTS,
    foot: 'PLACEHOLDER - one line explaining how the score is worked out.',
  },
}

/** Use real quotes only, kept word for word, with the person's permission. */
const quote = (date: string, rating: number, q: string): Quote => ({ name: 'Client Name', context: 'PLACEHOLDER', date, rating, quote: q })
export const FEEDBACK: Quote[] = [
  quote('Jan 5, 2026', 5, 'PLACEHOLDER - a real quote from someone who used your product, word for word, two to four sentences on what it did for them.'),
  quote('Jan 4, 2026', 5, 'PLACEHOLDER - a real quote about a specific feature or result, with a number if they gave one.'),
  quote('Jan 3, 2026', 5, 'PLACEHOLDER - a short real quote, one sentence is fine.'),
  quote('Jan 2, 2026', 5, 'PLACEHOLDER - a real quote about working with you or the support you gave, not just the product.'),
  quote('Jan 1, 2026', 4, 'PLACEHOLDER - a one-line quote.'),
  quote('Dec 31, 2025', 5, 'PLACEHOLDER - a real quote from a community member or early user, two sentences.'),
]
