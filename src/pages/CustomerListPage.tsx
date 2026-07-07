import { useEffect, useMemo, useState } from 'react'
import {
  CustomerList,
  type CustomerSortState,
  type SortableCustomerField,
} from '../components/CustomerList'
import { useCustomerApi } from '../hooks/useCustomerApi'

const SORT_STORAGE_KEY = 'customer-list-sort'

function getInitialSortState(): CustomerSortState {
  if (typeof window === 'undefined') {
    return { field: 'name', direction: 'asc' }
  }

  const storedSort = window.localStorage.getItem(SORT_STORAGE_KEY)
  if (!storedSort) {
    return { field: 'name', direction: 'asc' }
  }

  try {
    const parsedSort = JSON.parse(storedSort) as CustomerSortState
    if (
      ['name', 'email', 'city', 'state'].includes(parsedSort.field) &&
      ['asc', 'desc'].includes(parsedSort.direction)
    ) {
      return parsedSort
    }
  } catch {
    return { field: 'name', direction: 'asc' }
  }

  return { field: 'name', direction: 'asc' }
}

export function CustomerListPage() {
  const { customers, isLoading, error, deleteCustomer } = useCustomerApi()
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState<CustomerSortState>(getInitialSortState)

  useEffect(() => {
    window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort))
  }, [sort])

  const filteredAndSortedCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    const filteredCustomers = customers.filter((customer) => {
      if (!normalizedSearch) {
        return true
      }

      const fieldsToSearch = [customer.name, customer.email, customer.city]

      return fieldsToSearch.some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      )
    })

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
      const aValue = a[sort.field].toLowerCase()
      const bValue = b[sort.field].toLowerCase()
      const compareResult = aValue.localeCompare(bValue)

      return sort.direction === 'asc' ? compareResult : compareResult * -1
    })

    return sortedCustomers
  }, [customers, searchTerm, sort])

  const handleSort = (field: SortableCustomerField) => {
    setSort((currentSort) => {
      if (currentSort.field === field) {
        return {
          field,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        field,
        direction: 'asc',
      }
    })
  }

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
          Showing {filteredAndSortedCustomers.length} of {customers.length} customers
        </p>
      </div>
      {isLoading && <div className="placeholder-card">Loading customers...</div>}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerList
        customers={filteredAndSortedCustomers}
        onDelete={handleDeleteCustomer}
        sort={sort}
        onSort={handleSort}
      />
    </section>
  )
}