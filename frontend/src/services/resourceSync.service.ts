import { createResource, loadMyResources, prepareResourceImages } from "./resource.service";
import { loadResources, type ResourceListing } from "../data/mvpData";
import type { AuthUser } from "../types/auth";

const syncedUsers = new Set<string>();
const syncRequests = new Map<string, Promise<void>>();
const localResourceSyncEnabled = import.meta.env.VITE_ENABLE_LOCAL_RESOURCE_SYNC === "true";

export async function syncLocalOwnedResourcesToBackend(user: AuthUser) {
  if (!localResourceSyncEnabled) return;
  if (syncedUsers.has(user.id)) return;
  const inFlight = syncRequests.get(user.id);
  if (inFlight) return inFlight;

  const syncRequest = runResourceSync(user)
    .then(() => {
      syncedUsers.add(user.id);
    })
    .catch((error) => {
      syncedUsers.delete(user.id);
      throw error;
    })
    .finally(() => {
      syncRequests.delete(user.id);
    });

  syncRequests.set(user.id, syncRequest);
  return syncRequest;
}

async function runResourceSync(user: AuthUser) {
  const existing = await loadMyResources().catch(() => []);
  const existingKeys = new Set([
    ...existing.map((resource) => resource.clientResourceId).filter(Boolean),
    ...existing.map((resource) => resource.id).filter(Boolean)
  ]);

  const ownedLocalResources = loadResources()
    .filter((resource) => isLocalResourceOwnedByUser(resource, user))
    .filter((resource) => !existingKeys.has(resource.id));

  await Promise.all(
    ownedLocalResources.map((resource) =>
      createResource({
        clientResourceId: resource.id,
        title: resource.title,
        description: resource.description,
        category: resource.category,
        resourceType: resource.value === "Donation" ? "Donate" : "Sell",
        condition: toApiCondition(resource.condition),
        status: toApiStatus(resource.availabilityStatus),
        city: resource.city || "Local area",
        address: resource.address || resource.city || "Pickup location available on request",
        images: prepareResourceImages(
          resource.media?.filter((item) => item.type === "image").map((item) => item.url) ?? [],
          resource.image
        ),
        latitude: resource.latitude,
        longitude: resource.longitude
      })
    )
  );
}

function isLocalResourceOwnedByUser(resource: ResourceListing, user: AuthUser) {
  const owner = resource.sellerProfile;
  if (!owner) return false;

  return owner.userId === user.id || owner.email?.toLowerCase() === user.email.toLowerCase();
}

function toApiCondition(condition: string): "excellent" | "good" | "fair" | "poor" {
  const normalized = condition.trim().toLowerCase();
  if (normalized.includes("excellent") || normalized.includes("brand new") || normalized.includes("like new")) return "excellent";
  if (normalized.includes("fair") || normalized.includes("damaged")) return "fair";
  if (normalized.includes("poor")) return "poor";
  return "good";
}

function toApiStatus(status: ResourceListing["availabilityStatus"]): "available" | "matched" | "picked_up" | "closed" {
  if (status === "Matched" || status === "Pending Pickup") return "matched";
  if (status === "Closed") return "closed";
  return "available";
}
