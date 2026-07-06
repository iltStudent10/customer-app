import {
  createContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react'
import type { Customer } from '../types/customer'

type CustomerAction =
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: number }

interface CustomerContextValue {
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (customer: Customer) => void
  deleteCustomer: (id: number) => void
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined)

function customerReducer(state: Customer[], action: CustomerAction): Customer[] {
  switch (action.type) {
    case 'SET_CUSTOMERS':
      return action.payload
    case 'ADD_CUSTOMER':
      return [...state, action.payload]
    case 'UPDATE_CUSTOMER':
      return state.map((customer) =>
        customer.id === action.payload.id ? action.payload : customer,
      )
    case 'DELETE_CUSTOMER':
      return state.filter((customer) => customer.id !== action.payload)
    default:
      return state
  }
}

export function CustomerProvider({ children }: PropsWithChildren) {
  const [customers, dispatch] = useReducer(customerReducer, [])

  const value = useMemo<CustomerContextValue>(
    () => ({
      customers,
      setCustomers: (nextCustomers) =>
        dispatch({ type: 'SET_CUSTOMERS', payload: nextCustomers }),
      addCustomer: (customer) => dispatch({ type: 'ADD_CUSTOMER', payload: customer }),
      updateCustomer: (customer) =>
        dispatch({ type: 'UPDATE_CUSTOMER', payload: customer }),
      deleteCustomer: (id) => dispatch({ type: 'DELETE_CUSTOMER', payload: id }),
    }),
    [customers],
  )

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
}

export { CustomerContext }