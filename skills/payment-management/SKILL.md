# Payment Management Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | Payment Management |
| **Version** | 1.0.0 |
| **Domain** | Payment Lifecycle |
| **Persona** | Buyer (records payments) + Supplier (confirms/disputes) |
| **Dependencies** | User & Auth, Order Management, Invoice & Billing |

## Description

The Payment Management skill handles the complete payment lifecycle including advance payments, balance payments, two-step payment confirmation (buyer records, supplier confirms/disputes), dispute resolution, and auto-completion logic. It tracks payment accumulation and ensures financial integrity through a confirmation workflow.

## Capabilities

| # | Capability | Actor | Description |
|---|-----------|-------|-------------|
| 1 | Record Advance Payment | Buyer | Submit advance payment with amount and UTR |
| 2 | Confirm Advance Payment | Supplier | Confirm receipt of advance |
| 3 | Dispute Advance Payment | Supplier | Dispute the advance payment amount |
| 4 | Record Balance Payment | Buyer | Submit balance payment after QC |
| 5 | Confirm Balance Payment | Supplier | Confirm receipt of balance |
| 6 | Dispute Balance Payment | Supplier | Dispute the balance payment amount |
| 7 | View Payment History | Both | See full payment timeline |
| 8 | View Payment Summary | Both | See totals: due, advance, balance, remaining |

## API Reference

### Record Advance Payment

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Buyer)

**Prerequisites:** Order status must be `po_issued`

**Request Body:**
```json
{
  "type": "advance_payment",
  "quoted_price": 750000,
  "message": "Advance payment of 7.5 lakhs transferred via NEFT. UTR: UTIB12345678"
}
```

**Effect:**
- `orders.advance_paid += quoted_price` (accumulates)
- Order status changes to `advance_paid`
- `advance_confirmed` remains `false` until supplier confirms

### Confirm Advance Payment

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Supplier)

**Prerequisites:** Order status is `advance_paid` and `advance_confirmed` is `false`

**Request Body:**
```json
{
  "type": "advance_payment_confirmed",
  "message": "Advance payment of 7.5 lakhs received and confirmed."
}
```

**Effect:**
- `orders.advance_confirmed = true`
- Status remains `advance_paid`

### Dispute Advance Payment

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Supplier)

**Prerequisites:** Order status is `advance_paid`

**Request Body:**
```json
{
  "type": "advance_payment_disputed",
  "message": "Payment amount does not match. Only received 5 lakhs."
}
```

**Effect:**
- System queries the last `advance_payment` message to find the disputed amount
- `orders.advance_paid -= disputed_amount` (reverses the last payment)
- `orders.advance_confirmed = false`
- Order status changes to `payment_disputed`

### Record Balance Payment

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Buyer)

**Prerequisites:** Order status must be `qc_approved` or `payment_disputed`

**Request Body:**
```json
{
  "type": "balance_payment",
  "quoted_price": 750000,
  "message": "Balance payment of 7.5 lakhs. UTR: UTIB87654321"
}
```

**Effect:**
- `orders.balance_paid += quoted_price` (accumulates)
- If coming from `payment_disputed`: `balance_confirmed = false`, status changes to `qc_approved`
- Status remains `qc_approved` (does NOT auto-complete)

### Confirm Balance Payment

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Supplier)

**Prerequisites:** Order status is `qc_approved` and balance has been recorded

**Request Body:**
```json
{
  "type": "balance_payment_confirmed",
  "message": "Balance payment confirmed. Thank you for your business."
}
```

**Effect:**
- `orders.balance_confirmed = true`
- System checks: `(advance_paid + balance_paid) >= total_value * 0.99`
  - If fully paid: Order status changes to `completed`
  - If partially paid: Status remains `qc_approved` (buyer pays more)

### Dispute Balance Payment

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Supplier)

**Request Body:**
```json
{
  "type": "balance_payment_disputed",
  "message": "Balance amount incorrect. Expected 7.5 lakhs, received 6 lakhs."
}
```

**Effect:**
- Order status changes to `payment_disputed`
- Buyer must re-record the correct payment

### View Payment History

```
GET /api/orders/:id/payment-history
```

**Authentication:** Required

**Response:**
```json
[
  {
    "type": "advance_payment",
    "amount": 750000,
    "message": "Advance payment of 7.5 lakhs. UTR: UTIB12345678",
    "sender_role": "buyer",
    "created_at": "2024-06-01T10:00:00Z"
  },
  {
    "type": "advance_payment_confirmed",
    "message": "Advance confirmed.",
    "sender_role": "supplier",
    "created_at": "2024-06-02T09:00:00Z"
  },
  {
    "type": "balance_payment",
    "amount": 750000,
    "message": "Balance payment. UTR: UTIB87654321",
    "sender_role": "buyer",
    "created_at": "2024-07-15T10:00:00Z"
  }
]
```

### View Payment Summary (via Order Detail)

```
GET /api/orders/:id
```

