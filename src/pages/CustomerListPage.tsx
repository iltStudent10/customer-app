import { useEffect, useState } from 'react'
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
  const { customers, totalCustomers, isLoading, error, fetchCustomers, deleteCustomer } =
    useCustomerApi()
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState<CustomerSortState>(getInitialSortState)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const totalPages = Math.max(1, Math.ceil(totalCustomers / rowsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  useEffect(() => {
    window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort))
  }, [sort])

  useEffect(() => {
    void fetchCustomers({
      page: Math.min(Math.max(1, currentPage), totalPages),
      perPage: rowsPerPage,
      searchTerm,
      sortField: sort.field,
      sortDirection: sort.direction,
    })
  }, [currentPage, rowsPerPage, searchTerm, sort, fetchCustomers, totalPages])

  const firstResultIndex =
    totalCustomers === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1
  const lastResultIndex = Math.min(
    (safeCurrentPage - 1) * rowsPerPage + customers.length,
    totalCustomers,
  )

  const handleSort = (field: SortableCustomerField) => {
    setSort((currentSort) => {
      setCurrentPage(1)

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

    void (async () => {
      const wasDeleted = await deleteCustomer(id)

      if (wasDeleted && customers.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      }
    })()
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
            onChange={(event) => {
              setCurrentPage(1)
              setSearchTerm(event.target.value)
            }}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-button"
              aria-label="Clear search"
              onClick={() => {
                setCurrentPage(1)
                setSearchTerm('')
              }}
            >
              ×
            </button>
          )}
        </div>
        <div className="results-summary-row">
          <p className="results-count">
            Showing {firstResultIndex}-{lastResultIndex} of {totalCustomers} customers
          </p>
          <label htmlFor="rows-per-page" className="rows-per-page-label">
            Rows per page
            <select
              id="rows-per-page"
              className="rows-per-page-select"
              value={rowsPerPage}
              onChange={(event) => {
                setCurrentPage(1)
                setRowsPerPage(Number(event.target.value))
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>
      {isLoading && <div className="placeholder-card">Loading customers...</div>}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerList
        customers={customers}
        onDelete={handleDeleteCustomer}
        sort={sort}
        onSort={handleSort}
      />
      <div className="pagination-row" aria-label="Pagination">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setCurrentPage((page) => Math.max(1, Math.min(totalPages, page) - 1))}
          disabled={safeCurrentPage <= 1}
        >
          Previous
        </button>
        <p className="page-indicator">Page {safeCurrentPage} of {totalPages}</p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setCurrentPage((page) => Math.min(totalPages, Math.max(1, page) + 1))}
          disabled={safeCurrentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </section>
  )
}