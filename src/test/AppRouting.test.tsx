import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
import { CustomerProvider } from '../context/CustomerContext'

const AUTH_STORAGE_KEY = 'customer-manager-auth-user'
const AUTH_ACCOUNTS_STORAGE_KEY = 'customer-manager-auth-accounts'

describe('App routing', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('redirects unauthenticated users to /login when navigating to /add', async () => {
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
      expect(screen.getByRole('heading', { name: 'Login', level: 2 })).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Email or Phone')).toBeInTheDocument()
  })

  it('renders add customer form for admin users on /add', async () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ username: 'admin@customerapp.local', role: 'admin' }),
    )
    window.localStorage.setItem(
      AUTH_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([
        {
          username: 'admin@customerapp.local',
          email: 'admin@customerapp.local',
          role: 'admin',
          password: 'Admin#123',
        },
      ]),
    )

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

    expect(screen.getByLabelText('Email or Phone')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })

  it('renders account page when navigating to /account while authenticated', async () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ username: 'maria' }),
    )

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [],
      headers: { get: () => '0' },
    } as unknown as Response)

    render(
      <MemoryRouter initialEntries={['/account']}>
        <AuthProvider>
          <CustomerProvider>
            <App />
          </CustomerProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Account', level: 2 })).toBeInTheDocument()
    })

    expect(screen.getAllByText('Signed in as maria')).toHaveLength(2)
  })
})
