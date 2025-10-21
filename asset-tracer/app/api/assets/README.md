# Assets API Routes

RESTful API endpoints for managing assets.

## Authentication

All endpoints require authentication via Supabase session. The user's organization_id is automatically extracted from their profile.

## Endpoints

### GET /api/assets

Fetch all assets for the authenticated user's organization.

**Response:**
```json
{
  "assets": [
    {
      "id": "uuid",
      "organization_id": "org-id",
      "name": "Asset Name",
      "description": "Description",
      "category": "Electronics",
      "purchase_date": "2024-01-15",
      "purchase_cost": 1500,
      "current_value": 1200,
      "status": "active",
      "location": "Office A",
      "serial_number": "SN123",
      "image_url": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not signed in)
- `403` - Forbidden (no organization)
- `500` - Server error

---

### POST /api/assets

Create a new asset.

**Request Body:**
```json
{
  "name": "Dell Laptop",
  "description": "High-performance laptop",
  "category": "Electronics",
  "purchase_date": "2024-01-15",
  "purchase_cost": 1500,
  "current_value": 1200,
  "status": "active",
  "location": "Office Building A",
  "serial_number": "DL123456"
}
```

**Response:**
```json
{
  "asset": {
    "id": "uuid",
    "organization_id": "org-id",
    "name": "Dell Laptop",
    ...
  }
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `500` - Server error

---

### GET /api/assets/[id]

Fetch a single asset by ID.

**Response:**
```json
{
  "asset": {
    "id": "uuid",
    "name": "Asset Name",
    ...
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

---

### PATCH /api/assets/[id]

Update an existing asset (partial update).

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "current_value": 1100,
  "status": "maintenance"
}
```

**Response:**
```json
{
  "asset": {
    "id": "uuid",
    "name": "Updated Name",
    ...
  }
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (no permission)
- `404` - Not found
- `500` - Server error

---

### DELETE /api/assets/[id]

Delete an asset.

**Response:**
```json
{
  "message": "Asset deleted successfully"
}
```

**Status Codes:**
- `200` - Deleted successfully
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

## Validation Rules

### Required Fields (Create):
- `name` - min 2 characters
- `purchase_cost` - number >= 0
- `current_value` - number >= 0
- `status` - enum: 'active', 'maintenance', 'retired', 'sold'

### Optional Fields:
- `description`
- `category`
- `purchase_date`
- `location`
- `serial_number`

## Usage Example

```typescript
// Fetch all assets
const response = await fetch('/api/assets');
const { assets } = await response.json();

// Create asset
const response = await fetch('/api/assets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Asset',
    purchase_cost: 1000,
    current_value: 1000,
    status: 'active',
  }),
});
const { asset } = await response.json();

// Update asset
const response = await fetch(`/api/assets/${assetId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    current_value: 900,
    status: 'maintenance',
  }),
});

// Delete asset
const response = await fetch(`/api/assets/${assetId}`, {
  method: 'DELETE',
});
```

