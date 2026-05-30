# Procure to Pay (P2P) Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | Procure to Pay |
| **Version** | 1.0.0 |
| **Domain** | End-to-End Procurement |
| **Persona** | Buyer + Supplier |
| **Dependencies** | All other skills (orchestrator) |

## Description

The Procure to Pay (P2P) skill is the **orchestrator skill** that ties the entire procurement lifecycle together. It guides agents through the complete journey from sourcing a product to final payment completion. Rather than duplicating the detailed API specs of individual skills, this skill defines the end-to-end workflow, phase transitions, and how individual skills connect.

Use this skill when the user needs guidance across the full procurement lifecycle rather than a single domain-specific action.

## The P2P Lifecycle

```
PHASE 1: SOURCING          PHASE 2: NEGOTIATION         PHASE 3: CONTRACTING
───────────────────         ────────────────────         ────────────────────
Browse Catalog              Supplier Sends Quote         Buyer Accepts Quote
Search Products      ──►    Buyer Counter-Offers   ──►   Purchase Order Issued
Create Inquiry/RFQ          Price Negotiation             PO PDF Generated
                            Agreement Reached

PHASE 4: PAYMENT            PHASE 5: FULFILLMENT         PHASE 6: CLOSURE
───────────────────         ────────────────────         ────────────────────
Advance Payment             Invoice Created              Goods Received (GRN)
Supplier Confirms    ──►    Goods Dispatched       ──►   QC Inspection
Payment Tracking            Delivery Challan             Balance Payment
                                                         Order Completed
```

## Phase Details

### Phase 1: Sourcing
**Skill Used:** [Sourcing](../sourcing/SKILL.md)

| Step | Actor | Action | API |
|------|-------|--------|-----|
| 1.1 | Buyer | Browse product catalog | `GET /api/products` |
| 1.2 | Buyer | Search and filter products | `GET /api/products?search=&category=` |
| 1.3 | Buyer | View product details | `GET /api/products/:id` |
| 1.4 | Buyer | Save favorites | `POST /api/favorites/:productId` |
| 1.5 | Buyer | Create Inquiry or RFQ | `POST /api/orders` |

**Exit Criteria:** Order created with status `pending`

### Phase 2: Negotiation
**Skill Used:** [Order Management](../order-management/SKILL.md)

| Step | Actor | Action | API |
|------|-------|--------|-----|
| 2.1 | Supplier | Review incoming inquiry | `GET /api/orders/:id` |
| 2.2 | Supplier | Send quote with price | `POST /api/orders/:id/messages` (type: `quote`) |
| 2.3 | Buyer | Review quote | `GET /api/orders/:id/messages` |
| 2.4 | Buyer | Accept OR counter-offer | `POST /api/orders/:id/messages` (type: `acceptance` or `counter_offer`) |
| 2.5 | Supplier | Accept counter OR re-quote | `POST /api/orders/:id/messages` |
| 2.6 | -- | Repeat 2.3-2.5 until agreement | -- |

**Status Flow:** `pending` --> `quoted` --> `negotiating` --> `accepted`

**Exit Criteria:** Order status is `accepted`

### Phase 3: Contracting
**Skill Used:** [Order Management](../order-management/SKILL.md)

| Step | Actor | Action | API |
|------|-------|--------|-----|
| 3.1 | Buyer | Issue Purchase Order | `PATCH /api/orders/:id/status` (status: `po_issued`) |
| 3.2 | Either | Download PO PDF | `GET /api/orders/:id/po` |

**Status Flow:** `accepted` --> `po_issued`

**Exit Criteria:** PO issued and PDF available

### Phase 4: Advance Payment
**Skill Used:** [Payment Management](../payment-management/SKILL.md)

| Step | Actor | Action | API |
|------|-------|--------|-----|
| 4.1 | Buyer | Record advance payment | `POST /api/orders/:id/messages` (type: `advance_payment`) |
| 4.2 | Supplier | Confirm or dispute advance | `POST /api/orders/:id/messages` (type: `advance_payment_confirmed` or `advance_payment_disputed`) |

**Status Flow:** `po_issued` --> `advance_paid`

**If Disputed:** Status becomes `payment_disputed`, buyer re-records payment

**Exit Criteria:** Advance payment confirmed by supplier

### Phase 5: Fulfillment
**Skills Used:** [Invoice & Billing](../invoice-and-billing/SKILL.md) + [Logistics & Delivery](../logistics-and-delivery/SKILL.md)

| Step | Actor | Action | API |
|------|-------|--------|-----|
| 5.1 | Supplier | Start manufacturing | `PATCH /api/orders/:id/status` (status: `in-progress`) |
| 5.2 | Supplier | Create invoice | `POST /api/orders/:id/invoice` |
| 5.3 | Supplier | Record dispatch | `POST /api/orders/:id/messages` (type: `dispatch`) |

**Status Flow:** `advance_paid` --> `in-progress` --> `invoiced` --> `dispatched`

**Exit Criteria:** Goods dispatched with challan details

### Phase 6: Receipt, QC & Closure
**Skills Used:** [Logistics & Delivery](../logistics-and-delivery/SKILL.md) + [Quality Control](../quality-control/SKILL.md) + [Payment Management](../payment-management/SKILL.md)

