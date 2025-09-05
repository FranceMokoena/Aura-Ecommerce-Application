# 🏪 SHOP MANAGER PRODUCT API - COMPLETE DOCUMENTATION

## 🚨 CRITICAL: MOBILE APP PRODUCT DISPLAY ISSUE

**PROBLEM IDENTIFIED:** The mobile app's `home.tsx` displays products from the **REGULAR PRODUCTS API** (`/api/products`), NOT the shop products API (`/api/shop-products`). 

**SOLUTION:** When creating products in the desktop app, you must use the **REGULAR PRODUCTS API** to ensure they appear in the mobile app's home screen.

---

## 📱 MOBILE APP API ENDPOINTS (ALL ENDPOINTS USED)

### **Base URL:** `http://192.168.1.104:5000/api`

---

## 🛍️ **REGULAR PRODUCTS API** (DISPLAYS IN MOBILE APP HOME)

### **Base URL:** `/api/products`

**⚠️ IMPORTANT:** These are the products that appear in the mobile app's home.tsx screen!

---

### **1. GET ALL PRODUCTS (FOR CUSTOMERS)**
```
GET /api/products
```
**Used by:** Mobile app home.tsx to display products

**Query Parameters:**
- `category` - Filter by category
- `search` - Search in name and description
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `location` - Location filter

**Response:**
```json
[
  {
    "_id": "product_id",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "quantity": 50,
    "category": "electronics",
    "images": ["image_urls"],
    "status": "active",
    "sellerId": {
      "_id": "seller_id",
      "name": "Seller Name",
      "location": "Seller Location"
    },
    "location": "Product Location",
    "deliveryOptions": "pickup",
    "deliveryFee": 0,
    "stockStatus": "in_stock",
    "averageRating": 4.5,
    "reviewCount": 12,
    "ratings": [
      {
        "customerId": "customer_id",
        "stars": 5,
        "review": "Great product!",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### **2. CREATE PRODUCT (SELLER ONLY)**
```
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Fields:**
```json
{
  "name": "string (required)",
  "description": "string (required)",
  "price": "number (required, min: 0)",
  "quantity": "number (required, min: 0)",
  "category": "string (required)"
}
```

**Optional Fields:**
```json
{
  "images": ["array of image URLs"],
  "location": "string",
  "deliveryOptions": "string (enum: ['delivery', 'pickup', 'both'], default: 'pickup')",
  "deliveryFee": "number (default: 0, min: 0)",
  "stockStatus": "string (enum: ['in_stock', 'sold_out', 'out_of_stock'], default: 'in_stock')",
  "useProfileLocation": "boolean (use seller's profile location)"
}
```