**Payment fields in response:**
```json
{
  "total_value": 1500000,
  "advance_paid": 750000,
  "balance_paid": 750000,
  "advance_confirmed": true,
  "balance_confirmed": true,
  "status": "completed"
}
```

**Derived calculations:**
```
Total Due       = total_value
Advance Paid    = advance_paid
Balance Paid    = balance_paid
Total Paid      = advance_paid + balance_paid
Remaining       = total_value - advance_paid - balance_paid
```

## Payment State Machine

```
                  po_issued
                      │
              [advance_payment]
                      │
                      ▼
                advance_paid
                 │         │
        [confirmed]     [disputed]
            │               │
            │               ▼
            │        payment_disputed
            │               │
            │         [re-record]
            │               │
            │               └──────► advance_paid
            │
            ▼
    (manufacturing proceeds)
            │
            ▼
       qc_approved
            │
    [balance_payment]
            │
            ▼
    (balance recorded)
         │         │
[confirmed]     [disputed]
    │               │
    │               ▼
    │        payment_disputed
    │               │
    │         [re-record]
    │               │
    │               └──────► qc_approved
    │
    ▼
[check total]
    │         │
[>= 99%]  [< 99%]
    │         │
    ▼         └──────► qc_approved (pay more)
completed
```

## Two-Step Confirmation Flow

Every payment follows a two-step process to prevent errors:

```
Step 1: Buyer records payment
  → Amount added to advance_paid or balance_paid
  → Confirmation flag stays FALSE

Step 2: Supplier confirms or disputes
  → Confirms: Flag set to TRUE, check for completion
  → Disputes: Amount reversed, status = payment_disputed
```

This ensures:
- No premature order completion from incorrect payment amounts
- Supplier has veto power over payment claims
- Full audit trail of all payment attempts

## Auto-Completion Logic

```
WHEN supplier confirms balance payment:
    total_paid = advance_paid + balance_paid
    total_due  = total_value

    IF total_paid >= total_due * 0.99 THEN
        // 99% threshold accounts for paise rounding differences
        order.status = "completed"
    ELSE
        // Partial payment, buyer needs to pay remaining
        order.status stays "qc_approved"
    END IF
```

## Dispute Reversal Logic

When supplier disputes an advance payment:

```
1. Query last advance_payment message for this order
2. Get the disputed_amount from that message's quoted_price
3. UPDATE orders SET
     advance_paid = advance_paid - disputed_amount,
     advance_confirmed = FALSE,
     status = 'payment_disputed'
4. Buyer sees payment_disputed status and re-records
```

## Business Rules

| Rule | Description |
|------|-------------|
| Two-step confirmation | All payments require buyer record + supplier confirm |
| Accumulation | Multiple payments accumulate (not replace) in advance_paid/balance_paid |
| Advance before manufacturing | Advance must be paid before production starts |
| QC before balance | Balance payment only after QC approval |
| 99% completion threshold | Order auto-completes when total paid >= 99% of total due |
| Dispute reverses last | Disputing reverses only the most recent payment amount |
| Default payment terms | 50% advance on PO, 50% balance after QC and delivery |
| UTR reference | Buyer should include UTR/transaction reference for traceability |
| No negative payments | Payment amounts must be positive |

## Data Models

### Payment-Related Order Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_value` | numeric(14,2) | Total order value (set during negotiation) |
| `advance_paid` | numeric(14,2) | Accumulated advance payments |
| `balance_paid` | numeric(14,2) | Accumulated balance payments |
| `advance_confirmed` | boolean | Supplier confirmed advance receipt |
| `balance_confirmed` | boolean | Supplier confirmed balance receipt |

### Payment Message Types

| Type | Sender | Purpose |
|------|--------|---------|
| `advance_payment` | Buyer | Record advance payment |
| `advance_payment_confirmed` | Supplier | Confirm advance receipt |
| `advance_payment_disputed` | Supplier | Dispute advance amount |
| `balance_payment` | Buyer | Record balance payment |
| `balance_payment_confirmed` | Supplier | Confirm balance receipt |
| `balance_payment_disputed` | Supplier | Dispute balance amount |

## Example Prompts

- "Pay advance of 7.5 lakhs for order ORD-1716000000"
- "Confirm the advance payment received"
- "The advance amount is wrong, dispute it"
- "What's the payment status on my order?"
- "How much balance is remaining on this order?"
- "Pay the remaining balance"
- "Show me the payment history for order ORD-1716000000"
- "The buyer paid 6 lakhs but it should be 7.5 lakhs, dispute it"
- "Re-record the correct payment amount"
- "Is this order fully paid?"

## Error Handling

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Wrong status for advance | 400 | Order not at `po_issued` | Issue PO first |
| Wrong status for balance | 400 | Order not at `qc_approved` | Complete QC inspection first |
| Not buyer | 403 | Supplier trying to record payment | Only buyer records payments |
| Not supplier | 403 | Buyer trying to confirm payment | Only supplier confirms/disputes |
| Missing amount | 400 | Payment message without `quoted_price` | Include amount in `quoted_price` field |
| Invalid amount | 400 | Negative or zero payment | Amount must be positive |
