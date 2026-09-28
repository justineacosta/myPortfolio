import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeButton from '@/components/shell/ThemeButton'

describe('ThemeButton', () => {
  it('is labelled like Kraft and toggles the theme', async () => {
    document.documentElement.dataset.theme = 'dark'
    render(<ThemeButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Toggle dark and light mode' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
