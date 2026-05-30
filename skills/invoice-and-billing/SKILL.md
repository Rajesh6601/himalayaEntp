# Invoice & Billing Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | Invoice & Billing |
| **Version** | 1.0.0 |
| **Domain** | Financial Documents |
| **Persona** | Supplier (creates), Buyer (views) |
| **Dependencies** | User & Auth, Order Management |

## Description

The Invoice & Billing skill enables suppliers to create GST-compliant tax invoices against Purchase Orders. It handles invoice line items, HSN codes, GST calculations (CGST/SGST for intra-state or IGST for inter-state), PDF generation, and invoice tracking. Buyers can view and download invoice documents.

## Capabilities

| # | Capability | Actor | Description |
|---|-----------|-------|-------------|
| 1 | Create Invoice | Supplier | Generate a tax invoice against a PO |
| 2 | View Invoice Data | Both | Get invoice details as JSON |
| 3 | Download Invoice PDF | Both | Download formatted invoice document |
| 4 | GST Calculation | System | Auto-calculate CGST/SGST or IGST based on place of supply |
| 5 | Invoice Validation | System | Validate invoice total against PO value |

## API Reference

### Create Invoice

```
POST /api/orders/:id/invoice
```

**Authentication:** Required (Supplier only)

**Prerequisites:** Order status must be `in-progress` or `advance_paid`

**Request Body:**
```json
{
  "invoice_date": "2024-06-15",
  "due_date": "2024-07-15",
  "supplier_gstin": "20AABCH1234F1Z5",
  "buyer_gstin": "10AABCK5678G1Z2",
  "hsn_code": "8707",
  "place_of_supply": "Bihar",
  "payment_terms": "50% advance, 50% on delivery after QC",
  "notes": "Invoice for 10-Wheeler Tipper Bodies as per PO",
  "items": [
    {
      "description": "10-Wheeler Tipper Body - 16 cubic meters, High-Tensile Steel",
      "hsn_code": "8707",
      "quantity": 5,
      "unit_price": 300000
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "order_id": "ORD-...",
  "invoice_number": "INV-20240615-001",
  "invoice_date": "2024-06-15",
  "due_date": "2024-07-15",
  "supplier_gstin": "20AABCH1234F1Z5",
  "buyer_gstin": "10AABCK5678G1Z2",
  "hsn_code": "8707",
  "place_of_supply": "Bihar",
  "subtotal": 1500000,
  "cgst_rate": 9,
  "cgst_amount": 135000,
  "sgst_rate": 9,
  "sgst_amount": 135000,
  "igst_rate": 0,
  "igst_amount": 0,
  "total_tax": 270000,
  "grand_total": 1770000,
  "payment_terms": "50% advance, 50% on delivery after QC",
  "notes": "...",
  "status": "draft",
  "items": [...]
}
```

**Effect:** Order status changes to `invoiced`

### Get Invoice Data (JSON)

```
GET /api/orders/:id/invoice-data
```

**Authentication:** Required

**Response:** Same JSON structure as create response

### Download Invoice PDF

```
GET /api/orders/:id/invoice
```

**Authentication:** Required

**Response:** `application/pdf` binary stream

**PDF Contents:**
- Himalaya Enterprises letterhead
- Invoice number, date, and due date
- Supplier details with GSTIN
- Buyer details with GSTIN
- Itemized table:
  - Description, HSN code, quantity, unit price, total
- GST breakdown:
  - Intra-state (Bihar): CGST 9% + SGST 9%
  - Inter-state: IGST 18%
- Subtotal, tax, grand total
- Amount in words (Indian Rupees)
- Payment terms and notes
- Advance received, balance received, outstanding amount
- Signature block

## GST Calculation Logic

```
IF place_of_supply == "Bihar" THEN
    // Intra-state supply (supplier is in Jharkhand/Bihar region)
    CGST Rate = 9%
    SGST Rate = 9%
    CGST Amount = subtotal * 0.09
    SGST Amount = subtotal * 0.09
    IGST Rate = 0%
    IGST Amount = 0
    Total Tax = CGST + SGST
ELSE
    // Inter-state supply
    CGST Rate = 0%
    SGST Rate = 0%
    IGST Rate = 18%
    IGST Amount = subtotal * 0.18
    Total Tax = IGST
END IF

Grand Total = Subtotal + Total Tax
```

