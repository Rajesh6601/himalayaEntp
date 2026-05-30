# Himalaya Enterprises - Skills Registry

> Modular, agent-ready skills for B2B manufacturing procurement workflows.
> Each skill is self-contained and can be used independently by AI agents, automation tools, or integrated into external portals.

## What Are Skills?

Skills are structured instruction sets that tell an AI agent **what it can do**, **which APIs to call**, **what business rules to follow**, and **how workflows progress**. Each skill maps to a specific business domain in the Procure-to-Pay lifecycle.

## Available Skills

| # | Skill | Domain | Directory | Persona |
|---|-------|--------|-----------|---------|
| 1 | [Sourcing](./sourcing/SKILL.md) | Strategic Sourcing | `skills/sourcing/` | Buyer |
| 2 | [Procure to Pay](./procure-to-pay/SKILL.md) | End-to-End P2P | `skills/procure-to-pay/` | Buyer + Supplier |
| 3 | [Order Management](./order-management/SKILL.md) | Order Lifecycle | `skills/order-management/` | Buyer + Supplier |
| 4 | [Invoice & Billing](./invoice-and-billing/SKILL.md) | Financial Documents | `skills/invoice-and-billing/` | Supplier |
| 5 | [Payment Management](./payment-management/SKILL.md) | Payment Lifecycle | `skills/payment-management/` | Buyer + Supplier |
| 6 | [Logistics & Delivery](./logistics-and-delivery/SKILL.md) | Fulfillment | `skills/logistics-and-delivery/` | Supplier + Buyer |
| 7 | [Quality Control](./quality-control/SKILL.md) | Inspection & QC | `skills/quality-control/` | Buyer |
| 8 | [Catalog Management](./catalog-management/SKILL.md) | Product Catalog | `skills/catalog-management/` | Supplier |
| 9 | [User & Authentication](./user-and-auth/SKILL.md) | Identity & Access | `skills/user-and-auth/` | System |

## Skill Dependency Map

```
                    ┌──────────────────┐
                    │  User & Auth     │
                    │  (Identity)      │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Catalog    │  │  Sourcing    │  │  Order       │
    │  Management │◄─│  (Discovery) │─►│  Management  │
    └─────────────┘  └──────────────┘  └──────┬───────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
                  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                  │  Invoice &   │   │  Payment     │   │  Logistics & │
                  │  Billing     │   │  Management  │   │  Delivery    │
                  └──────────────┘   └──────────────┘   └──────┬───────┘
                                                               │
                                                               ▼
                                                      ┌──────────────┐
                                                      │  Quality     │
                                                      │  Control     │
                                                      └──────────────┘

                  ┌─────────────────────────────────────────────────┐
                  │          Procure to Pay (P2P)                   │
                  │  Orchestrates all skills end-to-end             │
                  └─────────────────────────────────────────────────┘
```

## How to Use a Skill

### For AI Agents
1. Read the skill's `SKILL.md` file
2. The file contains: metadata, capabilities, API endpoints, workflows, business rules, and example prompts
3. The agent uses the skill to understand what actions to take and which APIs to call

### For Portal Integration
Each skill exposes:
- **API Endpoints** with request/response schemas
- **State Machines** with valid transitions
- **Business Rules** for validation
- **Example Prompts** for natural language interfaces

### For Community Contributors
1. Fork the repository
2. Create a new skill directory under `skills/`
3. Follow the skill template structure (see any existing skill as reference)
4. Submit a pull request

## Skill File Structure

Each skill follows this template:

```
skills/<skill-name>/
└── SKILL.md
    ├── Metadata (name, version, domain, personas)
    ├── Description
    ├── Capabilities
    ├── API Reference (endpoints, methods, auth, request/response)
    ├── Workflows (step-by-step procedures)
    ├── State Machine (status transitions, if applicable)
    ├── Business Rules (validations, constraints)
    ├── Data Models (relevant schemas)
    ├── Example Prompts (how users invoke this skill)
    └── Error Handling (common errors and resolutions)
```

## Base URL & Authentication

All skills use the same base configuration:

| Setting | Value |
|---------|-------|
| Base URL | `http://localhost:8080/api` (or deployed URL) |
| Auth | JWT Bearer token in `Authorization` header |
| Content-Type | `application/json` |
| Token Expiry | 24 hours |
| Obtain Token | `POST /api/auth/login` with `{ email, password }` |

## Industry Context

These skills are designed for **B2B manufacturing procurement** in the Indian automobile body manufacturing industry. Key domain specifics:
- Currency: INR (Indian Rupees) with Indian numbering format (1,23,456)
- Tax: GST with CGST/SGST (intra-state) or IGST (inter-state)
- Documents: Purchase Orders, Tax Invoices, Delivery Challans, GRN, QC Reports
- Payment terms: Typically 50% advance, 50% on delivery after QC

## License

These skills are open for community use. See the main repository LICENSE for details.
