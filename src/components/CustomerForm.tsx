import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { CustomerFormData } from '../types/customer'

interface CustomerFormProps {
  initialData?: CustomerFormData
  onSubmit: (formData: CustomerFormData) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
  isDisabled?: boolean
  showActions?: boolean
  formId?: string
  extraContent?: ReactNode
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

const fieldLabels: Record<keyof CustomerFormData, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  city: 'City',
  state: 'State',
  zip: 'ZIP',
}

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
  isDisabled = false,
  showActions = true,
  formId,
  extraContent,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>(
    initialData ?? emptyFormData,
  )
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>(
    {},
  )

  const errorEntries = useMemo(() => Object.entries(errors), [errors])

  const isEditMode = Boolean(initialData)

  const validate = (values: CustomerFormData) => {
    const nextErrors: Partial<Record<keyof CustomerFormData, string>> = {}
    const trimmedName = values.name.trim()
    const trimmedEmail = values.email.trim()
    const trimmedAddress = values.address.trim()
    const trimmedCity = values.city.trim()
    const trimmedState = values.state.trim()
    const trimmedZip = values.zip.trim()

    if (!trimmedName) {
      nextErrors.name = 'Name is required.'
    } else if (trimmedName.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.'
    } else if (trimmedName.length > 100) {
      nextErrors.name = 'Name must be 100 characters or fewer.'
    } else if (!/^[a-zA-Z][a-zA-Z' -]*$/.test(trimmedName)) {
      nextErrors.name = 'Name can only contain letters, spaces, apostrophes, and hyphens.'
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.'
    } else if (trimmedEmail.length < 2) {
      nextErrors.email = 'Email must be at least 2 characters.'
    } else if (trimmedEmail.length > 254) {
      nextErrors.email = 'Email must be 254 characters or fewer.'
    } else if (!trimmedEmail.includes('@')) {
      nextErrors.email = 'Email must include @.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    const normalizedPhone = values.phone.replace(/\D/g, '')

    if (!values.phone.trim()) {
      nextErrors.phone = 'Phone is required.'
    } else if (normalizedPhone.length < 7) {
      nextErrors.phone = 'Phone must be at least 7 digits.'
    }

    if (trimmedZip && trimmedZip.length !== 5) {
      nextErrors.zip = 'ZIP must be exactly 5 digits.'
    }

    if (trimmedAddress) {
      if (trimmedAddress.length < 5) {
        nextErrors.address = 'Address must be at least 5 characters.'
      } else if (trimmedAddress.length > 120) {
        nextErrors.address = 'Address must be 120 characters or fewer.'
      }
    }

    if (trimmedCity) {
      if (trimmedCity.length < 2) {
        nextErrors.city = 'City must be at least 2 characters.'
      } else if (trimmedCity.length > 100) {
        nextErrors.city = 'City must be 100 characters or fewer.'
      } else if (!/^[a-zA-Z][a-zA-Z' -]*$/.test(trimmedCity)) {
        nextErrors.city = 'City can only contain letters, spaces, apostrophes, and hyphens.'
      }
    }

    if (trimmedState && trimmedState.length !== 2) {
      nextErrors.state = 'State must be exactly 2 letters.'
    }

    return nextErrors
  }

  const handleFieldChange = (
    field: keyof CustomerFormData,
    value: CustomerFormData[keyof CustomerFormData],
  ) => {
    const hasInvalidPhoneCharacters =
      field === 'phone' && typeof value === 'string' && /\D/.test(value)
    const hasInvalidZipCharacters =
      field === 'zip' && typeof value === 'string' && /\D/.test(value)
    const hasZipLengthOverflow =
      field === 'zip' && typeof value === 'string' && value.replace(/\D/g, '').length > 5
    const hasInvalidStateCharacters =
      field === 'state' && typeof value === 'string' && /[^a-zA-Z]/.test(value)
    const hasStateLengthOverflow =
      field === 'state' && typeof value === 'string' && value.replace(/[^a-zA-Z]/g, '').length > 2

    let nextValue = value
    if (field === 'phone' && typeof value === 'string') {
      nextValue = value.replace(/\D/g, '')
    }
    if (field === 'zip' && typeof value === 'string') {
      nextValue = value.replace(/\D/g, '').slice(0, 5)
    }
    if (field === 'state' && typeof value === 'string') {
      nextValue = value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase()
    }

    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: nextValue,
    }))

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      if (hasInvalidPhoneCharacters) {
        nextErrors.phone = 'Phone can only contain numbers.'
        return nextErrors
      }

      if (hasInvalidZipCharacters) {
        nextErrors.zip = 'ZIP can only contain numbers.'
        return nextErrors
      }

      if (hasZipLengthOverflow) {
        nextErrors.zip = 'ZIP can only be 5 digits.'
        return nextErrors
      }

      if (hasInvalidStateCharacters) {
        nextErrors.state = 'State can only contain letters.'
        return nextErrors
      }

      if (hasStateLengthOverflow) {
        nextErrors.state = 'State can only be 2 letters.'
        return nextErrors
      }

      if (nextErrors[field]) {
        delete nextErrors[field]
      }

      return nextErrors
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedFormData: CustomerFormData = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      zip: formData.zip.trim(),
    }

    const validationErrors = validate(normalizedFormData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)

      const fieldOrder: (keyof CustomerFormData)[] = [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'zip',
      ]
      const firstInvalidField = fieldOrder.find((field) => validationErrors[field])

      if (firstInvalidField) {
        const invalidFieldElement = document.getElementById(firstInvalidField)
        invalidFieldElement?.focus()
      }

      return
    }

    setFormData(normalizedFormData)

    await onSubmit(normalizedFormData)
  }

  return (
    <form id={formId} className="customer-form" onSubmit={handleSubmit} noValidate>
      <fieldset disabled={isDisabled}>
      {errorEntries.length > 0 && (
        <div
          className="form-error-summary"
          role="alert"
          aria-live="assertive"
        >
          <p>Please correct the following fields:</p>
          <ul>
            {errorEntries.map(([field]) => (
              <li key={field}>
                <strong>{fieldLabels[field as keyof CustomerFormData]}</strong> needs attention.
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            className={errors.name ? 'input-error' : ''}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="field-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            className={errors.email ? 'input-error' : ''}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="field-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="text"
            inputMode="numeric"
            autoComplete="tel"
            value={formData.phone}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
            className={errors.phone ? 'input-error' : ''}
            required
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="field-error" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            type="text"
            autoComplete="street-address"
            value={formData.address}
            onChange={(event) => handleFieldChange('address', event.target.value)}
            className={errors.address ? 'input-error' : ''}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address && (
            <p id="address-error" className="field-error" role="alert">
              {errors.address}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            autoComplete="address-level2"
            value={formData.city}
            onChange={(event) => handleFieldChange('city', event.target.value)}
            className={errors.city ? 'input-error' : ''}
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <p id="city-error" className="field-error" role="alert">
              {errors.city}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="state">State</label>
          <input
            id="state"
            type="text"
            inputMode="text"
            autoComplete="address-level1"
            value={formData.state}
            onChange={(event) => handleFieldChange('state', event.target.value)}
            className={errors.state ? 'input-error' : ''}
            aria-invalid={Boolean(errors.state)}
            aria-describedby={errors.state ? 'state-error' : undefined}
          />
          {errors.state && (
            <p id="state-error" className="field-error" role="alert">
              {errors.state}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="zip">ZIP</label>
          <input
            id="zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={formData.zip}
            onChange={(event) => handleFieldChange('zip', event.target.value)}
            className={errors.zip ? 'input-error' : ''}
            aria-invalid={Boolean(errors.zip)}
            aria-describedby={errors.zip ? 'zip-error' : undefined}
          />
          {errors.zip && (
            <p id="zip-error" className="field-error" role="alert">
              {errors.zip}
            </p>
          )}
        </div>
      </div>

      {extraContent}

      {showActions && (
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            {cancelLabel ?? 'Cancel'}
          </button>
          <button type="submit" className="primary-button">
            {submitLabel ?? (isEditMode ? 'Update Customer' : 'Add Customer')}
          </button>
        </div>
      )}
      </fieldset>
    </form>
  )
}