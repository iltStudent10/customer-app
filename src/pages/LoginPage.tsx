import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'
import { useAuth } from '../hooks/useAuth'
import { useCustomerApi } from '../hooks/useCustomerApi'
import type { CustomerFormData } from '../types/customer'

interface NavigationState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { isAuthenticated, login, register } = useAuth()
  const { addCustomer, isEmailInUse, error: customerApiError } = useCustomerApi()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectPath =
    (location.state as NavigationState | null)?.from?.pathname ?? '/'

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const loginResult = await login(identifier, password)
      if (!loginResult.success) {
        setError(loginResult.error ?? 'Invalid email/phone or password.')
        return
      }

      navigate(redirectPath, { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateAccountSubmit = async (formData: CustomerFormData) => {
    setError(null)

    if (password.trim() !== confirmPassword.trim()) {
      setError('Passwords do not match.')
      return
    }

    const emailAlreadyExists = await isEmailInUse(formData.email)
    if (emailAlreadyExists) {
      setError('A customer with this email already exists.')
      return
    }

    setIsSubmitting(true)

    try {
      const registrationResult = await register(formData.email, password, {
        email: formData.email,
        phone: formData.phone,
      })
      if (!registrationResult.success) {
        setError(registrationResult.error ?? 'Unable to create account.')
        return
      }

      const wasCreated = await addCustomer(formData)
      if (!wasCreated) {
        setError('Unable to create customer profile right now.')
        return
      }

      navigate(redirectPath, { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2 className="page-title">{isCreateMode ? 'Create Account' : 'Login'}</h2>
      <p className="page-subtitle">
        {isCreateMode
          ? 'Create an account with your customer profile details.'
          : 'Sign in to edit customer records.'}
      </p>
      {error && <div className="placeholder-card auth-error-card">{error}</div>}
      {customerApiError && (
        <div className="placeholder-card auth-error-card">{customerApiError}</div>
      )}
      {isCreateMode ? (
        <CustomerForm
          onSubmit={handleCreateAccountSubmit}
          onCancel={() => {
            setError(null)
            setPassword('')
            setConfirmPassword('')
            setIsCreateMode(false)
          }}
          cancelLabel="Back to Login"
          submitLabel={isSubmitting ? 'Creating Account...' : 'Create Account'}
          isDisabled={isSubmitting}
          extraContent={
            <div className="form-grid create-account-password-section">
              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>
          }
        />
      ) : (
      <form className="customer-form" onSubmit={handleLoginSubmit}>
        <fieldset disabled={isSubmitting}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="identifier">Email or Phone</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isCreateMode ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {isCreateMode && (
            <div className="form-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          )}
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setError(null)
              setPassword('')
              setConfirmPassword('')
              setIsCreateMode((currentMode) => !currentMode)
            }}
          >
            {isCreateMode ? 'Back to Login' : 'Create Account'}
          </button>
          <button type="submit" className="primary-button">
            {isSubmitting
              ? isCreateMode
                ? 'Creating Account...'
                : 'Signing In...'
              : isCreateMode
                ? 'Create Account'
                : 'Login'}
          </button>
        </div>
        </fieldset>
      </form>
      )}
    </section>
  )
}