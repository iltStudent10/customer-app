import { useCallback, useEffect, useRef, useState } from 'react'
import { useCustomerContext } from './useCustomerContext'
import type { Customer, CustomerFormData } from '../types/customer'

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

export function useCustomerApi() {
  const { customers, setCustomers } = useCustomerContext()
  const [isLoading, setIsLoading] = useState(customers.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [totalCustomers, setTotalCustomers] = useState(customers.length)
  const [matchingCustomers, setMatchingCustomers] = useState(customers.length)
  const lastQueryRef = useRef<FetchCustomersOptions>({ page: 1, perPage: 10 })

  const requestTotalCustomersCount = useCallback(async (): Promise<number> => {
    const params = new URLSearchParams()
    params.set('_page', '1')
    params.set('_limit', '1')

    const response = await fetch(`/api/customers?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch total customer count.')
    }

    const totalCountHeader = Number(response.headers.get('X-Total-Count'))
    if (Number.isFinite(totalCountHeader) && totalCountHeader >= 0) {
      return totalCountHeader
    }

    const data = (await response.json()) as Customer[]
    return data.length
  }, [])

  const requestCustomers = useCallback(
    async (options: FetchCustomersOptions): Promise<FetchCustomersResult> => {
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

      const response = await fetch(`/api/customers?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch customers.')
      }

      const data = (await response.json()) as Customer[]
      const matchingCountHeader = Number(response.headers.get('X-Total-Count'))
      const resolvedMatchingCount =
        Number.isFinite(matchingCountHeader) && matchingCountHeader >= 0
          ? matchingCountHeader
          : data.length

      const hasSearchTerm = Boolean(normalizedSearch)
      const resolvedTotalCount = hasSearchTerm
        ? await requestTotalCustomersCount()
        : resolvedMatchingCount

      return {
        customers: data,
        matchingCustomers: resolvedMatchingCount,
        totalCustomers: resolvedTotalCount,
      }
    },
    [requestTotalCustomersCount],
  )

  const refreshCustomers = useCallback(async () => {
    const data = await requestCustomers(lastQueryRef.current)
    setCustomers(data.customers)
    setMatchingCustomers(data.matchingCustomers)
    setTotalCustomers(data.totalCustomers)
  }, [requestCustomers, setCustomers])

  const fetchCustomers = useCallback(async (options?: FetchCustomersOptions) => {
    if (options) {
      lastQueryRef.current = { ...lastQueryRef.current, ...options }
    }

    setIsLoading(true)
    setError(null)

    try {
      await refreshCustomers()
    } catch {
      setError('Unable to load customers right now.')
    } finally {
      setIsLoading(false)
    }
  }, [refreshCustomers])

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
    }
  }, [customers.length, refreshCustomers])

  const getCustomerById = useCallback(
    async (id: number) => {
      const existingCustomer = customers.find((customer) => customer.id === id)
      if (existingCustomer) {
        return existingCustomer
      }

      try {
        const response = await fetch(`/api/customers/${id}`)

        if (response.status === 404) {
          return null
        }

        if (!response.ok) {
          throw new Error('Failed to fetch customer.')
        }

        const data = (await response.json()) as Customer
        return data
      } catch {
        setError('Unable to load customer right now.')
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
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to add customer.')
        }

        await refreshCustomers()
        return true
      } catch {
        setError('Unable to add customer right now.')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [refreshCustomers],
  )

  const isEmailInUse = useCallback(
    async (email: string, excludeCustomerId?: number) => {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail) {
        return false
      }

      try {
        const response = await fetch(
          `/api/customers?email=${encodeURIComponent(normalizedEmail)}`,
        )

        if (!response.ok) {
          throw new Error('Failed to check duplicate email.')
        }

        const data = (await response.json()) as Customer[]
        return data.some((customer) => {
          const customerEmail = customer.email.trim().toLowerCase()
          return (
            customerEmail === normalizedEmail &&
            (excludeCustomerId === undefined || customer.id !== excludeCustomerId)
          )
        })
      } catch {
        setError('Unable to validate email right now.')
        return false
      }
    },
    [],
  )

  const updateCustomer = useCallback(
    async (customer: Customer) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/customers/${customer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        })

        if (!response.ok) {
          throw new Error('Failed to update customer.')
        }

        await refreshCustomers()
        return true
      } catch {
        setError('Unable to update customer right now.')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [refreshCustomers],
  )

  const deleteCustomer = useCallback(
    async (id: number) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete customer.')
        }

        await refreshCustomers()
        return true
      } catch {
        setError('Unable to delete customer right now.')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [refreshCustomers],
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