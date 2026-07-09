import { Link } from 'react-router-dom'
import type { Customer } from '../types/customer'

export type SortableCustomerField = 'name' | 'email' | 'city' | 'state'
export type SortDirection = 'asc' | 'desc'

export interface CustomerSortState {
  field: SortableCustomerField
  direction: SortDirection
}

interface CustomerListProps {
  customers: Customer[]
  onDelete: (id: number) => void
  sort?: CustomerSortState
  onSort?: (field: SortableCustomerField) => void
}

export function CustomerList({
  customers,
  onDelete,
  sort,
  onSort,
}: CustomerListProps) {
  const getAriaSort = (field: SortableCustomerField): 'none' | 'ascending' | 'descending' => {
    if (sort?.field !== field) {
      return 'none'
    }

    return sort.direction === 'asc' ? 'ascending' : 'descending'
  }

  const getSortIndicator = (field: SortableCustomerField) => {
    if (sort?.field !== field) {
      return '↕'
    }

    return sort.direction === 'asc' ? '↑' : '↓'
  }

  if (customers.length === 0) {
    return <p className="placeholder-card">No customers found.</p>
  }

  return (
    <div className="table-card">
      <table className="customer-table">
        <caption className="sr-only">Customer list with sortable columns</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={getAriaSort('name')}>
              <button
                type="button"
                className="sort-header"
                onClick={() => onSort?.('name')}
                aria-label={`Sort by name. Current order: ${getAriaSort('name')}.`}
              >
                Name <span className="sort-indicator">{getSortIndicator('name')}</span>
              </button>
            </th>
            <th scope="col" aria-sort={getAriaSort('email')}>
              <button
                type="button"
                className="sort-header"
                onClick={() => onSort?.('email')}
                aria-label={`Sort by email. Current order: ${getAriaSort('email')}.`}
              >
                Email{' '}
                <span className="sort-indicator">{getSortIndicator('email')}</span>
              </button>
            </th>
            <th scope="col">Phone</th>
            <th scope="col" aria-sort={getAriaSort('city')}>
              <button
                type="button"
                className="sort-header"
                onClick={() => onSort?.('city')}
                aria-label={`Sort by city. Current order: ${getAriaSort('city')}.`}
              >
                City <span className="sort-indicator">{getSortIndicator('city')}</span>
              </button>
            </th>
            <th scope="col" aria-sort={getAriaSort('state')}>
              <button
                type="button"
                className="sort-header"
                onClick={() => onSort?.('state')}
                aria-label={`Sort by state. Current order: ${getAriaSort('state')}.`}
              >
                State <span className="sort-indicator">{getSortIndicator('state')}</span>
              </button>
            </th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{customer.city}</td>
              <td>{customer.state}</td>
              <td className="actions-cell">
                <Link
                  className="action-link"
                  to={`/edit/${customer.id}`}
                  aria-label={`Edit ${customer.name}`}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="action-button"
                  aria-label={`Delete ${customer.name}`}
                  onClick={() => onDelete(customer.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}