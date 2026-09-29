'use client'

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { FRONT, PEEK_DELAY_MS, slotOf, SPIN_MS, SWIPE_CLICK_MS, TAP_SLOP_PX, TILT_DEG, TOUCH_HOLD_MS } from '@/lib/fan'

type Options = {
  /** How many items take turns on the arc. */
  count: number
  /** The arc slot under a pointer `dx` px from the fan's centre, on a fan `width` px wide. */
  pick: (dx: number, width: number) => number
}

/**
 * A fan of cards inside a link that turns one step every SPIN_MS while it is
 * on screen, so every item takes the front (lib/fan.ts). A mouse over it holds
 * it, tilts the stage toward the pointer, brings the slot under the pointer
 * forward and, once the pointer rests, sets `peek`. A finger swiping across it
 * scrubs it; the click a browser may send straight after that swipe is
 * cancelled, so the link does not follow. Keyboard focus on the link holds it
 * and names the front item. With reduced motion it neither turns, tilts nor
 * peeks.
 *
 * Spread `handlers` on the fan element (`fan`), and give the element that
 * tilts `stage`; it gets --tx and --ty.
 */
export function useFan({ count, pick }: Options) {
  const still = useReducedMotion()
  const fan = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [turn, setTurn] = useState(0)
  /** The arc slot a pointer or finger has brought forward. */
  const [focus, setFocus] = useState<number | null>(null)
  /** A mouse is over the fan, or a finger is on it (or just left it). */
  const [held, setHeld] = useState(false)
  const [keyboard, setKeyboard] = useState(false)
  const [peek, setPeek] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [shown, setShown] = useState(true)
  const touch = useRef<{ x0: number; moved: boolean } | null>(null)
  const swallowClick = useRef(false)
  const peekTimer = useRef<number | undefined>(undefined)
  const holdTimer = useRef<number | undefined>(undefined)
  const swallowTimer = useRef<number | undefined>(undefined)

  // Only turn while the fan is on screen and the tab is visible.
  useEffect(() => {
    const el = fan.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const onVis = () => setShown(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Keyboard focus on the link the fan sits in holds it.
  useEffect(() => {
    const link = fan.current?.closest('a')
    if (!link) return
    const on = () => setKeyboard(true)
    const off = () => setKeyboard(false)
    link.addEventListener('focus', on)
    link.addEventListener('blur', off)
    return () => {
      link.removeEventListener('focus', on)
      link.removeEventListener('blur', off)
    }
  }, [])

  const spinning = !still && onScreen && shown && !held && !keyboard
  useEffect(() => {
    if (!spinning) return
    const t = window.setInterval(() => setTurn((n) => n + 1), SPIN_MS)
    return () => window.clearInterval(t)
  }, [spinning])

  useEffect(
    () => () => {
      window.clearTimeout(peekTimer.current)
      window.clearTimeout(holdTimer.current)
      window.clearTimeout(swallowTimer.current)
    },
    [],
  )

  /** Brings slot `s` forward, and (for a mouse, with motion on) peeks after a rest. */
  const bring = (s: number, withPeek: boolean) => {
    if (s === focus) return
    setFocus(s)
    setPeek(false)
    window.clearTimeout(peekTimer.current)
    if (withPeek && !still) peekTimer.current = window.setTimeout(() => setPeek(true), PEEK_DELAY_MS)
  }

  const tilt = (x: number, y: number) => {
    stage.current?.style.setProperty('--tx', `${(-y * TILT_DEG.x).toFixed(2)}deg`)
    stage.current?.style.setProperty('--ty', `${(x * TILT_DEG.y).toFixed(2)}deg`)
  }

  /** Where a pointer is across the fan: its offset from the centre in px, and -1..1 each way. */
  const locate = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (box.left + box.width / 2)
    const dy = e.clientY - (box.top + box.height / 2)
    return { dx, width: box.width, nx: box.width ? (2 * dx) / box.width : 0, ny: box.height ? (2 * dy) / box.height : 0 }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const at = locate(e)
    if (e.pointerType === 'touch') {
      const t = touch.current
      if (!t) return
      if (Math.abs(e.clientX - t.x0) > TAP_SLOP_PX) t.moved = true
      if (t.moved) bring(pick(at.dx, at.width), false)
      return
    }
    setHeld(true)
    bring(pick(at.dx, at.width), true)
    if (!still) tilt(at.nx, at.ny)
  }

  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    setHeld(false)
    setFocus(null)
    setPeek(false)
    window.clearTimeout(peekTimer.current)
    tilt(0, 0)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return
    window.clearTimeout(holdTimer.current)
    touch.current = { x0: e.clientX, moved: false }
    setHeld(true)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch' || !touch.current) return
    // A swipe is not a tap: the click a browser may send straight after it does
    // not follow the link. Browsers often send none, so the flag only lasts a moment.
    swallowClick.current = touch.current.moved
    window.clearTimeout(swallowTimer.current)
    if (touch.current.moved) swallowTimer.current = window.setTimeout(() => (swallowClick.current = false), SWIPE_CLICK_MS)
    touch.current = null
    holdTimer.current = window.setTimeout(() => {
      setHeld(false)
      setFocus(null)
    }, TOUCH_HOLD_MS)
  }

  /** Cancels the click that ends a swipe, before the link sees it. */
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!swallowClick.current) return
    swallowClick.current = false
    e.preventDefault()
    e.stopPropagation()
  }

  const front = focus ?? FRONT
  const named = focus !== null ? focus : keyboard ? FRONT : null
  /** The item in `slot` now, if any. */
  const itemAt = (slot: number) => Array.from({ length: count }, (_, i) => i).find((i) => slotOf(i, turn, count) === slot)

  return {
    fan,
    stage,
    turn,
    held,
    peek,
    /** The arc slot in front: the one a pointer brought forward, else the middle. */
    front,
    /** The item to name, while a pointer, finger or keyboard focus is on the fan. */
    named: named === null ? undefined : itemAt(named),
    frontItem: itemAt(front),
    slotOf: (i: number) => slotOf(i, turn, count),
    handlers: {
      onPointerEnter: onPointerMove,
      onPointerMove,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClick,
    },
  }
}
