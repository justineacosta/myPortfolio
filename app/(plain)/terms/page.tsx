import type { Metadata } from 'next'
import LegalDoc from '@/components/plain/LegalDoc'
import { legal } from '@/data/legal'

export const metadata: Metadata = { title: legal.terms.title, description: legal.terms.description }

export default function Page() {
  return <LegalDoc doc={legal.terms} />
}
