import Hero from '@/components/home/Hero'
import HomeProfile from '@/components/home/HomeProfile'

export default function HomePage() {
  return (
    <div className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <HomeProfile />
      <Hero />
    </div>
  )
}
