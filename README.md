# Expense Tracker for Students (MERN)

A pocket-money tracker for school and college students: record the pocket money you receive and what you spend in the canteen, hostel, on books, xerox, travel and more, then review monthly summaries with charts. Built with **MongoDB, Express, React and Node.js**, with JWT authentication.

- **Backend:** Express 5 REST API, Mongoose, Zod validation, JWT auth with real logout (token denylist), MongoDB aggregation for summaries, rate limiting, Helmet, CORS.
- **Frontend:** React 19 + Vite, React Router, Axios, Recharts; responsive dashboard, CRUD modals with validation, loading/error/empty states, light/dark theme.
- **Tests:** 35 API tests with Node's built-in test runner, Supertest and an in-memory MongoDB.

The full API contract and schemas are in [docs/API.md](docs/API.md).

## Features

- Sign up, log in, log out, change password (signs out other sessions), update name/currency, delete account
- Add, edit and delete entries: amount, type (pocket money/expense), category, date, payment method, optional note
- Edit from the dashboard's recent list or the transactions page — click a row or its **Edit** button
- Student categories: pocket money from parents, scholarships, part-time jobs; expenses like Canteen & Snacks, Hostel & Mess, Books & Notes, Stationery, Printouts & Xerox, Fees & Exams, Transport, Mobile & Internet
- Filter by month, type, category and payment method; search notes; sort; paginate
- Dashboard per month: pocket money, spent, left over, % saved with change vs previous month
- Daily spending chart, category breakdown, payment-method breakdown, 6-month pocket money vs spending trend
- In the API, pocket money is stored as `type: "income"` to match the brief's `income/expense` field
- Every chart has a table view; month selection is kept in the URL so views are shareable and survive refresh

## Project structure

```
expense-tracker/
├── client/                    React + Vite frontend
│   ├── src/
│   │   ├── api/               Axios instance, auth & transaction calls
│   │   ├── components/        Layout, forms, charts, list, modal, states
│   │   ├── context/           Auth, meta (categories), toast providers
│   │   ├── hooks/             useAsync, useMonth, useTheme, useDebouncedValue
│   │   ├── pages/             Login, Register, Dashboard, Transactions, Profile
│   │   ├── styles/index.css   Design tokens + responsive styles
│   │   └── utils/             Formatting, dates, validation
│   └── vercel.json            SPA rewrites for Vercel (public/_redirects for Netlify)
├── server/                    Express API
│   ├── src/
│   │   ├── config/            env + database connection
│   │   ├── constants/         categories, payment methods, currencies
│   │   ├── controllers/       auth + transaction handlers
│   │   ├── middleware/        auth, validation, errors, rate limit
│   │   ├── models/            User, Transaction, RevokedToken
│   │   ├── routes/            /api/auth, /api/transactions, /api/meta
│   │   ├── validators/        Zod schemas
│   │   ├── scripts/seed.js    demo data
│   │   ├── app.js             Express app
│   │   └── index.js           entry point
│   └── tests/                 API tests
├── docs/API.md                features, schemas, endpoint contract
├── docker-compose.yml         local MongoDB
└── render.yaml                Render blueprint for the API
```

## Getting started

**Prerequisites:** Node.js **22.9+**, and either Docker (for local MongoDB) or a MongoDB Atlas connection string.

```bash
# 1. Install everything
npm run install:all

# 2. Configure the API
cp server/.env.example server/.env
#    then set JWT_SECRET (and MONGO_URI if not using local Docker)

# 3. Start MongoDB locally (skip if using Atlas)
npm run db:up

# 4. Optional: load demo data — demo@example.com / Demo@1234
npm run seed

# 5. Run API (http://localhost:5050) and web app (http://localhost:5173)
npm run dev
```

In development, Vite proxies `/api` to the API, so the client needs no configuration.

### Environment variables

**server/.env**

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5050` | API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/expense-tracker` | MongoDB connection string |
| `JWT_SECRET` | — | **Required in production.** Long random string |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origins, comma-separated |
| `NODE_ENV` | `development` | `production` hides internal error messages |

**client/.env** (production builds only)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Full API base URL, e.g. `https://expense-tracker-api.onrender.com/api` |

### Scripts (from the repo root)

