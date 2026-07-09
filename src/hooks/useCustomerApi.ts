import { useCallback, useEffect, useRef, useState } from 'react'
import { useCustomerContext } from './useCustomerContext'
import type { Customer, CustomerFormData } from '../types/customer'

const REQUEST_TIMEOUT_MS = 8000
const RETRY_ATTEMPTS = 2
const RETRY_DELAY_MS = 250

interface FetchCustomersOptions {
  page?: number
  perPage?: number
  searchTerm?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

interface FetchCustomersResult {
  customers: Customer[]
  matchingCustomers: number
  totalCustomers: number
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function isRetriableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function toFriendlyErrorMessage(
  fallbackMessage: string,
  error: unknown,
): string {
  if (isAbortError(error)) {
    return 'The request timed out. Please try again.'
  }

  return fallbackMessage
}

export function useCustomerApi() {
  const { customers, setCustomers } = useCustomerContext()
  const [isLoading, setIsLoading] = useState(customers.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [totalCustomers, setTotalCustomers] = useState(customers.length)
  const [matchingCustomers, setMatchingCustomers] = useState(customers.length)
  const lastQueryRef = useRef<FetchCustomersOptions>({ page: 1, perPage: 10 })
  const listAbortControllerRef = useRef<AbortController | null>(null)
  const listRequestIdRef = useRef(0)

  const fetchWithResilience = useCallback(
    async (input: string, init?: RequestInit): Promise<Response> => {
      const method = (init?.method ?? 'GET').toUpperCase()
      const allowsRetry = method === 'GET' || method === 'HEAD'
      const maxAttempts = allowsRetry ? RETRY_ATTEMPTS + 1 : 1
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const timeoutController = new AbortController()
        const timeoutId = window.setTimeout(() => {
          timeoutController.abort()
        }, REQUEST_TIMEOUT_MS)

        if (init?.signal) {
          if (init.signal.aborted) {
            timeoutController.abort()
          } else {
            init.signal.addEventListener(
              'abort',
              () => {
                timeoutController.abort()
              },
              { once: true },
            )
          }
        }

        try {
          const response = await fetch(input, {
            ...init,
            signal: timeoutController.signal,
          })

          if (!response.ok) {
            if (allowsRetry && attempt < maxAttempts && isRetriableStatus(response.status)) {
              await delay(RETRY_DELAY_MS * attempt)
              continue
            }

            throw new Error(`Request failed with status ${response.status}`)
          }

          return response
        } catch (error) {
          if (error instanceof Error) {
            lastError = error
          } else {
            lastError = new Error('Request failed')
          }

          if (!allowsRetry || attempt === maxAttempts || isAbortError(error)) {
            break
          }

          await delay(RETRY_DELAY_MS * attempt)
        } finally {
          window.clearTimeout(timeoutId)
        }
      }

      throw lastError ?? new Error('Request failed')
    },
    [],
  )

  const requestTotalCustomersCount = useCallback(
    async (signal?: AbortSignal): Promise<number> => {
      const params = new URLSearchParams()
      params.set('_page', '1')
      params.set('_limit', '1')

      const response = await fetchWithResilience(`/api/customers?${params.toString()}`, {
        signal,
      })

      const totalCountHeader = Number(response.headers.get('X-Total-Count'))
      if (Number.isFinite(totalCountHeader) && totalCountHeader >= 0) {
        return totalCountHeader
      }

      const data = (await response.json()) as Customer[]
      return data.length
    },
    [fetchWithResilience],
  )

  const requestCustomers = useCallback(
    async (
      options: FetchCustomersOptions,
      signal?: AbortSignal,
    ): Promise<FetchCustomersResult> => {
      const params = new URLSearchParams()
      params.set('_page', String(options.page ?? 1))
      params.set('_limit', String(options.perPage ?? 10))

      const normalizedSearch = options.searchTerm?.trim()
      if (normalizedSearch) {
        params.set('q', normalizedSearch)
      }

      if (options.sortField) {
        params.set('_sort', options.sortField)
        params.set('_order', options.sortDirection ?? 'asc')
      }

      const response = await fetchWithResilience(`/api/customers?${params.toString()}`, {
        signal,
      })

      const data = (await response.json()) as Customer[]
      const matchingCountHeader = Number(response.headers.get('X-Total-Count'))
      const resolvedMatchingCount =
        Number.isFinite(matchingCountHeader) && matchingCountHeader >= 0
          ? matchingCountHeader
          : data.length

      const hasSearchTerm = Boolean(normalizedSearch)
      const resolvedTotalCount = hasSearchTerm
        ? await requestTotalCustomersCount(signal)
        : resolvedMatchingCount

      return {
        customers: data,
        matchingCustomers: resolvedMatchingCount,
        totalCustomers: resolvedTotalCount,
      }
    },
    [fetchWithResilience, requestTotalCustomersCount],
  )

  const refreshCustomers = useCallback(async (signal?: AbortSignal) => {
    const data = await requestCustomers(lastQueryRef.current, signal)
    setCustomers(data.customers)
    setMatchingCustomers(data.matchingCustomers)
    setTotalCustomers(data.totalCustomers)
  }, [requestCustomers, setCustomers])

  const fetchCustomers = useCallback(async (options?: FetchCustomersOptions) => {
    if (options) {
      lastQueryRef.current = { ...lastQueryRef.current, ...options }
    }

    listAbortControllerRef.current?.abort()
    const listAbortController = new AbortController()
    listAbortControllerRef.current = listAbortController
    const requestId = listRequestIdRef.current + 1
    listRequestIdRef.current = requestId

    setIsLoading(true)
    setError(null)

    try {
      const data = await requestCustomers(lastQueryRef.current, listAbortController.signal)

      if (listRequestIdRef.current !== requestId) {
        return
      }

      setCustomers(data.customers)
      setMatchingCustomers(data.matchingCustomers)
      setTotalCustomers(data.totalCustomers)
    } catch (error) {
      if (listRequestIdRef.current !== requestId) {
        return
      }

      if (isAbortError(error)) {
        return
      }

      setError(toFriendlyErrorMessage('Unable to load customers right now.', error))
    } finally {
      if (listRequestIdRef.current === requestId) {
        setIsLoading(false)
      }

      if (listAbortControllerRef.current === listAbortController) {
        listAbortControllerRef.current = null
      }
    }
  }, [requestCustomers, setCustomers])

  useEffect(() => {
    if (customers.length > 0) {
      return
    }

    let isMounted = true

    const loadInitialCustomers = async () => {
      try {
        await refreshCustomers()
      } catch {
        if (isMounted) {
          setError('Unable to load customers right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialCustomers()

    return () => {
      isMounted = false
      listAbortControllerRef.current?.abort()
    }
  }, [customers.length, refreshCustomers])

  const getCustomerById = useCallback(
    async (id: number) => {
      const existingCustomer = customers.find((customer) => customer.id === id)
      if (existingCustomer) {
        return existingCustomer
      }

      try {
        const timeoutController = new AbortController()
        const timeoutId = window.setTimeout(() => {
          timeoutController.abort()
        }, REQUEST_TIMEOUT_MS)

        try {
          const response = await fetch(`/api/customers/${id}`, {
            signal: timeoutController.signal,
          })

          if (response.status === 404) {
            return null
          }

          if (!response.ok) {
            throw new Error('Failed to fetch customer.')
          }

          const data = (await response.json()) as Customer
          return data
        } finally {
          window.clearTimeout(timeoutId)
        }
      } catch (error) {
        setError(toFriendlyErrorMessage('Unable to load customer right now.', error))
        return null
      }
    },
    [customers],
  )

  const addCustomer = useCallback(
    async (formData: CustomerFormData) => {
      setIsLoading(true)
      setError(null)

      try {
        await fetchWithResilience('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        await refreshCustomers()
        return true
      } catch (error) {
        setError(toFriendlyErrorMessage('Unable to add customer right now.', error))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fetchWithResilience, refreshCustomers],
  )

  const isEmailInUse = useCallback(
    async (email: string, excludeCustomerId?: number) => {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail) {
        return false
      }

      try {
        const response = await fetchWithResilience(
          `/api/customers?email=${encodeURIComponent(normalizedEmail)}`,
        )

        const data = (await response.json()) as Customer[]
        return data.some((customer) => {
          const customerEmail = customer.email.trim().toLowerCase()
          return (
            customerEmail === normalizedEmail &&
            (excludeCustomerId === undefined || customer.id !== excludeCustomerId)
          )
        })
      } catch (error) {
        setError(toFriendlyErrorMessage('Unable to validate email right now.', error))
        return false
      }
    },
    [fetchWithResilience],
  )

  const updateCustomer = useCallback(
    async (customer: Customer) => {
      setIsLoading(true)
      setError(null)

      try {
        await fetchWithResilience(`/api/customers/${customer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        })

        await refreshCustomers()
        return true
      } catch (error) {
        setError(toFriendlyErrorMessage('Unable to update customer right now.', error))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fetchWithResilience, refreshCustomers],
  )

  const deleteCustomer = useCallback(
    async (id: number) => {
      setIsLoading(true)
      setError(null)

      try {
        await fetchWithResilience(`/api/customers/${id}`, {
          method: 'DELETE',
        })

        await refreshCustomers()
        return true
      } catch (error) {
        setError(toFriendlyErrorMessage('Unable to delete customer right now.', error))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fetchWithResilience, refreshCustomers],
  )

  return {
    customers,
    matchingCustomers,
    totalCustomers,
    isLoading,
    error,
    fetchCustomers,
    getCustomerById,
    addCustomer,
    isEmailInUse,
    updateCustomer,
    deleteCustomer,
  }
}