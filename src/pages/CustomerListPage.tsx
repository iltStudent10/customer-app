import { CustomerList } from '../components/CustomerList'
import { useCustomerApi } from '../hooks/useCustomerApi'

export function CustomerListPage() {
  const { customers, isLoading, error, deleteCustomer } = useCustomerApi()

  const handleDeleteCustomer = (id: number) => {
    void deleteCustomer(id)
  }

  return (
    <section>
      <h2 className="page-title">Customers</h2>
      {isLoading && <div className="placeholder-card">Loading customers...</div>}
      {error && <div className="placeholder-card">{error}</div>}
      <CustomerList customers={customers} onDelete={handleDeleteCustomer} />
    </section>
  )
}