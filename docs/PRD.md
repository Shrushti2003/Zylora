# Zylora Product Requirements Document

## Project Overview
Zylora is an AI-powered circular economy platform for local reuse, donation, resale, resource discovery, NGO coordination, maps, messaging, and impact storytelling. The current product includes a React/Vite frontend, Express/MongoDB API, Firebase Authentication, local marketplace seed data, real database-backed listings for signed-in users, support/legal pages, and AI-assisted pricing/listing intelligence.

## Vision
Make it simple for individuals, sellers, NGOs, schools, and community organizations to keep usable resources in circulation instead of sending them to waste.

## Problem Statement
Reusable goods are often idle, discarded, or hard to route to the right recipient. Communities need trusted discovery, clear listing details, safe contact, profile context, map discovery, and lightweight impact tracking.

## Objectives
- Enable users to browse, buy, sell, donate, save, and contact listing owners.
- Preserve accurate seller profile data and show only listings owned by the selected seller.
- Support authenticated listing creation and persistence to MongoDB.
- Provide map-based resource discovery and nearby search.
- Support messaging, wishlist, profile settings, verification, and support/report flows.
- Document legal, privacy, trust, safety, and support guidance honestly.

## Target Users
- Individuals sharing, buying, or donating reusable items.
- Sellers listing affordable reusable resources.
- NGOs requesting or receiving donations.
- Schools receiving educational materials or infrastructure support.
- Businesses and community groups managing surplus.
- Admin users reviewing platform activity.

## User Personas
- Local Seller: lists reusable goods, manages pricing, responds to buyers.
- Buyer/Recipient: searches listings, saves options, contacts sellers, reviews details.
- Donor: donates useful goods with photos and pickup instructions.
- NGO/School Coordinator: needs verified profile context and resource matching.
- Admin/Operator: monitors platform operations and trust signals.

## User Stories
- As a seller, I can publish a listing that appears in Browse, Buy, Maps, details, and my public profile.
- As a buyer, I can search and filter listings, save items, open details, and contact the seller.
- As a donor, I can create donation listings with media, quantity, city, and expiry data.
- As a profile viewer, I can click a seller name and see only that seller's posts, donations, and sold items.
- As a user, I can manage profile, privacy, notifications, saved resources, and messages.
- As a user, I can report unsafe listings, users, scams, copyright issues, or technical issues.

## Functional Requirements
- Authentication with Firebase email/password and Google provider through the frontend and backend token sync.
- Protected routes for donate, dashboards, messages, saved items, profile, and admin.
- Marketplace browsing from local and database-backed resource data.
- Seller dashboard listing creation with AI price support and backend persistence.
- Donation listing creation with backend persistence.
- Item details pages with media, owner profile links, and contact actions.
- Public profile pages backed by database data for real users and listing-specific fallback profiles for seed/local non-account sellers.
- Wishlist toggling through authenticated API.
- Messaging with conversations, attachments, editing, deletion, forwarding, unread counts, and server-sent events.
- Map page and nearby resource API.
- Help Center, Legal Center, Trust & Safety, report pages, 404, error boundary, footer, manifest, sitemap, and robots metadata.

## Non-functional Requirements
- TypeScript-safe frontend and backend.
- Responsive design across desktop and mobile.
- No false claims about unsupported payments, compliance, certifications, or end-to-end encryption.
- Clear error states and empty states.
- Conservative security posture with rate limiting, validation, CORS, Helmet, and protected routes.
- Buildable frontend and backend.

## Marketplace Flow
Landing or navigation -> Browse/Marketplace -> search/filter/category cards -> listing card -> Details or Contact -> seller profile via seller name/avatar.

## NGO Flow
Login -> NGO dashboard -> browse resources or create needs -> contact listing owner -> coordinate in messages -> track impact manually through platform views.

## Donation Flow
Login -> Donate -> fill item, media, quantity, city, pickup, expiry -> backend creates resource -> listing appears in Browse, Buy, Map, details, and profile.

## Buying Flow
Login -> Buy dashboard -> search/filter -> wishlist or details -> contact seller -> conversation opens in Messages.

## Selling Flow
Login -> Sell dashboard -> enter item data -> optional AI pricing estimate -> publish -> backend stores listing -> owner profile shows listing.

## Authentication Flow
Register or Login -> Firebase Auth -> backend verifies Firebase token -> MongoDB user synced -> Redux auth state initialized -> protected routes become available.

## Messaging Flow
Contact seller -> backend opens conversation -> messages stored on user conversation records -> SSE updates unread counts -> user can edit, delete, forward, upload media, and download attachments.

## Maps Flow
Map page reads resource data and can use `/api/resources/nearby` with latitude, longitude, and radius for distance-filtered database listings.

## Admin Features
Admin route is protected by `RequireAuth` with `admin` role. Current admin page provides operational dashboard UI; role enforcement happens in frontend route protection.

## AI Features
- Backend pricing endpoint uses local estimation and optionally Google Gemini when `GOOGLE_GEMINI_API_KEY` is configured.
- AI service exposes listing intent extraction through FastAPI.
- Frontend Smart Pricing Calculator consumes pricing estimates.

## Future Scope
- Fully automated account deletion API.
- Cloud image storage integration.
- Production status dashboard.
- Formal test suite and CI/CD.
- Payment flow only if actually implemented.
- Stronger admin backend authorization for admin-only APIs.

## Success Metrics
- Successful listing creation rate.
- Listings with valid owner profiles.
- Contact-to-conversation conversion.
- Donation listing completion.
- Search and map engagement.
- Reduced support reports for wrong seller profile data.
- Build/lint pass rate before deployment.
