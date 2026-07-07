import type { NextFunction, Request, RequestHandler, Response } from "express";
import { getDistance } from "geolib";
import { z } from "zod";
import { ListingModel } from "../models/listing.model.js";
import { AppError } from "../utils/AppError.js";

const nearbyQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(50)
});

function sanitizePlainText(value: string, maxLength: number) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function plainText(minLength: number, maxLength: number) {
  return z.string().transform((value) => sanitizePlainText(value, maxLength)).refine((value) => value.length >= minLength);
}

function sanitizeMediaUrl(value: string) {
  return value
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("")
    .trim()
    .slice(0, 1_000_000);
}

const createResourceSchema = z.object({
  clientResourceId: plainText(1, 120).optional(),
  title: plainText(2, 160),
  category: plainText(2, 80),
  description: plainText(2, 1200).optional(),
  condition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
  status: z.enum(["draft", "available", "matched", "picked_up", "closed"]).optional(),
  resourceType: z.enum(["Sell", "Buy", "Donate"]).optional(),
  city: plainText(2, 120),
  address: plainText(2, 240),
  images: z.array(z.string().transform(sanitizeMediaUrl).refine((value) => value.length > 0)).max(8).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

type ListingWithLocation = {
  _id: unknown;
  clientResourceId?: string;
  title: string;
  description?: string;
  category: string;
  resourceType?: string;
  city?: string;
  condition?: string;
  status?: string;
  mediaUrls?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  latitude?: number;
  longitude?: number;
  location?: {
    address?: string;
    city?: string;
    geo?: {
      coordinates?: number[];
    };
  };
  ownerId?: {
    _id?: unknown;
    name?: string;
    profile?: { username?: string; photoUrl?: string };
    verification?: { isIdentityVerified?: boolean; badge?: string };
  };
};

const geocodeCacheTtlMs = 24 * 60 * 60 * 1000;
const maxGeocodeCacheEntries = 200;
const geocodeCache = new Map<string, { coordinates: { latitude: number; longitude: number }; expiresAt: number }>();
const geocodeRequests = new Map<string, Promise<{ latitude: number; longitude: number }>>();

function getListingCoordinates(listing: ListingWithLocation) {
  const [storedLongitude, storedLatitude] = listing.location?.geo?.coordinates ?? [];
  const latitude = listing.latitude ?? storedLatitude;
  const longitude = listing.longitude ?? storedLongitude;

  return { latitude, longitude };
}

function inferResourceType(listing: ListingWithLocation) {
  const explicitType = (listing as ListingWithLocation & { resourceType?: string }).resourceType;
  if (explicitType === "Sell" || explicitType === "Buy" || explicitType === "Donate") {
    return explicitType;
  }

  const category = listing.category.toLowerCase();
  const text = `${listing.title} ${listing.description ?? ""}`.toLowerCase();

  if (category.includes("ngo") || category.includes("donation") || text.includes("donat")) {
    return "Donate";
  }

  return "Sell";
}

function toResource(listing: ListingWithLocation, userLocation?: { latitude: number; longitude: number }, precomputedDistanceMeters?: number | null) {
  const { latitude, longitude } = getListingCoordinates(listing);
  const distanceMeters =
    typeof precomputedDistanceMeters === "number"
      ? precomputedDistanceMeters
      : userLocation && typeof latitude === "number" && typeof longitude === "number"
      ? getDistance(userLocation, { latitude, longitude })
      : null;

  return {
    id: String(listing._id),
    clientResourceId: listing.clientResourceId,
    title: listing.title,
    description: listing.description ?? "",
    category: listing.category,
    resourceType: inferResourceType(listing),
    condition: listing.condition ?? "good",
    status: listing.status ?? "draft",
    city: listing.city ?? listing.location?.city ?? "",
    address: listing.location?.address ?? "",
    images: listing.mediaUrls ?? [],
    datePosted: listing.createdAt,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    views: 0,
    latitude,
    longitude,
    distanceKm: distanceMeters === null ? null : Number((distanceMeters / 1000).toFixed(2)),
    owner: listing.ownerId ? {
      id: String(listing.ownerId._id ?? ""),
      name: listing.ownerId.name ?? "Zylora member",
      username: listing.ownerId.profile?.username ?? "",
      photoUrl: listing.ownerId.profile?.photoUrl ?? "",
      isVerified: Boolean(listing.ownerId.verification?.isIdentityVerified),
      badge: listing.ownerId.verification?.badge ?? "unverified"
    } : null
  };
}

async function geocodeAddress(address: string, city: string) {
  const query = `${address}, ${city}`;
  const cacheKey = query.trim().toLowerCase();
  const cached = geocodeCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.coordinates;
  }

  const inFlight = geocodeRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const request = fetchGeocodeAddress(query)
    .then((coordinates) => {
      if (geocodeCache.size >= maxGeocodeCacheEntries) {
        const oldestKey = geocodeCache.keys().next().value as string | undefined;
        if (oldestKey) geocodeCache.delete(oldestKey);
      }
      geocodeCache.set(cacheKey, {
        coordinates,
        expiresAt: Date.now() + geocodeCacheTtlMs
      });
      return coordinates;
    })
    .finally(() => {
      geocodeRequests.delete(cacheKey);
    });

  geocodeRequests.set(cacheKey, request);
  return request;
}

async function fetchGeocodeAddress(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Zylora/1.0 contact@zylora.local"
    }
  });

  if (!response.ok) {
    throw new AppError("Could not geocode the provided address", 502);
  }

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  const match = results.at(0);

  if (!match) {
    throw new AppError("No OpenStreetMap result found for that address", 422);
  }

  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon)
  };
}

