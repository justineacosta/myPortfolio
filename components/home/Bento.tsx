import AboutCard from './AboutCard'
import CredentialsCard from './CredentialsCard'
import ProjectsCard from './ProjectsCard'
import ServicesCard from './ServicesCard'
import StackCard from './StackCard'
import TestimonialsCard from './TestimonialsCard'
import ToolsRow from './ToolsRow'

const ROW = 'flex flex-wrap gap-[clamp(11px,1.3cqw,18px)]'

/** Kraft's framed card grid (KraftScreens.dc.html:60-199). */
export default function Bento() {
  return (
    <div
      data-intro-hold
      data-intro-delay="220"
      className="bento flex flex-col gap-[clamp(11px,1.3cqw,18px)] rounded-[26px] border border-b1 p-[clamp(11px,1.3cqw,18px)]"
    >
      <ToolsRow />
      <div className={ROW}>
        <ProjectsCard />
        <AboutCard />
        <StackCard />
      </div>
      <div className={ROW}>
        <ServicesCard />
        <TestimonialsCard />
        <CredentialsCard />
      </div>
    </div>
  )
}
