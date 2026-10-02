import { mode } from '@/lib/assistant/config'
import AssistantRoot from './AssistantRoot'

/** The assistant, always: with no key it answers from the site's own text, so the launcher ships in every build. The server picks the mode, and the panel says which it is. */
export default function Assistant() {
  return <AssistantRoot mode={mode()} />
}
