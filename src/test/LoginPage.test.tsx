import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { useCustomerApi } from '../hooks/useCustomerApi'
import { LoginPage } from '../pages/LoginPage'

const AUTH_ACCOUNTS_STORAGE_KEY = 'customer-manager-auth-accounts'

vi.mock('../hooks/useCustomerApi', () => ({
  useCustomerApi: vi.fn(),
}))

describe('LoginPage', () => {
  const addCustomer = vi.fn()
  const isEmailInUse = vi.fn()

  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
    addCustomer.mockReset()
    isEmailInUse.mockReset()
    isEmailInUse.mockResolvedValue(false)
    addCustomer.mockResolvedValue(true)

    vi.mocked(useCustomerApi).mockReturnValue({
      addCustomer,
      isEmailInUse,
      error: null,
    } as unknown as ReturnType<typeof useCustomerApi>)
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

    await userEvent.type(screen.getByLabelText('Name'), 'Maria Garcia')
    await userEvent.type(screen.getByLabelText('Email'), 'maria.garcia@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '5550101')
    await userEvent.type(screen.getByLabelText('Address'), '742 Evergreen Terrace')
    await userEvent.type(screen.getByLabelText('City'), 'Springfield')
    await userEvent.type(screen.getByLabelText('State'), 'il')
    await userEvent.type(screen.getByLabelText('ZIP'), '62704')
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
    expect(savedAccounts[0].username).toBe('maria.garcia@example.com')
    expect(savedAccounts[0].password).toBeUndefined()
    expect(savedAccounts[0].passwordHash).toBeTruthy()
    expect(savedAccounts[0].passwordSalt).toBeTruthy()
    expect(savedAccounts[0].passwordVersion).toBe(2)

    expect(isEmailInUse).toHaveBeenCalledWith('maria.garcia@example.com')
    expect(addCustomer).toHaveBeenCalledWith({
      name: 'Maria Garcia',
      email: 'maria.garcia@example.com',
      phone: '5550101',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
    })
  })

  it('shows customer duplicate validation and does not create account', async () => {
    isEmailInUse.mockResolvedValue(true)

    renderPage('/login')

    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    await userEvent.type(screen.getByLabelText('Name'), 'New Person')
    await userEvent.type(screen.getByLabelText('Email'), 'newperson@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '5551111')
    await userEvent.type(screen.getByLabelText('Password'), 'Secret#123')
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'Secret#123')

    await userEvent.click(screen.getByRole('button', { name: /^Create Account$/ }))

    await waitFor(() => {
      expect(
        screen.getByText('A customer with this email already exists.'),
      ).toBeInTheDocument()
    })

    expect(addCustomer).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Home', level: 2 })).not.toBeInTheDocument()
  })

  it('logs in with an existing account', async () => {
    window.localStorage.setItem(
      AUTH_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([{ username: 'james', password: 'pw1234' }]),
    )

    renderPage('/login')

    await userEvent.type(screen.getByLabelText('Email or Phone'), 'james')
    await userEvent.type(screen.getByLabelText('Password'), 'pw1234')
    await userEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Home', level: 2 })).toBeInTheDocument()
    })
  })

  it('shows validation error when creating an account with a short password', async () => {
    renderPage('/login')

    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await userEvent.type(screen.getByLabelText('Name'), 'Aisha Patel')
    await userEvent.type(screen.getByLabelText('Email'), 'aisha@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '5550103')
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

    await userEvent.type(screen.getByLabelText('Name'), 'Nina Flores')
    await userEvent.type(screen.getByLabelText('Email'), 'nina@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '5550133')
    await userEvent.type(screen.getByLabelText('Password'), 'Password1')
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'Password1')

    await userEvent.click(screen.getByRole('button', { name: /^Create Account$/ }))

    expect(
      screen.getByText('Password must include at least one special character.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Home', level: 2 })).not.toBeInTheDocument()
  })

  it('logs in with an existing account using a phone number', async () => {
    window.localStorage.setItem(
      AUTH_ACCOUNTS_STORAGE_KEY,
      JSON.stringify([
        {
          username: 'james',
          phone: '+15551234567',
          password: 'pw1234',
        },
      ]),
    )

    renderPage('/login')

    await userEvent.type(screen.getByLabelText('Email or Phone'), '+1 (555) 123-4567')
    await userEvent.type(screen.getByLabelText('Password'), 'pw1234')
    await userEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Home', level: 2 })).toBeInTheDocument()
    })
  })
})