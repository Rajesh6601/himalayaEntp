# Catalog Management Skill

## Metadata

| Field | Value |
|-------|-------|
| **Name** | Catalog Management |
| **Version** | 1.0.0 |
| **Domain** | Product Catalog |
| **Persona** | Supplier |
| **Dependencies** | User & Auth |

## Description

The Catalog Management skill enables suppliers to manage the product catalog. This includes creating new products, editing existing product details, updating stock levels, managing product images, and deleting products. The catalog is the foundation that the Sourcing skill reads from -- this skill is its write-side counterpart.

## Capabilities

| # | Capability | Description |
|---|-----------|-------------|
| 1 | Create Product | Add a new product to the catalog |
| 2 | Update Product | Edit product details (name, specs, price, description) |
| 3 | Update Stock | Change stock quantity and availability status |
| 4 | Delete Product | Remove a product from the catalog |
| 5 | List Products | View all products (with filters) |
| 6 | View Categories | List available product categories |

## API Reference

### Create Product

```
POST /api/products
```

**Authentication:** Required (Supplier only)

**Request Body:**
```json
{
  "name": "24 Cum Tipper Body",
  "category_id": "tippers",
  "specs": "24 cubic meters, Hardox 450 Steel, 10mm floor plate",
  "description": "Extra-large capacity tipper body designed for mining operations. Features Hardox 450 wear-resistant steel floor plates, reinforced side walls, and heavy-duty hydraulic tipping mechanism. Suitable for 12-wheeler chassis (Tata/Ashok Leyland).",
  "price_min": 420000,
  "price_max": 520000,
  "stock": 2,
  "status": "available",
  "images": ["tipper-24cum.jpg"]
}
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Product display name |
| `category_id` | string | Yes | Must match an existing category ID |
| `specs` | string | Yes | Technical specifications (capacity, material, dimensions) |
| `description` | text | No | Detailed product description |
| `price_min` | numeric | Yes | Minimum price in INR |
| `price_max` | numeric | Yes | Maximum price in INR |
| `stock` | integer | Yes | Available quantity |
| `status` | enum | Yes | `available`, `production`, `order` |
| `images` | JSONB | No | Array of image filenames |

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "24 Cum Tipper Body",
  "category_id": "tippers",
  "specs": "24 cubic meters, Hardox 450 Steel",
  "description": "...",
  "price_min": 420000,
  "price_max": 520000,
  "stock": 2,
  "status": "available",
  "images": ["tipper-24cum.jpg"],
  "created_by": "uuid",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Update Product

```
PUT /api/products/:id
```

**Authentication:** Required (Supplier only)

**Request Body:** Same schema as create (all fields)

**Response:** Updated product object

### Update Stock

```
PATCH /api/products/:id/stock
```

**Authentication:** Required (Supplier only)

**Request Body:**
```json
{
  "stock": 10,
  "status": "available"
}
```

**Status Values:**

| Value | Meaning | When to Use |
|-------|---------|-------------|
| `available` | In stock, ready for delivery | `stock > 0` and units are complete |
| `production` | Currently being manufactured | Units are on the production line |
| `order` | Made to order | No stock, built on demand |

**Response:** Updated product object

### Delete Product

```
DELETE /api/products/:id
```

**Authentication:** Required (Supplier only)

**Response:** `204 No Content`

### List Products

```
GET /api/products
```

**Authentication:** Not required (public)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category ID |
| `status` | string | Filter by stock status |
| `search` | string | Full-text search on name and specs |

**Response:** Array of product objects

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
    "description": "Heavy-duty tipper bodies for mining and construction",
    "icon": "emoji",
    "sort_order": 1
  }
]
```

## Available Categories

| ID | Name | Description | Sort Order |
|----|------|-------------|------------|
| `tippers` | Tippers | Heavy-duty tipper bodies for mining, construction, and transportation | 1 |
| `trailers` | Trailers | Flatbed, low-bed, and skeletal trailers for logistics | 2 |
| `tracter-trolleys` | Tractor Trolleys | Agricultural and industrial tractor trolley bodies | 3 |
| `water-tanks` | Water Tankers | Industrial water storage and transport tanks | 4 |
| `load-body` | Load Body | Goods transport bodies for commercial vehicles | 5 |
| `containers` | Containers | Container body fabrication and fittings | 6 |
| `waste-management` | Waste Management | Garbage collection and waste management bodies | 7 |
| `custom` | Custom Fabrication | Bespoke automobile body building to specification | 8 |

