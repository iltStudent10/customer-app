import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EditCustomerPage } from '../pages/EditCustomerPage'
import { useCustomerApi } from '../hooks/useCustomerApi'
import type { CustomerFormData } from '../types/customer'

vi.mock('../hooks/useCustomerApi', () => ({
  useCustomerApi: vi.fn(),
}))

vi.mock('../components/CustomerForm', () => ({
  CustomerForm: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (data: CustomerFormData) => Promise<void> | void
    onCancel: () => void
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onSubmit({
            name: 'Updated Name',
            email: 'updated@example.com',
            phone: '555-9999',
            address: '99 Updated Rd',
            city: 'Denver',
            state: 'CO',
            zip: '80202',
          })
        }
      >
        Trigger Submit
      </button>
      <button type="button" onClick={onCancel}>
        Trigger Cancel
      </button>
    </div>
  ),
}))

describe('EditCustomerPage', () => {
  const updateCustomer = vi.fn()
  const getCustomerById = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderPage(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/edit/:id" element={<EditCustomerPage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders existing customer and submits updates', async () => {
    updateCustomer.mockResolvedValue(true)

    vi.mocked(useCustomerApi).mockReturnValue({
      customers: [
        {
          id: 1,
          name: 'Maria Garcia',
          email: 'maria@example.com',
          phone: '555-0101',
          address: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'IL',
          zip: '62704',
        },
      ],
      updateCustomer,
      getCustomerById,
      error: null,
    } as unknown as ReturnType<typeof useCustomerApi>)

    renderPage('/edit/1')

    await waitFor(() => {
      expect(screen.getByText('Customer ID: 1')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Submit' }))

    await waitFor(() => {
      expect(updateCustomer).toHaveBeenCalledWith({
        id: 1,
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '555-9999',
        address: '99 Updated Rd',
        city: 'Denver',
        state: 'CO',
        zip: '80202',
      })
    })
  })

  it('renders error message when customer cannot be loaded', async () => {
    getCustomerById.mockResolvedValue(null)

    vi.mocked(useCustomerApi).mockReturnValue({
      customers: [],
      updateCustomer,
      getCustomerById,
      error: 'Unable to load customer right now.',
    } as unknown as ReturnType<typeof useCustomerApi>)

    renderPage('/edit/99')

    await waitFor(() => {
      expect(screen.getByText('Unable to load customer right now.')).toBeInTheDocument()
    })
  })

  it('renders not found when customer does not exist and no API error', async () => {
    getCustomerById.mockResolvedValue(null)

    vi.mocked(useCustomerApi).mockReturnValue({
      customers: [],
      updateCustomer,
      getCustomerById,
      error: null,
    } as unknown as ReturnType<typeof useCustomerApi>)

    renderPage('/edit/777')

    await waitFor(() => {
      expect(screen.getByText('Customer not found.')).toBeInTheDocument()
    })
  })
})
