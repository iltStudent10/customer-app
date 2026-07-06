import { useState, type FormEvent } from 'react'
import type { CustomerFormData } from '../types/customer'

interface CustomerFormProps {
  initialData?: CustomerFormData
  onSubmit: (formData: CustomerFormData) => void
  onCancel: () => void
}

const emptyFormData: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>(
    initialData ?? emptyFormData,
  )
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>(
    {},
  )

  const isEditMode = Boolean(initialData)

  const validate = (values: CustomerFormData) => {
    const nextErrors: Partial<Record<keyof CustomerFormData, string>> = {}

    if (!values.name.trim()) {
      nextErrors.name = 'Name is required.'
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!values.phone.trim()) {
      nextErrors.phone = 'Phone is required.'
    }

    return nextErrors
  }

  const handleFieldChange = (
    field: keyof CustomerFormData,
    value: CustomerFormData[keyof CustomerFormData],
  ) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))

    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validate(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    onSubmit(formData)
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="text"
            value={formData.phone}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
            className={errors.phone ? 'input-error' : ''}
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            type="text"
            value={formData.address}
            onChange={(event) => handleFieldChange('address', event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(event) => handleFieldChange('city', event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="state">State</label>
          <input
            id="state"
            type="text"
            value={formData.state}
            onChange={(event) => handleFieldChange('state', event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="zip">ZIP</label>
          <input
            id="zip"
            type="text"
            value={formData.zip}
            onChange={(event) => handleFieldChange('zip', event.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button">
          {isEditMode ? 'Update Customer' : 'Add Customer'}
        </button>
      </div>
    </form>
  )
}