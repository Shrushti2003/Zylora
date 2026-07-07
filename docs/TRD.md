# Zylora Technical Requirements Document

## Tech Stack
- Frontend: React 18, Vite, TypeScript, React Router, Redux Toolkit, TanStack Query, Framer Motion, Tailwind/PostCSS, Leaflet/React Leaflet, Lucide icons, Firebase client SDK.
- Backend: Node.js, Express, TypeScript, Mongoose, Zod, Firebase Admin, Helmet, CORS, compression, cookie-parser, express-rate-limit, Morgan.
- AI service: Python, FastAPI, Pydantic-style schemas, service layer for listing intent.
- Database: MongoDB with Mongoose schemas and indexes.

## Frontend Architecture
`frontend/src` is organized into `app`, `api`, `components`, `config`, `data`, `features`, `pages`, `routes`, `services`, `store`, `styles`, `types`, and `utils`.

Pages are route-level views. Shared UI lives in `components/common`, `components/forms`, and `components/layout`. API-facing modules live in `services` and `api/httpClient.ts`. Auth and theme state live in Redux slices.

## Backend Architecture
`backend/src` is organized into `app.ts`, `server.ts`, `config`, `controllers`, `database`, `middleware`, `models`, `repositories`, `routes`, `services`, `types`, and `utils`.

Express mounts route modules under `/api/auth`, `/api/resources`, `/api/users`, and `/api/pricing`. Controllers coordinate validation and service/model operations.

## Database Architecture
MongoDB stores users, listings, organizations, resource requests, and operational collections such as transactions, messages, notifications, impact metrics, reviews, and pickup tasks. See `DATABASE_SCHEMA.md`.

## API Layer
The frontend uses Axios through `frontend/src/api/httpClient.ts`. Auth endpoints sync Firebase users, manage sessions, profile settings, saved resources, messages, and verification. Resource endpoints support listing CRUD and nearby search.

## Authentication
Firebase is authoritative for login/signup/Google identity. The frontend obtains Firebase ID tokens. The backend authenticate middleware verifies tokens and attaches `request.user`. Session cookies are attempted for backend convenience but bearer-token auth remains authoritative.

## Authorization
Protected frontend routes use `RequireAuth`. Backend resource creation, deletion, message, saved-resource, profile, and verification endpoints require authentication. Resource deletion is owner-scoped.

## State Management
Redux stores authenticated user and theme state. React local state handles forms, page filters, and UI panels. TanStack Query is configured for future server-state workflows.

## Folder Structure Explanation
- `frontend/public`: static images, favicon, robots, sitemap, manifest.
- `frontend/src/pages`: route pages.
- `frontend/src/data`: seed listings, support/legal content, visuals.
- `backend/src/models`: Mongoose schemas.
- `backend/src/middleware`: auth, authorization, rate limiting, validation, error handling.
- `backend/src/services`: auth, Firebase token, message event services.
- `backend/ai-service/app`: FastAPI app, schemas, services, API routers.

## Environment Variables
Core variables include `NODE_ENV`, `PORT`, `CLIENT_URL`, `CORS_ORIGIN`, `API_PUBLIC_URL`, `MONGODB_URI`, Firebase server credentials, `GOOGLE_GEMINI_API_KEY`, and frontend `VITE_FIREBASE_*`/`VITE_API_BASE_URL`.

## Build Process
- Frontend: `npm --prefix frontend run build` runs `tsc -b` and `vite build`.
- Backend: `npm --prefix backend run build` runs `tsc`.
- Root: `npm run build` runs both.

## Deployment Flow
Deploy frontend as a static Vite build, backend as a Node service, AI service as a Python/FastAPI service, and MongoDB through a managed cluster or Docker Compose. Configure exact production origins in Firebase, CORS, and OAuth settings.

## Error Handling
Backend uses `AppError` and centralized `errorHandler`. Frontend has a global error boundary and explicit empty/error states on support, profile, auth, listing, and report flows.

## Logging Strategy
Backend uses Morgan request logging. Auth session-cookie failures are logged as warnings in development. Future production logging should add structured logs and correlation IDs.

## Performance Optimization
Frontend uses Vite bundling, code-level component reuse, local state where appropriate, image assets in public, and list limits on backend queries. Backend limits resource list and nearby queries and applies compression.

## Security Practices
Implemented: Helmet, CORS allow-list, Firebase token verification, route protection, Zod validation, rate limiting, owner-scoped deletes, environment validation, cookie flags, and conservative error messages. Future: automated dependency scanning, CSRF hardening if cookie auth becomes primary, cloud upload scanning, and audit logging.
