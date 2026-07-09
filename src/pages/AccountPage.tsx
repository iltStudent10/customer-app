import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import accountHero from '../assets/account-hero.svg'
import profileAvatar from '../assets/profile-avatar.svg'
import { useAuth } from '../hooks/useAuth'

export function AccountPage() {
  const navigate = useNavigate()
  const { user, logout, updateUsername, updatePassword } = useAuth()
  const [newIdentifier, setNewIdentifier] = useState(user?.username ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const handleIdentifierSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsUpdatingUsername(true)

    try {
      const result = await updateUsername(newIdentifier)
      if (!result.success) {
        setError(result.error ?? 'Unable to update email or phone.')
        return
      }

      setSuccess('Email or phone updated successfully.')
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsUpdatingPassword(true)

    try {
      if (newPassword.trim() !== confirmNewPassword.trim()) {
        setError('New password and confirm password must match.')
        return
      }

      const result = await updatePassword(currentPassword, newPassword)
      if (!result.success) {
        setError(result.error ?? 'Unable to update password.')
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setSuccess('Password updated successfully.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <section>
      <h2 className="page-title">Account</h2>
      <p className="page-subtitle">Manage your sign-in session and credentials.</p>
      <div className="account-hero-card">
        <img
          src={accountHero}
          alt="Decorative account dashboard illustration"
          className="account-hero-image"
        />
      </div>
      {error && <div className="placeholder-card auth-error-card">{error}</div>}
      {success && <div className="placeholder-card auth-success-card">{success}</div>}
      <div className="placeholder-card account-summary-card">
        <img
          src={profileAvatar}
          alt="Profile avatar illustration"
          className="account-avatar-image"
        />
        <div className="account-summary-content">
          <p className="page-subtitle">Signed in as {user?.username ?? 'Unknown user'}</p>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => navigate('/')}>
              Back to Customers
            </button>
            <button type="button" className="primary-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <form className="customer-form" onSubmit={handleIdentifierSubmit}>
        <fieldset disabled={isUpdatingUsername}>
        <h3 className="page-subtitle">Change Email or Phone</h3>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="new-identifier">New Email or Phone</label>
            <input
              id="new-identifier"
              name="new-identifier"
              type="text"
              autoComplete="username"
              value={newIdentifier}
              onChange={(event) => setNewIdentifier(event.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button">
            {isUpdatingUsername ? 'Updating Email or Phone...' : 'Update Email or Phone'}
          </button>
        </div>
        </fieldset>
      </form>

      <form className="customer-form account-form-spacing" onSubmit={handlePasswordSubmit}>
        <fieldset disabled={isUpdatingPassword}>
        <h3 className="page-subtitle">Change Password</h3>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              name="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="confirm-new-password">Confirm New Password</label>
            <input
              id="confirm-new-password"
              name="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button">
            {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
        </fieldset>
      </form>
    </section>
  )
}