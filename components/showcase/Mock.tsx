import type { CSSProperties, ReactNode } from 'react'
import { CaretRightIcon, CheckCircleIcon, CrownIcon, MagnifyingGlassIcon, MapPinLineIcon, PlusIcon, SparkleIcon, StarIcon } from '@phosphor-icons/react/ssr'
import { MOCK, showcase, type ShowcaseTab } from '@/data/showcase'

/** Stagger order for the rise-in (globals.css .mock-rise). */
const rise = (i: number) => ({ '--i': i }) as CSSProperties
const PANEL = 'rounded-[.7em] border border-b1 bg-s1'
const LABEL = 'text-[.62em] font-extrabold tracking-[.14em] text-ink3 uppercase'
const PILL = 'rounded-full border px-[.7em] py-[.35em] text-[.7em] font-bold whitespace-nowrap'
const FILTER = `${PILL} border-b1 bg-s1 text-ink3`
const FILTER_ON = `${PILL} border-accent bg-accent text-on-accent`
const TONES = ['bg-wash text-accent', 'bg-chip text-ink2', 'bg-s3 text-ink'] as const
const STATE = { applied: 'bg-wash text-accent', saved: 'bg-chip text-ink3', new: 'bg-accent text-on-accent' } as const

/**
 * The Flagship's product mock (kape Flagship.tsx), in Kraft's tokens. Every
 * size is in em, so the whole app scales from the one font size its stage
 * sets. It is decorative: its parent is aria-hidden.
 */
export default function Mock({ tab }: { tab: ShowcaseTab }) {
  return (
    <div className="grid h-full grid-cols-[12.6em_minmax(0,1fr)] overflow-hidden bg-bg text-ink">
      <Sidebar tab={tab} />
      <div className="flex min-w-0 flex-col overflow-hidden">
        <div className="mock-rise flex min-w-0 items-center gap-[.6em] border-b border-b1 bg-s1 px-[1em] py-[.7em]" style={rise(1)}>
          <span className="text-[.92em] font-extrabold tracking-[-.01em] whitespace-nowrap">{tab.label}</span>
          <div className="ml-auto flex min-w-0 items-center gap-[.4em]">
            <span className="flex w-[9.6em] min-w-0 items-center gap-[.45em] overflow-hidden rounded-[.55em] border border-b1 py-[.4em] pr-[.5em] pl-[.65em] text-[.74em] font-medium whitespace-nowrap text-ink4">
              <MagnifyingGlassIcon weight="bold" size="1em" />
              <span>{MOCK.chrome.search}</span>
              <span className="ml-auto rounded-[.3em] bg-chip px-[.4em] py-[.12em] text-[.82em] font-bold text-ink3">{MOCK.chrome.kbd}</span>
            </span>
            <span className="flex items-center gap-[.35em] rounded-full border border-b1 px-[.6em] py-[.3em] text-[.7em] font-bold whitespace-nowrap">
              <span className="size-[.4em] rounded-full bg-accent" />
              {MOCK.chrome.status}
            </span>
            <span className="size-[1.6em] shrink-0 rounded-full bg-linear-to-b from-accent to-s3" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-[.85em] overflow-hidden bg-bg px-[1.5em] py-[1.1em] *:shrink-0">
          {tab.id === 'home' && <HomeScreen />}
          {tab.id === 'board' && <BoardScreen />}
          {tab.id === 'listings' && <ListingsScreen />}
          {tab.id === 'features' && <FeaturesScreen />}
          {tab.id === 'search' && <SearchScreen />}
        </div>
      </div>
    </div>
  )
}

