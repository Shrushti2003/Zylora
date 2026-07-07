# Zylora

AI-powered circular economy intelligence platform for hyperlocal reuse, donation, resale, NGO coordination, and sustainability analytics.

## Support, legal, and trust pages

The frontend includes a production-oriented support information architecture:

- `/help` and `/help/faqs` provide searchable Help Center categories for buying, selling, donations, NGOs, schools, accounts, maps, messaging, notifications, verification, profiles, and unsupported payments.
- `/trust-safety` contains community guidelines, buyer safety, seller safety, account security, scam awareness, suspicious activity guidance, and report entry points.
- `/legal/:slug` serves Privacy Policy, Terms of Use, Copyright & IP Policy, Data & Privacy, Cookie Policy, and Account Deletion pages with sidebar navigation, table of contents, and last-updated dates.
- `/report/:kind` supports report forms for users, listings, scams, copyright, and technical issues with reason dropdowns, descriptions, optional screenshots, and confirmation states.
- `/support/:slug` covers press/media, accessibility, security, responsible disclosure, status, changelog, and sitemap utility pages.
- `frontend/public/site.webmanifest`, `robots.txt`, and `sitemap.xml` document PWA and SEO discovery paths for the public site.

Unsupported features are labeled conservatively. Payments, live chat, developer docs, and public status are marked unavailable or coming soon rather than described as implemented.

## Repository documentation

The production documentation set lives in `docs/`:

- `PRD.md` - product requirements, personas, flows, and success metrics.
- `TRD.md` - technology stack, architecture, build process, and security practices.
- `SYSTEM_ARCHITECTURE.md` - service interaction and request lifecycles.
- `DATABASE_SCHEMA.md` - MongoDB/Mongoose collections, fields, relationships, and indexes.
- `API_DOCUMENTATION.md` - current Express API routes and request/response expectations.
- `SECURITY.md` - implemented safeguards and future security work.
- `TESTING.md` - manual and command-based verification strategy.
- `DEPLOYMENT.md` - local setup, environment variables, production checklist, and troubleshooting.
- `APP_FLOW.md` - end-to-end user journeys.
- `CHANGELOG.md` - semantic version history.

## Phase 1 Scope

This repository currently contains the Phase 1 foundation requested in the project prompt:

- Separated `frontend`, `backend`, and Docker orchestration roots, with the FastAPI AI service kept under `backend/ai-service`
- Professional `src` folder structures
- Firebase Authentication with email/password, Google sign-in, password reset, backend token verification, and MongoDB profile sync
- MongoDB schema design for users and sessions
- Docker and Docker Compose setup
- Environment configuration templates
- Architecture, API, database, and dependency documentation

Later phases can add marketplace, maps, dashboards, AI copilot, logistics, analytics, testing, CI/CD, and production hardening on top of this base.

## Quick Start

```bash
npm install --workspaces --include-workspace-root
npm run build
docker compose -f docker/docker-compose.yml up --build
```

Docker exposes the frontend, backend health endpoint, and optional AI service
health endpoint on their documented development ports.

## Vercel deployment

The root `vercel.json` deploys the Vite frontend from `frontend/dist` and
routes `/api/*` requests to the Express app through `api/index.js`.

Set these in Vercel before building:

- `VITE_API_BASE_URL=/api`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `MONGODB_URI`
- `CLIENT_URL`
- `CORS_ORIGIN`
- `FIREBASE_SERVICE_ACCOUNT_KEY` or `FIREBASE_CLIENT_EMAIL` plus `FIREBASE_PRIVATE_KEY`
- Optional: `GOOGLE_GEMINI_API_KEY`

For separate frontend/backend hosting, keep using the standalone frontend and
backend commands documented in `docs/DEPLOYMENT.md`.

## Firebase authentication deployment checklist

Zylora uses Firebase Authentication for both email/password and Google accounts.
Before deploying, configure the Firebase project that matches
`VITE_FIREBASE_PROJECT_ID`:

- Enable the **Email/Password** and **Google** providers in Firebase Authentication.
- In **Authentication → Settings → Authorized domains**, add every frontend host
  (for example the local development host, the preview domain, and the production domain).
- For the Google OAuth client owned by this Firebase project, retain Firebase's
  callback URI: `https://zylora-app.firebaseapp.com/__/auth/handler`. If a
  custom Firebase auth domain is used, add that domain's corresponding
  `/__/auth/handler` callback as well. Do not point Google directly at an API
  route: Firebase owns the OAuth callback and the SPA completes the session.
- Add the production web origin to the OAuth client’s **Authorized JavaScript
  origins** and to Firebase **Authorized domains**. Production must use its
  exact HTTPS origin.
- Add the same frontend origin to `CLIENT_URL` and `CORS_ORIGIN` on the API.
- Keep `VITE_FIREBASE_AUTH_DOMAIN` on the Firebase auth domain for the selected
  project. Google sign-in returns through that domain and the client completes
  the redirect callback on application load.
- Provide a Firebase service-account credential to the API in production. The
  development public-certificate verifier is intentionally only a local fallback.

The application persists Firebase sessions using local browser persistence for
registration and Google sign-in, and honors the “Remember me” choice for email
sign-in. The API creates or updates the MongoDB user profile only after verifying
the Firebase ID token.
