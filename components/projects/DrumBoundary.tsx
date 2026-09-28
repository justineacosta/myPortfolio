'use client'

import { Component, type ReactNode } from 'react'

type Props = { onFail: () => void; children: ReactNode }

/**
 * Catches anything the lazy drum throws: a chunk that fails to load (a
 * redeploy while the tab was open, a dropped connection) or a runtime error
 * in the scene. The sites view then falls back to its grid instead of the
 * whole page failing (spec §12).
 */
export default class DrumBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFail()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
