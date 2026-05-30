# Sourcing Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | Sourcing |
| **Version** | 1.0.0 |
| **Domain** | Strategic Sourcing |
| **Persona** | Buyer |
| **Dependencies** | User & Auth, Catalog Management |

## Description

The Sourcing skill enables buyer agents to discover products, browse the catalog, compare specifications, manage favorites, and create Requests for Quotation (RFQs). This is the entry point of the procurement lifecycle -- where buyers identify what they need and initiate the sourcing process.

## Capabilities

| # | Capability | Description |
|---|-----------|-------------|
| 1 | Browse Catalog | View all products with filtering by category, status, and search |
| 2 | Search Products | Find products by name, specifications, or keywords |
| 3 | Filter by Category | Narrow results to a specific product category |
| 4 | View Product Details | Get full specs, pricing, images, and stock status |
| 5 | Check Stock Availability | See if a product is In Stock, In Production, or Made to Order |
| 6 | Manage Favorites | Save/remove products for later reference |
| 7 | Create Inquiry | Submit a product inquiry with quantity and notes |
| 8 | Create RFQ | Submit a Request for Quotation for custom requirements |
| 9 | Compare Pricing | Review price ranges (min/max) across products |
| 10 | View Categories | List all available product categories |

## Product Categories

| Category ID | Name | Icon | Products |
|-------------|------|------|----------|
| `tippers` | Tippers | Truck icon | 6-Wheeler, 10-Wheeler, 12-Wheeler tipper bodies |
| `trailers` | Trailers | Truck icon | Flatbed, low-bed, skeletal trailers |
| `tracter-trolleys` | Tractor Trolleys | Tractor icon | Agricultural & industrial trolleys |
| `water-tanks` | Water Tankers | Water icon | 5K, 10K, 20K liter tanks |
| `load-body` | Load Body | Ruler icon | Tata 720, Eicher-compatible load bodies |
| `containers` | Containers | Box icon | Standard ISO, skeletal 20/40ft |
| `waste-management` | Waste Management | Recycle icon | Garbage tippers, modular toilets |
| `custom` | Custom Fabrication | Wrench icon | Bespoke body building |

## API Reference

### List Products

```
GET /api/products
```

**Authentication:** Not required (public)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category ID (e.g., `tippers`, `trailers`) |
| `status` | string | Filter by stock status: `available`, `production`, `order` |
| `search` | string | Full-text search on product name and specifications |

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "10-Wheeler Tipper Body",
    "category_id": "tippers",
    "category_name": "Tippers",
    "specs": "16 cubic meters, High-Tensile Steel",
    "description": "Heavy-duty tipper body for mining and construction...",
    "price_min": 285000,
    "price_max": 350000,
    "stock": 5,
    "status": "available",
    "icon": "emoji",
    "images": ["tipper.jpg"],
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Product Detail

```
GET /api/products/:id
```

**Authentication:** Not required (public)

**Response:** Single product object (same schema as above)

### List Categories

```
GET /api/categories
```

**Authentication:** Not required (public)

**Response:**
```json
[
  {
    "id": "tippers",
    "name": "Tippers",
    "description": "Heavy-duty tipper bodies...",
    "icon": "emoji",
    "sort_order": 1
  }
]
```

### List Favorites

```
GET /api/favorites
```

**Authentication:** Required (Buyer)

**Response:**
```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "name": "10-Wheeler Tipper Body",
    "category_id": "tippers",
    "specs": "...",
    "price_min": 285000,
    "price_max": 350000,
    "stock": 5,
    "status": "available",
    "images": ["tipper.jpg"],
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Add to Favorites

```
POST /api/favorites/:productId
```

**Authentication:** Required (Buyer)

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "product_id": "uuid"
}
```

### Remove from Favorites

```
DELETE /api/favorites/:productId
```

**Authentication:** Required (Buyer)

**Response:** `204 No Content`

### Create Inquiry / RFQ

```
POST /api/orders
```

**Authentication:** Required (Buyer)

