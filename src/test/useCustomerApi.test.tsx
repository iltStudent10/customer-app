import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomerProvider } from '../context/CustomerContext'
import { useCustomerApi } from '../hooks/useCustomerApi'

function wrapper({ children }: PropsWithChildren) {
  return <CustomerProvider>{children}</CustomerProvider>
}

describe('useCustomerApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches paginated customers and exposes total count', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
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
        headers: { get: () => '21' },
      } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.fetchCustomers({
        page: 2,
        perPage: 10,
        searchTerm: 'maria',
        sortField: 'name',
        sortDirection: 'asc',
      })
    })

    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/customers?_page=2&_limit=10&q=maria&_sort=name&_order=asc',
    )
    expect(result.current.customers).toHaveLength(1)
    expect(result.current.totalCustomers).toBe(21)
    expect(result.current.customers[0].name).toBe('Maria Garcia')
  })

  it('adds a customer and refreshes the list', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock.mockImplementation(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
            ? input.url
            : String(input)
      const method = init?.method ?? 'GET'

      if (url.includes('/api/customers?_page=') && method === 'GET') {
        return {
          ok: true,
          json: async () => [
            {
              id: 7,
              name: 'New Customer',
              email: 'new@example.com',
              phone: '555-1111',
              address: '1 Test Ave',
              city: 'Austin',
              state: 'TX',
              zip: '73301',
            },
          ],
          headers: { get: () => '1' },
        } as unknown as Response
      }

      if (url.endsWith('/api/customers') && method === 'POST') {
        return {
          ok: true,
          json: async () => ({
            id: 7,
          }),
        } as unknown as Response
      }

      return {
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response
    })

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    let wasCreated = false
    await act(async () => {
      wasCreated = await result.current.addCustomer({
        name: 'New Customer',
        email: 'new@example.com',
        phone: '555-1111',
        address: '1 Test Ave',
        city: 'Austin',
        state: 'TX',
        zip: '73301',
      })
    })

    expect(wasCreated).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/customers',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.current.customers).toHaveLength(1)
    expect(result.current.customers[0].name).toBe('New Customer')
  })

  it('sets an error message when customer fetch fails', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Unable to load customers right now.')
  })
})
