import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import { useCustomerApi } from '../hooks/useCustomerApi'
import type { CustomerFormData } from '../types/customer'

export function AddCustomerPage() {
  const navigate = useNavigate()
  const { addCustomer, isLoading, error } = useCustomerApi()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: CustomerFormData) => {
    setIsSubmitting(true)
    const wasCreated = await addCustomer(formData)
    setIsSubmitting(false)

    if (wasCreated) {
      navigate('/')
    }
  }

  return (
    <section>
      <h2 className="page-title">Add Customer</h2>
      {isSubmitting && isLoading && (
        <div className="placeholder-card">Saving customer...</div>
      )}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerForm onSubmit={handleSubmit} onCancel={() => navigate('/')} />
    </section>
  )
}