function getBoundingBox(latitude: number, longitude: number, radiusKm: number) {
  const latitudeDelta = radiusKm / 111.32;
  const cosine = Math.cos(latitude * Math.PI / 180);
  const longitudeDelta = Math.abs(cosine) < 0.0001 ? 180 : radiusKm / (111.32 * Math.abs(cosine));

  return {
    minLatitude: Math.max(-90, latitude - latitudeDelta),
    maxLatitude: Math.min(90, latitude + latitudeDelta),
    minLongitude: Math.max(-180, longitude - longitudeDelta),
    maxLongitude: Math.min(180, longitude + longitudeDelta)
  };
}

function asyncHandler(handler: RequestHandler): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export class ResourceController {
  mine = asyncHandler(async (request, response) => {
    if (!request.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const listings = await ListingModel.find({ ownerId: request.user.id })
      .sort({ createdAt: -1 })
      .lean<ListingWithLocation[]>();

    response.status(200).json({
      resources: listings.map((listing) => toResource(listing))
    });
  });

  list = asyncHandler(async (_request, response) => {
    const listings = await ListingModel.find({
      status: "available",
      latitude: { $type: "number" },
      longitude: { $type: "number" }
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("ownerId", "name profile.username profile.photoUrl verification.isIdentityVerified verification.badge")
      .lean<ListingWithLocation[]>();

    response.status(200).json({
      resources: listings.map((listing) => toResource(listing))
    });
  });

  show = asyncHandler(async (request, response) => {
    const listing = await ListingModel.findById(request.params.resourceId)
      .populate("ownerId", "name profile.username profile.photoUrl verification.isIdentityVerified verification.badge")
      .lean<ListingWithLocation | null>();

    if (!listing) {
      throw new AppError("Listing not found", 404);
    }

    response.status(200).json({
      resource: toResource(listing)
    });
  });

  create = asyncHandler(async (request, response) => {
    if (!request.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const payload = createResourceSchema.parse(request.body);
    const coordinates =
      typeof payload.latitude === "number" && typeof payload.longitude === "number"
        ? { latitude: payload.latitude, longitude: payload.longitude }
        : await geocodeAddress(payload.address, payload.city);

    const listingPayload = {
      ownerId: request.user.id,
      clientResourceId: payload.clientResourceId,
      title: payload.title,
      description: payload.description ?? `${payload.title} available in ${payload.city}.`,
      category: payload.category,
      resourceType: payload.resourceType ?? "Sell",
      condition: payload.condition ?? "good",
      city: payload.city,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      location: {
        address: payload.address,
        city: payload.city,
        geo: {
          type: "Point",
          coordinates: [coordinates.longitude, coordinates.latitude]
        }
      },
      status: payload.status ?? "available",
      mediaUrls: payload.images ?? []
    };

    const listing = payload.clientResourceId
      ? await ListingModel.findOneAndUpdate(
        { ownerId: request.user.id, clientResourceId: payload.clientResourceId },
        { $set: listingPayload },
        { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true }
      )
      : await ListingModel.create(listingPayload);

    response.status(201).json({
      resource: toResource(listing.toObject())
    });
  });

  remove = asyncHandler(async (request, response) => {
    if (!request.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const listing = await ListingModel.findOneAndDelete({
      _id: request.params.resourceId,
      ownerId: request.user.id
    });

    if (!listing) {
      throw new AppError("Listing not found", 404);
    }

    response.status(200).json({ deleted: true, resourceId: request.params.resourceId });
  });

  nearby = asyncHandler(async (request, response) => {
    const { latitude, longitude, radius } = nearbyQuerySchema.parse(request.query);
    const radiusMeters = radius * 1000;
    const userLocation = { latitude, longitude };
    const bounds = getBoundingBox(latitude, longitude, radius);

    const listings = await ListingModel.find({
      status: "available",
      latitude: { $gte: bounds.minLatitude, $lte: bounds.maxLatitude },
      longitude: { $gte: bounds.minLongitude, $lte: bounds.maxLongitude }
    })
      .limit(1000)
      .populate("ownerId", "name profile.username profile.photoUrl verification.isIdentityVerified verification.badge")
      .lean<ListingWithLocation[]>();

    const resources = listings
      .map((listing) => {
        const coordinates = getListingCoordinates(listing);
        if (typeof coordinates.latitude !== "number" || typeof coordinates.longitude !== "number") {
          return null;
        }

        const distanceMeters = getDistance(userLocation, coordinates);
        if (distanceMeters > radiusMeters) return null;

        return toResource(listing, userLocation, distanceMeters);
      })
      .filter((resource): resource is NonNullable<typeof resource> => Boolean(resource))
      .sort((first, second) => (first.distanceKm ?? 0) - (second.distanceKm ?? 0));

    response.status(200).json({ resources });
  });
}
