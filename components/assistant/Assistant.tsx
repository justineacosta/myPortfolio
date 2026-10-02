import { enabled } from '@/lib/assistant/config'
import AssistantRoot from './AssistantRoot'

/** The assistant, only when it can answer: a real key or the fake is set. Read on the server, so a build without either ships no launcher. */
export default function Assistant() {
  return enabled() ? <AssistantRoot /> : null
}
