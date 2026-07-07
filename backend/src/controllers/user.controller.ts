import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { ListingModel } from "../models/listing.model.js";
import { UserModel } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80)
});

type PublicUser = {
  _id: unknown;
  id?: string;
  name?: string;
  email?: string;
  createdAt?: Date;
  profile?: {
    username?: string;
    photoUrl?: string;
    bio?: string;
    organizationName?: string;
    locationText?: string;
  };
  verification?: { isIdentityVerified?: boolean; badge?: string };
  preferences?: { privacy?: { publicProfile?: boolean; showEmail?: boolean; showSavedResources?: boolean; showOnlineStatus?: boolean; allowMessageRequests?: boolean } };
  savedResources?: unknown[];
};

type PublicListing = {
  _id: unknown;
  ownerId?: PublicUser;
  title: string;
  description?: string;
  category: string;
  resourceType?: string;
  city?: string;
  location?: { address?: string; city?: string };
  mediaUrls?: string[];
  condition?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function asyncHandler(handler: RequestHandler): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function publicUserFields() {
  return "name email profile.username profile.photoUrl profile.bio profile.organizationName profile.locationText verification.isIdentityVerified verification.badge preferences.privacy.publicProfile preferences.privacy.showEmail preferences.privacy.showSavedResources preferences.privacy.showOnlineStatus preferences.privacy.allowMessageRequests savedResources createdAt";
}

function userLookup(identifier: string) {
  const conditions: Array<Record<string, unknown>> = [
    { "profile.username": new RegExp(`^${escapeRegex(identifier)}$`, "i") }
  ];

  if (/^[a-f\d]{24}$/i.test(identifier)) {
    conditions.unshift({ _id: identifier });
  }

  return { $or: conditions };
}

function serializePublicUser(user: PublicUser, counts: { posts: number; saved: number }) {
  const name = user.name || user.profile?.organizationName || "Zylora member";
  const privacy = user.preferences?.privacy;
  return {
    id: String(user._id ?? user.id ?? ""),
    name,
    email: privacy?.showEmail === true ? user.email ?? "" : "",
    username: user.profile?.username ?? "",
    bio: user.profile?.bio ?? "",
    organizationName: user.profile?.organizationName ?? "",
    profileImage: user.profile?.photoUrl ?? "",
    photoUrl: user.profile?.photoUrl ?? "",
    location: user.profile?.locationText ?? "",
    joinedAt: user.createdAt,
    postCount: counts.posts,
    savedResourceCount: privacy?.showSavedResources === false ? null : counts.saved,
    isOnlineVisible: privacy?.showOnlineStatus !== false,
    allowMessageRequests: privacy?.allowMessageRequests !== false,
    isVerified: Boolean(user.verification?.isIdentityVerified),
    badge: user.verification?.badge ?? "unverified"
  };
}

function inferResourceType(listing: PublicListing) {
  if (listing.resourceType === "Sell" || listing.resourceType === "Buy" || listing.resourceType === "Donate") {
    return listing.resourceType;
  }

  const category = listing.category.toLowerCase();
  const text = `${listing.title} ${listing.description ?? ""}`.toLowerCase();

  if (category.includes("ngo") || category.includes("donation") || text.includes("donat")) {
    return "Donate";
  }

  return "Sell";
}

function serializeListing(listing: PublicListing) {
  const city = listing.city ?? listing.location?.city ?? "";
  const address = listing.location?.address ?? "";

  return {
    id: String(listing._id),
    authorId: listing.ownerId ? String(listing.ownerId._id) : "",
    title: listing.title,
    description: listing.description ?? "",
    category: listing.category,
    resourceType: inferResourceType(listing),
    condition: listing.condition ?? "",
    status: listing.status ?? "draft",
    city,
    address,
    location: city || address,
    images: listing.mediaUrls ?? [],
    datePosted: listing.createdAt,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    views: 0,
    likes: 0,
    comments: 0,
    saveCount: 0,
    shareCount: 0,
    author: listing.ownerId ? serializePublicUser(listing.ownerId, { posts: 0, saved: 0 }) : null
  };
}

export class UserController {
  show = asyncHandler(async (request, response) => {
    const identifier = request.params.identifier.trim();
    const user = await UserModel.findOne(userLookup(identifier))
      .select(publicUserFields())
      .lean<PublicUser | null>();

    if (!user || user.preferences?.privacy?.publicProfile === false) {
      throw new AppError("Public profile not found", 404);
    }

    const [postCount, savedCount] = await Promise.all([
      ListingModel.countDocuments({ ownerId: user._id }),
      Promise.resolve(user.savedResources?.length ?? 0)
    ]);

    response.status(200).json({ user: serializePublicUser(user, { posts: postCount, saved: savedCount }) });
  });

  posts = asyncHandler(async (request, response) => {
    const identifier = request.params.identifier.trim();
    const user = await UserModel.findOne(userLookup(identifier))
      .select(publicUserFields())
      .lean<PublicUser | null>();

    if (!user || user.preferences?.privacy?.publicProfile === false) {
      throw new AppError("Public profile not found", 404);
    }

    const listings = await ListingModel.find({ ownerId: user._id })
      .sort({ createdAt: -1 })
      .lean<PublicListing[]>();

    response.status(200).json({
      user: serializePublicUser(user, { posts: listings.length, saved: user.savedResources?.length ?? 0 }),
      posts: listings.map((listing) => serializeListing({ ...listing, ownerId: user }))
    });
  });

  search = asyncHandler(async (request, response) => {
    const { q } = searchQuerySchema.parse(request.query);
    const pattern = new RegExp(escapeRegex(q), "i");
    const users = await UserModel.find({
      "preferences.privacy.publicProfile": { $ne: false },
      "preferences.privacy.allowSearchVisibility": { $ne: false },
      $or: [
        { name: pattern },
        { "profile.username": pattern },
        { "profile.organizationName": pattern }
      ]
    })
      .select(publicUserFields())
      .limit(12)
      .lean<PublicUser[]>();

    const counts = users.length
      ? await ListingModel.aggregate<{ _id: unknown; count: number }>([
        { $match: { ownerId: { $in: users.map((user) => user._id) } } },
        { $group: { _id: "$ownerId", count: { $sum: 1 } } }
      ])
      : [];
    const postCounts = new Map(counts.map((item) => [String(item._id), item.count]));

    response.status(200).json({
      users: users.map((user) => serializePublicUser(user, {
        posts: postCounts.get(String(user._id)) ?? 0,
        saved: user.savedResources?.length ?? 0
      }))
    });
  });
}
