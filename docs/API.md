# Expense Tracker — Features, Schemas & API Contract

A pocket-money and expense tracker for school and college students. In the API, pocket money is stored as `type: "income"` (matching the project brief's `income/expense` field); the app labels it **Pocket money** everywhere.

Base URL: `/api` (local: `http://localhost:5050/api`). All request and response bodies are JSON. There is no authentication: every endpoint is public and all transactions belong to one shared list. Amounts are in Indian Rupees (INR).

## 1. Features

| Area | Feature |
| --- | --- |
| Transactions | Create, list, view, update, delete pocket money (`income`) and expense records |
| Filtering | By month (`YYYY-MM`), type, category, payment method, free-text search on note/category; sorting and pagination |
| Summary | Monthly pocket money, spending, amount left over, % saved, category breakdown, payment-method breakdown, zero-filled daily series, N-month pocket money vs spending trend (MongoDB aggregation with `$facet`) |
| UI | Responsive dashboard with charts and table views, add/edit/delete from the dashboard and the transactions list, form validation, loading/error/empty states |

## 2. MongoDB schemas

### Transaction

| Field | Type | Rules |
| --- | --- | --- |
| `amount` | Number | required, > 0, ≤ 1,000,000,000, max 2 decimals |
| `type` | String | `income` (pocket money) \| `expense` |
| `category` | String | must belong to the list for the chosen `type` (see below and `GET /api/meta`) |
| `date` | Date | stored as UTC midnight of the calendar date sent as `YYYY-MM-DD` |
| `paymentMethod` | String | `cash, upi, debit_card, campus_card, wallet, bank_transfer, other` |
| `note` | String | optional, trimmed, ≤ 200 chars, default `""` |
| `createdAt`, `updatedAt` | Date | timestamps |

Indexes: `{ date: -1 }`, `{ type: 1, category: 1 }`.

**Categories**

- Pocket money (`income`): From Parents, Scholarship, Part-time Job, Internship Stipend, Prize Money, Gifts, Other
- Expense: Canteen & Snacks, Hostel & Mess, Books & Notes, Stationery, Printouts & Xerox, Fees & Exams, Coaching & Tuition, Transport, Mobile & Internet, Clubs & Events, Outings & Fun, Laundry & Essentials, Medical, Other

## 3. Conventions

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
| 404 | Route or transaction not found |
| 500 | Unexpected server error |

## 4. Endpoints

### Health & metadata

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | `{ status, database, uptime }` |
| GET | `/api/meta` | Allowed `types`, display `typeLabels`, `categories` (by type), `paymentMethods` (`{ value, label }`), `currency` (`"INR"`), `noteMaxLength` |

### Transactions

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
