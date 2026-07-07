# Zylora Deployment Guide

## Local Setup
1. Install Node.js 20+ and Python 3.11+.
2. Install Node dependencies: `npm install --workspaces --include-workspace-root`.
3. Alternatively install services independently with `npm --prefix frontend install` and `npm --prefix backend install`.
4. Install AI service dependencies from `backend/ai-service/requirements.txt`.
5. Copy `.env.example` to `.env` and fill required values.
6. Start MongoDB locally or provide Atlas URI.
7. Run frontend and backend dev servers.

## Environment Variables
Required for backend: `MONGODB_URI`. Production Firebase Admin requires `FIREBASE_SERVICE_ACCOUNT_KEY` or `FIREBASE_CLIENT_EMAIL` plus `FIREBASE_PRIVATE_KEY`. Frontend requires `VITE_API_BASE_URL` and Firebase web config values.

## Backend Deployment
- Build with `npm --prefix backend run build`.
- Start with `npm --prefix backend run start`.
- Configure `CLIENT_URL`, `CORS_ORIGIN`, `MONGODB_URI`, Firebase credentials, and optional Gemini key.
- Serve over HTTPS in production.

## Frontend Deployment
- Build with `npm --prefix frontend run build`.
- Deploy `frontend/dist` to static hosting.
- Configure `VITE_API_BASE_URL` before build.
- Add production frontend origin to Firebase Authorized domains and Google OAuth JavaScript origins.

## Vercel Deployment
- The root `vercel.json` is configured for a monorepo deployment.
- Vercel installs with `npm install --workspaces --include-workspace-root`.
- The production build command is `npm run backend:build && npm run frontend:build`.
- The output directory is `frontend/dist`.
- `/api/*` routes are rewritten to `api/index.js`, which reuses the compiled Express app and connects to MongoDB before handling requests.
- Set `VITE_API_BASE_URL=/api` for same-origin API calls on Vercel.
- Set production `CLIENT_URL` and `CORS_ORIGIN` to the exact Vercel production URL or custom domain.
- Configure `MONGODB_URI` and Firebase Admin credentials in Vercel environment variables before deployment.
- The FastAPI AI service is not bundled into the Vercel deployment; deploy it separately if listing intent extraction is required.

## Database Deployment
Use MongoDB Atlas or a managed MongoDB provider. Enable backups, least-privilege users, TLS, and network restrictions.

## AI Service Deployment
Deploy `backend/ai-service` as a FastAPI service if listing intent extraction is needed. Keep it independently scalable from the Node API.

## Production Checklist
- Frontend build passes.
- Backend build passes.
- Root `npm run build` passes.
- CORS origin matches production frontend.
- Firebase project and OAuth origins are configured.
- MongoDB URI uses production database.
- Secrets are stored in the hosting secret manager.
- HTTPS enabled.
- Logs and monitoring configured.
- Sitemap, robots, manifest, and metadata deployed.

## CI/CD Recommendations
Run frontend lint, frontend build, backend build, and future automated tests on every pull request. Use separate environments for preview and production.

## Troubleshooting
- Firebase unauthorized domain: add frontend host in Firebase Authentication settings.
- CORS error: update `CORS_ORIGIN` and `CLIENT_URL`.
- Mongo connection failure: verify `MONGODB_URI`, network access, and credentials.
- Vite build EPERM on Windows sandbox: run outside restrictive sandbox or allow Vite temp file writes.
- Listing geocoding failure: pass latitude/longitude directly or verify address/city.

## Common Commands
- `npm run frontend:dev`
- `npm run backend:dev`
- `npm run frontend:build`
- `npm run backend:build`
- `npm run build`
