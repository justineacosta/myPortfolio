/**
 * Kraft ships no real quotes (KraftScreens.dc.html:614-618, "Nothing on this
 * page is fabricated"). Every field stays a PLACEHOLDER until a real client
 * says it.
 */
export type Client = { n: string; name: string; role: string; tag: string; quote: string; tags: string[] }

export const CLIENTS: Client[] = ['01', '02', '03'].map((n) => ({
  n,
  name: 'PLACEHOLDER - client name',
  role: 'PLACEHOLDER - role · company',
  tag: 'PLACEHOLDER - scope',
  quote: 'PLACEHOLDER - a real client quote. Nothing on this page is fabricated.',
  tags: ['PLACEHOLDER - tag', 'PLACEHOLDER - tag', 'PLACEHOLDER - tag'],
}))
