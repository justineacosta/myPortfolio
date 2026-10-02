/** The model every reply uses (the alias, no date suffix). */
export const MODEL = 'claude-haiku-4-5'

/** The most tokens one reply may run to. */
export const MAX_TOKENS = 600

/** Whether the fake Claude is on: no API calls, no email, no database writes. */
export function isFake(env: Record<string, string | undefined> = process.env) {
  return env.ASSISTANT_FAKE === '1'
}

/** Whether the assistant can answer at all: a real key, or the fake. */
export function enabled(env: Record<string, string | undefined> = process.env) {
  return isFake(env) || Boolean(env.ANTHROPIC_API_KEY)
}