| Step | Actor | Action | API |
|------|-------|--------|-----|
| 6.1 | Buyer | Record goods receipt (GRN) | `POST /api/orders/:id/messages` (type: `grn`) |
| 6.2 | Buyer | Perform QC inspection | `POST /api/orders/:id/messages` (type: `qc_approved` or `qc_rejected`) |
| 6.3 | Buyer | Record balance payment | `POST /api/orders/:id/messages` (type: `balance_payment`) |
| 6.4 | Supplier | Confirm balance payment | `POST /api/orders/:id/messages` (type: `balance_payment_confirmed`) |
| 6.5 | System | Auto-complete if fully paid | Status --> `completed` |

**Status Flow:** `dispatched` --> `delivered` --> `qc_approved` --> `completed`

**If QC Rejected:** Status becomes `disputed`, supplier responds with `dispute_response`

**Exit Criteria:** Order status is `completed`

## Complete Status Machine

```
pending ──[quote]──► quoted ──[counter_offer]──► negotiating
                       │                              │
                       └──[acceptance]──► accepted ◄──┘
                                            │
                                      [issue PO]
                                            │
                                            ▼
                                       po_issued
                                            │
                                    [advance_payment]
                                            │
                                            ▼
                                      advance_paid
                                       │         │
                              [confirmed]       [disputed]
                                  │                 │
                                  ▼                 ▼
                             in-progress     payment_disputed
                                  │                 │
                            [invoice]          [re-record]
                                  │                 │
                                  ▼                 └──► advance_paid
                             invoiced
                                  │
                            [dispatch]
                                  │
                                  ▼
                            dispatched
                                  │
                              [grn]
                                  │
                                  ▼
                            delivered
                               │    │
                       [qc_pass]    [qc_fail]
                          │              │
                          ▼              ▼
                    qc_approved      disputed
                       │                │
                [balance_payment]  [dispute_response]
                       │
                       ▼
                 [supplier confirms]
                    │         │
              [fully paid] [partial]
                  │            │
                  ▼            └──► qc_approved (pay more)
              completed
```

## Key Documents Generated

| Document | Phase | Generated By | Format |
|----------|-------|-------------|--------|
| Purchase Order | Contracting | System | PDF |
| Tax Invoice | Fulfillment | Supplier | PDF |
| Delivery Challan | Fulfillment | Supplier (recorded) | Data |
| Goods Receipt Note | Closure | Buyer (recorded) | Data |
| QC Report | Closure | Buyer (recorded) | Data |
| Payment Receipt | Closure | System | Data |

## Business Rules

| Rule | Description |
|------|-------------|
| Sequential phases | Each phase must complete before the next begins |
| Role enforcement | Buyers and suppliers can only perform actions assigned to their role |
| Price negotiation | Final price must be agreed during negotiation before PO |
| Two-step payments | All payments require buyer recording + supplier confirmation |
| QC before balance | Balance payment only allowed after QC approval |
| Auto-completion | Order completes when total payments >= 99% of total due |
| Invoice validation | Invoice subtotal cannot exceed PO value by more than 5% |
| GST compliance | All invoices must include GST breakdown (CGST+SGST or IGST) |
| Payment terms | Default: 50% advance on PO, 50% balance after QC |

## Example Prompts

These are high-level prompts that span the full P2P lifecycle:

- "I want to procure 5 tipper bodies. Walk me through the process."
- "What's the status of my order ORD-1716000000? What's the next step?"
- "My order is at PO issued stage. What do I do next?"
- "The supplier quoted 3.5 lakhs but I want to negotiate to 3 lakhs."
- "I received the goods. What are the next steps to close this order?"
- "Show me the complete procurement timeline for order RFQ-1716000000."
- "What payments are pending on my orders?"
- "Guide me through creating a purchase from start to finish."

## Cross-Skill Orchestration

When an agent receives a P2P request, it should:

1. **Identify the current phase** by checking order status via `GET /api/orders/:id`
2. **Route to the appropriate skill** based on the phase
3. **Execute the next action** using the specific skill's API reference
4. **Advance to the next phase** when exit criteria are met
5. **Report progress** to the user with current status and next steps

| Current Status | Phase | Next Action | Skill to Use |
|---------------|-------|-------------|-------------|
| (no order) | Sourcing | Browse/search/create inquiry | Sourcing |
| `pending` | Negotiation | Wait for supplier quote | Order Management |
| `quoted` | Negotiation | Accept or counter-offer | Order Management |
| `negotiating` | Negotiation | Continue negotiation | Order Management |
| `accepted` | Contracting | Issue Purchase Order | Order Management |
| `po_issued` | Payment | Record advance payment | Payment Management |
| `advance_paid` | Fulfillment | Wait for manufacturing | Invoice & Billing |
| `in-progress` | Fulfillment | Wait for invoice | Invoice & Billing |
| `invoiced` | Fulfillment | Wait for dispatch | Logistics & Delivery |
| `dispatched` | Closure | Record GRN | Logistics & Delivery |
| `delivered` | Closure | Perform QC inspection | Quality Control |
| `qc_approved` | Closure | Record balance payment | Payment Management |
| `completed` | Done | No action needed | -- |
| `disputed` | Closure | Wait for supplier response | Quality Control |
| `payment_disputed` | Payment | Re-record payment | Payment Management |
