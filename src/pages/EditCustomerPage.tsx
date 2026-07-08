import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import type { Customer, CustomerFormData } from '../types/customer'
import { useCustomerApi } from '../hooks/useCustomerApi'

export function EditCustomerPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { customers, updateCustomer, getCustomerById, isEmailInUse, error } = useCustomerApi()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCustomerLoading, setIsCustomerLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const routeCustomerId = Number(id)

  useEffect(() => {
    let isMounted = true

    const loadCustomer = async () => {
      if (!Number.isInteger(routeCustomerId) || routeCustomerId <= 0) {
        if (isMounted) {
          setCustomer(null)
          setIsCustomerLoading(false)
        }
        return
      }

      const existingCustomer = customers.find((item) => item.id === routeCustomerId)
      if (existingCustomer) {
        if (isMounted) {
          setCustomer(existingCustomer)
          setIsCustomerLoading(false)
        }
        return
      }

      if (isMounted) {
        setIsCustomerLoading(true)
      }

      const fetchedCustomer = await getCustomerById(routeCustomerId)
      if (isMounted) {
        setCustomer(fetchedCustomer)
        setIsCustomerLoading(false)
      }
    }

    void loadCustomer()

    return () => {
      isMounted = false
    }
  }, [customers, routeCustomerId, getCustomerById])

  if (isCustomerLoading) {
    return (
      <section>
        <h2 className="page-title">Edit Customer</h2>
        <div className="placeholder-card">Loading customer...</div>
      </section>
    )
  }

  if (!customer && error) {
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
    setValidationError(null)

    const emailAlreadyExists = await isEmailInUse(formData.email, customer.id)
    if (emailAlreadyExists) {
      setValidationError('A customer with this email already exists.')
      return
    }

    setIsSubmitting(true)
    const wasUpdated = await updateCustomer({ id: customer.id, ...formData }).finally(
      () => {
        setIsSubmitting(false)
      },
    )

    if (wasUpdated) {
      navigate('/')
    }
  }

  return (
    <section>
      <h2 className="page-title">Edit Customer</h2>
      <p className="page-subtitle">Customer ID: {customer.id}</p>
      {isSubmitting && <div className="placeholder-card">Updating customer...</div>}
      {validationError && <div className="placeholder-card">{validationError}</div>}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </section>
  )
}