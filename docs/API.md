# Expense Tracker — Features, Schemas & API Contract

A pocket-money and expense tracker for school and college students. In the API, pocket money is stored as `type: "income"` (matching the project brief's `income/expense` field); the app labels it **Pocket money** everywhere.

Base URL: `/api` (local: `http://localhost:5050/api`). All request and response bodies are JSON.

## 1. Features

| Area | Feature |
| --- | --- |
| Auth | Register, log in, log out (server-side token revocation), current user, update profile (name, currency), change password (signs out other sessions), delete account |
| Transactions | Create, list, view, update, delete pocket money (`income`) and expense records scoped to the logged-in user |
| Filtering | By month (`YYYY-MM`), type, category, payment method, free-text search on note/category; sorting and pagination |
| Summary | Monthly pocket money, spending, amount left over, % saved, category breakdown, payment-method breakdown, zero-filled daily series, N-month pocket money vs spending trend (MongoDB aggregation with `$facet`) |
| UI | Responsive dashboard with charts and table views, add/edit/delete from the dashboard and the transactions list, form validation, loading/error/empty states, light/dark theme |

## 2. MongoDB schemas

### User

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | required, trimmed, 2–50 chars |
| `email` | String | required, unique, lowercase |
| `password` | String | bcrypt hash (cost 12), `select: false`, never returned |
| `currency` | String | one of `INR, USD, EUR, GBP, JPY, AUD, CAD, SGD, AED`; default `INR` |
| `passwordChangedAt` | Date | tokens issued before this are rejected |
| `createdAt`, `updatedAt` | Date | timestamps |

### Transaction

| Field | Type | Rules |
| --- | --- | --- |
| `user` | ObjectId → User | required; every query is scoped by it |
| `amount` | Number | required, > 0, ≤ 1,000,000,000, max 2 decimals |
| `type` | String | `income` (pocket money) \| `expense` |
| `category` | String | must belong to the list for the chosen `type` (see below and `GET /api/meta`) |
| `date` | Date | stored as UTC midnight of the calendar date sent as `YYYY-MM-DD` |
| `paymentMethod` | String | `cash, upi, debit_card, campus_card, wallet, bank_transfer, other` |
| `note` | String | optional, trimmed, ≤ 200 chars, default `""` |
| `createdAt`, `updatedAt` | Date | timestamps |

Indexes: `{ user: 1, date: -1 }`, `{ user: 1, type: 1, category: 1 }`.

**Categories**

- Pocket money (`income`): From Parents, Scholarship, Part-time Job, Internship Stipend, Prize Money, Gifts, Other
- Expense: Canteen & Snacks, Hostel & Mess, Books & Notes, Stationery, Printouts & Xerox, Fees & Exams, Coaching & Tuition, Transport, Mobile & Internet, Clubs & Events, Outings & Fun, Laundry & Essentials, Medical, Other

### RevokedToken

| Field | Type | Rules |
| --- | --- | --- |
| `jti` | String | unique JWT id of a logged-out token |
| `expiresAt` | Date | TTL index — MongoDB deletes the entry once the token would have expired |

## 3. Conventions

- **Auth:** send `Authorization: Bearer <token>` on every endpoint marked 🔒. Tokens are HS256 JWTs with `sub` (user id), `jti`, `iat`, `exp` (default 7 days).
- **IDs:** resources expose `id` (string); `_id` and `__v` are not returned.
- **Dates:** request `YYYY-MM-DD`; responses return ISO strings such as `2026-10-05T00:00:00.000Z`.
- **Errors:** every error has the shape below. `details` is present for validation errors.

```json
{
  "message": "Validation failed",
  "details": [{ "field": "amount", "message": "Amount must be greater than 0" }]
}
```

| Status | Meaning |
| --- | --- |
| 400 | Validation failed / malformed JSON / invalid id |
| 401 | Missing, invalid, expired or revoked token; bad login credentials |
| 404 | Route or resource not found (including another user's transaction) |
| 409 | Email already registered |
| 429 | Too many login/register attempts (20 per 15 min per IP) |
| 500 | Unexpected server error |

## 4. Endpoints

### Health & metadata

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | — | `{ status, database, uptime }` |
| GET | `/api/meta` | — | Allowed `types`, display `typeLabels`, `categories` (by type), `paymentMethods` (`{ value, label }`), `currencies`, `noteMaxLength` |

### Auth

| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | — | `{ name, email, password, currency? }` | `201 { user, token }` |
| POST | `/api/auth/login` | — | `{ email, password }` | `200 { user, token }` |
| POST | `/api/auth/logout` | 🔒 | — | `204` (token is revoked) |
| GET | `/api/auth/me` | 🔒 | — | `200 { user }` |
| PATCH | `/api/auth/me` | 🔒 | `{ name?, currency? }` | `200 { user }` |
| PUT | `/api/auth/password` | 🔒 | `{ currentPassword, newPassword }` | `200 { user, token }` — older tokens stop working |
| DELETE | `/api/auth/me` | 🔒 | `{ password }` | `204` — deletes the user and all transactions |

Password rules: 8–72 characters with at least one letter and one number.

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "demo@example.com", "password": "Demo@1234" }
```

```json
{
  "user": {
    "id": "6710a2f1c2b4a1e9d0f1a2b3",
    "name": "Demo Student",
    "email": "demo@example.com",
    "currency": "INR",
    "createdAt": "2026-10-15T07:00:00.000Z",
    "updatedAt": "2026-10-15T07:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Transactions 🔒

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/transactions` | List with filters (below) |
| POST | `/api/transactions` | Create — `201 { transaction }` |
| GET | `/api/transactions/summary` | Monthly summary (below) |
| GET | `/api/transactions/:id` | Fetch one — `200 { transaction }` |
| PUT | `/api/transactions/:id` | Replace all fields — `200 { transaction }` |
| DELETE | `/api/transactions/:id` | Delete — `204` |

**Transaction body** (POST and PUT; all fields required except `note`):

```json
{
  "amount": 250.5,
  "type": "expense",
  "category": "Canteen & Snacks",
  "date": "2026-10-05",
  "paymentMethod": "upi",
  "note": "Lunch at canteen"
}
```

**List query parameters** (all optional; empty values are ignored):

| Param | Example | Notes |
| --- | --- | --- |
| `month` | `2026-10` | `[first day, first day of next month)` in UTC |
| `type` | `expense` | |
| `category` | `Canteen & Snacks` | |
| `paymentMethod` | `upi` | |
| `q` | `xerox` | case-insensitive match on note or category |
| `sort` | `-date` | `-date` (default), `date`, `-amount`, `amount` |
| `page` | `1` | ≥ 1 |
| `limit` | `20` | 1–100, default 20 |

```http
GET /api/transactions?month=2026-10&type=expense&page=1&limit=20
```

```json
{
  "transactions": [
    {
      "id": "6710a3...",
      "user": "6710a2...",
      "amount": 250.5,
      "type": "expense",
      "category": "Canteen & Snacks",
      "date": "2026-10-05T00:00:00.000Z",
      "paymentMethod": "upi",
      "note": "Lunch at canteen",
      "createdAt": "2026-10-05T10:12:00.000Z",
      "updatedAt": "2026-10-05T10:12:00.000Z"
    }
  ],
  "totals": { "income": 0, "expense": 250.5, "balance": -250.5 },
  "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
}
```

`totals` covers every transaction matching the filters, not only the current page.

**Summary query parameters:** `month` (default: current UTC month), `months` (trend length, 1–12, default 6).

```http
GET /api/transactions/summary?month=2026-10
```

```json
{
  "month": "2026-10",
  "totals": { "income": 50000, "expense": 10000.3, "balance": 39999.7, "count": 4, "savingsRate": 80 },
  "byCategory": {
    "income": [{ "category": "From Parents", "total": 50000, "count": 1, "percent": 100 }],
    "expense": [
      { "category": "Canteen & Snacks", "total": 7000.1, "count": 2, "percent": 70 },
      { "category": "Stationery", "total": 3000.2, "count": 1, "percent": 30 }
    ]
  },
  "byPaymentMethod": [{ "paymentMethod": "upi", "total": 7000.1, "count": 2 }],
  "daily": [
    { "date": "2026-10-01", "income": 50000, "expense": 0 },
    { "date": "2026-10-02", "income": 0, "expense": 0 }
  ],
  "trend": [
    { "month": "2026-05", "income": 0, "expense": 0, "balance": 0 },
    { "month": "2026-10", "income": 50000, "expense": 10000.3, "balance": 39999.7 }
  ]
}
```

`daily` always contains every day of the month and `trend` every month in range, zero-filled, so charts need no client-side gap handling. The whole summary is computed in one aggregation: a `$match` over the trend window followed by a `$facet` with `totals`, `byCategory`, `byPaymentMethod`, `daily` and `trend` pipelines using conditional `$sum`s.
