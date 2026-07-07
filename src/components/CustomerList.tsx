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
        <thead>
          <tr>
            <th scope="col">
              <button
                type="button"
                className="sort-header"
                onClick={() => onSort?.('name')}
              >
                Name <span className="sort-indicator">{getSortIndicator('name')}</span>
              </button>
            </th>
            <th scope="col">
              <button
                type="button"
                className="sort-header"
                onClick={() => onSort?.('email')}
              >
                Email{' '}
                <span className="sort-indicator">{getSortIndicator('email')}</span>
              </button>
            </th>
            <th scope="col">Phone</th>
            <th scope="col">
              <button
                type="button"
                className="sort-header"
                onClick={() => onSort?.('city')}
              >
                City <span className="sort-indicator">{getSortIndicator('city')}</span>
              </button>
            </th>
            <th scope="col">
              <button
                type="button"
                className="sort-header"
                onClick={() => onSort?.('state')}
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