**Response:**
```json
{
  "_id": "product_id",
  "sellerId": "seller_id",
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "quantity": 50,
  "category": "electronics",
  "images": ["image_urls"],
  "status": "active",
  "location": "Product Location",
  "deliveryOptions": "pickup",
  "deliveryFee": 0,
  "stockStatus": "in_stock",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### **3. GET SELLER PRODUCTS**
```
GET /api/products/seller/products
Authorization: Bearer <token>
```

**Used by:** Mobile app seller dashboard

**Response:**
```json
[
  {
    "_id": "product_id",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "quantity": 50,
    "category": "electronics",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### **4. UPDATE PRODUCT**
```
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**All fields are optional for updates**

---

### **5. DELETE PRODUCT**
```
DELETE /api/products/:id
Authorization: Bearer <token>
```

---

### **6. ADD PRODUCT RATING**
```
POST /api/products/:id/rating
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "stars": "number (1-5, required)",
  "review": "string (optional)"
}
```

---

## 🏪 **SHOP PRODUCTS API** (SEPARATE SYSTEM)

### **Base URL:** `/api/shop-products`

**⚠️ NOTE:** These products are separate from regular products and may not appear in the mobile app home screen by default.

---

### **1. GET ALL SHOP PRODUCTS (FOR CUSTOMERS)**
```
GET /api/shop-products
```

**Query Parameters:**
- `shopId` - Filter by specific shop
- `category` - Filter by category
- `search` - Search in name, description, brand
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `onSale` - Filter sale items: 'true' or 'false'
- `featured` - Filter featured items: 'true' or 'false'
- `sortBy` - Sort field: 'createdAt', 'price', 'name' (default: 'createdAt')
- `sortOrder` - Sort direction: 'asc', 'desc' (default: 'desc')

**Response:**
```json
[
  {
    "_id": "product_id",
    "shopId": {
      "_id": "shop_id",
      "name": "Shop Name",
      "location": "Shop Location"
    },
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "originalPrice": 129.99,
    "quantity": 50,
    "category": "electronics",
    "subcategory": "smartphones",
    "images": ["image_urls"],
    "brand": "Brand Name",
    "sku": "SP-123456-789",
    "status": "active",
    "featured": false,
    "onSale": true,
    "salePercentage": 25,
    "deliveryOptions": "both",
    "deliveryFee": 10.00,
    "estimatedDeliveryDays": 3,
    "averageRating": 4.5,
    "reviewCount": 12,
    "salePrice": 74.99,
    "stockStatus": "in_stock",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## 🔄 **DIFFERENCE BETWEEN REGULAR PRODUCTS AND SHOP PRODUCTS**

| Feature | Regular Products (`/api/products`) | Shop Products (`/api/shop-products`) |
|---------|-----------------------------------|--------------------------------------|
| **Mobile App Display** | ✅ Appears in home.tsx | ❌ May not appear in home.tsx |
| **Seller Type** | Individual sellers | Shop owners |
| **Product Structure** | Simple structure | Advanced structure with SKU, brand, etc. |
| **Categories** | Basic categories | Extended categories with subcategories |
| **Sale Features** | Basic | Advanced (onSale, salePercentage, originalPrice) |
| **Inventory Management** | Basic | Advanced (stock alerts, thresholds) |
| **Delivery Options** | Basic | Advanced (estimated delivery days) |
| **Analytics** | Basic | Advanced analytics for shop owners |

---

## 🎯 **RECOMMENDATION FOR DESKTOP APP**

**For products to appear in mobile app home.tsx:**
1. **Use Regular Products API** for basic product management
2. **Use Shop Products API** for advanced shop management
3. **Consider implementing a sync mechanism** between both systems

---

## 📱 **MOBILE APP STORE INTEGRATION**

The mobile app uses Zustand stores for state management:

### **Product Store** (`utils/productStore.ts`)
```javascript
// Fetches products from /api/products
const { products, fetchProducts } = useProductStore();

// Used in home.tsx to display products
const activeProducts = products.filter(product => product.status === 'active');
```

### **API Service** (`utils/api.ts`)
```javascript
// Product APIs
async getProducts(filters) // GET /api/products
async createProduct(productData) // POST /api/products
async updateProduct(id, updates) // PUT /api/products/:id
async deleteProduct(id) // DELETE /api/products/:id
async getSellerProducts() // GET /api/products/seller/products
async rateProduct(productId, stars, review) // POST /api/products/:id/rating
```

---

## 🚨 **CRITICAL DATABASE SCHEMAS**

### **Regular Product Schema** (appears in mobile app)
```javascript
{
  sellerId: ObjectId (ref: 'User'),
  name: String (required),
  description: String (required),
  price: Number (required, min: 0),
  quantity: Number (required, min: 0),
  category: String (required),
  images: [String],
  location: String,
  ratings: [{
    customerId: ObjectId (ref: 'User'),
    stars: Number (1-5),
    review: String,
    createdAt: Date
  }],
  status: String (enum: ['active', 'inactive', 'out_of_stock'], default: 'active'),
  deliveryOptions: String (enum: ['delivery', 'pickup', 'both'], default: 'pickup'),
  deliveryFee: Number (default: 0, min: 0),
  stockStatus: String (enum: ['in_stock', 'sold_out', 'out_of_stock'], default: 'in_stock')
}
```

### **Shop Product Schema** (advanced features)
```javascript
{
  shopId: ObjectId (ref: 'Shop'),
  name: String (required),
  description: String (required),
  price: Number (required, min: 0),
  originalPrice: Number (min: 0),
  quantity: Number (required, min: 0),
  category: String (required, enum: ['electronics', 'clothing', 'food', 'beauty', 'home', 'sports', 'books', 'automotive', 'health', 'other']),
  subcategory: String,
  images: [String],
  brand: String,
  sku: String (auto-generated),
  weight: Number (min: 0),
  dimensions: {
    length: Number (min: 0),
    width: Number (min: 0),
    height: Number (min: 0)
  },
  specifications: Map,
  tags: [String],
  ratings: [{
    customerId: ObjectId (ref: 'User'),
    stars: Number (1-5),
    review: String,
    createdAt: Date
  }],
  status: String (enum: ['active', 'inactive', 'out_of_stock', 'discontinued'], default: 'active'),
  featured: Boolean (default: false),
  onSale: Boolean (default: false),
  salePercentage: Number (0-100),
  deliveryOptions: String (enum: ['delivery', 'pickup', 'both'], default: 'pickup'),
  deliveryFee: Number (default: 0, min: 0),
  estimatedDeliveryDays: Number (default: 3, min: 1),
  returnPolicy: {
    allowed: Boolean (default: true),
    days: Number (default: 30, min: 0),
    conditions: String
  },
  warranty: String,
  stockAlert: {
    enabled: Boolean (default: false),
    threshold: Number (default: 5, min: 0)
  }
}
```

---

## 🔧 **AUTHENTICATION & AUTHORIZATION**

### **Regular Products API**
- **Public endpoints:** GET `/api/products`, GET `/api/products/:id`
- **Protected endpoints:** All other endpoints require authentication
- **Seller endpoints:** User must have seller role

### **Shop Products API**
- **Public endpoints:** GET `/api/shop-products`, GET `/api/shop-products/:id`
- **Protected endpoints:** All other endpoints require authentication
- **Shop owner endpoints:** User must have `shop_owner` role and existing shop profile

---

## 📊 **MOBILE APP FILTERING & SEARCH**

The mobile app applies these filters to products:

### **Category Filtering**
```javascript
const categories = [
  { id: 'all', name: 'All', icon: '🏪' },
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'fashion', name: 'Fashion', icon: '👕' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'books', name: 'Books', icon: '📚' },
  { id: 'beauty', name: 'Beauty', icon: '💄' },
  { id: 'toys', name: 'Toys', icon: '🧸' }
];
```

### **Status Filtering**
```javascript
// Only active products are displayed
const activeProducts = products.filter(product => product.status === 'active');
```

### **Search Functionality**
```javascript
const filteredProducts = activeProducts.filter(product => {
  const sellerName = typeof product.sellerId === 'object' ? product.sellerId.name : product.sellerId;
  const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       sellerName.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
  return matchesSearch && matchesCategory;
});
```

---

## 🎯 **SOLUTION FOR DESKTOP APP**

To ensure products created in the desktop app appear in the mobile app:

1. **Use Regular Products API** for basic product management
2. **Implement proper category mapping** between desktop and mobile
3. **Ensure status is set to 'active'** for products to appear
4. **Use proper seller authentication** (user must have seller role)
5. **Include all required fields** (name, description, price, quantity, category)

---

## 📋 API ENDPOINTS FOR SHOP MANAGERS

**Base URL:** `/api/shop-products`

---

### **1. CREATE PRODUCT** 
```
POST /api/shop-products
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Fields:**
```json
{
  "name": "string (required)",
  "description": "string (required)", 
  "price": "number (required, min: 0)",
  "quantity": "number (required, min: 0)",
  "category": "string (required, enum: ['electronics', 'clothing', 'food', 'beauty', 'home', 'sports', 'books', 'automotive', 'health', 'other'])"
}
```

**Optional Fields:**
```json
{
  "originalPrice": "number (min: 0)",
  "subcategory": "string",
  "images": ["array of image URLs"],
  "brand": "string",
  "weight": "number (min: 0)",
  "dimensions": {
    "length": "number (min: 0)",
    "width": "number (min: 0)", 
    "height": "number (min: 0)"
  },
  "specifications": "Map of key-value pairs",
  "tags": ["array of strings"],
  "deliveryOptions": "string (enum: ['delivery', 'pickup', 'both'], default: 'pickup')",
  "deliveryFee": "number (default: 0, min: 0)",
  "estimatedDeliveryDays": "number (default: 3, min: 1)",
  "returnPolicy": {
    "allowed": "boolean (default: true)",
    "days": "number (default: 30, min: 0)",
    "conditions": "string"
  },
  "warranty": "string",
  "stockAlert": {
    "enabled": "boolean (default: false)",
    "threshold": "number (default: 5, min: 0)"
  }
}
```

---

### **2. GET MY PRODUCTS**
```
GET /api/shop-products/me/products
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status: 'active', 'inactive', 'out_of_stock', 'discontinued'
- `category` - Filter by category
- `search` - Search in name, description, brand
- `onSale` - Filter sale items: 'true' or 'false'
- `featured` - Filter featured items: 'true' or 'false'

---

### **3. UPDATE PRODUCT**
```
PUT /api/shop-products/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**All fields are optional for updates:**
```json
{
  "name": "string",
  "description": "string",
  "price": "number",
  "originalPrice": "number", 
  "quantity": "number",
  "category": "string",
  "subcategory": "string",
  "images": ["array"],
  "brand": "string",
  "weight": "number",
  "dimensions": "object",
  "specifications": "Map",
  "tags": ["array"],
  "status": "string (enum: ['active', 'inactive', 'out_of_stock', 'discontinued'])",
  "featured": "boolean",
  "onSale": "boolean",
  "salePercentage": "number (0-100)",
  "deliveryOptions": "string",
  "deliveryFee": "number",
  "estimatedDeliveryDays": "number",
  "returnPolicy": "object",
  "warranty": "string",
  "stockAlert": "object"
}
```

---

### **4. BULK UPDATE PRODUCTS**
```
POST /api/shop-products/bulk-update
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "productIds": ["array of product IDs"],
  "updates": {
    "status": "string",
    "onSale": "boolean",
    "featured": "boolean",
    "salePercentage": "number"
  }
}
```

---

### **5. DELETE PRODUCT**
```
DELETE /api/shop-products/:id
Authorization: Bearer <token>
```

---

### **6. GET PRODUCT ANALYTICS**
```
GET /api/shop-products/me/analytics
Authorization: Bearer <token>
```

**Returns:**
```json
{
  "shopId": "string",
  "totalProducts": "number",
  "activeProducts": "number", 
  "onSaleProducts": "number",
  "lowStockProducts": "number",
  "categoryBreakdown": [
    {
      "_id": "category name",
      "count": "number of products",
      "totalValue": "total inventory value"
    }
  ]
}
```

---

## 🎯 PRODUCT MODEL STRUCTURE

**Auto-generated Fields:**
- `_id` - MongoDB ObjectId
- `shopId` - Auto-linked to shop owner
- `sku` - Auto-generated: `SP-{timestamp}-{random}`
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

**Virtual Fields (computed):**
- `averageRating` - Average of all ratings (0-5)
- `reviewCount` - Number of reviews
- `salePrice` - Calculated sale price if onSale
- `stockStatus` - 'in_stock', 'low_stock', 'out_of_stock'

---

## 🔐 AUTHENTICATION REQUIREMENTS

- **All shop manager endpoints require authentication**
- **User must have `shop_owner` role**
- **User must have an existing shop profile**
- **Token format:** `Bearer <JWT_TOKEN>`

---

## 📊 RESPONSE FORMATS

**Success Response (201/200):**
```json
{
  "_id": "product_id",
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "quantity": 50,
  "category": "electronics",
  "status": "active",
  "averageRating": 4.5,
  "reviewCount": 12,
  "stockStatus": "in_stock",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (400/404/500):**
```json
{
  "message": "Error description"
}
```

---

## 🚨 VALIDATION RULES

1. **Price:** Must be >= 0
2. **Quantity:** Must be >= 0  
3. **Category:** Must be one of the enum values
4. **Sale Percentage:** Must be 0-100 if provided
5. **Rating:** Must be 1-5 if provided
6. **Shop Owner:** Must have existing shop profile
7. **Product Ownership:** Can only modify own products

---

## 💻 EXAMPLE USAGE

### Create a New Product
```javascript
const newProduct = {
  name: "iPhone 15 Pro",
  description: "Latest iPhone with advanced features",
  price: 999.99,
  originalPrice: 1099.99,
  quantity: 25,
  category: "electronics",
  subcategory: "smartphones",
  brand: "Apple",
  images: ["https://example.com/iphone1.jpg"],
  deliveryOptions: "both",
  deliveryFee: 10.00,
  onSale: true,
  salePercentage: 10,
  stockAlert: {
    enabled: true,
    threshold: 5
  }
};

fetch('/api/shop-products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newProduct)
});
```

### Get My Products with Filters
```javascript
fetch('/api/shop-products/me/products?status=active&onSale=true&search=iphone', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Bulk Update Products
```javascript
const bulkUpdate = {
  productIds: ["product1", "product2", "product3"],
  updates: {
    onSale: true,
    salePercentage: 15,
    status: "active"
  }
};

fetch('/api/shop-products/bulk-update', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(bulkUpdate)
});
```

---

## 🎨 COLOR PALETTE FOR DESKTOP APP

### Primary Gold Family (Brand Colors)
```css
highlightGold: '#FFDC73'    /* Soft glows, gradients */
buttonGold: '#FFCF40'       /* Primary CTAs, buttons */
logoGold: '#FFC926'         /* Logo, important details */
deepGold: '#FFBF00'         /* Headers, strong accents */
```

### Dark Theme Colors
```css
background: '#0A0A0A'       /* Main background */
surface: '#1C1C1C'          /* Cards, containers */
text: '#FFFFFF'             /* Primary text */
textSecondary: '#EDEDED'    /* Secondary text */
border: '#2E2E2E'           /* Borders, dividers */
```

### Light Theme Colors
```css
background: '#FFFFFF'       /* Main background */
surface: '#F8F9FA'          /* Cards, containers */
text: '#0A0A0A'             /* Primary text */
textSecondary: '#666666'    /* Secondary text */
border: '#E9ECEF'           /* Borders, dividers */
```

### Status Colors
```css
success: '#28a745'          /* Success, completed, in stock */
info: '#17a2b8'             /* Information, processing */
warning: '#ffc107'          /* Warning, low stock */
danger: '#dc3545'           /* Error, out of stock, delete */
error: '#ff4757'            /* Error states, delete actions */
```

### Accent Colors
```css
royalPurple: '#4B0082'      /* Exclusive highlights, premium badges */
midnightNavy: '#0B2545'     /* Alternative deep background */
white: '#FFFFFF'            /* Contrast, typography */
softGrey: '#EDEDED'         /* Readability, subtle backgrounds */
black: '#0A0A0A'            /* Premium backgrounds */
richCharcoal: '#1C1C1C'     /* Cards, menus, UI containers */
```

### Chart Colors (for analytics)
```css
chartBlue: '#0088FE'
chartGreen: '#00C49F'
chartYellow: '#FFBB28'
chartOrange: '#FF8042'
chartPurple: '#8884D8'
chartTeal: '#10b981'
chartIndigo: '#3b82f6'
```

---

## 🎯 RECOMMENDED USAGE FOR DESKTOP APP

**Primary Actions:**
- Use `buttonGold` (#FFCF40) for main CTAs, primary buttons
- Use `deepGold` (#FFBF00) for headers, important elements

**Backgrounds:**
- Use `background` for main app background
- Use `surface` for cards, modals, panels
- Use `richCharcoal` for sidebar, navigation

**Text:**
- Use `text` for primary text
- Use `textSecondary` for labels, descriptions
- Use `white` for text on dark backgrounds

**Status Indicators:**
- Use `success` for completed orders, in-stock items
- Use `warning` for pending items, low stock
- Use `danger` for errors, out-of-stock items

**Accents:**
- Use `royalPurple` for premium features, VIP badges
- Use `midnightNavy` for alternative backgrounds
- Use `highlightGold` for subtle highlights, hover states

---

## 📱 MOBILE APP INTEGRATION

This API is used by the existing mobile app (`ecommerce-app`) and ensures perfect synchronization between mobile and desktop applications. The desktop app should use the exact same endpoints and data structures to maintain consistency.

**Key Integration Points:**
- Same authentication system (JWT tokens)
- Same product data model
- Same validation rules
- Same response formats
- Same error handling

---

## 🛒 SHOP ORDER MANAGEMENT API

### **Base URL:** `/api/shop-orders`

---

### **1. CREATE SHOP PRODUCT ORDER (Customer)**
```
POST /api/shop-orders/create
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "shopId": "string (required)",
  "products": [
    {
      "shopProductId": "string (required)",
      "quantity": "number (required, min: 1)"
    }
  ],
  "shippingAddress": {
    "street": "string",
    "city": "string", 
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "paymentMethod": "string (required, enum: ['card', 'paypal', 'mobile_money', 'bank_transfer', 'stripe'])",
  "deliveryOption": "string (enum: ['delivery', 'pickup'], default: 'pickup')",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "order": {
    "_id": "order_id",
    "customerId": "customer_id",
    "sellerId": "shop_owner_id",
    "orderType": "product",
    "products": [
      {
        "shopProductId": {
          "_id": "product_id",
          "name": "Product Name",
          "price": 99.99,
          "images": ["image_urls"],
          "brand": "Brand Name"
        },
        "quantity": 2,
        "price": 99.99
      }
    ],
    "totalAmount": 199.98,
    "status": "pending",
    "shippingAddress": "object or null",
    "notes": "string",
    "createdAt": "timestamp"
  },
  "payment": {
    "_id": "payment_id",
    "amount": 199.98,
    "method": "card",
    "status": "pending",
    "transactionId": "SHOP_timestamp_random"
  },
  "message": "Order created successfully"
}
```

---

### **2. GET SHOP MANAGER ORDERS**
```
GET /api/shop-orders/manager/orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status: 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
- `search` - Search in product names or order notes
- `startDate` - Filter orders from this date (YYYY-MM-DD)
- `endDate` - Filter orders until this date (YYYY-MM-DD)
- `sortBy` - Sort field: 'createdAt', 'totalAmount', 'status' (default: 'createdAt')
- `sortOrder` - Sort direction: 'asc', 'desc' (default: 'desc')

**Response:**
```json
[
  {
    "_id": "order_id",
    "customerId": {
      "_id": "customer_id",
      "name": "Customer Name",
      "email": "customer@email.com",
      "phone": "phone_number"
    },
    "products": [
      {
        "shopProductId": {
          "_id": "product_id",
          "name": "Product Name",
          "price": 99.99,
          "images": ["image_urls"],
          "brand": "Brand Name",
          "sku": "SP-123456-789"
        },
        "quantity": 2,
        "price": 99.99
      }
    ],
    "totalAmount": 199.98,
    "status": "pending",
    "paymentId": {
      "_id": "payment_id",
      "status": "pending",
      "method": "card",
      "amount": 199.98
    },
    "shippingAddress": "object or null",
    "trackingNumber": "string or null",
    "estimatedDelivery": "date or null",
    "notes": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

---

### **3. UPDATE ORDER STATUS (Shop Manager)**
```
PUT /api/shop-orders/manager/orders/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "string (required, enum: ['paid', 'shipped', 'delivered', 'cancelled'])",
  "trackingNumber": "string (optional)",
  "estimatedDelivery": "date (optional, ISO format)",
  "notes": "string (optional)"
}
```

**Status Transition Rules:**
- `pending` → `paid`, `cancelled`
- `paid` → `shipped`, `cancelled`
- `shipped` → `delivered`, `cancelled`
- `delivered` → (no further transitions)
- `cancelled` → (no further transitions)

**Response:**
```json
{
  "order": {
    "_id": "order_id",
    "status": "shipped",
    "trackingNumber": "TRK123456789",
    "estimatedDelivery": "2024-01-15T00:00:00.000Z",
    "notes": "Shipped via Express Delivery",
    "updatedAt": "timestamp"
  },
  "message": "Order status updated to shipped"
}
```

---

### **4. GET SHOP ORDER ANALYTICS**
```
GET /api/shop-orders/manager/analytics
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` - Analysis period in days (default: 30)

**Response:**
```json
{
  "shopId": "shop_id",
  "period": "30 days",
  "orderStats": {
    "pending": {
      "count": 5,
      "totalAmount": 499.95
    },
    "paid": {
      "count": 12,
      "totalAmount": 1199.88
    },
    "shipped": {
      "count": 8,
      "totalAmount": 799.92
    },
    "delivered": {
      "count": 15,
      "totalAmount": 1499.85
    }
  },
  "dailyTrends": [
    {
      "_id": "2024-01-01",
      "count": 3,
      "revenue": 299.97
    }
  ],
  "topProducts": [
    {
      "productName": "iPhone 15 Pro",
      "totalQuantity": 25,
      "totalRevenue": 24999.75
    }
  ],
  "totalOrders": 40,
  "totalRevenue": 3999.60
}
```

---

### **5. GET SHOP ORDER DETAILS**
```
GET /api/shop-orders/manager/orders/:orderId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "order_id",
  "customerId": {
    "_id": "customer_id",
    "name": "Customer Name",
    "email": "customer@email.com",
    "phone": "phone_number"
  },
  "products": [
    {
      "shopProductId": {
        "_id": "product_id",
        "name": "Product Name",
        "price": 99.99,
        "images": ["image_urls"],
        "brand": "Brand Name",
        "sku": "SP-123456-789",
        "weight": 0.5,
        "dimensions": {
          "length": 10,
          "width": 5,
          "height": 2
        }
      },
      "quantity": 2,
      "price": 99.99
    }
  ],
  "totalAmount": 199.98,
  "status": "shipped",
  "paymentId": {
    "_id": "payment_id",
    "status": "completed",
    "method": "card",
    "amount": 199.98,
    "transactionId": "SHOP_1234567890_abc123",
    "createdAt": "timestamp"
  },
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "trackingNumber": "TRK123456789",
  "estimatedDelivery": "2024-01-15T00:00:00.000Z",
  "notes": "Customer requested express delivery",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

### **6. GET CUSTOMER SHOP ORDERS**
```
GET /api/shop-orders/customer/orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status: 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
- `shopId` - Filter by specific shop

**Response:**
```json
[
  {
    "_id": "order_id",
    "sellerId": {
      "_id": "shop_owner_id",
      "name": "Shop Name"
    },
    "products": [
      {
        "shopProductId": {
          "_id": "product_id",
          "name": "Product Name",
          "price": 99.99,
          "images": ["image_urls"],
          "brand": "Brand Name"
        },
        "quantity": 2,
        "price": 99.99
      }
    ],
    "totalAmount": 199.98,
    "status": "shipped",
    "paymentId": {
      "_id": "payment_id",
      "status": "completed",
      "method": "card",
      "amount": 199.98
    },
    "shippingAddress": "object or null",
    "trackingNumber": "TRK123456789",
    "estimatedDelivery": "2024-01-15T00:00:00.000Z",
    "createdAt": "timestamp"
  }
]
```

---

## 🎯 ORDER STATUS FLOW

**Complete Order Lifecycle:**
1. **pending** - Order created, waiting for payment
2. **paid** - Payment confirmed, ready for processing
3. **shipped** - Order shipped with tracking number
4. **delivered** - Order successfully delivered
5. **cancelled** - Order cancelled (restores product stock)

**Status Updates Sync:**
- ✅ Shop manager updates status → Customer sees real-time update
- ✅ Customer can track order progress
- ✅ Stock management is automatic
- ✅ Payment status is tracked separately

---

## 🔐 AUTHENTICATION REQUIREMENTS

**Customer Endpoints:**
- Requires authentication
- User can only access their own orders

**Shop Manager Endpoints:**
- Requires authentication
- User must have `shop_owner` role
- User must have existing shop profile
- Can only manage orders for their own shop

---

## 🚀 **DUAL PRODUCT CREATION SYSTEM - IMPLEMENTATION GUIDE**

### **🎯 OBJECTIVE**
Create products in BOTH `/api/products` AND `/api/shop-products` to ensure mobile app visibility while maintaining advanced shop features.

---

## **PHASE 1: BACKEND ENHANCEMENT (MINIMAL CHANGES)**

### **1. Enhanced Shop Product Controller**

Add a new endpoint that creates products in both systems:

```javascript
// In: ecommerce-backend/src/controllers/shopProduct.controller.js

// NEW: Create product in both systems
const createDualProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      quantity,
      category,
      subcategory,
      images,
      brand,
      weight,
      dimensions,
      specifications,
      tags,
      deliveryOptions,
      deliveryFee,
      estimatedDeliveryDays,
      returnPolicy,
      warranty,
      stockAlert,
      // NEW: Regular product fields
      location,
      useProfileLocation
    } = req.body;

    // Verify user has a shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    // Get seller's profile location if requested
    let finalLocation = location || 'Not specified';
    if (useProfileLocation) {
      const seller = await User.findById(req.user._id);
      if (seller && seller.location && seller.location.city) {
        finalLocation = `${seller.location.city}, ${seller.location.country || ''}`.trim();
      }
    }

    // 1. Create Shop Product (Advanced features)
    const shopProduct = new ShopProduct({
      shopId: shop._id,
      name,
      description,
      price,
      originalPrice,
      quantity,
      category,
      subcategory,
      images: images || [],
      brand,
      weight,
      dimensions,
      specifications,
      tags: tags || [],
      deliveryOptions: deliveryOptions || 'pickup',
      deliveryFee: deliveryFee || 0,
      estimatedDeliveryDays: estimatedDeliveryDays || 3,
      returnPolicy,
      warranty,
      stockAlert
    });

    await shopProduct.save();

    // 2. Create Regular Product (Mobile app visibility)
    const regularProduct = new Product({
      sellerId: req.user._id,
      name,
      description,
      price,
      quantity,
      category,
      images: images || [],
      location: finalLocation,
      deliveryOptions: deliveryOptions || 'pickup',
      deliveryFee: deliveryFee || 0,
      stockStatus: 'in_stock'
    });

    await regularProduct.save();

    // 3. Link the products (optional)
    shopProduct.regularProductId = regularProduct._id;
    regularProduct.shopProductId = shopProduct._id;
    
    await shopProduct.save();
    await regularProduct.save();

    res.status(201).json({
      message: "Product created successfully in both systems",
      shopProduct,
      regularProduct
    });

  } catch (error) {
    console.error('Dual product creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add to module.exports
module.exports = {
  // ... existing exports
  createDualProduct
};
```

### **2. Add New Route**

```javascript
// In: ecommerce-backend/src/routes/shopProduct.routes.js

// Add new route for dual creation
router.post('/dual-create', authMiddleware, createDualProduct);
```

### **3. Enhanced Update Function**

```javascript
// Update both products simultaneously
const updateDualProduct = async (req, res) => {
  try {
    const { shopProductId, regularProductId } = req.params;
    const updates = req.body;

    // Get user's shop
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop profile not found" });
    }

    // Update shop product
    const shopProduct = await ShopProduct.findOne({
      _id: shopProductId,
      shopId: shop._id
    });

    if (!shopProduct) {
      return res.status(404).json({ message: "Shop product not found" });
    }

    // Update regular product
    const regularProduct = await Product.findOne({
      _id: regularProductId,
      sellerId: req.user._id
    });

    if (!regularProduct) {
      return res.status(404).json({ message: "Regular product not found" });
    }

    // Apply updates to both products
    Object.keys(updates).forEach(key => {
      if (key !== 'shopProductId' && key !== 'regularProductId') {
        if (shopProduct.schema.paths[key]) {
          shopProduct[key] = updates[key];
        }
        if (regularProduct.schema.paths[key]) {
          regularProduct[key] = updates[key];
        }
      }
    });

    await shopProduct.save();
    await regularProduct.save();

    res.json({
      message: "Products updated successfully in both systems",
      shopProduct,
      regularProduct
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## **PHASE 2: DESKTOP APP IMPLEMENTATION**

### **1. Enhanced API Service**

```javascript
// In your desktop app API service

class ProductService {
  // Create product in both systems
  async createDualProduct(productData) {
    try {
      const response = await fetch('/api/shop-products/dual-create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Dual product creation failed:', error);
      throw error;
    }
  }

  // Update product in both systems
  async updateDualProduct(shopProductId, regularProductId, updates) {
    try {
      const response = await fetch(`/api/shop-products/dual-update/${shopProductId}/${regularProductId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Dual product update failed:', error);
      throw error;
    }
  }

  // Get products from both systems
  async getDualProducts() {
    try {
      const [shopProducts, regularProducts] = await Promise.all([
        fetch('/api/shop-products/me/products', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }),
        fetch('/api/products/seller/products', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        })
      ]);

      const shopProductsData = await shopProducts.json();
      const regularProductsData = await regularProducts.json();

      // Merge and deduplicate products
      return this.mergeProducts(shopProductsData, regularProductsData);
    } catch (error) {
      console.error('Failed to fetch dual products:', error);
      throw error;
    }
  }

  // Merge products from both systems
  mergeProducts(shopProducts, regularProducts) {
    const merged = [];
    const processedIds = new Set();

    // Add shop products
    shopProducts.forEach(shopProduct => {
      if (shopProduct.regularProductId) {
        const regularProduct = regularProducts.find(rp => rp._id === shopProduct.regularProductId);
        if (regularProduct) {
          merged.push({
            ...shopProduct,
            regularProduct,
            isDual: true
          });
          processedIds.add(regularProduct._id);
        }
      } else {
        merged.push({
          ...shopProduct,
          isDual: false
        });
      }
    });

    // Add remaining regular products
    regularProducts.forEach(regularProduct => {
      if (!processedIds.has(regularProduct._id)) {
        merged.push({
          ...regularProduct,
          isDual: false
        });
      }
    });

    return merged;
  }
}
```

### **2. Desktop App Product Form**

```javascript
// Enhanced product creation form

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    quantity: 0,
    category: '',
    subcategory: '',
    images: [],
    brand: '',
    location: '',
    deliveryOptions: 'pickup',
    deliveryFee: 0,
    onSale: false,
    salePercentage: 0,
    // Advanced shop features
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    specifications: {},
    tags: [],
    returnPolicy: { allowed: true, days: 30 },
    warranty: '',
    stockAlert: { enabled: false, threshold: 5 }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create product in both systems
      const result = await productService.createDualProduct(formData);
      
      // Show success message
      showNotification('Product created successfully in both systems!', 'success');
      
      // Reset form
      setFormData(initialFormData);
      
    } catch (error) {
      showNotification('Failed to create product: ' + error.message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Fields (for both systems) */}
      <div className="form-section">
        <h3>Basic Information</h3>
        <input
          type="text"
          placeholder="Product Name *"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <textarea
          placeholder="Description *"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Price *"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
          required
        />
        <input
          type="number"
          placeholder="Quantity *"
          value={formData.quantity}
          onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
          required
        />
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          required
        >
          <option value="">Select Category *</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="home">Home & Garden</option>
          <option value="sports">Sports</option>
          <option value="books">Books</option>
          <option value="beauty">Beauty</option>
          <option value="toys">Toys</option>
        </select>
      </div>

      {/* Advanced Fields (shop products only) */}
      <div className="form-section">
        <h3>Advanced Features (Shop Products)</h3>
        <input
          type="text"
          placeholder="Brand"
          value={formData.brand}
          onChange={(e) => setFormData({...formData, brand: e.target.value})}
        />
        <input
          type="text"
          placeholder="Subcategory"
          value={formData.subcategory}
          onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
        />
        <input
          type="number"
          placeholder="Original Price"
          value={formData.originalPrice}
          onChange={(e) => setFormData({...formData, originalPrice: parseFloat(e.target.value)})}
        />
        <label>
          <input
            type="checkbox"
            checked={formData.onSale}
            onChange={(e) => setFormData({...formData, onSale: e.target.checked})}
          />
          On Sale
        </label>
        {formData.onSale && (
          <input
            type="number"
            placeholder="Sale Percentage (0-100)"
            value={formData.salePercentage}
            onChange={(e) => setFormData({...formData, salePercentage: parseInt(e.target.value)})}
            min="0"
            max="100"
          />
        )}
      </div>

      <button type="submit" className="btn-primary">
        Create Product (Both Systems)
      </button>
    </form>
  );
};
```

---

## **PHASE 3: SYNCHRONIZATION SYSTEM**

### **1. Product Sync Service**

```javascript
// Background service to keep products in sync

