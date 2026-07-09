import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { LoginPage } from '../pages/LoginPage'

const AUTH_ACCOUNTS_STORAGE_KEY = 'customer-manager-auth-accounts'

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  function renderPage(initialPath = '/login') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<h2>Home</h2>} />
            <Route path="/edit/:id" element={<h2>Edit Customer</h2>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
  }

  it('creates a new account and redirects after successful registration', async () => {
    renderPage('/login')

    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await userEvent.type(screen.getByLabelText('Username'), 'maria')
    await userEvent.type(screen.getByLabelText('Password'), 'Secret#123')
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'Secret#123')

    await userEvent.click(screen.getByRole('button', { name: /^Create Account$/ }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Home', level: 2 })).toBeInTheDocument()
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

  it('logs in with an existing account', async () => {
    window.localStorage.setItem(
      AUTH_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([{ username: 'james', password: 'pw1234' }]),
    )

    renderPage('/login')

    await userEvent.type(screen.getByLabelText('Username'), 'james')
    await userEvent.type(screen.getByLabelText('Password'), 'pw1234')
    await userEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Home', level: 2 })).toBeInTheDocument()
    })
  })

  it('shows validation error when creating an account with a short password', async () => {
    renderPage('/login')

    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await userEvent.type(screen.getByLabelText('Username'), 'aisha')
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'short')

    await userEvent.click(screen.getByRole('button', { name: /^Create Account$/ }))

    expect(
      screen.getByText('Password must be at least 8 characters long.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Home', level: 2 })).not.toBeInTheDocument()
  })

  it('shows validation error when creating an account without a special character', async () => {
    renderPage('/login')

    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await userEvent.type(screen.getByLabelText('Username'), 'nina')
    await userEvent.type(screen.getByLabelText('Password'), 'Password1')
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password1')

    await userEvent.click(screen.getByRole('button', { name: /^Create Account$/ }))

    expect(
      screen.getByText('Password must include at least one special character.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Home', level: 2 })).not.toBeInTheDocument()
  })
})