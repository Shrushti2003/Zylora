# Zylora Testing Guide

## Current Verification Commands
- Frontend lint: `npm --prefix frontend run lint`
- Frontend build: `npm --prefix frontend run build`
- Backend build: `npm --prefix backend run build`
- Root build: `npm run build`

## Testing Strategy
Use build/lint checks for static verification, manual browser testing for flows, API checks for backend responses, and regression checklists before deployment. Automated unit/e2e tests are recommended future work.

## Manual Testing Checklist
- Landing page loads.
- Navigation links and mobile menu work.
- Help dropdown opens and routes correctly.
- Footer links route to valid pages.
- Unknown URL shows 404 page.
- Global error boundary renders fallback for render failures.

## Authentication Testing
- Register with email/password.
- Login with email/password.
- Google sign-in returns to intended route.
- Forgot password sends Firebase reset flow.
- Protected routes redirect unauthenticated users.
- Logout clears Redux state and backend session cookie.

## CRUD Testing
- Create Sell listing from dashboard.
- Create Donate listing.
- Confirm listing appears in Browse, Buy, details, map/profile where applicable.
- Delete own listing.
- Verify another user cannot delete a listing they do not own.

## Search and Filter Testing
- Marketplace query search.
- Buyer dashboard category search and active category filter.
- Suggestions apply query text.
- Help Center search filters support categories.

## Maps Testing
- Map route loads without console errors.
- Nearby API returns distance-sorted listings for valid coordinates.
- Invalid coordinate query returns validation error.

## Messaging Testing
- Contact seller opens conversation.
- Send, edit, delete, forward, and upload message attachment.
- Unread count updates through message stream.

## Responsive Testing
- Landing, Marketplace, Buy/Sell dashboards, Donate, Details, Profile, Messages, Help, Legal, Report, and Footer at mobile/tablet/desktop widths.

## Lighthouse Testing
Run Lighthouse against production/preview for performance, accessibility, best practices, and SEO. Pay attention to image sizes and bundle growth.

## Browser Compatibility
Manually test current Chrome/Edge. Safari/Firefox should be added before production launch.

## Edge Cases
- Expired donation/listing dates.
- Missing listing images.
- Private public profile.
- Seller with no active listings.
- Non-account seed seller profile.
- Backend unavailable during listing creation.
- Firebase configuration errors.

## Regression Testing
Before release, run lint/build, exercise auth, listing creation, seller profile ownership, wishlist, messages, maps, support/legal routes, and profile settings.
