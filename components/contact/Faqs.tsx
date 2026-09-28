'use client'

import { useState } from 'react'
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react/ssr'
import { FAQS } from '@/data/faqs'

/** Kraft's FAQ accordion (KraftScreens.dc.html:525-538, 1202-1207): the first answer open, one at a time. */
export default function Faqs() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <ul className="mt-3.5 flex flex-col">
      {FAQS.map((item, i) => {
        const on = open === i
        const n = String(i + 1).padStart(2, '0')
        const Caret = on ? CaretUpIcon : CaretDownIcon
        return (
          <li key={item.q} className="border-b border-b1">
            <h3>
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`faq-${n}`}
                onClick={() => setOpen(on ? null : i)}
                className="flex min-h-[52px] w-full cursor-pointer items-start gap-3.5 border-0 bg-transparent px-0.5 py-[15px] text-left"
              >
                <span aria-hidden className="shrink-0 font-mono text-[10.5px] leading-[1.45] text-accent">{n}</span>
                <span className="text-[13.5px] leading-[1.35] font-semibold text-ink-soft">{item.q}</span>
                <Caret aria-hidden className={`ml-auto shrink-0 text-[15px] transition-colors duration-250 ${on ? 'text-accent' : 'text-ink3'}`} />
              </button>
            </h3>
            <div id={`faq-${n}`} hidden={!on} className="mr-1.5 mb-4 ml-[38px] animate-rise text-[12.5px] leading-[1.65] whitespace-pre-line text-ink3">
              <p>{item.a}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
