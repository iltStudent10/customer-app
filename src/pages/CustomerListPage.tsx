import { useState } from 'react'
import { CustomerList } from '../components/CustomerList'
import type { Customer } from '../types/customer'

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    phone: '555-0101',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62704',
  },
  {
    id: 2,
    name: 'James Chen',
    email: 'james.chen@example.com',
    phone: '555-0102',
    address: '1600 Pennsylvania Ave',
    city: 'Washington',
    state: 'DC',
    zip: '20500',
  },
  {
    id: 3,
    name: 'Aisha Patel',
    email: 'aisha.patel@example.com',
    phone: '555-0103',
    address: '350 Fifth Avenue',
    city: 'New York',
    state: 'NY',
    zip: '10118',
  },
]

export function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)

  const handleDeleteCustomer = (id: number) => {
    setCustomers((currentCustomers) =>
      currentCustomers.filter((customer) => customer.id !== id),
    )
  }

  return (
    <section>
      <h2 className="page-title">Customers</h2>
      <CustomerList customers={customers} onDelete={handleDeleteCustomer} />
    </section>
  )
}