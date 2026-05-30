# Order Management Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | Order Management |
| **Version** | 1.0.0 |
| **Domain** | Order Lifecycle |
| **Persona** | Buyer + Supplier |
| **Dependencies** | User & Auth, Sourcing |

## Description

The Order Management skill handles the complete order lifecycle from creation through negotiation to purchase order issuance. It covers inquiry management, RFQ processing, price negotiation (quote and counter-offer exchanges), order acceptance, PO generation, and order tracking with filtering/sorting.

## Capabilities

| # | Capability | Actor | Description |
|---|-----------|-------|-------------|
| 1 | Create Order | Buyer | Submit inquiry or RFQ |
| 2 | List Orders | Both | View orders with filters |
| 3 | View Order Detail | Both | Full order info with items and messages |
| 4 | Send Quote | Supplier | Quote a price for an inquiry |
| 5 | Counter-Offer | Either | Propose a different price |
| 6 | Accept Quote | Buyer | Accept the quoted/negotiated price |
| 7 | Reject Order | Either | Reject and cancel negotiation |
| 8 | Issue Purchase Order | Buyer | Generate formal PO |
| 9 | Download PO PDF | Both | Get the Purchase Order document |
| 10 | Update Order Status | Both | Transition order to next state |
| 11 | View Negotiation Thread | Both | See all messages on an order |
| 12 | Filter & Sort Orders | Both | Filter by date, status, type; sort by date |

## API Reference

### Create Order

```
POST /api/orders
```

**Authentication:** Required (Buyer)

**Request Body:**
```json
{
  "type": "inquiry | rfq",
  "notes": "Project details and requirements",
  "items": [
    {
      "product_id": "uuid (optional for custom items)",
      "name": "Product name",
      "category": "Category name",
      "specs": "Technical specifications",
      "quantity": 5,
      "price": 285000,
      "price_max": 350000
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "ORD-1716000000-abc123",
  "buyer_id": "uuid",
  "type": "inquiry",
  "status": "pending",
  "notes": "...",
  "items": [...],
  "created_at": "2024-01-01T00:00:00Z"
}
```

### List Orders

```
GET /api/orders
```

**Authentication:** Required

**Behavior by Role:**
- **Buyer:** Returns only their own orders
- **Supplier:** Returns all orders

**Response:**
```json
[
  {
    "id": "ORD-1716000000-abc123",
    "buyer_id": "uuid",
    "buyer_name": "Ramesh Kumar",
    "buyer_company": "Kumar Industries",
    "type": "inquiry",
    "status": "pending",
    "total_value": null,
    "advance_paid": 0,
    "balance_paid": 0,
    "advance_confirmed": false,
    "balance_confirmed": false,
    "notes": "...",
    "items": [...],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Client-Side Filtering (applied after fetch):**

| Filter | Type | Description |
|--------|------|-------------|
| Date From | date | Orders created on or after this date |
| Date To | date | Orders created on or before this date |
| Status | enum | Filter by order status |
| Type | enum | `inquiry` or `rfq` |
| Sort | toggle | `newest` (default) or `oldest` |

### Get Order Detail

```
GET /api/orders/:id
```

**Authentication:** Required

**Response:**
```json
{
  "id": "ORD-1716000000-abc123",
  "buyer_id": "uuid",
  "buyer_name": "Ramesh Kumar",
  "buyer_email": "ramesh@example.com",
  "buyer_company": "Kumar Industries",
  "buyer_phone": "9876543210",
  "type": "inquiry",
  "status": "quoted",
  "total_value": 1425000,
  "advance_paid": 0,
  "balance_paid": 0,
  "advance_confirmed": false,
  "balance_confirmed": false,
  "notes": "Need for mining project",
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "name": "10-Wheeler Tipper Body",
      "category": "Tippers",
      "specs": "16 cubic meters",
      "quantity": 5,
      "price": 285000,
      "price_max": 350000
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

### Get Negotiation Messages

```
GET /api/orders/:id/messages
```

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "uuid",
    "order_id": "ORD-...",
    "sender_id": "uuid",
    "sender_role": "supplier",
    "sender_name": "Himalaya Enterprises",
    "type": "quote",
    "quoted_price": 300000,
    "delivery_estimate": "4-6 weeks",
    "message": "We can offer at 3 lakhs per unit with delivery in 4-6 weeks",
    "created_at": "2024-01-02T00:00:00Z"
  }
]
```

### Send Message (Quote / Counter-Offer / Accept / Reject)

```
POST /api/orders/:id/messages
```

**Authentication:** Required

**Message Types for Order Management:**

#### Send Quote (Supplier)
```json
{
  "type": "quote",
  "quoted_price": 300000,
  "delivery_estimate": "4-6 weeks",
  "message": "We can offer at 3 lakhs per unit"
}
```
**Effect:** Order status changes to `quoted`, `total_value` is set to `quoted_price * quantity`

#### Send Counter-Offer (Either)
```json
{
  "type": "counter_offer",
  "quoted_price": 275000,
  "message": "Can you do 2.75 lakhs? We are ordering in bulk."
}
```
**Effect:** Order status changes to `negotiating`

#### Accept Quote (Buyer)
```json
{
  "type": "acceptance",
  "message": "We accept the quoted price. Please proceed."
}
```
**Effect:** Order status changes to `accepted`

#### Reject (Either)
```json
{
  "type": "rejection",
  "message": "Unable to proceed at this price point."
}
```
**Effect:** Order status changes to `cancelled`

#### Comment (Either)
```json
{
  "type": "comment",
  "message": "Can you share the material test certificates?"
}
```
**Effect:** No status change, adds to conversation thread

### Update Order Status

```
PATCH /api/orders/:id/status
```

**Authentication:** Required

**Request Body:**
```json
{
  "status": "po_issued"
}
```

**Valid Transitions (Order Management scope):**

| From | To | Actor |
|------|----|-------|
| `accepted` | `po_issued` | Buyer |
| `advance_paid` | `in-progress` | Supplier |
| Any pre-dispatch | `cancelled` | Either |

### Download Purchase Order PDF

```
GET /api/orders/:id/po
```

**Authentication:** Required

**Available When:** Order status is `po_issued` or any later status

**Response:** `application/pdf` binary stream

**PDF Contents:**
- Himalaya Enterprises letterhead
- Buyer and supplier details (name, company, email, phone)
- Order ID and date
- Itemized table (product, specs, quantity, unit price, total)
- GST tax breakdown:
  - Place of supply = Bihar: CGST 9% + SGST 9%
  - Place of supply != Bihar: IGST 18%
- Grand total with amount in words (Indian Rupees)
- Terms and conditions
- Signature blocks

## Negotiation State Machine

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
pending ──[quote]──► quoted ──[counter_offer]──► negotiating
                       │                          │    ▲  │
                       │                          │    │  │
                       │                          │    └──┘
                       │                          │  (more counter-offers)
                       │                          │
                       ├──[acceptance]──► accepted ◄──[acceptance]
                       │                     │
                       │               [issue PO]
                       │                     │
                       │                     ▼
                       │                po_issued
                       │
                       └──[rejection]──► cancelled
```

