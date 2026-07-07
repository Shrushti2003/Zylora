# Changelog

All notable changes to Zylora are documented here using semantic versioning.

## 1.0.0 - 2026-07-03

### Added
- React/Vite frontend with marketplace, dashboards, donations, maps, item details, profiles, messages, support pages, and responsive layout.
- Express/MongoDB backend with Firebase authentication sync, profile, resources, pricing, users, messages, saved resources, and verification endpoints.
- Firebase email/password and Google authentication support.
- Seller profile data loading that shows real database-backed owner listings for account users and listing-specific fallback profiles for non-account seed sellers.
- Buy/Browse listing cards with Contact and Details actions while seller name/avatar handles profile navigation.
- Help Center, Trust & Safety, Legal Center, report pages, shared footer, 404 page, error boundary, sitemap, robots, and web manifest.
- AI-assisted pricing endpoint with local estimate fallback and optional Gemini integration.
- FastAPI AI service for listing intent extraction.
- Documentation set for product, technical, architecture, database, API, security, testing, deployment, app flow, and changelog.

### Changed
- Marketplace-specific help/legal/messaging cards were moved out of Buy/Sell dashboards into dedicated support routes.
- Unsupported features are labeled as unavailable or future work rather than presented as implemented.

### Verified
- Frontend lint and build pass after support/legal/profile updates.
