# Customer Manager

A React + TypeScript application for managing customer records with create, read, update, and delete operations.

## Features

- Customer list with server-backed pagination
- Search by name, email, or city
- Sort by name, email, city, and state
- Add and edit customer forms with client-side validation
- Account creation and login with session persisted in local storage (passwords require 8+ chars, uppercase, lowercase, number, and special character)
- Protected edit access (users must be logged in to edit customers)
- Duplicate email validation before create/update
- Delete confirmation dialog
- Light/Dark mode toggle persisted in local storage
- Error boundary for safer UI failure handling

## Tech Stack

- React 19 + TypeScript
- Vite 8
- React Router 7
- JSON Server for local REST API
- Vitest + Testing Library for tests

## Project Structure

- `src/components` – UI components (`Header`, `Layout`, `CustomerList`, `CustomerForm`, `ErrorBoundary`)
- `src/pages` – Route-level pages (`CustomerListPage`, `AddCustomerPage`, `EditCustomerPage`, `LoginPage`)
- `src/hooks` – Data and context hooks (`useCustomerApi`, `useCustomerContext`, `useAuth`)
- `src/context` – Context providers (`CustomerProvider`, `AuthProvider`)
- `src/types` – Shared TypeScript types
- `db.json` – Local API database file
- `db.seed.json` – Seed data for resetting the database

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run locally

Run the API and frontend in separate terminals:

```bash
# Terminal 1
npm run api

# Terminal 2
npm run dev
```

Then open the URL shown by Vite (typically `http://localhost:5173`).

## Available Scripts

- `npm run dev` – Start Vite dev server
- `npm run api` – Start JSON Server on port 3001
- `npm run api:reset` – Reset `db.json` from `db.seed.json`
- `npm run build` – Type-check and build production assets
- `npm run preview` – Preview the production build locally
- `npm run lint` – Run ESLint
- `npm run test` – Run Vitest in watch mode
- `npm run test:run` – Run Vitest once
- `npm run deploy` – Deploy `dist/` to GitHub Pages

## Routing

- `/` – Customer list
- `/add` – Add customer
- `/login` – Login page
- `/edit/:id` – Edit customer

Unauthenticated users are redirected to `/login` when attempting to access `/edit/:id`.

`BrowserRouter` uses Vite `BASE_URL` as basename, so the app works locally and on GitHub Pages under `/customer-app/`.

## API and Proxy

Frontend requests use relative `/api/...` paths. Vite proxies those to JSON Server in development:

- Vite proxy source: `vite.config.ts`
- Target API: `http://localhost:3001`
- Resource: `/customers`

Common requests:

- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

## Testing

Run the full test suite:

```bash
npm run test:run
```

Test files are in `src/test`.

## Deployment (GitHub Pages)

This project is configured for GitHub Pages deployment.

1. Ensure `homepage` in `package.json` matches your repo page URL.
2. Build and deploy:

```bash
npm run deploy
```

The deploy script publishes the `dist/` directory using `gh-pages`.

## Troubleshooting

### JSON Server port already in use

- Change the `api` script port in `package.json`.
- Update proxy target in `vite.config.ts` to the same port.

### Data not persisting

- Confirm API process is running (`npm run api`).
- Verify writes use `POST`, `PUT`, or `DELETE`.
- Check whether `db.json` is changing.

### CORS or network errors in dev

- Confirm frontend calls use `/api/customers` (not hardcoded host URLs).
- Confirm Vite proxy is enabled and points to JSON Server.
