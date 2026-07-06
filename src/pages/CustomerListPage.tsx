import { useEffect, useState } from 'react'
import { CustomerList } from '../components/CustomerList'
import type { Customer } from '../types/customer'
import { useCustomerContext } from '../hooks/useCustomerContext'

export function CustomerListPage() {
  const { customers, setCustomers, deleteCustomer } = useCustomerContext()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setError(null)
        const response = await fetch('/api/customers')

        if (!response.ok) {
          throw new Error('Failed to load customers.')
        }

        const data = (await response.json()) as Customer[]
        setCustomers(data)
      } catch {
        setError('Unable to load customers right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadCustomers()
  }, [])

  const handleDeleteCustomer = async (id: number) => {
    try {
      setError(null)
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete customer.')
      }

      deleteCustomer(id)
    } catch {
      setError('Unable to delete customer right now.')
    }
  }

  return (
    <section>
      <h2 className="page-title">Customers</h2>
      {isLoading && <div className="placeholder-card">Loading customers...</div>}
      {error && <div className="placeholder-card">{error}</div>}
      {!isLoading && !error && (
      <CustomerList customers={customers} onDelete={handleDeleteCustomer} />
      )}
    </section>
  )
}