## Invoice Workflow

```
Order at "in-progress" or "advance_paid"
         │
         ▼
Supplier fills invoice form:
  - Invoice date & due date
  - GSTIN (supplier & buyer)
  - HSN code (default: 8707 for vehicle bodies)
  - Place of supply (determines GST type)
  - Line items (description, qty, price)
  - Payment terms & notes
         │
         ▼
System validates:
  ✓ Invoice subtotal <= PO value * 1.05 (5% tolerance)
  ✓ No duplicate invoice for this order
  ✓ All required fields present
         │
         ▼
System calculates GST based on place of supply
         │
         ▼
Invoice created → Order status: "invoiced"
         │
         ▼
PDF available for download by both parties
```

## Business Rules

| Rule | Description |
|------|-------------|
| Supplier only | Only the supplier can create invoices |
| One invoice per order | Duplicate invoice creation is rejected |
| PO value validation | Invoice subtotal cannot exceed PO value by more than 5% |
| Auto GST calculation | GST rates auto-applied based on place of supply |
| HSN code required | Default HSN code is 8707 (vehicle bodies and parts) |
| Invoice number format | Auto-generated: `INV-{date}-{sequence}` |
| Status prerequisite | Order must be at `in-progress` or `advance_paid` |
| Status effect | Creating invoice moves order to `invoiced` |
| Payment display | Invoice PDF shows advance received, balance received, and outstanding |

## HSN Code Reference

| HSN Code | Description | Applicable Products |
|----------|-------------|-------------------|
| 8707 | Bodies for motor vehicles | Tippers, trailers, load bodies |
| 8716 | Trailers and semi-trailers | Flatbed trailers, tractor trolleys |
| 7309 | Tanks, vats, reservoirs of iron/steel | Water tankers |
| 8479 | Machines with individual functions | Custom fabrication |

## Data Models

### Invoice

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | string | FK to orders |
| `invoice_number` | string | Unique invoice number |
| `invoice_date` | date | Date of invoice |
| `due_date` | date | Payment due date |
| `supplier_gstin` | string | Supplier's GST number |
| `buyer_gstin` | string | Buyer's GST number |
| `hsn_code` | string | Harmonized System Nomenclature code |
| `place_of_supply` | string | State of supply (determines GST type) |
| `subtotal` | numeric | Sum of all line items |
| `cgst_rate` | numeric | Central GST rate (%) |
| `cgst_amount` | numeric | Central GST amount |
| `sgst_rate` | numeric | State GST rate (%) |
| `sgst_amount` | numeric | State GST amount |
| `igst_rate` | numeric | Integrated GST rate (%) |
| `igst_amount` | numeric | Integrated GST amount |
| `total_tax` | numeric | Total tax amount |
| `grand_total` | numeric | Subtotal + total tax |
| `payment_terms` | text | Payment terms description |
| `notes` | text | Additional notes |
| `status` | enum | `draft`, `sent`, `paid`, `cancelled` |
| `created_by` | UUID | FK to users (supplier) |
| `created_at` | timestamp | Creation time |

### Invoice Item

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `invoice_id` | UUID | FK to invoices |
| `description` | string | Item description |
| `hsn_code` | string | HSN code for this item |
| `quantity` | integer | Quantity |
| `unit_price` | numeric | Price per unit |
| `total` | numeric | quantity * unit_price |

## Example Prompts

- "Create an invoice for order ORD-1716000000"
- "What's the invoice status for my order?"
- "Download the invoice PDF"
- "The place of supply is Maharashtra, calculate GST"
- "What is the HSN code for tipper bodies?"
- "Show me the invoice details for this order"
- "What's the outstanding amount on this invoice?"
- "Generate an invoice with payment terms of NET 30"

## Error Handling

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Not supplier | 403 | Buyer attempting to create invoice | Only supplier can create invoices |
| Duplicate invoice | 409 | Invoice already exists for this order | View existing invoice instead |
| Exceeds PO value | 400 | Invoice subtotal > PO value * 1.05 | Reduce line item quantities or prices |
| Invalid status | 400 | Order not at `in-progress` or `advance_paid` | Wait for order to reach correct status |
| Missing GSTIN | 400 | GSTIN not provided | Include supplier and buyer GSTIN |
| No order found | 404 | Invalid order ID | Verify order exists |
