# Customer Manager

Customer Manager is a React + TypeScript app for authenticated customer management.

## Features

- Customer list with server-backed pagination, search, and sorting
- Create, edit, and delete customer records
- Login and account creation flow (email or phone sign-in)
- Role-based access (`admin` and `user`)
- Protected routes with redirect handling
- Account page for username/password updates
- Light/dark theme preference persisted in local storage
- Error boundary and resilient API requests (timeouts/retries)

## Tech Stack

- React 19
- TypeScript
- React Router 7
- Vite 8
- JSON Server
- Vitest + Testing Library

## Quick Start

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

## Default Admin Account

Use this built-in account for admin-only actions (for example, adding customers):

- Email: `admin@customerapp.local`
- Password: `Admin#123`

## Scripts

- `npm run dev` — Start Vite dev server
- `npm run api` — Start JSON Server (`db.json`) on port `3001`
- `npm run api:reset` — Reset `db.json` from `db.seed.json`
- `npm run build` — Type-check and build production assets
- `npm run preview` — Preview the production build
- `npm run lint` — Run ESLint
- `npm run test` — Run Vitest in watch mode
- `npm run test:run` — Run Vitest once
- `npm run deploy` — Deploy `dist/` to GitHub Pages

## Routing and Access Rules

- `/login` — Public login/create-account page
- `/` — Customer list (requires authentication)
- `/edit/:id` — Edit customer (requires authentication)
- `/account` — Account settings (requires authentication)
- `/add` — Add customer (requires admin role)

## Project Structure

- `src/components` — Shared UI components
- `src/pages` — Route-level pages
- `src/context` — Context providers for auth and customers
- `src/hooks` — App hooks for auth, API, and context access
- `src/types` — Shared TypeScript models
- `src/utils` — Domain utilities
- `src/test` — Unit/integration tests
- `db.json` — Local API data source
- `db.seed.json` — Seed file used for resets

## API and Proxy (Development)

The frontend calls relative `/api/...` URLs. Vite proxies these to JSON Server:

- Vite proxy source: `vite.config.ts`
- Target API: `http://localhost:3001`
- Resource: `/customers`

Common endpoints:

- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

## Testing

```bash
npm run test:run
```

All tests are under `src/test`.

## Deployment (GitHub Pages)

1. Ensure `homepage` in `package.json` matches the repository page URL.
2. Deploy:

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
