# Quality Control Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | Quality Control |
| **Version** | 1.0.0 |
| **Domain** | Inspection & Quality Assurance |
| **Persona** | Buyer (inspects) + Supplier (responds to disputes) |
| **Dependencies** | User & Auth, Order Management, Logistics & Delivery |

## Description

The Quality Control skill handles post-delivery quality inspection, approval/rejection decisions, and dispute resolution. After goods are received (GRN recorded), the buyer performs a QC inspection and either approves or rejects the goods. Rejection triggers a dispute workflow where the supplier must respond. QC approval is a prerequisite for balance payment.

## Capabilities

| # | Capability | Actor | Description |
|---|-----------|-------|-------------|
| 1 | Approve QC | Buyer | Mark goods as passing quality inspection |
| 2 | Reject QC | Buyer | Reject goods with detailed remarks |
| 3 | Respond to Dispute | Supplier | Address buyer's QC rejection |
| 4 | View QC Status | Both | Check inspection results |

## API Reference

### Approve QC Inspection

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Buyer)

**Prerequisites:** Order status must be `delivered`

**Request Body:**
```json
{
  "type": "qc_approved",
  "message": "Quality inspection passed. All 5 tipper bodies meet specifications. Dimensions verified, weld quality satisfactory, paint finish acceptable, hydraulic systems tested and operational."
}
```

**Recommended message format:**
The QC approval message should cover the inspection points:
- **Dimensional Check** -- Verify body dimensions match specifications
- **Weld Quality** -- Visual and structural weld inspection
- **Paint & Finish** -- Surface quality, anti-rust coating, color match
- **Hydraulic Systems** -- Functional test of hydraulic mechanisms
- **Overall Verdict** -- Summary assessment

**Effect:**
- Order status changes to `qc_approved`
- Enables balance payment (handled by Payment Management skill)

### Reject QC Inspection

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Buyer)

**Prerequisites:** Order status must be `delivered`

**Request Body:**
```json
{
  "type": "qc_rejected",
  "message": "Quality inspection failed. Issues found: (1) Unit #2 has weld cracks on the left side panel, (2) Unit #4 hydraulic cylinder leaking, (3) Paint bubbling on unit #1 rear panel. Requesting immediate rectification or replacement."
}
```

**Recommended message format:**
The rejection message should detail:
- **Issue List** -- Numbered list of defects found
- **Affected Units** -- Which specific units/items have issues
- **Severity** -- Critical / Major / Minor classification
- **Expected Resolution** -- Rectification, replacement, or credit request

**Effect:**
- Order status changes to `disputed`
- Supplier must respond with a dispute resolution

### Respond to Dispute (Supplier)

```
POST /api/orders/:id/messages
```

**Authentication:** Required (Supplier)

**Prerequisites:** Order status must be `disputed`

**Request Body:**
```json
{
  "type": "dispute_response",
  "message": "We acknowledge the issues reported. Resolution plan: (1) Unit #2 weld will be repaired on-site within 3 days, (2) Unit #4 hydraulic cylinder will be replaced, (3) Unit #1 will be repainted. Our QC team will visit your site on 25-Jun-2024."
}
```

**Recommended message format:**
The dispute response should include:
- **Acknowledgment** -- Recognize the reported issues
- **Resolution Plan** -- Specific actions for each defect
- **Timeline** -- When each fix will be completed
- **On-site Visit** -- If applicable, when the team will visit

**Effect:**
- Adds the response to the message thread
- Buyer and supplier continue discussion until resolution
- Once resolved, buyer can re-approve QC

## QC Workflow

```
          delivered
              │
      [buyer inspects goods]
              │
        ┌─────┴─────┐
        │            │
   [approve]    [reject]
        │            │
        ▼            ▼
   qc_approved    disputed
        │            │
        │    [supplier responds]
        │            │
        │            ▼
        │    dispute_response
        │            │
        │    [resolution reached]
        │            │
        │    [buyer re-inspects]
        │            │
        │            ├── [approve] ──► qc_approved
        │            └── [reject]  ──► disputed (cycle)
        │
        ▼
  (balance payment)
  via Payment Mgmt skill
```

