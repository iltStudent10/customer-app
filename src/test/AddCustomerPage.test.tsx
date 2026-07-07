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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits customer data through addCustomer', async () => {
    addCustomer.mockResolvedValue(true)

    vi.mocked(useCustomerApi).mockReturnValue({
      addCustomer,
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
  })

  it('renders API error when present', () => {
    vi.mocked(useCustomerApi).mockReturnValue({
      addCustomer,
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