class ProductSyncService {
  constructor() {
    this.syncInterval = null;
  }

  startSync() {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncProducts();
    }, 5 * 60 * 1000);
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncProducts() {
    try {
      // Get products from both systems
      const [shopProducts, regularProducts] = await Promise.all([
        this.getShopProducts(),
        this.getRegularProducts()
      ]);

      // Find products that exist in one system but not the other
      const orphanedShopProducts = shopProducts.filter(sp => !sp.regularProductId);
      const orphanedRegularProducts = regularProducts.filter(rp => !rp.shopProductId);

      // Create missing products
      for (const shopProduct of orphanedShopProducts) {
        await this.createRegularProductFromShop(shopProduct);
      }

      for (const regularProduct of orphanedRegularProducts) {
        await this.createShopProductFromRegular(regularProduct);
      }

      console.log('Product sync completed');
    } catch (error) {
      console.error('Product sync failed:', error);
    }
  }

  async createRegularProductFromShop(shopProduct) {
    const regularProductData = {
      name: shopProduct.name,
      description: shopProduct.description,
      price: shopProduct.price,
      quantity: shopProduct.quantity,
      category: shopProduct.category,
      images: shopProduct.images,
      location: 'Not specified',
      deliveryOptions: shopProduct.deliveryOptions,
      deliveryFee: shopProduct.deliveryFee
    };

    const regularProduct = await this.createRegularProduct(regularProductData);
    
    // Link the products
    await this.linkProducts(shopProduct._id, regularProduct._id);
  }

  async createShopProductFromRegular(regularProduct) {
    const shopProductData = {
      name: regularProduct.name,
      description: regularProduct.description,
      price: regularProduct.price,
      quantity: regularProduct.quantity,
      category: regularProduct.category,
      images: regularProduct.images,
      deliveryOptions: regularProduct.deliveryOptions,
      deliveryFee: regularProduct.deliveryFee
    };

    const shopProduct = await this.createShopProduct(shopProductData);
    
    // Link the products
    await this.linkProducts(shopProduct._id, regularProduct._id);
  }
}
```

---

## **PHASE 4: MIGRATION STRATEGY**

### **1. Database Migration Script**

```javascript
// Migration script to link existing products

