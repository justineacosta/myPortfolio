import { CheckCircleIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { CERTS } from '@/data/credentials'
import { home } from '@/data/home'
import CertBadge from '@/components/ui/CertBadge'
import HomeCard from './HomeCard'

export default function CredentialsCard() {
  const c = home.cards.credentials
  return (
    <HomeCard title={c.title} icon={SealCheckIcon} className="min-w-[min(220px,100%)] flex-[1_1_230px] gap-[13px] p-5">
      <p className="-mt-0.5 mb-0.5 text-[13px] leading-normal text-ink3">{c.body}</p>
      <div className="relative flex items-end justify-center rounded-[13px] border border-b1 bg-s0 px-3.5 pt-[26px] pb-[60px]">
        {CERTS.map((cert) => (
          <span key={cert.name} role="img" aria-label={cert.name} className="medal cert-turn">
            <CertBadge icon={cert.icon} size={72} />
            <span aria-hidden className="medal-pill">
              <CheckCircleIcon size={13} className="shrink-0 text-accent" />
              {cert.pill}
            </span>
          </span>
        ))}
      </div>
    </HomeCard>
  )
}