## Business Rules

| Rule | Description |
|------|-------------|
| Quote sets total_value | When supplier sends first quote, `total_value = quoted_price * total_quantity` |
| Counter-offer updates total | Each counter-offer updates the order's `total_value` |
| Only buyer accepts | Only the buyer can send an `acceptance` message |
| Only supplier quotes | Only the supplier can send the initial `quote` |
| Either can counter | Both buyer and supplier can send `counter_offer` |
| PO after accept | PO can only be issued after order is `accepted` |
| PO is irreversible | Once PO is issued, the order cannot be cancelled (procurement commitment) |
| Order ID format | Inquiries: `ORD-{timestamp}-{random}`, RFQs: `RFQ-{timestamp}-{random}` |
| Buyer sees own | Buyers can only view their own orders |
| Supplier sees all | Suppliers can view all orders across buyers |

## Data Models

### Order

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Order ID (ORD-xxx or RFQ-xxx) |
| `buyer_id` | UUID | FK to users |
| `type` | enum | `inquiry`, `rfq` |
| `status` | enum | See status machine above |
| `notes` | text | Buyer's notes/requirements |
| `total_value` | numeric | Agreed total value (set on quote) |
| `advance_paid` | numeric | Accumulated advance payments |
| `balance_paid` | numeric | Accumulated balance payments |
| `advance_confirmed` | boolean | Supplier confirmed advance |
| `balance_confirmed` | boolean | Supplier confirmed balance |
| `created_at` | timestamp | Order creation time |
| `updated_at` | timestamp | Last update time |

### Order Item

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | string | FK to orders |
| `product_id` | UUID | FK to products (nullable for custom) |
| `name` | string | Product name |
| `category` | string | Category name |
| `specs` | string | Specifications |
| `quantity` | integer | Quantity ordered |
| `price` | numeric | Unit price (min) |
| `price_max` | numeric | Unit price (max) |

### Order Message

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | string | FK to orders |
| `sender_id` | UUID | FK to users |
| `sender_role` | string | `buyer` or `supplier` |
| `type` | enum | Message type (see types above) |
| `quoted_price` | numeric | Price in quote/counter-offer |
| `delivery_estimate` | string | Estimated delivery timeline |
| `message` | text | Free-text message content |
| `created_at` | timestamp | When message was sent |

## Example Prompts

- "Show me all my pending orders"
- "What's the status of order ORD-1716000000?"
- "The supplier quoted 3 lakhs. I want to counter at 2.75 lakhs."
- "Accept the quote on order ORD-1716000000"
- "Issue a purchase order for my accepted order"
- "Download the PO for order ORD-1716000000"
- "Show me the negotiation history for this order"
- "Filter my orders by status 'quoted'"
- "Show orders from last week"
- "Cancel order RFQ-1716000000"

## Error Handling

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Invalid status transition | 400 | Attempting an invalid state change | Check current status and valid transitions |
| Not authorized | 403 | Buyer trying to access another buyer's order | Verify order ownership |
| Order not found | 404 | Invalid order ID | Verify order ID format and existence |
| Cannot cancel | 400 | Trying to cancel after dispatch | Order cannot be cancelled once dispatched |
| Missing quote price | 400 | Quote message without `quoted_price` | Include `quoted_price` in quote messages |
