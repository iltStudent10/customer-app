import { NavLink } from 'react-router-dom'

export function Header() {
  return (
    <header className="app-header">
      <div className="container header-content">
        <h1 className="app-title">Customer Manager</h1>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Customers
          </NavLink>
          <NavLink
            to="/add"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Add Customer
          </NavLink>
        </nav>
      </div>
    </header>
  )
}