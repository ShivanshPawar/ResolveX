# ResolveX Backend API Contract

Base URL: `http://localhost:5000/api/v1`  
Auth style: httpOnly cookies (`accessToken`, `refreshToken`) set by auth endpoints.

## Response Envelope

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "message": "optional"
}
```

### Error

```json
{
  "success": false,
  "message": "Error message",
  "details": null
}
```

---

## Auth

### `POST /auth/register`
- Access: Public
- Body:
```json
{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "TestPass123"
}
```
- Returns: `data` = `{ id, email, fullName, role, avatarUrl }`

### `POST /auth/login`
- Access: Public
- Body:
```json
{
  "email": "test@example.com",
  "password": "TestPass123"
}
```
- Returns: user summary in `data`

### `POST /auth/refresh`
- Access: Public (requires `refreshToken` cookie)
- Returns: `{ success: true }` and refreshes `accessToken` cookie

### `POST /auth/logout`
- Access: Public
- Returns: `{ success: true, message: "Logged out" }`

### `GET /auth/me`
- Access: Auth required
- Returns: current user summary in `data`

---

## Issues

### `GET /issues`
- Access: Public
- Query:
  - `page`, `limit`
  - `category`
  - `status`
  - `search` (Mongo text search)
  - `sort` = `newest | oldest | most_upvoted`
  - `userId` (filter by reporter)
- Returns:
  - `data`: issue array
  - `meta`: pagination

### `GET /issues/:id`
- Access: Public
- Returns: single issue in `data`

### `POST /issues`
- Access: Auth required
- Body:
```json
{
  "title": "Broken street light",
  "description": "Not working since 4 days",
  "category": "Street Light",
  "location": "Main Road Ward 7",
  "latitude": 19.076,
  "longitude": 72.8777
}
```

### `PATCH /issues/:id`
- Access: Owner or `moderator/admin`
- Body (partial):
```json
{
  "status": "in_progress",
  "rejectionReason": "optional"
}
```

### `DELETE /issues/:id`
- Access: Owner or admin

### `GET /issues/nearby/search`
- Access: Public
- Query:
  - `lat` (required)
  - `lng` (required)
  - `radiusKm` (default 5)

### `POST /issues/:id/upvote`
- Access: Auth required
- Behavior: toggle
- Returns:
```json
{
  "success": true,
  "data": { "upvoted": true }
}
```

### `POST /issues/:id/images`
- Access: Owner or admin
- Content-Type: `multipart/form-data`
- Field: `images` (1-5 files)
- Allowed: jpeg/jpg/png/webp, max 5MB each
- Returns uploaded image metadata (`url`, `fileId`, `thumbnailUrl`, etc.)

### `DELETE /issues/:id/images/:fileId`
- Access: Owner or admin

---

## Comments

### `GET /comments/issue/:issueId`
- Access: Public
- Returns issue comments in created order

### `POST /comments/issue/:issueId`
- Access: Auth required
- Body:
```json
{
  "text": "Please fix urgently",
  "parentId": null
}
```
- Notes:
  - max nesting depth = 3
  - creates notification for issue owner (if commenter is different)

### `PATCH /comments/:id`
- Access: Comment owner
- Body:
```json
{
  "text": "Updated comment"
}
```

### `DELETE /comments/:id`
- Access: Owner or `moderator/admin`
- Behavior: soft delete (`text = "[deleted]"`)

---

## Users / Profile

### `GET /users/me`
- Access: Auth required

### `PATCH /users/me`
- Access: Auth required
- Body (at least one field):
```json
{
  "fullName": "New Name",
  "phone": "9999999999",
  "address": "Address",
  "bio": "Bio"
}
```

### `PATCH /users/me/password`
- Access: Auth required
- Body:
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass1234"
}
```

### `POST /users/me/avatar`
- Access: Auth required
- Content-Type: `multipart/form-data`
- Field: `avatar` (single image)

### `GET /users/me/dashboard`
- Access: Auth required
- Returns summary counters and recent issues

---

## Notifications

### `GET /notifications`
- Access: Auth required
- Returns:
  - `data`: notifications array
  - `meta.unreadCount`: number

### `PATCH /notifications/:id/read`
- Access: Auth required

### `POST /notifications/read-all`
- Access: Auth required

---

## Search + Saved Searches

### `GET /search`
- Access: Public
- Query:
  - `query`
  - `category`
  - `status`
  - `sort` = `relevance | newest | oldest | upvotes`
  - `startDate` / `endDate`
  - `page`, `limit`

### `GET /search/suggestions?q=...`
- Access: Public

### `GET /search/saved`
- Access: Auth required

### `POST /search/saved`
- Access: Auth required
- Body:
```json
{
  "name": "Street Light New",
  "query": "street light",
  "filters": {
    "status": "new",
    "category": "Street Light"
  },
  "notifyNewResults": true
}
```

### `DELETE /search/saved/:id`
- Access: Auth required

---

## Analytics

### `GET /analytics/summary`
- Access: Public
- Returns total/open/resolved counters

### `GET /analytics/trends?days=30`
- Access: Public
- Returns grouped daily creation counts

### `GET /analytics/categories`
- Access: Public
- Returns category distribution

### `GET /analytics/status-distribution`
- Access: Public

### `GET /analytics/top-issues?limit=10`
- Access: Public

### `GET /analytics/resolution-metrics`
- Access: Public

---

## Admin

Admin route prefix: `/admin`

### Shared Guard
- All admin routes require `requireAuth` + `requireRole("admin", "moderator")` at router level.

### Admin/Moderator routes
- `GET /admin/stats`
- `GET /admin/issues`
- `PATCH /admin/issues/:id`  
  Body:
  ```json
  {
    "status": "resolved",
    "rejectionReason": "optional"
  }
  ```
- `POST /admin/issues/bulk-moderate`
  ```json
  {
    "issueIds": ["<issueId1>", "<issueId2>"],
    "status": "in_review",
    "rejectionReason": "optional"
  }
  ```
### Admin-only routes
- `GET /admin/users`
- `PATCH /admin/users/:id/role`
  ```json
  {
    "role": "moderator"
  }
  ```
- `PATCH /admin/users/:id/suspend`
  ```json
  {
    "suspended": true
  }
  ```

---

## Realtime Socket Events

Server emits:
- `issue:created`
- `issue:updated`
- `comment:created`
- `comment:updated`
- `comment:deleted`
- `upvote:changed`

Client room convention:
- Join room via `issue:{issueId}` (socket layer)

---

## Role & Permission Clarification

If you see:

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "details": null
}
```

it means the logged-in user does not satisfy route role guard.

For your tested endpoints:
- `PATCH /admin/users/:id/role` -> **admin only**
- `PATCH /admin/users/:id/suspend` -> **admin only**

Use `GET /auth/me` to confirm current `role`.
