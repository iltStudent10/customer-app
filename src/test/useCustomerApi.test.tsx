import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomerProvider } from '../context/CustomerContext'
import { useCustomerApi } from '../hooks/useCustomerApi'

function wrapper({ children }: PropsWithChildren) {
  return <CustomerProvider>{children}</CustomerProvider>
}

describe('useCustomerApi', () => {
  const sampleCustomer = {
    id: 1,
    name: 'Maria Garcia',
    email: 'maria@example.com',
    phone: '555-0101',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62704',
  }

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
          sampleCustomer,
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

  it('falls back to data length when total count header is missing', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [sampleCustomer],
        headers: { get: () => 'not-a-number' },
      } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.fetchCustomers({
        page: 1,
        perPage: 10,
      })
    })

    await waitFor(() => {
      expect(result.current.totalCustomers).toBe(1)
    })
  })

  it('returns an already loaded customer without making a detail fetch', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [sampleCustomer],
      headers: { get: () => '1' },
    } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const customer = await result.current.getCustomerById(1)

    expect(customer).toEqual(sampleCustomer)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns null for getCustomerById when api returns 404', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const customer = await result.current.getCustomerById(999)
    expect(customer).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets error when getCustomerById request fails', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response)
      .mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let customer = null
    await act(async () => {
      customer = await result.current.getCustomerById(2)
    })

    expect(customer).toBeNull()
    await waitFor(() => {
      expect(result.current.error).toBe('Unable to load customer right now.')
    })
  })

  it('checks duplicate email and supports excluding current customer id', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ ...sampleCustomer, id: 12, email: 'MAria@example.com' }],
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ ...sampleCustomer, id: 12, email: 'MAria@example.com' }],
      } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const inUse = await result.current.isEmailInUse(' maria@example.com ')
    const notInUseForSelf = await result.current.isEmailInUse(
      ' maria@example.com ',
      12,
    )

    expect(inUse).toBe(true)
    expect(notInUseForSelf).toBe(false)
  })

  it('returns false for blank email without calling duplicate-check api', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      headers: { get: () => '0' },
    } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const inUse = await result.current.isEmailInUse('   ')
    expect(inUse).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('updates customer and refreshes list', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleCustomer,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [sampleCustomer],
        headers: { get: () => '1' },
      } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let wasUpdated = false
    await act(async () => {
      wasUpdated = await result.current.updateCustomer(sampleCustomer)
    })

    expect(wasUpdated).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/customers/1',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('returns false and sets error when delete fails', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let wasDeleted = true
    await act(async () => {
      wasDeleted = await result.current.deleteCustomer(1)
    })

    expect(wasDeleted).toBe(false)
    expect(result.current.error).toBe('Unable to delete customer right now.')
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

  it('sets an error message when add customer fails', async () => {
    const fetchMock = vi.mocked(globalThis.fetch)

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as unknown as Response)

    const { result } = renderHook(() => useCustomerApi(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let wasCreated = true
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

    expect(wasCreated).toBe(false)
    expect(result.current.error).toBe('Unable to add customer right now.')
  })
})