**Request Body:**
```json
{
  "type": "inquiry",
  "notes": "Need 5 units of 10-Wheeler Tipper Body for mining project",
  "items": [
    {
      "product_id": "uuid",
      "name": "10-Wheeler Tipper Body",
      "category": "Tippers",
      "specs": "16 cubic meters",
      "quantity": 5,
      "price": 285000,
      "price_max": 350000
    }
  ]
}
```

**Type Values:**
- `inquiry` -- General product inquiry
- `rfq` -- Formal Request for Quotation with detailed specs

**Response:**
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

## Workflows

### Workflow 1: Product Discovery

```
1. Agent calls GET /api/categories to list all categories
2. Agent calls GET /api/products?category={id} to browse a category
   OR GET /api/products?search={term} to search across all categories
3. Agent presents results with name, specs, price range, and stock status
4. If buyer wants details, agent calls GET /api/products/:id
5. Agent can save products via POST /api/favorites/:productId
```

### Workflow 2: Create Inquiry

```
1. Buyer identifies products of interest (via discovery workflow)
2. Agent collects: product IDs, quantities, and any special notes
3. Agent calls POST /api/orders with type="inquiry"
4. Order created with status "pending"
5. Agent confirms order ID to buyer for tracking
```

### Workflow 3: Create RFQ

```
1. Buyer describes custom requirements (specs, materials, quantities)
2. Agent structures the items array (product_id can be null for custom items)
3. Agent calls POST /api/orders with type="rfq"
4. Order created with status "pending"
5. Agent confirms RFQ ID to buyer
6. Supplier will respond with a quote (handled by Order Management skill)
```

### Workflow 4: Manage Favorites

```
1. Agent calls GET /api/favorites to list saved products
2. To add: POST /api/favorites/:productId
3. To remove: DELETE /api/favorites/:productId
4. Agent presents updated favorites list
```

## Business Rules

| Rule | Description |
|------|-------------|
| Public catalog | Product browsing does not require authentication |
| Auth for actions | Favorites and order creation require JWT token |
| Buyer role only | Only users with `role=buyer` can create inquiries/RFQs |
| Stock status | `available` = in stock, `production` = being manufactured, `order` = made on demand |
| Price range | Products have min/max price; final price determined during negotiation |
| Unique favorites | A product can only be favorited once per user (duplicate adds are rejected) |
| Order ID format | Inquiries: `ORD-{timestamp}-{random}`, RFQs: `RFQ-{timestamp}-{random}` |

## Data Models

### Product

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | string | Product name |
| `category_id` | string | FK to categories |
| `specs` | string | Technical specifications |
| `description` | text | Full description |
| `price_min` | numeric | Minimum price (INR) |
| `price_max` | numeric | Maximum price (INR) |
| `stock` | integer | Available quantity |
| `status` | enum | `available`, `production`, `order` |
| `images` | JSONB | Array of image filenames |

### Favorite

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `product_id` | UUID | FK to products |
| `created_at` | timestamp | When favorited |

## Example Prompts

These are natural language prompts a user might give to an agent using this skill:

- "Show me all tipper bodies available"
- "Search for water tanks with 10,000 liter capacity"
- "What products do you have in the trailer category?"
- "Save the 40ft flatbed trailer to my favorites"
- "I need a quote for 3 units of 12-Wheeler Tipper Body"
- "Create an RFQ for a custom garbage tipper with 8 cubic meter capacity"
- "What's the price range for container bodies?"
- "Show me my saved products"
- "Which products are currently in stock?"
- "Remove the tractor trolley from my favorites"

## Error Handling

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Unauthorized | 401 | Missing or expired JWT | Re-authenticate via `/api/auth/login` |
| Product not found | 404 | Invalid product ID | Verify product ID from catalog |
| Already favorited | 409 | Duplicate favorite add | Product already in favorites, no action needed |
| Validation error | 400 | Missing required fields in order | Ensure `type`, `items` array with at least one item |
