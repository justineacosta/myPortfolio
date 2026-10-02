import { leadLedger, type LeadLedger } from '@/lib/assistant/mail'

/** The one ledger of conversations that already sent a lead, shared by the chat route (Claude's lead tool and the quick engine) and the lead form route. */
export const conversationLeads: LeadLedger = leadLedger()
