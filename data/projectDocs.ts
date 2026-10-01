import {
  ArticleIcon, BooksIcon, BrowsersIcon, ChartBarIcon, ChatCircleIcon, CodeIcon, CoffeeIcon, DatabaseIcon, FileCodeIcon, FileJsIcon, FilmStripIcon, HashIcon, MagnifyingGlassIcon, MicrophoneIcon, PaperPlaneTiltIcon, PhoneCallIcon, ShieldCheckIcon, ShippingContainerIcon, SparkleIcon, TerminalWindowIcon, TimerIcon, UsersThreeIcon, WaveformIcon,
} from '@phosphor-icons/react/ssr'
import type { AgentGroup, Chip } from './projects'

/**
 * The Projects AI agents view's long copy, verbatim from Kraft Projects
 * Board.dc.html. Kept apart from data/projects.ts so the shell (⌘K) never
 * pulls it into other pages.
 */
const GROUPS: AgentGroup[] = [
  {
    name: 'KapeAI', blurb: 'Answers how to do anything in the workspace, in English or Tagalog.',
    cards: [
      { title: 'KapeAI', icon: CoffeeIcon, live: true, icons: [SparkleIcon], desc: 'Answers how to do anything in the workspace, in English or Tagalog.', meta: 'Claude Haiku 4.5 · cached knowledge, no retrieval step', tags: ['Claude'] },
    ],
  },
  {
    name: 'AI Agents', blurb: 'They pick their own tools and finish the job. Not chat windows.',
    cards: [
      { title: 'KapeSEO', icon: ArticleIcon, live: false, icons: [SparkleIcon, TerminalWindowIcon], desc: 'A keyword in, a 3,000-word article out. It grades itself before handing over.', meta: 'Claude Code skill + subagent · multi-tenant', tags: ['Claude', 'Claude Code'] },
      { title: 'KAPE Reel worker', icon: FilmStripIcon, live: false, icons: [FileJsIcon, WaveformIcon, MicrophoneIcon, PaperPlaneTiltIcon], desc: 'One Telegram message. It scripts, voices, captions, renders, and returns for approval.', meta: 'Node worker · ElevenLabs, Whisper, Remotion', tags: ['Node.js', 'ElevenLabs', 'OpenAI Whisper', 'Telegram'] },
      { title: 'BrewedOps OS roster', icon: UsersThreeIcon, live: false, icons: [SparkleIcon, TerminalWindowIcon], desc: 'Ten specialists, one job each, from n8n audits to client deliverables. Every write is approval-gated.', meta: 'Claude Code subagents · Opus and Sonnet', tags: ['Claude', 'Claude Code'] },
    ],
  },
  {
    name: 'RAG Chatbots', blurb: 'They search real documents first, then answer from what they found.',
    cards: [
      { title: 'Ken AI Bot', icon: ChatCircleIcon, live: true, icons: [SparkleIcon, DatabaseIcon, HashIcon], desc: 'Searches a client team library and live sales figures. Refuses to guess.', meta: 'Claude Sonnet 5 · pgvector similarity search, 5 tools', tags: ['Claude', 'Postgres + pgvector', 'Slack'] },
      { title: 'Kape AI knowledge search', icon: MagnifyingGlassIcon, live: true, icons: [SparkleIcon, BooksIcon], desc: 'Pulls the five best passages from my 1,277-chunk knowledge base, then answers.', meta: 'SQLite FTS5 keyword ranking · Claude Haiku 4.5', tags: ['Claude', 'SQLite FTS5'] },
    ],
  },
  {
    name: 'Chatbots', blurb: 'Shipped inside BrewedOps.com. Each does one job well.',
    cards: [
      { title: 'Voice Call Tester', icon: PhoneCallIcon, live: true, icons: [SparkleIcon, WaveformIcon], desc: 'Hold a real spoken call with your voice agent before a customer does.', meta: 'Claude Sonnet 4.6 · ElevenLabs speech', tags: ['Claude', 'ElevenLabs'] },
      { title: 'Copy Website', icon: BrowsersIcon, live: true, icons: [SparkleIcon], desc: 'Point it at a page, get an editable rebuild streamed back.', meta: 'Claude Sonnet 4.6 · streaming', tags: ['Claude'] },
    ],
  },
  {
    name: 'Hermes', blurb: 'My own agent on a server, reachable from Telegram. Remembers, reads my notes, runs jobs unasked.',
    cards: [
      { title: 'Hermes', icon: ChartBarIcon, live: true, icons: [ShieldCheckIcon, PaperPlaneTiltIcon, ShippingContainerIcon], desc: 'My own agent on a server, reachable from Telegram. Remembers, reads my notes, runs jobs unasked.', meta: 'Nous hermes-agent, deployed and extended by me · Docker on my VPS', tags: ['Nous Hermes', 'Telegram', 'Docker'] },
      { title: 'Save-progress watcher', icon: TimerIcon, live: true, icons: [ShieldCheckIcon, PaperPlaneTiltIcon], desc: 'Pings me every fifteen minutes, but only when there is real work to save.', meta: 'Scheduled job · skips the model when nothing changed', tags: ['Nous Hermes', 'Telegram'] },
    ],
  },
]

export const agentsView = {
  title: 'AI agents and RAG chatbots',
  kicker: 'AI AGENTS AND RAG CHATBOTS',
  lede: 'I design, build, and run every system below. Most are in daily use.',
  builtWith: [
    { name: 'Claude Code', icon: TerminalWindowIcon },
    { name: 'Codex', icon: CodeIcon },
    { name: 'VS Code', icon: FileCodeIcon },
    { name: 'Hermes', icon: ShieldCheckIcon },
  ] satisfies Chip[],
  groups: GROUPS,
}
