import { useNavigate, useParams } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import type { CustomerFormData } from '../types/customer'
import { useCustomerContext } from '../hooks/useCustomerContext'

export function EditCustomerPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { customers, updateCustomer } = useCustomerContext()

  const customerId = Number(id)
  const customer = customers.find((item) => item.id === customerId)

  if (!customer) {
    return (
      <section>
        <h2 className="page-title">Edit Customer</h2>
        <div className="placeholder-card">Customer not found.</div>
      </section>
    )
  }

  const initialData: CustomerFormData = {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
  }

  const handleSubmit = (formData: CustomerFormData) => {
    updateCustomer({ id: customerId, ...formData })
    navigate('/')
  }

  return (
    <section>
      <h2 className="page-title">Edit Customer</h2>
      <p className="page-subtitle">Customer ID: {customerId}</p>
      <CustomerForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </section>
  )
}