const migrateExistingProducts = async () => {
  try {
    console.log('Starting product migration...');

    // Get all shop products
    const shopProducts = await ShopProduct.find({});
    
    for (const shopProduct of shopProducts) {
      // Check if regular product exists
      const existingRegularProduct = await Product.findOne({
        name: shopProduct.name,
        sellerId: shopProduct.shopId // Assuming shop owner is the seller
      });

      if (existingRegularProduct) {
        // Link existing products
        shopProduct.regularProductId = existingRegularProduct._id;
        existingRegularProduct.shopProductId = shopProduct._id;
        
        await shopProduct.save();
        await existingRegularProduct.save();
        
        console.log(`Linked: ${shopProduct.name}`);
      } else {
        // Create missing regular product
        const regularProduct = new Product({
          sellerId: shopProduct.shopId,
          name: shopProduct.name,
          description: shopProduct.description,
          price: shopProduct.price,
          quantity: shopProduct.quantity,
          category: shopProduct.category,
          images: shopProduct.images,
          location: 'Not specified',
          deliveryOptions: shopProduct.deliveryOptions,
          deliveryFee: shopProduct.deliveryFee
        });

        await regularProduct.save();
        
        // Link products
        shopProduct.regularProductId = regularProduct._id;
        regularProduct.shopProductId = shopProduct._id;
        
        await shopProduct.save();
        await regularProduct.save();
        
        console.log(`Created and linked: ${shopProduct.name}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
```

---

## **🎯 BENEFITS OF THIS APPROACH**

### **✅ Advantages**
1. **No Breaking Changes** - Existing APIs remain unchanged
2. **Mobile App Compatibility** - Products appear in mobile app immediately
3. **Advanced Features** - Shop products retain all advanced features
4. **Backward Compatibility** - Existing products continue to work
5. **Gradual Migration** - Can be implemented incrementally
6. **Data Integrity** - Products stay in sync automatically

### **⚠️ Considerations**
1. **Storage Overhead** - Products stored in both systems
2. **Sync Complexity** - Need to maintain consistency
3. **Performance** - Slightly more complex queries
4. **Maintenance** - Need to keep both systems updated

---

## **🚀 IMPLEMENTATION TIMELINE**

### **Week 1: Backend Enhancement**
- Add dual creation endpoints
- Implement sync service
- Add database migration script

### **Week 2: Desktop App Integration**
- Update API service
- Enhance product forms
- Add dual product management UI

### **Week 3: Testing & Migration**
- Test dual creation system
- Run migration script
- Verify mobile app integration

### **Week 4: Monitoring & Optimization**
- Monitor sync performance
- Optimize queries
- Add error handling

---

**This approach ensures your products appear in the mobile app while maintaining all advanced shop features! 🎉**

---

*Last Updated: January 2024*
*Version: 1.0*
*Compatible with: Aura E-commerce Platform*
