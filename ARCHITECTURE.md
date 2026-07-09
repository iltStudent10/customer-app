# Customer Manager Architecture

## Component Tree

- App
  - BrowserRouter
    - AuthProvider
      - CustomerProvider
        - Layout
          - Header (navigation links, auth status, logout, theme toggle)
          - ErrorBoundary
            - Routes
              - LoginPage (public)
              - CustomerListPage (requires auth)
                - CustomerList
              - AddCustomerPage (requires admin)
                - CustomerForm (mode: add)
              - EditCustomerPage (requires auth)
                - CustomerForm (mode: edit, pre-filled)
              - AccountPage (requires auth)

## Architecture Decisions

1. **Where customer state lives**
   - Customer state lives in `CustomerProvider` (Context API) wrapped around the app.
   - Customer list updates are managed with `useReducer` and typed actions.
   - Route pages and reusable components read and update shared data without prop drilling.

2. **How CRUD operations are managed**
   - API requests are centralized in `useCustomerApi`.
   - The hook handles list fetch, create, update, delete, and duplicate-email checks.
   - Request resilience includes timeout, retry for retriable reads, and abort handling for stale requests.

3. **Custom hooks in use**
   - `useCustomerApi` for customer REST operations through `/api/customers`.
   - `useCustomerContext` for safe customer context consumption.
   - `useAuth` for auth state, role checks, and account actions.

4. **How add and edit form modes work**
   - A single `CustomerForm` component supports both modes through props.
   - Add mode starts with empty values and creates a customer.
   - Edit mode loads existing customer data and updates the record.

5. **How access control works**
   - Auth state is managed in `AuthProvider` and persisted in local storage.
   - `RequireAuth` protects list, account, and edit routes.
   - `RequireAdmin` protects the add route.

6. **How local and deployed routing stays consistent**
   - `BrowserRouter` basename is derived from Vite `BASE_URL`.
   - This keeps route resolution working in local development and GitHub Pages deployment.