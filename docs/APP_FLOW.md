# Zylora Application Flow

## Primary User Journey
Landing Page -> Authentication -> Dashboard -> Marketplace -> Listing Details -> Contact Seller -> Chat -> Profile -> Settings -> Logout.

## Landing Flow
User opens `/` -> reviews value proposition and product sections -> chooses Register, Login, Marketplace, Donate, Buy, Sell, Help, or Contact.

## Authentication Flow
Register/Login/Forgot Password/Google -> Firebase Auth -> backend sync/session -> Redux auth user -> protected route access.

## Browse Flow
`/marketplace` -> listing grid -> search/category interactions -> seller name/avatar opens profile -> Details opens item details -> Contact opens message flow.

## Buy Flow
`/dashboard/buy` -> query/category filters -> wishlist toggle -> Contact/Details -> message or details page.

## Sell Flow
`/dashboard/sell` -> create listing form -> optional smart pricing -> media preview -> publish -> backend resource -> local listing sync -> listing visible in app.

## Donation Flow
`/donate` -> donation form -> media preview -> expiry validation -> backend resource -> Browse/Buy/Profile visibility.

## Listing Details Flow
`/items/:id` -> media and details -> owner identity -> Contact card -> seller name profile route.

## Seller Profile Flow
Seller name/avatar -> `/profile/:identifier` -> backend public profile/posts for real account users -> listing-specific fallback profile for seed/non-account listings -> tabs for Posts, Donations, Sold Items.

## Messaging Flow
Contact Seller -> `/api/auth/messages/contact` -> conversation list -> send/edit/delete/forward/upload -> unread updates through SSE -> Messages page.

## Wishlist Flow
Heart button -> `/api/auth/saved-resources/:resourceId/toggle` -> Redux user saved IDs update -> Saved page and dashboard wishlist reflect state.

## Maps Flow
Map navigation -> resource map -> listing markers/data -> nearby API when coordinates/radius are supplied.

## Profile Settings Flow
Profile -> edit identity/photo/social/privacy/notifications/theme/language -> backend profile update -> Redux refresh -> profile references sync.

## Verification Flow
Verify page -> user submits organization/identity details -> `/api/auth/verification` -> verification status updated.

## Support Flow
Help -> search categories -> contact/report/legal/trust routes -> report form confirmation or support contact path.

## Admin Flow
Admin route -> `RequireAuth` checks admin role -> admin dashboard page.
