import type { Customer } from '../types/customer'

interface AccessUser {
  username: string
  role: 'admin' | 'user'
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function normalizePhone(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return ''
  }

  const hasLeadingPlus = trimmedValue.startsWith('+')
  const digitsOnly = trimmedValue.replace(/\D/g, '')
  if (!digitsOnly || digitsOnly.length < 7) {
    return ''
  }

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly
}

export function canAccessCustomer(customer: Customer, user: AccessUser | null): boolean {
  if (!user) {
    return false
  }

  if (user.role === 'admin') {
    return true
  }

  const normalizedUserText = normalizeText(user.username)
  const normalizedUserPhone = normalizePhone(user.username)
  const normalizedCustomerEmail = normalizeText(customer.email)
  const normalizedCustomerPhone = normalizePhone(customer.phone)

  return (
    normalizedUserText === normalizedCustomerEmail ||
    (normalizedUserPhone ? normalizedUserPhone === normalizedCustomerPhone : false)
  )
}
