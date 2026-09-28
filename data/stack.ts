/**
 * The tools Kraft lists (KraftScreens.dc.html:561-573). Logos are self-hosted
 * from simple-icons by scripts/brand-icons.mjs.
 */
export type Brand = { name: string; slug: string }

export const brandIcon = (slug: string) => `/icons/brands/${slug}.svg`

export const TOOLS: Brand[] = [
  { name: 'React', slug: 'react' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'Node.js', slug: 'nodedotjs' },
  { name: 'Python', slug: 'python' },
  { name: 'PostgreSQL', slug: 'postgresql' },
  { name: 'Supabase', slug: 'supabase' },
  { name: 'Docker', slug: 'docker' },
  { name: 'n8n', slug: 'n8n' },
  { name: 'Figma', slug: 'figma' },
  { name: 'Claude', slug: 'claude' },
  { name: 'Next.js', slug: 'nextdotjs' },
  { name: 'Tailwind', slug: 'tailwindcss' },
  { name: 'FastAPI', slug: 'fastapi' },
  { name: 'Redis', slug: 'redis' },
  { name: 'MongoDB', slug: 'mongodb' },
  { name: 'Prisma', slug: 'prisma' },
  { name: 'Vercel', slug: 'vercel' },
  { name: 'Cloudflare', slug: 'cloudflare' },
  { name: 'GitHub Actions', slug: 'githubactions' },
  { name: 'Git', slug: 'git' },
  { name: 'LangChain', slug: 'langchain' },
  { name: 'Hugging Face', slug: 'huggingface' },
  { name: 'Gemini', slug: 'googlegemini' },
  { name: 'Zapier', slug: 'zapier' },
  { name: 'Make', slug: 'make' },
  { name: 'Stripe', slug: 'stripe' },
  { name: 'Expo', slug: 'expo' },
  { name: 'GraphQL', slug: 'graphql' },
]

/** Tools Justine is still testing; the Stack card gives them a grey dot. */
export const EXPERIMENTAL = ['LangChain', 'Hugging Face', 'Gemini', 'Make', 'Expo', 'Prisma', 'GraphQL']

/** Kraft's two Stack marquee rows: alternate tools, so both rows mix (KraftScreens.dc.html:575-581). */
export function stackRows(): [Brand[], Brand[]] {
  return [TOOLS.filter((_, i) => i % 2 === 0), TOOLS.filter((_, i) => i % 2 === 1)]
}
