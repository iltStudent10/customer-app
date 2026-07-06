import { useNavigate } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import { useCustomerContext } from '../hooks/useCustomerContext'
import type { CustomerFormData } from '../types/customer'

export function AddCustomerPage() {
  const navigate = useNavigate()
  const { customers, addCustomer } = useCustomerContext()

  const handleSubmit = (formData: CustomerFormData) => {
    const nextId =
      customers.length > 0
        ? Math.max(...customers.map((customer) => customer.id)) + 1
        : 1

    addCustomer({ id: nextId, ...formData })
    navigate('/')
  }

  return (
    <section>
      <h2 className="page-title">Add Customer</h2>
      <CustomerForm onSubmit={handleSubmit} onCancel={() => navigate('/')} />
    </section>
  )
}