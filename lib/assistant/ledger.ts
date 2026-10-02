import { leadLedger, type LeadLedger } from '@/lib/assistant/mail'

declare global {
  var __kraftLeadLedger: LeadLedger | undefined
  var __kraftLeadsSending: Set<string> | undefined
}

/** The one ledger of conversations that already sent a lead, shared by the chat route (Claude's lead tool and the quick engine) and the lead form route. It lives on `globalThis` because Next may bundle those routes separately, and each bundle would otherwise get its own copy. */
export const conversationLeads: LeadLedger = (globalThis.__kraftLeadLedger ??= leadLedger())

/** The conversations whose form card lead is being sent right now, so a second send from the same conversation waits its turn as a 409. On `globalThis` like the ledger. */
export const leadsSending: Set<string> = (globalThis.__kraftLeadsSending ??= new Set())
