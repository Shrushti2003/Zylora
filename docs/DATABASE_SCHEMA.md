# Zylora Database Schema

## Overview
Zylora uses MongoDB through Mongoose. Primary collections are `users`, `listings`, `organizations`, `resourcerequests`, `transactions`, `messages`, `notifications`, `impactmetrics`, `reviews`, and `pickuptasks`.

## User
Model: `UserModel`

Fields:
- `name`: string, required.
- `email`: string, required, unique, lowercase.
- `passwordHash`: string, optional legacy/server password field.
- `role`: enum `individual`, `ngo`, `volunteer`, `business`, `admin`; indexed.
- `profile`: photo, username, organization name, bio, address, phone, location text, social links, geo point, achievement badges.
- `scores`: reputation, sustainability, donation, circular economy, trust, carbon savings.
- `verification`: email/identity flags, badge, organization details, documents, notes, status, submitted/verified dates.
- `preferences`: theme, language, privacy settings, notification settings.
- `savedResources`: resource IDs and saved timestamps.
- `conversations`: embedded conversation records with messages and attachments.
- `authProviders`: Google ID, Firebase UID, provider list.
- timestamps.

Indexes:
- `email` unique.
- `role`.
- `profile.location` 2dsphere.
- `authProviders.googleId` unique sparse.
- `authProviders.firebaseUid` unique sparse.

Sample:
```json
{
  "name": "Shrushti Swarnakar",
  "email": "user@example.com",
  "role": "individual",
  "profile": { "username": "shrushti", "photoUrl": "", "locationText": "Amravati" },
  "verification": { "isEmailVerified": true, "isIdentityVerified": false, "status": "Not Submitted" }
}
```

## Listing
Model: `ListingModel`

Fields:
- `ownerId`: ObjectId reference to User, required, indexed.
- `clientResourceId`: optional client-side id for idempotent sync, indexed.
- `title`, `description`, `category`.
- `resourceType`: enum `Sell`, `Buy`, `Donate`; indexed.
- `city`, `latitude`, `longitude`.
- `condition`: enum `excellent`, `good`, `fair`, `poor`.
- `location`: address, city, geo point.
- `estimatedValue`, `impactScore`.
- `status`: enum `draft`, `available`, `matched`, `picked_up`, `closed`; indexed.
- `mediaUrls`: string array.
- `ai`: generated description, confidence, tags.
- timestamps.

Indexes and constraints:
- `ownerId`.
- `category`, `resourceType`, `city`, `status`.
- `location.geo` 2dsphere.
- unique sparse compound `{ ownerId, clientResourceId }`.
- latitude/longitude min/max validation.

Sample:
```json
{
  "ownerId": "64f000000000000000000001",
  "clientResourceId": "resource-123",
  "title": "Set of Glass",
  "category": "Kitchen Equipment",
  "resourceType": "Sell",
  "status": "available",
  "city": "Amravati"
}
```

## Organization
Fields: `ownerId`, `name`, `type` (`ngo`, `business`, `school`, `community`), `verificationStatus`, `documents`, `address`, `impactSummary`. Indexed: owner, type, verification status.

## ResourceRequest
Fields: `requesterId`, `title`, `category`, `quantity`, `urgency`, `status`, `location`. Indexed: requester, category, urgency, status, location geo.

## Operations Collections
- Transaction: listing, donor, recipient, status, value.
- Message: sender, recipient, body, read timestamp.
- Notification: user, title, body, type, read timestamp.
- ImpactMetric: user/organization, waste, carbon, water, reused counts.
- Review: reviewer, subject, rating, comment.
- PickupTask: transaction, volunteer, status, pickup window, route summary.

## Relationships
- User 1:N Listing.
- User 1:N ResourceRequest.
- User 1:N Organization ownership.
- Listing can participate in Transaction.
- User embeds conversations for the current messaging implementation.
