import { useCallback, useEffect, useState } from 'react'
import { useCustomerContext } from './useCustomerContext'
import type { Customer, CustomerFormData } from '../types/customer'

interface CustomerDbPayload {
  customers: Customer[]
}

const LOCAL_CUSTOMERS_STORAGE_KEY = 'customer-app-customers'

function readStoredCustomers() {
  if (typeof window === 'undefined') {
    return null
  }

  const storedCustomers = window.localStorage.getItem(LOCAL_CUSTOMERS_STORAGE_KEY)
  if (!storedCustomers) {
    return null
  }

  try {
    const parsedCustomers = JSON.parse(storedCustomers) as Customer[]
    return Array.isArray(parsedCustomers) ? parsedCustomers : null
  } catch {
    return null
  }
}

function writeStoredCustomers(customers: Customer[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    LOCAL_CUSTOMERS_STORAGE_KEY,
    JSON.stringify(customers),
  )
}

export function useCustomerApi() {
  const { customers, setCustomers } = useCustomerContext()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStaticCustomers = useCallback(async () => {
    const staticDataPath = `${import.meta.env.BASE_URL}db.json`
    const staticResponse = await fetch(staticDataPath)

    if (!staticResponse.ok) {
      throw new Error('Failed to fetch customers.')
    }

    const staticPayload = (await staticResponse.json()) as CustomerDbPayload
    return staticPayload.customers
  }, [])

  const getFallbackCustomers = useCallback(async () => {
    const storedCustomers = readStoredCustomers()
    if (storedCustomers) {
      return storedCustomers
    }

    const staticCustomers = await loadStaticCustomers()
    writeStoredCustomers(staticCustomers)
    return staticCustomers
  }, [loadStaticCustomers])

  const refreshCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers')

      if (!response.ok) {
        throw new Error('Failed to fetch customers.')
      }

      const data = (await response.json()) as Customer[]
      setCustomers(data)
      return
    } catch {
      const fallbackCustomers = await getFallbackCustomers()
      setCustomers(fallbackCustomers)
    }
  }, [getFallbackCustomers, setCustomers])

  const fetchCustomers = useCallback(async () => {
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
  }, [refreshCustomers])

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
        const maxId = customers.reduce(
          (highestId, customer) => (customer.id > highestId ? customer.id : highestId),
          0,
        )

        const nextCustomers = [...customers, { id: maxId + 1, ...formData }]
        setCustomers(nextCustomers)
        writeStoredCustomers(nextCustomers)
        return true
      } finally {
        setIsLoading(false)
      }
    },
    [customers, refreshCustomers, setCustomers],
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
        const nextCustomers = customers.map((item) =>
          item.id === customer.id ? customer : item,
        )

        setCustomers(nextCustomers)
        writeStoredCustomers(nextCustomers)
        return true
      } finally {
        setIsLoading(false)
      }
    },
    [customers, refreshCustomers, setCustomers],
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
        const nextCustomers = customers.filter((customer) => customer.id !== id)
        setCustomers(nextCustomers)
        writeStoredCustomers(nextCustomers)
        return true
      } finally {
        setIsLoading(false)
      }
    },
    [customers, refreshCustomers, setCustomers],
  )

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  }
}