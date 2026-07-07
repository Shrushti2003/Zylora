# Zylora Security Documentation

## Implemented Measures
- Firebase Authentication for email/password and Google sign-in.
- Backend Firebase token verification through authentication middleware.
- Optional Firebase Admin session cookie with `httpOnly`, `sameSite: lax`, secure in production.
- Protected backend endpoints for profile, messages, verification, saved resources, pricing, and authenticated resource writes.
- Frontend protected routes through `RequireAuth`.
- Role-based frontend admin route protection.
- Mongoose owner check for deleting resources.
- Zod validation for resource creation, nearby search, pricing input, and user search.
- Helmet security headers.
- CORS allow-list from `CORS_ORIGIN`/`CLIENT_URL`, with local dev origin support outside production.
- Express JSON body size limit.
- Rate limiting for API, account status, and auth/me.
- Environment validation with Zod.
- Morgan HTTP logging.
- Centralized error handling.
- File/media client validation in frontend forms for image/video upload previews.
- Message attachment limits are handled in service validation paths.

## Password Handling
Current login/signup uses Firebase Authentication, so passwords are handled by Firebase rather than by the Express API. `passwordHash` exists in the user schema for compatibility but is not the primary authentication flow.

## Input Sanitization and XSS
React escapes rendered text by default. Backend sanitizes and bounds several inputs with Zod and string slicing in pricing. Additional HTML sanitization should be added if rich text is introduced.

## CSRF
Bearer token authentication is authoritative. Session cookies are optional. If cookie-authenticated mutations become primary, add explicit CSRF tokens.

## MongoDB Security
MongoDB connection is provided through `MONGODB_URI`. Production should use a least-privilege database user, network allow-listing, TLS, backups, and secret-managed credentials.

## API Keys and Secrets
Secrets are read from environment variables. `.env` files are ignored by git. Firebase private keys and Gemini API keys must never be committed.

## Claims Not Made
Zylora does not claim GDPR certification, ISO 27001 certification, PCI DSS compliance, DPDP compliance certification, or end-to-end encrypted messaging. Payments are currently unavailable.

## Future Improvements
- Backend admin authorization middleware for every admin API if new admin APIs are added.
- CSRF token support if session cookies become primary auth.
- Virus/malware scanning for uploads when cloud storage is implemented.
- Structured audit logs and security event monitoring.
- Automated dependency vulnerability scanning in CI.
- Content Security Policy tuning after external asset origins are finalized.
- Production WAF and DDoS protection at the hosting layer.
