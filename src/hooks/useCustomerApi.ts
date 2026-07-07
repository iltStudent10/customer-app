import { useCallback, useEffect, useState } from 'react'
import { useCustomerContext } from './useCustomerContext'
import type { Customer, CustomerFormData } from '../types/customer'

export function useCustomerApi() {
  const { customers, setCustomers } = useCustomerContext()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshCustomers = useCallback(async () => {
    const response = await fetch('/api/customers')

    if (!response.ok) {
      throw new Error('Failed to fetch customers.')
    }

    const data = (await response.json()) as Customer[]
    setCustomers(data)
  }, [setCustomers])

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
        setError('Unable to add customer right now.')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [refreshCustomers],
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
    isLoading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  }
}