function Sidebar({ tab }: { tab: ShowcaseTab }) {
  const Foot = MOCK.footLink.icon
  return (
    <aside className="mock-rise flex min-w-0 flex-col gap-[.85em] border-r border-b1 bg-s1 px-[.7em] pt-[.95em] pb-[.8em]" style={rise(0)}>
      <div className="flex items-center gap-[.5em] px-[.25em]">
        <span className="grid size-[1.75em] shrink-0 place-items-center rounded-[.55em] bg-accent text-on-accent">
          <SparkleIcon weight="fill" size="1.05em" />
        </span>
        <span className="text-[1.02em] font-extrabold tracking-[-.02em] whitespace-nowrap">
          {MOCK.product[0]}
          <span className="text-accent">{MOCK.product[1]}</span>
        </span>
      </div>
      <div className="flex flex-col gap-[.12em]">
        {MOCK.nav.map((n) => {
          const on = n.id === tab.nav
          return (
            <span
              key={n.id}
              className={`flex min-w-0 items-center gap-[.6em] rounded-[.55em] px-[.6em] py-[.52em] text-[.8em] whitespace-nowrap ${on ? 'bg-wash font-bold text-accent' : 'font-semibold text-ink'}`}
            >
              <n.icon weight={on ? 'fill' : 'regular'} size="1em" className={`shrink-0 ${on ? 'text-accent' : 'text-ink3'}`} />
              <span className="truncate">{n.label}</span>
              {n.pro ? (
                <CrownIcon weight="fill" size=".85em" className="ml-auto text-accent" />
              ) : n.sub ? (
                <CaretRightIcon weight="bold" size=".7em" className="ml-auto text-ink4" />
              ) : null}
            </span>
          )
        })}
      </div>
      <span className="mt-auto flex items-center gap-[.6em] border-t border-b1 px-[.6em] pt-[.8em] text-[.76em] font-semibold whitespace-nowrap">
        <Foot size="1em" className="text-ink3" />
        {MOCK.footLink.label}
      </span>
    </aside>
  )
}

function PageHead({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="mock-rise flex flex-col gap-[.15em]" style={rise(2)}>
      <span className="text-[.7em] font-bold text-ink3">{kicker}</span>
      <span className="text-[1.55em] leading-[1.1] font-extrabold tracking-[-.03em]">{title}</span>
      <span className="text-[.78em] font-medium text-ink3">{sub}</span>
    </div>
  )
}

function Filters({ items, at }: { items: string[]; at: number }) {
  return (
    <div className="mock-rise flex flex-wrap gap-[.4em]" style={rise(at)}>
      {items.map((f, i) => (
        <span key={f} className={i === 0 ? FILTER_ON : FILTER}>
          {f}
        </span>
      ))}
    </div>
  )
}

function Foot({ children, at }: { children: ReactNode; at: number }) {
  return (
    <span className="mock-rise text-[.68em] leading-[1.5] font-medium text-ink4" style={rise(at)}>
      {children}
    </span>
  )
}

