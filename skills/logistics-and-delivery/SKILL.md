# Logistics & Delivery Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | Logistics & Delivery |
| **Version** | 1.0.0 |
| **Domain** | Fulfillment & Delivery |
| **Persona** | Supplier (dispatches) + Buyer (receives) |
| **Dependencies** | User & Auth, Order Management, Invoice & Billing |

## Description

The Logistics & Delivery skill handles the physical fulfillment phase of the procurement lifecycle. It covers dispatch recording with transporter and challan details, goods receipt note (GRN) creation by the buyer, and delivery status tracking. This skill bridges the gap between invoice creation and quality inspection.

## Capabilities

| # | Capability | Actor | Description |
|---|-----------|-------|-------------|
| 1 | Record Dispatch | Supplier | Record dispatch with vehicle and challan details |
| 2 | Record Goods Receipt (GRN) | Buyer | Acknowledge delivery with date and condition |
| 3 | Track Delivery Status | Both | Monitor order through dispatch-to-delivery |

## API Reference

### Record Dispatch

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Supplier)

**Prerequisites:** Order status must be `invoiced`

**Request Body:**
```json
{
  "type": "dispatch",
  "message": "Goods dispatched. Vehicle: JH05AB1234, Challan No: DC-2024-0456, Transporter: Shree Balaji Transport, Expected delivery: 3-5 days",
  "delivery_estimate": "3-5 days"
}
```

**Recommended message format:**
The message should include the following details for proper tracking:
- **Vehicle Number** -- Registration number of the transport vehicle
- **Challan Number** -- Delivery challan reference number
- **Transporter** -- Name of the transport company
- **Expected Delivery** -- Estimated arrival timeline

**Effect:**
- Order status changes to `dispatched`
- Buyer is notified of dispatch details

### Record Goods Receipt Note (GRN)

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Buyer)

**Prerequisites:** Order status must be `dispatched`

**Request Body:**
```json
{
  "type": "grn",
  "message": "Goods received on 20-Jun-2024. Condition: Good. All 5 units received in proper packaging. Minor surface scratches on unit #3, not affecting structural integrity."
}
```

**Recommended message format:**
The message should include:
- **Receipt Date** -- When goods were physically received
- **Condition** -- Overall condition (Good / Damaged / Partial)
- **Quantity Check** -- Confirm units received match order
- **Remarks** -- Any observations about packaging, damage, or discrepancies

**Effect:**
- Order status changes to `delivered`
- Opens the path for QC inspection (handled by Quality Control skill)

### Track Delivery Status (via Order Detail)

```
GET /api/orders/:id
```

**Authentication:** Required

**Relevant status values for logistics:**

| Status | Meaning |
|--------|---------|
| `invoiced` | Invoice created, awaiting dispatch |
| `dispatched` | Goods shipped, in transit |
| `delivered` | Goods received, GRN recorded |

### View Dispatch/GRN Messages (via Message Thread)

```
GET /api/orders/:id/messages
```

**Filter for logistics messages:**
- Type `dispatch` -- Dispatch details from supplier
- Type `grn` -- Goods receipt from buyer

## Logistics Workflow

```
        invoiced
            │
    [supplier dispatches]
    Records: vehicle number,
    challan no, transporter,
    delivery estimate
            │
            ▼
       dispatched
            │
            │ (goods in transit)
            │
    [buyer receives goods]
    Records: receipt date,
    condition, quantity check,
    remarks
            │
            ▼
       delivered
            │
            ▼
    (QC Inspection follows
     via Quality Control skill)
```

## Delivery Challan Contents

When a supplier records dispatch, the following information should be captured:

| Field | Description | Example |
|-------|-------------|---------|
| Vehicle Number | Transport vehicle registration | JH05AB1234 |
| Challan Number | Delivery challan reference | DC-2024-0456 |
| Transporter Name | Transport company | Shree Balaji Transport |
| Dispatch Date | Date of dispatch | 2024-06-18 |
| Expected Delivery | Estimated arrival | 3-5 days |
| Items Description | What's being shipped | 5x 10-Wheeler Tipper Body |

## GRN (Goods Receipt Note) Contents

When a buyer records goods receipt:

| Field | Description | Example |
|-------|-------------|---------|
| Receipt Date | Date goods were received | 2024-06-20 |
| Condition | Overall condition assessment | Good / Damaged / Partial |
| Quantity Received | Number of units received | 5 out of 5 |
| Packaging Status | Condition of packaging | Intact / Damaged |
| Remarks | Observations and notes | Minor surface scratches on unit #3 |
| Discrepancies | Any mismatches | None / Short delivery / Wrong specs |

## Business Rules

| Rule | Description |
|------|-------------|
| Supplier dispatches | Only the supplier can record dispatch |
| Buyer receives | Only the buyer can record GRN |
| Invoice before dispatch | Goods can only be dispatched after invoice is created |
| Dispatch before GRN | GRN can only be recorded after dispatch |
| Sequential flow | `invoiced` --> `dispatched` --> `delivered` (no skipping) |
| Single dispatch | Only one dispatch record per order |
| Single GRN | Only one GRN per order |
| All details in message | Vehicle, challan, transporter details are in the message text |

## Data Models

### Logistics-Related Message Types

| Type | Sender | Fields Used | Description |
|------|--------|------------|-------------|
| `dispatch` | Supplier | `message`, `delivery_estimate` | Dispatch notification with transport details |
| `grn` | Buyer | `message` | Goods receipt acknowledgment |

### Order Status Transitions (Logistics Scope)

| From | To | Actor | Trigger |
|------|----|-------|---------|
| `invoiced` | `dispatched` | Supplier | Sends dispatch message |
| `dispatched` | `delivered` | Buyer | Sends GRN message |

## Example Prompts

- "Dispatch order ORD-1716000000. Vehicle JH05AB1234, Challan DC-2024-0456, Transporter: Shree Balaji"
- "Record goods received for order ORD-1716000000. All units in good condition."
- "What's the delivery status of my order?"
- "When was order ORD-1716000000 dispatched?"
- "Show me the dispatch details for this order"
- "I received the goods today, condition is good, all 5 units received"
- "Which transporter is carrying my order?"
- "Record GRN with remarks: 2 units have minor paint scratches"

## Error Handling

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Not supplier | 403 | Buyer trying to dispatch | Only supplier can dispatch |
| Not buyer | 403 | Supplier trying to record GRN | Only buyer can record GRN |
| Wrong status for dispatch | 400 | Order not at `invoiced` | Create invoice first |
| Wrong status for GRN | 400 | Order not at `dispatched` | Wait for supplier to dispatch |
| Order not found | 404 | Invalid order ID | Verify order ID |
