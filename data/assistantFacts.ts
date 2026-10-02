/**
 * What the site assistant knows about Justine beyond what the pages show: career, education, background, how he works with clients and what
 * he believes. Chosen by Justine from his previous portfolio's knowledge base (2026-10-02); where it and this site disagree, this site wins,
 * so the reply time, maintenance and the engagement steps stay with the FAQs and the Kraft Method. Written in the third person (he/him).
 * Read by lib/assistant/knowledge.ts (Claude) and lib/assistant/passages.ts (quick answers). Never put his email address here.
 */
export type Job = { role: string; org: string; where: string; when: string; did: string }

export const FACTS = {
  /** Newest first. */
  career: [
    { role: 'Freelance full-stack developer', org: 'Independent', where: 'Remote', when: 'January 2025 to now', did: 'He builds web applications with AI features for clients: secure backends, authentication, REST APIs and database work, in Next.js, TypeScript, Node.js and Python, and he plans architecture, reviews code and ships features with client teams.' },
    { role: 'IT support', org: 'Municipality of San Nicolas', where: 'Ilocos Norte, Philippines', when: 'August 2024 to February 2025', did: 'He kept the municipality’s computers, printers, network and user accounts running across several departments, and supported government staff day to day.' },
    { role: 'First freelance client work', org: 'Independent', where: 'Remote', when: 'September to December 2023', did: 'While still at university he delivered his first client websites end to end, from requirements and design to deployment and handover, and learned to scope and communicate work with non-technical clients.' },
    { role: 'Engineering intern, IT support', org: 'Municipality of San Nicolas', where: 'Ilocos Norte, Philippines', when: 'June to August 2023', did: 'He maintained office computers, printers and network connectivity, and supported the IT and engineering office.' },
  ] satisfies Job[],
  education: {
    degree: 'BS in Computer Engineering',
    school: 'Mariano Marcos State University',
    where: 'Batac City, Philippines',
    when: 'graduated August 2024',
    did: 'He was lead developer on major school projects and his capstone, building web systems, automation platforms and database-driven apps, alongside embedded systems, IoT and PCB layout work.',
  },
  background: {
    languages: 'He speaks English and Filipino.',
    start: 'He got into development by building projects at school.',
    interests: 'Outside work he follows sports and eSports, and he enjoys running, reading, photography and small side projects. Lately he is into local-first software, well-made command-line tools and how AI is changing product interfaces.',
  },
  working: {
    billing: 'He works hourly for ongoing or open-ended work, and at a fixed project price for a new system built end to end, which he prefers because the scope is clear up front. There is no published rate: the number depends on scope.',
    ownership: 'Code ownership and licensing are agreed in writing before work starts.',
    communication: 'He works over email or whatever chat the client already uses, sends updates when work lands, and gives an early heads-up if anything changes the estimate.',
    design: 'He designs as well as builds, so he isn’t only implementing someone else’s mockups.',
    team: 'He works solo, with no agency behind him, and is comfortable joining a team the client already has.',
  },
  beliefs: [
    'Great products feel inevitable, but they’re a thousand small decisions.',
    'The best engineers care about what users actually feel.',
    'Speed is a feature. Accessibility is a feature. Polish is a feature.',
    'Bias for action, with rigor where rigor matters.',
  ],
  /** His own words, from his previous portfolio's About page. */
  ownWords:
    'I build software the way good products are made, with curiosity, taste and a real love for the craft. I tend to work end to end: shaping fuzzy problems, prototyping fast, designing in the browser and shipping the kind of polish you can feel. I care a lot about performance, accessibility and the small details most people never notice, but everybody feels.',
}
