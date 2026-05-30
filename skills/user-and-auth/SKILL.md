# User & Authentication Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | User & Authentication |
| **Version** | 1.0.0 |
| **Domain** | Identity & Access Management |
| **Persona** | System (all users) |
| **Dependencies** | None (foundational skill) |

## Description

The User & Authentication skill is the foundational skill that all other skills depend on. It handles user registration, login, JWT token management, and role-based access control. Every authenticated API call across all other skills requires a valid JWT token obtained through this skill.

## Capabilities

| # | Capability | Description |
|---|-----------|-------------|
| 1 | Register | Create a new buyer account |
| 2 | Login | Authenticate and obtain JWT token |
| 3 | Token Management | Handle JWT lifecycle (storage, expiry, refresh) |
| 4 | Role-Based Access | Enforce buyer/supplier/admin permissions |

## User Roles

| Role | Description | Can Do | Cannot Do |
|------|-------------|--------|-----------|
| **buyer** | Purchases products and services | Browse catalog, create inquiries/RFQs, negotiate, accept quotes, issue POs, record payments, record GRN, perform QC, manage favorites | Create/edit/delete products, send initial quotes, create invoices, dispatch goods, confirm payments |
| **supplier** | Manages products and fulfills orders | Manage catalog (CRUD products), send quotes, counter-offer, create invoices, dispatch, confirm/dispute payments | Create inquiries, accept quotes, issue POs, record GRN, perform QC |
| **admin** | Platform administrator | All buyer + supplier actions | (Schema defined, not fully implemented) |

## API Reference

### Register

```
POST /api/auth/register
```

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "password": "securepassword123",
  "phone": "9876543210",
  "company": "Kumar Industries"
}
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Unique email address |
| `password` | string | Yes | Password (hashed with bcrypt) |
| `phone` | string | No | Phone number |
| `company` | string | No | Company name |

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "role": "buyer",
  "phone": "9876543210",
  "company": "Kumar Industries",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Important:** Registration always creates a **buyer** account. Supplier accounts are created directly in the database (registration is locked for supplier role).

### Login

```
POST /api/auth/login
```

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "ramesh@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "role": "buyer",
  "phone": "9876543210",
  "company": "Kumar Industries",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "error": "Invalid email or password"
}
```

## JWT Token Management

### Token Specification

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Expiry | 24 hours |
| Payload | `{ id, email, role }` |
| Header Name | `Authorization` |
| Header Format | `Bearer <token>` |

### Using the Token

All authenticated API calls must include the JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Token Lifecycle

```
1. User logs in via POST /api/auth/login
2. Server returns JWT token in response
3. Client stores token (localStorage recommended)
4. Client includes token in Authorization header for all API calls
5. If server returns 401:
   a. Token has expired (24h)
   b. Client must re-authenticate
   c. Auto-logout: clear stored token and redirect to login
```

### Token Payload

```json
{
  "id": "uuid",
  "email": "ramesh@example.com",
  "role": "buyer",
  "iat": 1716000000,
  "exp": 1716086400
}
```

## Authentication Flow

```
                    ┌─────────────┐
                    │  Unauthenticated │
                    └──────┬──────┘
                           │
                   ┌───────┴───────┐
                   │               │
              [register]      [login]
                   │               │
                   ▼               ▼
            POST /auth/      POST /auth/
             register          login
                   │               │
                   └───────┬───────┘
                           │
                    [JWT token returned]
                           │
                           ▼
                    ┌─────────────┐
                    │ Authenticated │
                    │ (token stored)│
                    └──────┬──────┘
                           │
                    [API calls with]
                    [Bearer token  ]
                           │
                    ┌──────┴──────┐
                    │             │
               [200 OK]     [401 Expired]
                    │             │
                    ▼             ▼
               Continue     Auto-logout
               working      → re-login
```

## Role-Based Access Matrix

| Endpoint | Buyer | Supplier | Public |
|----------|-------|----------|--------|
| `GET /api/products` | Yes | Yes | Yes |
| `GET /api/products/:id` | Yes | Yes | Yes |
| `POST /api/products` | No | Yes | No |
| `PUT /api/products/:id` | No | Yes | No |
| `PATCH /api/products/:id/stock` | No | Yes | No |
| `DELETE /api/products/:id` | No | Yes | No |
| `GET /api/orders` | Own only | All | No |
| `POST /api/orders` | Yes | No | No |
| `GET /api/orders/:id` | Own only | All | No |
| `POST /api/orders/:id/messages` | Yes (own) | Yes | No |
| `PATCH /api/orders/:id/status` | Yes (own) | Yes | No |
| `GET /api/orders/:id/po` | Own only | All | No |
| `POST /api/orders/:id/invoice` | No | Yes | No |
| `GET /api/orders/:id/invoice` | Own only | All | No |
| `GET /api/favorites` | Yes | No | No |
| `POST /api/favorites/:id` | Yes | No | No |
| `DELETE /api/favorites/:id` | Yes | No | No |
| `POST /api/contact` | Yes | Yes | Yes |
| `GET /api/categories` | Yes | Yes | Yes |

## Demo / Test Accounts

| Role | Email | Password | Name | Company |
|------|-------|----------|------|---------|
| Supplier | `admin@himalayaentp.com` | `admin123` | Himalaya Enterprises | Himalaya Enterprises |
| Buyer | `ramesh@example.com` | `buyer123` | Ramesh Kumar | Kumar Industries |
| Buyer | `suresh@example.com` | `buyer123` | Suresh Patel | Patel Traders |

## Business Rules

| Rule | Description |
|------|-------------|
| Unique email | Each email can only be registered once |
| Buyer registration only | `POST /api/auth/register` always creates buyer accounts |
| Supplier creation locked | Supplier accounts must be created directly in database |
| Password hashing | Passwords hashed with bcrypt before storage |
| Token in response | JWT token returned on both register and login |
| 24h token expiry | Tokens expire after 24 hours |
| Auto-logout on 401 | Client should clear token and redirect on 401 |
| Case-insensitive email | Email matching is case-insensitive |

## Data Models

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generated with pgcrypto) |
| `name` | string | Full name |
| `email` | string | Unique email address |
| `password` | string | Bcrypt-hashed password |
| `role` | enum | `buyer`, `supplier`, `admin` |
| `phone` | string | Phone number (optional) |
| `company` | string | Company name (optional) |
| `created_at` | timestamp | Registration time |
| `updated_at` | timestamp | Last profile update |

### JWT Payload

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | User ID |
| `email` | string | User email |
| `role` | string | User role |
| `iat` | number | Issued at (Unix timestamp) |
| `exp` | number | Expires at (Unix timestamp) |

## Example Prompts

- "Register as a new buyer"
- "Login with email ramesh@example.com"
- "My session expired, re-authenticate me"
- "What role am I logged in as?"
- "Can I create products?" (depends on role)
- "Show me what I can access as a buyer"
- "I forgot my password" (not implemented -- inform user)
- "Create a supplier account" (not allowed via API -- inform user)

## Error Handling

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Invalid credentials | 401 | Wrong email or password | Verify credentials and retry |
| Email taken | 409 | Email already registered | Login instead, or use different email |
| Missing fields | 400 | Required fields not provided | Include name, email, and password |
| Token expired | 401 | JWT token past 24h expiry | Re-login to obtain new token |
| Invalid token | 401 | Malformed or tampered token | Re-login to obtain valid token |
| Forbidden | 403 | Role doesn't have permission | Check role-based access matrix |
