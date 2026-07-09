import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
import { CustomerProvider } from '../context/CustomerContext'

describe('App routing', () => {
  it('renders the add customer form when navigating to /add', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
      headers: { get: () => '0' },
    } as unknown as Response)

    render(
      <MemoryRouter initialEntries={['/add']}>
        <AuthProvider>
          <CustomerProvider>
            <App />
          </CustomerProvider>
        </AuthProvider>
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

  it('redirects unauthenticated users to /login when navigating to /edit/:id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
      headers: { get: () => '0' },
    } as unknown as Response)

    render(
      <MemoryRouter initialEntries={['/edit/1']}>
        <AuthProvider>
          <CustomerProvider>
            <App />
          </CustomerProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Login', level: 2 })).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })
})
