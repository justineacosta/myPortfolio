/**
 * The site chat's copy: the launcher, the panel and every sentence the route
 * can send back. The assistant speaks as the site's assistant about Justine,
 * not as Justine.
 */
export const chat = {
  launcher: 'Ask about Justine’s work',
  title: 'Ask about the work',
  greeting: "Hi, I'm the assistant on this site. Ask me about what Justine builds, how a project starts, or what it costs to get going.",
  suggestions: ['What do you build?', 'Have you built this for a business like mine?', 'How does a project start?'] as [string, string, string],
  placeholder: 'Ask a question',
  send: 'Send',
  close: 'Close chat',
  handoff: 'Send Justine a message',
  capped: 'Justine can take it from here.',
  privacy: "Messages go to Anthropic to write the answer. This site doesn't keep them.",
  /** Each refusal gives the visitor a way forward; the panel shows the hand-off button beside it. */
  errors: {
    rate: "You've asked a lot in a short time. Give it a few minutes, or write to Justine directly.",
    unavailable: "I can't answer right now. You can write to Justine and he'll reply himself.",
    failed: "That didn't come through. Ask again, or write to Justine.",
    invalid: "I couldn't read that one. Try a shorter question, or write to Justine.",
  },
  /**
   * The keyless fallback (lib/chat/fallback.ts): the words that pick each
   * topic, in tie-break order, and the few lines it adds around the site's
   * own text. Triggers are matched as whole words or phrases.
   */
  fallback: {
    triggers: {
      price: ['price', 'prices', 'pricing', 'cost', 'costs', 'charge', 'rate', 'rates', 'budget', 'quote', 'how much'],
      start: ['how fast', 'how soon', 'start', 'when can you', 'availability', 'available', 'timeline'],
      after: ['after i write', 'after i send', 'reply', 'respond', 'hear back', 'response time'],
      maintain: ['maintain', 'maintenance', 'support', 'after launch', 'handover', 'hand over'],
      cases: ['example', 'examples', 'client', 'clients', 'portfolio', 'case study', 'case studies', 'past work', 'like mine', 'similar', 'industry'],
      process: ['process', 'steps', 'how do you work', 'method', 'approach', 'kickoff'],
      services: [
        'service', 'services', 'offer', 'what do you do', 'ai agent', 'ai agents', 'rag', 'chatbot', 'chatbots', 'automation', 'automations',
        'workflow', 'workflows', 'crm', 'cms', 'api', 'apis', 'integration', 'integrations', 'seo', 'website', 'websites', 'web app', 'app', 'apps', 'saas',
      ],
      build: ['what do you build', 'build', 'make'],
      stack: ['stack', 'tools', 'tech', 'technology', 'technologies', 'framework', 'frameworks', 'language', 'languages'],
      courses: ['course', 'courses', 'certificate', 'certificates', 'certification', 'certifications', 'training'],
      about: ['who', 'about you', 'about justine', 'background', 'experience', 'where are you', 'based', 'manila', 'yourself'],
      hello: ['hi', 'hello', 'hey', 'thanks', 'thank you'],
    },
    /** Any of these adds the hand-off button to the reply, whichever topic answers. */
    buying: ['price', 'pricing', 'cost', 'budget', 'quote', 'how much', 'project', 'hire', 'hiring', 'can you build', 'work with', 'proposal', 'call'],
    /** Everyday words for each case's trade, keyed by its folder, beside the words of its own name and trade. */
    caseWords: {
      'ostler-barbers': ['barber', 'barbers', 'haircut', 'salon'],
      'riverdale-and-brooks': ['lawyer', 'lawyers', 'attorney', 'legal', 'law firm'],
      'altitude-personal-training': ['gym', 'trainer', 'fitness', 'coach'],
      'range-physical-therapy': ['physio', 'physiotherapy', 'therapist', 'clinic'],
      'harbor-and-pine-moving': ['movers', 'removals', 'relocation'],
      'tidewell-vacation-rentals': ['airbnb', 'holiday let', 'short term rental'],
      'meridian-energy-infrastructure': ['solar', 'energy', 'renewable'],
      'ironline-utility-infrastructure': ['utilities', 'linework'],
      'meridian-werks': ['mechanic', 'garage', 'car', 'auto'],
      'oriel-portugal-residences': ['portugal', 'real estate', 'property'],
      'westmere-los-angeles': ['los angeles', 'real estate', 'property'],
    } as Record<string, string[]>,
    /** Words in a case's name or trade too general to point at that case. */
    caseStop: ['company', 'practice', 'infrastructure', 'studio', 'manager', 'cash', 'small', 'commercial', 'developer', 'range', 'personal', 'training', 'physical'],
    intro: {
      services: 'Justine works across six areas:',
      process: 'Every project runs through the same five steps:',
      stack: 'These are the tools he builds with:',
      courses: 'Courses he has completed:',
      cases: 'He has built full sample systems for these businesses:',
      case: 'Here is what he built for',
    },
    links: {
      contact: 'Get in touch',
      services: 'See the services',
      about: 'More about Justine',
      projects: 'See the projects',
      case: 'See the case study',
    },
    hello: 'Hi. Ask me what Justine builds, how a project starts, or what it costs.',
    unknown: "I can't answer that one here, but Justine can.",
  },
}
