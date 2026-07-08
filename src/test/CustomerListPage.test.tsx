import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CustomerListPage } from '../pages/CustomerListPage'
import { useCustomerApi } from '../hooks/useCustomerApi'

vi.mock('../hooks/useCustomerApi', () => ({
  useCustomerApi: vi.fn(),
}))

describe('CustomerListPage', () => {
  const fetchCustomers = vi.fn()
  const deleteCustomer = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('loads first page and supports next page navigation', async () => {
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
      totalCustomers: 30,
      isLoading: false,
      error: null,
      fetchCustomers,
      deleteCustomer,
    } as unknown as ReturnType<typeof useCustomerApi>)

    render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchCustomers).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        searchTerm: '',
        sortField: 'name',
        sortDirection: 'asc',
      })
    })

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(fetchCustomers).toHaveBeenCalledWith({
        page: 2,
        perPage: 10,
        searchTerm: '',
        sortField: 'name',
        sortDirection: 'asc',
      })
    })

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(fetchCustomers).toHaveBeenCalledWith({
        page: 3,
        perPage: 10,
        searchTerm: '',
        sortField: 'name',
        sortDirection: 'asc',
      })
    })

    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
  })

  it('applies search and rows-per-page changes', async () => {
    vi.mocked(useCustomerApi).mockReturnValue({
      customers: [],
      totalCustomers: 0,
      isLoading: false,
      error: null,
      fetchCustomers,
      deleteCustomer,
    } as unknown as ReturnType<typeof useCustomerApi>)

    render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Search customers'), 'm')

    await waitFor(() => {
      expect(fetchCustomers).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        searchTerm: 'm',
        sortField: 'name',
        sortDirection: 'asc',
      })
    })

    await userEvent.selectOptions(screen.getByLabelText('Rows per page'), '25')

    await waitFor(() => {
      expect(fetchCustomers).toHaveBeenCalledWith({
        page: 1,
        perPage: 25,
        searchTerm: 'm',
        sortField: 'name',
        sortDirection: 'asc',
      })
    })
  })

  it('deletes a customer when confirmation is accepted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteCustomer.mockResolvedValue(true)

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
      totalCustomers: 1,
      isLoading: false,
      error: null,
      fetchCustomers,
      deleteCustomer,
    } as unknown as ReturnType<typeof useCustomerApi>)

    render(
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Delete Maria Garcia' }))

    await waitFor(() => {
      expect(deleteCustomer).toHaveBeenCalledWith(1)
    })
  })
})
