import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import { useCustomerApi } from '../hooks/useCustomerApi'
import type { CustomerFormData } from '../types/customer'

export function AddCustomerPage() {
  const navigate = useNavigate()
  const { addCustomer, isEmailInUse, error } = useCustomerApi()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (formData: CustomerFormData) => {
    setValidationError(null)

    const emailAlreadyExists = await isEmailInUse(formData.email)
    if (emailAlreadyExists) {
      setValidationError('A customer with this email already exists.')
      return
    }

    setIsSubmitting(true)

    const wasCreated = await addCustomer(formData).finally(() => {
      setIsSubmitting(false)
    })

    if (wasCreated) {
      navigate('/')
    }
  }

  return (
    <section>
      <h2 className="page-title">Add Customer</h2>
      {isSubmitting && <div className="placeholder-card">Saving customer...</div>}
      {validationError && <div className="placeholder-card">{validationError}</div>}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerForm onSubmit={handleSubmit} onCancel={() => navigate('/')} />
    </section>
  )
}