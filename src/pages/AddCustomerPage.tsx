import { useNavigate } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import { useCustomerApi } from '../hooks/useCustomerApi'
import type { CustomerFormData } from '../types/customer'

export function AddCustomerPage() {
  const navigate = useNavigate()
  const { addCustomer, isLoading, error } = useCustomerApi()

  const handleSubmit = async (formData: CustomerFormData) => {
    const wasCreated = await addCustomer(formData)

    if (wasCreated) {
      navigate('/')
    }
  }

  return (
    <section>
      <h2 className="page-title">Add Customer</h2>
      {isLoading && <div className="placeholder-card">Saving customer...</div>}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerForm onSubmit={handleSubmit} onCancel={() => navigate('/')} />
    </section>
  )
}