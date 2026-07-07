# Zylora System Architecture

## High-level Architecture
Zylora is a multi-service application:

1. React/Vite frontend renders routes, forms, dashboards, marketplace, maps, messages, profiles, and support pages.
2. Express API handles authentication sync, resources, users, pricing, messages, saved resources, and verification.
3. MongoDB stores users, listings, conversations, saved resources, and operational records.
4. Firebase Authentication handles user identity.
5. Optional Gemini integration powers enhanced pricing estimates.
6. FastAPI AI service exposes listing intent extraction.

## Request Lifecycle
Browser route -> React page/component -> service module -> Axios HTTP request -> Express route -> middleware -> controller/service/model -> MongoDB/external API -> JSON response -> frontend state/UI update.

## Frontend to Backend to Database Flow
For listing creation, the seller/donor form validates required fields, calls `createResource`, sends a bearer-authenticated POST to `/api/resources`, the backend validates with Zod, geocodes if needed, creates or upserts a `Listing`, and returns a serialized resource.

## Authentication Flow
Firebase login/register/Google sign-in -> Firebase ID token -> backend authenticate middleware -> user sync through `AuthService` -> Redux user state -> protected routes become available.

## File Upload Flow
Current frontend forms read selected images/videos as browser data URLs for previews and listing media. Message media upload stores attachment data in conversation records through authenticated auth endpoints. Cloudinary variables exist in `.env.example`, but production cloud upload storage is not implemented in code.

## Maps Flow
Frontend map pages use Leaflet/React Leaflet and listing coordinates. Backend nearby search validates latitude, longitude, and radius, loads available listings with numeric coordinates, calculates distance using `geolib`, and returns sorted resources.

## Notification Flow
Message unread counts are delivered through message service responses and `/api/auth/messages/stream` server-sent events. Full push notification delivery is represented in user preferences but not implemented as an external push provider.

## AI Recommendation Flow
Frontend pricing calculator posts item data to `/api/pricing/estimate`. Backend sanitizes input, produces a local estimate, and optionally calls Gemini when configured. The AI service separately exposes `/listing-intent`.

## Component Interaction
Layouts provide navigation/footer/backgrounds. Route pages compose common cards, avatars, buttons, forms, and service calls. Seller names/avatar links use shared profile utilities to keep profile routing consistent.

## External Services
- Firebase Authentication and optional Firebase Admin credentials.
- MongoDB.
- OpenStreetMap/Nominatim for geocoding in resource creation when coordinates are missing.
- Optional Google Gemini API for pricing estimates.
- Optional future Cloudinary/Resend based on environment placeholders.

## Scalability Considerations
Current list endpoints cap results and use indexes for owner, status, category, city, role, Firebase UID, Google ID, and geospatial fields. Future scale work should add pagination, background jobs for geocoding/media processing, external object storage, audit logs, and production observability.
