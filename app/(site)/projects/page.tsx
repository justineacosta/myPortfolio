import type { Metadata } from 'next'
import Board from '@/components/projects/Board'
import ProjectViews from '@/components/projects/ProjectViews'
import PageHeader from '@/components/ui/PageHeader'
import { projects } from '@/data/projects'

export const metadata: Metadata = { title: 'Projects' }

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(16px,2cqw,28px)]">
      <PageHeader href="/projects" title={projects.title} lede={projects.lede} className="max-w-[1100px]" ledeClassName="max-w-[810px]" />
      <Board />
      <ProjectViews />
    </section>
  )
}
