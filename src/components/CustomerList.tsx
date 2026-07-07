import { Link } from 'react-router-dom'
import type { Customer } from '../types/customer'

interface CustomerListProps {
  customers: Customer[]
  onDelete: (id: number) => void
}

export function CustomerList({ customers, onDelete }: CustomerListProps) {
  if (customers.length === 0) {
    return <p className="placeholder-card">No customers found.</p>
  }

  return (
    <div className="table-card">
      <table className="customer-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">City</th>
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