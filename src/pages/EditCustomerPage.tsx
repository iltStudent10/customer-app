import { useNavigate, useParams } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import type { CustomerFormData } from '../types/customer'

export function EditCustomerPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const initialData: CustomerFormData = {
    name: 'Existing Customer',
    email: 'existing@example.com',
    phone: '555-0100',
    address: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
  }

  return (
    <section>
      <h2 className="page-title">Edit Customer</h2>
      <p className="page-subtitle">Customer ID: {id}</p>
      <CustomerForm
        initialData={initialData}
        onSubmit={() => navigate('/')}
        onCancel={() => navigate('/')}
      />
    </section>
  )
}