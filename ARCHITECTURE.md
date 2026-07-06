# Customer Manager Architecture

## Component Tree

- App
  - BrowserRouter
    - Layout
      - Header (navigation links)
      - Routes
        - CustomerListPage
          - CustomerList
            - CustomerRow
        - AddCustomerPage
          - CustomerForm (mode: add)
        - EditCustomerPage
          - CustomerForm (mode: edit, pre-filled)

## Architecture Decisions

1. **Where customer state will live**
   - Customer state will live in a `CustomerProvider` (Context API) that wraps the app.
   - Route pages and reusable components can read and update shared data without prop drilling.

2. **How CRUD operations will be managed**
   - CRUD state transitions will use `useReducer` with typed actions.
   - API calls will be handled in async functions/hooks, then dispatch reducer actions for consistent state updates.

3. **Custom hooks planned**
   - `useCustomerApi` for REST requests (`GET`, `POST`, `PUT`, `DELETE`) using `/api/customers`.
   - `useCustomers` as a convenience hook for consuming customer context safely.

4. **How add and edit form modes will work**
   - A single `CustomerForm` component will support both modes using props.
   - In add mode, form starts empty and submits `POST`.
   - In edit mode, form is pre-filled from selected customer and submits `PUT`.