function HomeScreen() {
  const h = MOCK.home
  return (
    <>
      <PageHead {...h.head} />
      <div className={`mock-rise overflow-hidden ${PANEL}`} style={rise(3)}>
        <div className="flex items-center px-[.95em] pt-[.75em] pb-[.45em]">
          <span className={LABEL}>{h.today}</span>
          <span className="ml-auto text-[.76em] font-bold">{h.viewAll}</span>
        </div>
        <div className="flex items-center gap-[.5em] px-[.95em] pt-[.35em] pb-[.85em] text-[.8em] font-medium text-ink3">
          <CheckCircleIcon weight="fill" size="1.15em" className="shrink-0 text-accent" />
          <span>{h.status}</span>
        </div>
        <div className="flex items-center gap-[.9em] border-t border-b1 px-[.95em] py-[.6em]">
          <span className={LABEL}>{h.goTo}</span>
          {h.links.map((l) => (
            <span key={l} className="text-[.76em] font-bold whitespace-nowrap">
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="mock-rise mt-[.35em] flex items-center gap-[.6em]" style={rise(4)}>
        <span className="text-[1.15em] font-extrabold tracking-[-.02em]">{h.news}</span>
        <span className="ml-auto flex items-center gap-[.3em] rounded-[.5em] border border-b1 bg-s1 px-[.7em] py-[.4em] text-[.74em] font-bold whitespace-nowrap">
          <PlusIcon weight="bold" size=".9em" />
          {h.newUpdate}
        </span>
      </div>
      {h.updates.map((u, i) => (
        <div key={u.title} className="mock-rise grid grid-cols-[5.2em_minmax(0,1fr)] gap-[1em] border-t border-b1 pt-[.75em]" style={rise(i + 5)}>
          <div className="flex flex-col leading-[1.25]">
            <span className="text-[.85em] font-extrabold">{u.date}</span>
            <span className="text-[.7em] font-semibold text-ink3">{u.year}</span>
            <span className="mt-[.15em] text-[.7em] font-bold text-accent">{u.ago}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-[.15em]">
            <span className={`text-[.6em] font-extrabold tracking-[.12em] uppercase ${u.kind === 'New' ? 'text-accent' : 'text-ink2'}`}>{u.kind}</span>
            <span className="text-[.92em] font-extrabold tracking-[-.015em]">{u.title}</span>
            <span className="text-[.76em] leading-[1.55] font-medium text-ink3">{u.text}</span>
          </div>
        </div>
      ))}
    </>
  )
}

function BoardScreen() {
  const b = MOCK.board
  return (
    <>
      <PageHead {...b.head} />
      <div className="grid grid-cols-4 gap-[.7em]">
        {b.columns.map((col, i) => (
          <div key={col.name} className={`mock-rise flex min-w-0 flex-col gap-[.5em] px-[.6em] py-[.7em] ${PANEL}`} style={rise(i + 3)}>
            <div className="flex items-center gap-[.4em]">
              <span className="truncate text-[.66em] font-extrabold tracking-[.1em] text-ink3 uppercase">{col.name}</span>
              <span className="ml-auto grid min-w-[1.35em] place-items-center rounded-[.35em] bg-chip px-[.35em] py-[.1em] text-[.62em] font-extrabold text-ink3">
                {col.tasks.length}
              </span>
            </div>
            {col.tasks.map((t) => (
              <div key={t.title} className="flex flex-col gap-[.45em] rounded-[.5em] border border-b1 bg-s2 px-[.6em] py-[.55em]">
                <span className="text-[.74em] leading-[1.35] font-bold">{t.title}</span>
                <span className="flex items-center gap-[.4em]">
                  <span className="rounded-[.3em] bg-chip px-[.45em] py-[.15em] text-[.58em] font-extrabold tracking-[.08em] text-ink3 uppercase">{t.tag}</span>
                  <span className={`ml-auto size-[.7em] rounded-full ${t.mine ? 'bg-accent' : 'bg-s3'}`} />
                </span>
              </div>
            ))}
            <span className="flex items-center gap-[.3em] text-[.68em] font-bold text-ink4">
              <PlusIcon weight="bold" size=".9em" />
              {b.add}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function ListingsScreen() {
  const l = MOCK.listings
  return (
    <>
      <PageHead {...l.head} />
      <Filters items={l.filters} at={3} />
      <div className="flex flex-col gap-[.45em]">
        {l.rows.map((r, i) => (
          <div
            key={r.title}
            className={`mock-rise grid grid-cols-[5.2em_minmax(0,1fr)_5em_1em] items-center gap-[.7em] px-[.75em] py-[.6em] ${PANEL}`}
            style={rise(i + 4)}
          >
            <span className={`grid place-items-center rounded-[.35em] px-[.4em] py-[.22em] text-[.6em] font-extrabold tracking-[.06em] uppercase ${TONES[r.tone]}`}>{r.source}</span>
            <span className="flex min-w-0 flex-col gap-[.1em]">
              <span className="truncate text-[.78em] font-extrabold">{r.title}</span>
              <span className="truncate text-[.66em] font-medium text-ink3">{r.meta}</span>
            </span>
            <span className={`grid place-items-center rounded-full px-[.4em] py-[.22em] text-[.6em] font-extrabold tracking-[.06em] uppercase ${STATE[r.state]}`}>{showcase.mockStates[r.state]}</span>
            <CaretRightIcon weight="bold" size=".85em" className="text-ink4" />
          </div>
        ))}
      </div>
      <Foot at={9}>{l.foot}</Foot>
    </>
  )
}

function FeaturesScreen() {
  const f = MOCK.features
  return (
    <>
      <PageHead {...f.head} />
      <Filters items={f.filters} at={3} />
      <div className="grid grid-cols-5 gap-[.6em]">
        {f.tiles.map((t, i) => (
          <div key={t.name} className={`mock-rise relative flex min-w-0 flex-col gap-[.25em] px-[.65em] pt-[.7em] pb-[.8em] ${PANEL}`} style={rise(i + 4)}>
            <span className="mb-[.3em] grid size-[1.75em] place-items-center rounded-[.5em] bg-wash text-accent">
              <t.icon weight="fill" size="1em" />
            </span>
            <span className="text-[.74em] leading-[1.3] font-extrabold">{t.name}</span>
            <span className="text-[.66em] leading-[1.35] font-medium text-ink3">{t.note}</span>
            {t.pro && (
              <span className="absolute top-[.5em] right-[.5em] rounded-full bg-accent px-[.4em] py-[.12em] text-[.55em] font-extrabold tracking-[.1em] text-on-accent uppercase">
                {f.pro}
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function SearchScreen() {
  const s = MOCK.search
  return (
    <>
      <div className="mock-rise grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-stretch gap-[.6em]" style={rise(2)}>
        {s.fields.map((f) => (
          <span key={f.label} className={`flex min-w-0 flex-col gap-[.1em] rounded-[.55em] px-[.7em] py-[.5em] ${PANEL}`}>
            <span className="text-[.58em] font-extrabold tracking-[.12em] text-ink4 uppercase">{f.label}</span>
            <span className="truncate text-[.8em] font-bold">{f.value}</span>
          </span>
        ))}
        <span className="flex items-center gap-[.35em] rounded-[.55em] bg-accent px-[1em] text-[.78em] font-extrabold whitespace-nowrap text-on-accent">
          <MapPinLineIcon weight="fill" size=".95em" />
          {s.go}
        </span>
      </div>
      <span className="mock-rise text-[.7em] font-semibold text-ink3" style={rise(3)}>
        {s.meta}
      </span>
      <div className="flex flex-col gap-[.45em]">
        {s.results.map((r, i) => (
          <div
            key={r.name}
            className={`mock-rise grid grid-cols-[minmax(0,1fr)_5.2em_7.5em_6em] items-center gap-[.7em] px-[.75em] py-[.55em] ${PANEL}`}
            style={rise(i + 4)}
          >
            <span className="flex min-w-0 flex-col gap-[.1em]">
              <span className="truncate text-[.78em] font-extrabold">{r.name}</span>
              <span className="truncate text-[.66em] font-medium text-ink3">{r.place}</span>
            </span>
            <span className="flex items-center gap-[.25em] text-[.74em] font-extrabold whitespace-nowrap">
              <StarIcon weight="fill" size=".85em" className="text-accent" />
              {r.rating}
              <span className="font-medium text-ink3">({r.reviews})</span>
            </span>
            <span className="flex items-center gap-[.5em]">
              <span className="h-[.32em] flex-1 overflow-hidden rounded-full bg-chip">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${r.score}%` }} />
              </span>
              <span className="min-w-[1.4em] text-right text-[.72em] font-extrabold">{r.score}</span>
            </span>
            <span className="grid place-items-center rounded-full bg-chip px-[.45em] py-[.22em] text-[.58em] font-extrabold tracking-[.06em] text-ink3 uppercase">{r.tag}</span>
          </div>
        ))}
      </div>
      <Foot at={9}>{s.foot}</Foot>
    </>
  )
}