| Command | Description |
| --- | --- |
| `npm run dev` | API + web app with live reload |
| `npm test` | Run API tests (in-memory MongoDB, no setup needed) |
| `npm run seed` | Reset and load the demo account |
| `npm run build` | Production build of the client into `client/dist` |
| `npm run db:up` / `db:down` | Start/stop local MongoDB via Docker |

## API overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account → `{ user, token }` |
| POST | `/api/auth/login` | Log in → `{ user, token }` |
| POST | `/api/auth/logout` | Revoke current token |
| GET / PATCH / DELETE | `/api/auth/me` | Current user / update profile / delete account |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/transactions?month=2026-10` | List (filters: `type`, `category`, `paymentMethod`, `q`, `sort`, `page`, `limit`) |
| POST | `/api/transactions` | Create |
| PUT | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |
| GET | `/api/transactions/summary?month=2026-10` | Totals, category & payment breakdowns, daily series, trend |
| GET | `/api/meta` | Categories, payment methods, currencies |

All `/api/transactions` routes need `Authorization: Bearer <token>`. See [docs/API.md](docs/API.md) for request/response examples and error formats.

## How authentication works

1. Register/login returns a signed JWT (`sub` = user id, unique `jti`). The client stores it and sends it as a Bearer token through an Axios interceptor.
2. `requireAuth` verifies the signature and expiry, loads the user, rejects tokens whose `jti` was revoked, and rejects tokens issued before the last password change.
3. **Logout** adds the token's `jti` to a `RevokedToken` collection with a TTL index, so the token is unusable immediately and the entry cleans itself up at expiry. Other devices stay logged in.
4. On any 401 the client clears the token, shows a "session ended" toast and redirects to the login page, returning the user to where they were after logging in.

Passwords are hashed with bcrypt (cost 12); login/register are rate limited.

## Testing

```bash
npm test
```

The suite starts an in-memory MongoDB automatically (the first run downloads the binary). To run against an existing database instead, set `MONGO_URI_TEST`. Coverage includes:

- Registration, duplicate email, validation errors, malformed JSON
- Login success/failure, logout revocation, multiple sessions, password change invalidating old tokens, account deletion
- Transaction validation for every field, category/type mismatch, decimal precision
- Month boundaries, filters, search, sort, pagination, per-user isolation, 404 for other users' records
- Summary totals, category/payment breakdowns, zero-filled daily and trend series, empty months

## Deployment

### 1. Database — MongoDB Atlas

Create a free cluster, add a database user, allow network access (`0.0.0.0/0` for Render's free tier), and copy the connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/expense-tracker`.

### 2. Backend — Render

Use **New → Blueprint** with this repo (it reads `render.yaml`), or create a Web Service manually:

- Root directory: `server` · Build: `npm ci` · Start: `npm start` · Health check: `/api/health`
- Env vars: `NODE_ENV=production`, `MONGO_URI=<atlas uri>`, `JWT_SECRET=<random>`, `CLIENT_URL=<your frontend URL>`

Optionally seed the demo account from your machine: `MONGO_URI=<atlas uri> npm run seed --prefix server`.

### 3. Frontend — Vercel (or Netlify)

- Root directory: `client` · Build: `npm run build` · Output: `dist`
- Env var: `VITE_API_URL=https://<your-render-service>.onrender.com/api`
- `client/vercel.json` (Vercel) and `client/public/_redirects` (Netlify) handle client-side routes.

Finally, make sure the API's `CLIENT_URL` exactly matches the deployed frontend origin (no trailing slash).

## One-week plan coverage

| Day | Rubric | Where it lives |
| --- | --- | --- |
| 1 | Define features, MongoDB schemas, REST endpoint contract | [docs/API.md](docs/API.md), `server/src/models`, `server/src/constants` |
| 2 | Express server, database connection, JSON APIs | `server/src/app.js`, `config/db.js`, `routes/`, `controllers/` |
| 3 | React pages, forms, API calls with Axios | `client/src/pages`, `components/TransactionForm.jsx`, `client/src/api` |
| 4 | Complete CRUD flows, validation, loading/error states | Transactions page (create/edit/delete), Zod + client validation, `States.jsx`, toasts |
| 5 | Test APIs, fix bugs, README, deploy | `server/tests`, this README, `render.yaml`, `client/vercel.json` |
