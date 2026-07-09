import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { AccountPage } from '../pages/AccountPage'

const AUTH_STORAGE_KEY = 'customer-manager-auth-user'
const AUTH_ACCOUNTS_STORAGE_KEY = 'customer-manager-auth-accounts'

describe('AccountPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ username: 'maria' }),
    )
    window.localStorage.setItem(
      AUTH_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([
        {
          username: 'maria',
          passwordHash: 'legacy-hash',
          passwordSalt: 'legacy-salt',
          passwordVersion: 2,
        },
      ]),
    )
  })

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/account']}>
        <AuthProvider>
          <Routes>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/" element={<h2>Home</h2>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
  }

  it('updates username and persists the new session user', async () => {
    renderPage()

    await userEvent.clear(screen.getByLabelText('New Username'))
    await userEvent.type(screen.getByLabelText('New Username'), 'maria2')
    await userEvent.click(screen.getByRole('button', { name: 'Update Username' }))

    await waitFor(() => {
      expect(screen.getByText('Username updated successfully.')).toBeInTheDocument()
    })

    expect(screen.getByText('Signed in as maria2')).toBeInTheDocument()

    const savedUser = JSON.parse(
      window.localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}',
    ) as { username?: string }
    const savedAccounts = JSON.parse(
      window.localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY) ?? '[]',
    ) as Array<{
      username: string
      password?: string
      passwordHash?: string
      passwordSalt?: string
      passwordVersion?: number
    }>

    expect(savedUser.username).toBe('maria2')
    expect(savedAccounts).toHaveLength(1)
    expect(savedAccounts[0].username).toBe('maria2')
    expect(savedAccounts[0].password).toBeUndefined()
    expect(savedAccounts[0].passwordHash).toBeTruthy()
    expect(savedAccounts[0].passwordSalt).toBeTruthy()
    expect(savedAccounts[0].passwordVersion).toBe(2)
  })

  it('shows an error when current password is wrong during password update', async () => {
    renderPage()

    await userEvent.type(screen.getByLabelText('Current Password'), 'Wrong#123')
    await userEvent.type(screen.getByLabelText('New Password'), 'Better#123')
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'Better#123')
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect.')).toBeInTheDocument()
    })
  })

  it('updates password when current password is correct', async () => {
    window.localStorage.setItem(
      AUTH_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([{ username: 'maria', password: 'Secret#123' }]),
    )

    renderPage()

    await userEvent.type(screen.getByLabelText('Current Password'), 'Secret#123')
    await userEvent.type(screen.getByLabelText('New Password'), 'Better#123')
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'Better#123')
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(screen.getByText('Password updated successfully.')).toBeInTheDocument()
    })

    const savedAccounts = JSON.parse(
      window.localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY) ?? '[]',
    ) as Array<{
      username: string
      password?: string
      passwordHash?: string
      passwordSalt?: string
      passwordVersion?: number
    }>

    expect(savedAccounts).toHaveLength(1)
    expect(savedAccounts[0].username).toBe('maria')
    expect(savedAccounts[0].password).toBeUndefined()
    expect(savedAccounts[0].passwordHash).toBeTruthy()
    expect(savedAccounts[0].passwordSalt).toBeTruthy()
    expect(savedAccounts[0].passwordVersion).toBe(2)
  })
})