import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import { CustomerProvider } from '../context/CustomerContext'
import { useCustomerContext } from '../hooks/useCustomerContext'

function wrapper({ children }: PropsWithChildren) {
  return <CustomerProvider>{children}</CustomerProvider>
}

describe('CustomerContext', () => {
  it('supports set, add, update, and delete operations', () => {
    const { result } = renderHook(() => useCustomerContext(), { wrapper })

    act(() => {
      result.current.setCustomers([
        {
          id: 1,
          name: 'Maria Garcia',
          email: 'maria@example.com',
          phone: '555-0101',
          address: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'IL',
          zip: '62704',
        },
      ])
    })

    expect(result.current.customers).toHaveLength(1)

    act(() => {
      result.current.addCustomer({
        id: 2,
        name: 'James Chen',
        email: 'james@example.com',
        phone: '555-0102',
        address: '1600 Pennsylvania Ave',
        city: 'Washington',
        state: 'DC',
        zip: '20500',
      })
    })

    expect(result.current.customers).toHaveLength(2)

    act(() => {
      result.current.updateCustomer({
        id: 2,
        name: 'James Chen Updated',
        email: 'james@example.com',
        phone: '555-0102',
        address: '1600 Pennsylvania Ave',
        city: 'Washington',
        state: 'DC',
        zip: '20500',
      })
    })

    expect(result.current.customers.find((customer) => customer.id === 2)?.name).toBe(
      'James Chen Updated',
    )

    act(() => {
      result.current.deleteCustomer(1)
    })

    expect(result.current.customers).toHaveLength(1)
    expect(result.current.customers[0].id).toBe(2)
  })

  it('throws when useCustomerContext is used outside provider', () => {
    expect(() => renderHook(() => useCustomerContext())).toThrow(
      'useCustomerContext must be used within a CustomerProvider.',
    )
  })
})
