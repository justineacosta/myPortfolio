import AssistantRoot from './AssistantRoot'

/** The assistant, always: with no key it answers from the site's own text, so the launcher ships in every build. */
export default function Assistant() {
  return <AssistantRoot />
}
