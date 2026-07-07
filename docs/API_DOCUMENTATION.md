# Zylora API Documentation

Base URL: `/api`

Authentication: protected endpoints require a Firebase bearer token or verified session context handled by `authenticate.middleware.ts`.

## Health
`GET /health`
- Auth: no.
- Response: `{ "service": "zylora-api", "status": "healthy" }`
- Status: 200.

## Auth
`POST /auth/firebase/sync`
- Auth: yes.
- Body: optional `{ "role": "individual", "name": "User Name" }`.
- Response: `{ "user": AuthUser }`.

`POST /auth/session`
- Auth: yes.
- Body: `{ "idToken": "firebase-token" }` or token from middleware.
- Response: 204. Creates `zylora_session` cookie when Firebase Admin supports it.

`POST /auth/logout`
- Auth: no.
- Response: 204 and clears session cookie.

`POST /auth/account-status`
- Auth: no, rate-limited.
- Body: `{ "email": "user@example.com" }`.
- Response: account existence/provider information.
- Validation: valid email required.

`GET /auth/me`
- Auth: yes, rate-limited.
- Response: `{ "user": AuthUser }`.

`PATCH /auth/profile`
- Auth: yes.
- Body: profile, preferences, privacy, notification, photo, social, language, and theme fields supported by `AuthService`.
- Response: updated `{ "user": AuthUser }`.

`POST /auth/saved-resources/:resourceId/toggle`
- Auth: yes.
- Response: updated saved resource IDs.

## Messages
`GET /auth/messages`
- Auth: yes.
- Response: conversations and unread count.

`GET /auth/messages/stream`
- Auth: yes.
- Response: server-sent message/unread updates.

`POST /auth/messages/contact`
- Auth: yes.
- Body: seller/listing context.
- Response: opened conversation.

`POST /auth/messages/:conversationId/read`
- Auth: yes. Marks conversation read.

`POST /auth/messages/:conversationId`
- Auth: yes.
- Body: message content/kind.
- Status: 201.

`POST /auth/messages/:conversationId/upload`
- Auth: yes.
- Body: data URL attachment metadata.
- Status: 201.

`PATCH /auth/messages/:conversationId/:messageId`
- Auth: yes. Edits a message.

`POST /auth/messages/:conversationId/:messageId/forward`
- Auth: yes. Forwards a message.

`DELETE /auth/messages/:conversationId`
- Auth: yes. Deletes selected messages.

`DELETE /auth/messages/:conversationId/conversation`
- Auth: yes. Deletes conversation for the current user.

`GET /auth/messages/:conversationId/:messageId/attachments/:attachmentId`
- Auth: yes. Returns attachment metadata/data.

`POST /auth/verification`
- Auth: yes.
- Body: verification submission fields.
- Response: updated user verification state.

## Resources
`GET /resources`
- Auth: no.
- Description: returns up to 500 available listings with coordinates.
- Response: `{ "resources": Resource[] }`.

`GET /resources/me`
- Auth: yes.
- Description: current user's listings.

`GET /resources/nearby?latitude=19.07&longitude=72.87&radius=10`
- Auth: no.
- Validation: latitude -90..90, longitude -180..180, radius positive max 50.
- Response: resources sorted by distance.

`GET /resources/:resourceId`
- Auth: no.
- Response: `{ "resource": Resource }`.
- Status: 404 if missing.

`POST /resources`
- Auth: yes.
- Body:
```json
{
  "clientResourceId": "resource-local-id",
  "title": "Books",
  "category": "Books & Educational Supplies",
  "description": "Usable school books",
  "condition": "good",
  "status": "available",
  "resourceType": "Donate",
  "city": "Amravati",
  "address": "Local area",
  "images": ["/book.jpg"],
  "latitude": 20.93,
  "longitude": 77.75
}
```
- Validation: Zod schema in `resource.controller.ts`.
- Response: 201 `{ "resource": Resource }`.
- Behavior: upserts by `{ ownerId, clientResourceId }` when client id is present.

`DELETE /resources/:resourceId`
- Auth: yes.
- Description: deletes only if current user owns listing.
- Response: `{ "deleted": true, "resourceId": "..." }`.

## Users
`GET /users/search?q=shr`
- Auth: no.
- Validation: q 1..80 chars.
- Response: public users respecting privacy settings.

`GET /users/:identifier`
- Auth: no.
- Identifier: Mongo ObjectId or username.
- Response: public user profile.
- Status: 404 if missing/private.

`GET /users/:identifier/posts`
- Auth: no.
- Response: public user and listings owned by that user.

## Pricing
`POST /pricing/estimate`
- Auth: yes.
- Body: product/category/quantity plus optional condition, dates, images, repair history, location, listing intent.
- Validation: product name, category, and quantity required.
- Response: `{ "estimate": PriceEstimate }`.
- Behavior: returns local estimate; optionally Gemini estimate if `GOOGLE_GEMINI_API_KEY` is configured and succeeds.