## QC Inspection Checklist

For automobile bodies manufactured by Himalaya Enterprises, the following inspection points apply:

### Structural Inspection

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| Body dimensions | Length, width, height measurements | Within +/- 5mm of specification |
| Frame alignment | Chassis mounting points | Properly aligned, no deviation |
| Load capacity | Weight-bearing capability | Meets rated capacity |
| Ground clearance | Minimum clearance check | Per vehicle specification |

### Weld Quality

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| Visual inspection | Surface weld appearance | No cracks, porosity, or undercut |
| Structural welds | Load-bearing joint integrity | Full penetration, no defects |
| Corner joints | Box section joint quality | Proper fusion, no gaps |
| Reinforcements | Side wall and floor reinforcements | Correct placement, solid welds |

### Surface & Finish

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| Paint quality | Uniform coverage, no runs/sags | Even finish, no bare spots |
| Anti-rust coating | Primer and undercoat | Full coverage on underside |
| Surface defects | Dents, scratches, deformations | No visible defects |
| Color match | Color consistency | Matches RAL/specified code |

### Mechanical Systems

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| Hydraulic lift | Tipping mechanism operation | Smooth lift and lower |
| Cylinder test | Hydraulic cylinder pressure | No leaks under rated pressure |
| Hinge points | Tipping pivot points | Free movement, proper lubrication |
| Locking mechanism | Body latch/lock system | Secure engagement |

### Safety & Compliance

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| Reflectors | Mandatory reflectors in position | Per CMVR norms |
| Mud flaps | Rear mud flap installation | Properly fitted |
| Sharp edges | No exposed sharp edges | Rounded or covered |
| Documentation | Certification papers | ISO/AIS-113 compliance |

## Business Rules

| Rule | Description |
|------|-------------|
| Buyer inspects | Only the buyer can approve or reject QC |
| Supplier responds | Only the supplier can respond to disputes |
| GRN required first | QC can only be performed after goods are received (GRN recorded) |
| QC before payment | Balance payment requires QC approval |
| Dispute cycle | Rejected items enter a dispute cycle until resolved |
| Re-inspection | After dispute resolution, buyer can re-inspect and approve/reject again |
| Detailed remarks | QC messages should include specific defects and affected units |
| Single QC per delivery | One QC decision per delivery (approve or reject) |

## Data Models

### QC-Related Message Types

| Type | Sender | Fields Used | Description |
|------|--------|------------|-------------|
| `qc_approved` | Buyer | `message` | QC inspection passed |
| `qc_rejected` | Buyer | `message` | QC inspection failed with defect details |
| `dispute_response` | Supplier | `message` | Supplier's response to QC rejection |

### Order Status Transitions (QC Scope)

| From | To | Actor | Trigger |
|------|----|-------|---------|
| `delivered` | `qc_approved` | Buyer | Sends QC approved message |
| `delivered` | `disputed` | Buyer | Sends QC rejected message |
| `disputed` | `disputed` | Supplier | Sends dispute response (status unchanged) |
| `disputed` | `qc_approved` | Buyer | Re-approves after dispute resolution |

## Example Prompts

- "Approve QC for order ORD-1716000000. All items pass inspection."
- "Reject QC. Unit #2 has weld cracks and unit #4 has hydraulic leak."
- "What's the QC status of my order?"
- "Respond to the QC dispute on order ORD-1716000000"
- "The buyer rejected the goods. What issues did they find?"
- "All issues have been fixed. Can the buyer re-inspect?"
- "Show me the QC inspection history for this order"
- "The hydraulic system on unit #3 failed pressure test. Reject QC."

## Error Handling

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Not buyer | 403 | Supplier trying to approve/reject QC | Only buyer inspects |
| Not supplier | 403 | Buyer trying to respond to dispute | Only supplier responds to disputes |
| Wrong status for QC | 400 | Order not at `delivered` | Record GRN first |
| Wrong status for dispute response | 400 | Order not at `disputed` | QC must be rejected first |
| Order not found | 404 | Invalid order ID | Verify order ID |
