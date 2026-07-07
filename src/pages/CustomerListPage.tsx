import { CustomerList } from '../components/CustomerList'
import { useCustomerApi } from '../hooks/useCustomerApi'

export function CustomerListPage() {
  const { customers, isLoading, error, deleteCustomer } = useCustomerApi()

  const handleDeleteCustomer = (id: number) => {
    const customer = customers.find((item) => item.id === id)
    const customerName = customer?.name ?? 'this customer'

    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${customerName}?`,
    )

    if (!isConfirmed) {
      return
    }

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