import { useMemo, useState } from 'react'
import { CustomerList } from '../components/CustomerList'
import { useCustomerApi } from '../hooks/useCustomerApi'

export function CustomerListPage() {
  const { customers, isLoading, error, deleteCustomer } = useCustomerApi()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return customers
    }

    return customers.filter((customer) => {
      const fieldsToSearch = [customer.name, customer.email, customer.city]

      return fieldsToSearch.some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      )
    })
  }, [customers, searchTerm])

  const handleDeleteCustomer = (id: number) => {
    const customer = customers.find((item) => item.id === id)
    const customerName = customer?.name ?? 'this customer'

    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${customerName}?`,
    )

    if (!isConfirmed) {
      return
    }

    void deleteCustomer(id)
  }

  return (
    <section>
      <h2 className="page-title">Customers</h2>
      <div className="search-row">
        <label htmlFor="customer-search" className="search-label">
          Search customers
        </label>
        <div className="search-input-wrap">
          <input
            id="customer-search"
            className="search-input"
            type="text"
            placeholder="Search by name, email, or city"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-button"
              aria-label="Clear search"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
        <p className="results-count">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      </div>
      {isLoading && <div className="placeholder-card">Loading customers...</div>}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerList customers={filteredCustomers} onDelete={handleDeleteCustomer} />
    </section>
  )
}