import { useNavigate, useParams } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import type { CustomerFormData } from '../types/customer'
import { useCustomerApi } from '../hooks/useCustomerApi'

export function EditCustomerPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { customers, updateCustomer, isLoading, error } = useCustomerApi()

  const customerId = Number(id)
  const customer = customers.find((item) => item.id === customerId)

  if (isLoading && customers.length === 0) {
    return (
      <section>
        <h2 className="page-title">Edit Customer</h2>
        <div className="placeholder-card">Loading customer...</div>
      </section>
    )
  }

  if (error && customers.length === 0) {
    return (
      <section>
        <h2 className="page-title">Edit Customer</h2>
        <div className="placeholder-card">{error}</div>
      </section>
    )
  }

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

  const handleSubmit = async (formData: CustomerFormData) => {
    const wasUpdated = await updateCustomer({ id: customerId, ...formData })

    if (wasUpdated) {
      navigate('/')
    }
  }

  return (
    <section>
      <h2 className="page-title">Edit Customer</h2>
      <p className="page-subtitle">Customer ID: {customerId}</p>
      {isLoading && <div className="placeholder-card">Updating customer...</div>}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </section>
  )
}