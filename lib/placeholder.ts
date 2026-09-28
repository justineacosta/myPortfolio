/** Content gaps are strings that start with this marker (spec §10). */
export const PLACEHOLDER_PREFIX = 'PLACEHOLDER - '

export function isPlaceholder(value: string): boolean {
  return value.startsWith('PLACEHOLDER')
}
