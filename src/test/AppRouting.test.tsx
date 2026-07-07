import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { CustomerProvider } from '../context/CustomerContext'

describe('App routing', () => {
  it('renders the add customer form when navigating to /add', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
      headers: { get: () => '0' },
    } as Response)

    render(
      <MemoryRouter initialEntries={['/add']}>
        <CustomerProvider>
          <App />
        </CustomerProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Add Customer', level: 2 }),
      ).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Customer' })).toBeInTheDocument()
  })
})