## Product Management Workflows

### Workflow 1: Add New Product

```
1. Agent calls GET /api/categories to list valid categories
2. Agent collects product details from supplier:
   - Name, category, specifications
   - Price range (min/max in INR)
   - Stock quantity and availability status
   - Description and images (optional)
3. Agent validates:
   - category_id matches a valid category
   - price_min <= price_max
   - stock >= 0
   - status is valid enum value
4. Agent calls POST /api/products
5. Product is now visible in catalog
```

### Workflow 2: Update Stock

```
1. Agent calls GET /api/products to list supplier's products
2. Agent identifies which product to update
3. Agent calls PATCH /api/products/:id/stock with new stock and status
4. Common scenarios:
   - New production batch completed: stock += batch_size, status = "available"
   - Stock depleted: stock = 0, status = "order"
   - Production started: status = "production"
```

### Workflow 3: Edit Product Details

```
1. Agent calls GET /api/products/:id to get current details
2. Agent collects changes from supplier
3. Agent calls PUT /api/products/:id with updated fields
4. Product details updated in catalog
```

### Workflow 4: Remove Product

```
1. Agent calls GET /api/products/:id to verify product exists
2. Agent confirms deletion with supplier (destructive action)
3. Agent calls DELETE /api/products/:id
4. Product removed from catalog
   Note: Existing orders referencing this product are not affected
```

## Business Rules

| Rule | Description |
|------|-------------|
| Supplier only | All write operations require supplier role |
| Valid category | `category_id` must match an existing category |
| Price range | `price_min` must be <= `price_max` |
| Non-negative stock | Stock quantity cannot be negative |
| Valid status | Status must be `available`, `production`, or `order` |
| Catalog is public | Any user (or guest) can read the catalog |
| Images as JSONB | Images stored as JSON array of filenames |
| Full-text search | Product search uses PostgreSQL full-text search on name + specs |
| Orders preserved | Deleting a product does not affect existing orders |
| Created_by tracking | Each product records which supplier created it |

## Data Models

### Product

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | string | Product display name |
| `category_id` | string | FK to categories table |
| `specs` | string | Technical specifications |
| `description` | text | Full product description |
| `price_min` | numeric | Minimum price in INR |
| `price_max` | numeric | Maximum price in INR |
| `stock` | integer | Available quantity |
| `status` | enum | `available`, `production`, `order` |
| `icon` | string | Emoji icon |
| `images` | JSONB | Array of image filenames |
| `created_by` | UUID | FK to users (supplier who created) |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

### Category

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key (e.g., `tippers`) |
| `name` | string | Display name |
| `description` | text | Category description |
| `icon` | string | Emoji icon |
| `sort_order` | integer | Display order |

## Example Prompts

- "Add a new 24 Cum tipper body to the catalog"
- "Update the stock of 10-Wheeler Tipper Body to 8 units"
- "Change the price range of the flatbed trailer to 6-8 lakhs"
- "Mark the tractor trolley as 'in production'"
- "Delete the old hydraulic tipper kit from the catalog"
- "What products do we have in the water tanks category?"
- "Set all container bodies to 'made to order'"
- "Add a new custom fabrication product for concrete mixer body"
- "List all products with zero stock"
- "Update the specifications for the 5000L water tank"

## Error Handling

| Error | HTTP Code | Cause | Resolution |
|-------|-----------|-------|------------|
| Not supplier | 403 | Non-supplier trying to create/edit | Only suppliers manage catalog |
| Invalid category | 400 | category_id doesn't match any category | Use `GET /api/categories` to get valid IDs |
| Product not found | 404 | Invalid product ID on update/delete | Verify product exists |
| Validation error | 400 | Missing required fields or invalid values | Check field requirements above |
| Duplicate name | 409 | Product with same name already exists | Use a unique product name |
