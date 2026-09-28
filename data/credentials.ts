import { brandIcon } from './stack'

/** Kraft's certifications (KraftScreens.dc.html:639-642). */
export type Cert = { name: string; label: string; pill: string; icon: string }

export const CERTS: Cert[] = [
  {
    name: 'AWS Cloud Practitioner Essentials',
    label: 'AWS CLOUD PRACTITIONER ESSENTIALS',
    pill: 'Cloud Practitioner Essentials',
    icon: '/assets/aws-mark.svg',
  },
  {
    name: 'HackerRank Software Engineer',
    label: 'HACKERRANK · SOFTWARE ENGINEER',
    pill: 'Software Engineer',
    icon: brandIcon('hackerrank'),
  },
]
