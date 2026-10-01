/**
 * The tools the three standalone pages name, with their logos in
 * lib/brand/logos/ (spec 2026-10-01-lively-pages §3). `brand` colours the
 * badge pulse and the hero glow. A `mono` logo takes the text colour. `dark`
 * means a <id>-dark.svg exists for dark themes. No runtime imports, so the
 * data files can import its type and still run under Node directly.
 */
export type ToolId =
  | 'n8n' | 'supabase' | 'gmail' | 'google-sheets' | 'telegram' | 'stripe' | 'claude' | 'cal-com'
  | 'claude-code' | 'vs-code' | 'codex' | 'github' | 'vercel'

export type Tool = { name: string; brand: string; mono?: true; dark?: true }

export const TOOLS: Record<ToolId, Tool> = {
  n8n: { name: 'n8n', brand: '#EA4B71' },
  supabase: { name: 'Supabase', brand: '#3ECF8E' },
  gmail: { name: 'Gmail', brand: '#EA4335' },
  'google-sheets': { name: 'Google Sheets', brand: '#34A853' },
  telegram: { name: 'Telegram', brand: '#26A5E4' },
  stripe: { name: 'Stripe', brand: '#635BFF' },
  claude: { name: 'Claude', brand: '#D97757' },
  'cal-com': { name: 'Cal.com', brand: '#292929' },
  'claude-code': { name: 'Claude Code', brand: '#D97757' },
  'vs-code': { name: 'VS Code', brand: '#007ACC' },
  codex: { name: 'Codex', brand: '#8B949E', dark: true },
  github: { name: 'GitHub', brand: '#8B949E', mono: true },
  vercel: { name: 'Vercel', brand: '#8B949E', mono: true },
}
