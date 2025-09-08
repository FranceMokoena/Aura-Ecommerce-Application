## Aura Desktop App Integration Guide

This document defines how the Desktop app must integrate with the existing Aura backend so it stays perfectly in sync with the mobile app expectations. Follow these requirements for auth, storage, endpoints, data contracts, filters, and error handling.

### API base URLs
- Production: `https://aura-ecommerce-application.onrender.com/api`
- Development: your LAN backend, e.g. `http://192.168.1.104:5000/api`

Configure a single environment variable and wire all API calls to it:

```env
API_BASE_URL=https://aura-ecommerce-application.onrender.com/api
# For local/dev builds
# API_BASE_URL=http://<your-lan-ip>:5000/api
```

### Authentication
- Use JWT Bearer token exactly like mobile.
- Endpoints:
  - POST `/auth/login` -> returns `{ token, user }`
  - POST `/auth/signup`
  - GET `/users/me` -> fetch current user
  - PUT `/users/me/profile`, POST `/users/me/profile-picture` (multipart)
- Every subsequent request must include header: `Authorization: Bearer <token>`.
- On 401 responses: clear token and redirect to Login.

Token storage (Desktop):
- Electron: use OS keychain via `keytar` (preferred) or secure file storage. Never store in plain text.
- Tauri: use `tauri-plugin-store` or OS keychain.

### Core display requirements (stay in sync with mobile)

1) Products on Home page
- Fetch with GET `/products` and support mobile-like filters via query params:
  - `category`, `search`, `minPrice`, `maxPrice`, `location`, `latitude`, `longitude`, `radius`.
- New seller products created via POST `/products` must appear on Home if:
  - `status` is `active`
  - `quantity` > 0 (or as per backend logic)
- Fields to render at minimum: `_id`, `name`, `price`, `images[]`, `status`, `sellerId` (may be object with `_id`, `name`).

2) Shops tab
- List shops with GET `/shops` supporting filters:
  - `category`, `search`, `location`, `featured`, `latitude`, `longitude`, `radius`.
- Shop managers create/update their shop via:
  - POST `/shops` (create)
  - GET `/shops/me/shop` (mine)
  - PUT `/shops/me/shop` (update)
- The shop should render in the Shops tab after creation if it meets normal listing criteria.

3) Events and Tickets
- List events with GET `/events` (filters supported: `category`, `search`, `location`, `date`, `featured`, `latitude`, `longitude`, `radius`).
- Event managers create and manage events via:
  - POST `/events`
  - GET `/events/me/events`
  - PUT `/events/{eventId}`
  - GET `/events/{eventId}`
- Tickets:
  - POST `/tickets/purchase`
  - POST `/tickets/confirm-purchase`
  - GET `/tickets/my-tickets`
  - POST `/tickets/validate`, `/tickets/refund`, GET `/tickets/stats/{eventId}`
- Newly created events must appear in Events listing if active/upcoming based on backend logic.

4) Shop products (if your desktop UI has a separate Shops → Products view)
- List shop products with GET `/shop-products` using similar filters: `shopId`, `category`, `search`, `minPrice`, `maxPrice`, `onSale`, `featured`, `sortBy`, `sortOrder`, `latitude`, `longitude`, `radius`.
- Shop managers create products with POST `/shop-products`.
- To show a manager’s products in a “My Shop Products” view: GET `/shop-products/me/products`.

### Create/Update flows the desktop must implement

- Seller product create/update/delete:
  - POST `/products`
  - PUT `/products/{id}`
  - DELETE `/products/{id}`
  - GET `/products/seller/products` (list own)

- Shop product create/update/delete:
  - POST `/shop-products`
  - PUT `/shop-products/{id}`
  - DELETE `/shop-products/{id}`
  - POST `/shop-products/bulk-update`
  - GET `/shop-products/me/products` (list own)

- Shop management:
  - POST `/shops`, GET `/shops/me/shop`, PUT `/shops/me/shop`, GET `/shops/{id}`
  - Ratings: POST `/shops/{shopId}/rating`

- Event management:
  - POST `/events`, GET `/events/me/events`, PUT `/events/{eventId}`, GET `/events/{id}`
  - Analytics: GET `/events/{eventId}/analytics`
  - Attendees: GET `/events/{eventId}/attendees`
  - Cancel: POST `/events/{eventId}/cancel`
  - Delete: DELETE `/events/{eventId}`

### Common list parameters (mirror mobile)
- Use URLSearchParams like the mobile client:
  - `category`, `search`, number ranges, booleans, and geolocation (`latitude`, `longitude`, `radius`).
- Support pagination if present (keep query strings pass-through ready to match backend updates).

### File uploads
- Profile picture upload uses multipart POST `/users/me/profile-picture` with field `profilePicture`.
- Products, shops, and events endpoints accept `images: string[]`. If you implement desktop uploads, ensure you obtain accessible URLs (server-served or CDN). Backend serves static files under `/uploads` when used.

### Orders, Bookings, Payments (if included in desktop scope)
- Orders:
  - Customer: GET `/orders/customer`
  - Seller: GET `/orders/seller`
  - Create: POST `/orders`
  - Status: PATCH `/orders/{id}/status`
  - Cancel/Delete: PATCH `/orders/{id}/cancel`, DELETE `/orders/{id}`
- Bookings (services):
  - Customer: GET `/bookings/customer`
  - Seeker (provider): GET `/bookings/seeker`
  - Create: POST `/bookings`
  - Status/Cancel/Delete per mobile `api.ts`
- Paystack demo flow (optional in desktop):
  - POST `/paystack/create-order`
  - POST `/paystack/verify`

### Notifications (optional but recommended)
- General: `/notifications` (list/history/read/delete/unread-count)
- Seller-specific: `/notifications/seller` and related routes
- Register push token (if you support desktop notifications): PUT `/users/me/push-token` (you may no-op if not using push on desktop)

### Error handling & resiliency
- Treat non-2xx responses as errors; show message from `{ message }` if present.
- On 401: clear token and redirect to Login.
- Handle network failures with retry/backoff for idempotent GETs.

### Consistent headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```
For multipart uploads, set `Content-Type: multipart/form-data` and include the bearer token.

### Desktop app tech notes
- Choose Electron or Tauri. Ensure a single API client module uses `API_BASE_URL` and mirrors mobile `utils/api.ts` behavior.
- Implement a storage adapter with the same surface as mobile’s `SecureTokenStorage`:
  - `getToken`, `setToken`, `removeToken`, `setUserData`, `getUserData`, `clearAll`, `setSessionId`.
- On app start, attempt `GET /users/me` to hydrate the session.

### CORS and backend config
- Backend CORS is already configured. For local desktop development, ensure `CORS_ORIGIN` includes your dev origin if you load via `http://localhost:<port>` for the renderer, or load files directly in Electron which typically bypasses CORS.

### Minimal test checklist (before shipping)
- Login, fetch `/users/me`.
- Create a seller product via `/products` → appears on Desktop Home (GET `/products`).
- Create a shop product via `/shop-products` → appears in the Shop Products view.
- Create/update a shop → appears in Shops tab (GET `/shops`).
- Create an event → appears in Events (GET `/events`).
- Basic order flow and/or booking flow endpoints reachable.
- Token refresh behavior (if backend adds it later) does not break calls.

### Reference: Mobile API surface (source of truth)
See `ecommerce-app/utils/api.ts` for the exact endpoints, request/response shapes, and supported query parameters. The desktop client must follow the same patterns to remain in sync.


