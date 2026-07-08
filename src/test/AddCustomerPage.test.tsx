import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AddCustomerPage } from '../pages/AddCustomerPage'
import { useCustomerApi } from '../hooks/useCustomerApi'
import type { CustomerFormData } from '../types/customer'

vi.mock('../hooks/useCustomerApi', () => ({
  useCustomerApi: vi.fn(),
}))

vi.mock('../components/CustomerForm', () => ({
  CustomerForm: ({
    onSubmit,
  }: {
    onSubmit: (data: CustomerFormData) => Promise<void> | void
  }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit({
          name: 'New User',
          email: 'new@example.com',
          phone: '555-1212',
          address: '123 Main',
          city: 'Seattle',
          state: 'WA',
          zip: '98101',
        })
      }
    >
      Trigger Add
    </button>
  ),
}))

describe('AddCustomerPage', () => {
  const addCustomer = vi.fn()
  const isEmailInUse = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits customer data through addCustomer', async () => {
    isEmailInUse.mockResolvedValue(false)
    addCustomer.mockResolvedValue(true)

    vi.mocked(useCustomerApi).mockReturnValue({
      addCustomer,
      isEmailInUse,
      error: null,
    } as unknown as ReturnType<typeof useCustomerApi>)

    render(
      <MemoryRouter>
        <AddCustomerPage />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Add' }))

    await waitFor(() => {
      expect(addCustomer).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        phone: '555-1212',
        address: '123 Main',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
      })
    })

    expect(isEmailInUse).toHaveBeenCalledWith('new@example.com')
  })

  it('shows duplicate email validation and does not submit', async () => {
    isEmailInUse.mockResolvedValue(true)

    vi.mocked(useCustomerApi).mockReturnValue({
      addCustomer,
      isEmailInUse,
      error: null,
    } as unknown as ReturnType<typeof useCustomerApi>)

    render(
      <MemoryRouter>
        <AddCustomerPage />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Add' }))

    await waitFor(() => {
      expect(screen.getByText('A customer with this email already exists.')).toBeInTheDocument()
    })
    expect(addCustomer).not.toHaveBeenCalled()
  })

  it('renders API error when present', () => {
    vi.mocked(useCustomerApi).mockReturnValue({
      addCustomer,
      isEmailInUse,
      error: 'Unable to add customer right now.',
    } as unknown as ReturnType<typeof useCustomerApi>)

    render(
      <MemoryRouter>
        <AddCustomerPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Unable to add customer right now.')).toBeInTheDocument()
  })
})
