import type { Metadata } from 'next'
import LegalDoc from '@/components/plain/LegalDoc'
import { legal } from '@/data/legal'

export const metadata: Metadata = { title: legal.privacy.title, description: legal.privacy.description }

export default function Page() {
  return <LegalDoc doc={legal.privacy} />
}
