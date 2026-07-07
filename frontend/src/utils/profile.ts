import { createSellerSlug, type ListingSellerProfile, type ResourceListing, type SellerProfile } from "../data/mvpData";
import type { AuthUser } from "../types/auth";

export type ProfileIdentity = {
  id?: string;
  userId?: string;
  name?: string;
  username?: string;
  slug?: string;
  photoUrl?: string;
  profileImage?: string;
  isVerified?: boolean;
  verificationStatus?: "Verified" | "Unverified";
};

const avatarColors = [
  "#1d4ed8",
  "#047857",
  "#7c2d12",
  "#b91c1c",
  "#6d28d9",
  "#0f766e",
  "#be123c",
  "#854d0e",
  "#374151",
  "#166534"
];

export function getDisplayName(profile: ProfileIdentity | AuthUser | SellerProfile | ListingSellerProfile | null | undefined) {
  if (!profile) return "Zylora member";
  if ("profile" in profile) {
    return profile.profile.organizationName?.trim() || profile.name?.trim() || "Zylora member";
  }
  return profile.name?.trim() || "Zylora member";
}

export function getProfilePhoto(profile: ProfileIdentity | AuthUser | SellerProfile | ListingSellerProfile | null | undefined) {
  if (!profile) return "";
  if ("profile" in profile) return profile.profile.photoUrl?.trim() || "";
  const photoUrl = "photoUrl" in profile ? profile.photoUrl : "";
  const profileImage = "profileImage" in profile ? profile.profileImage : "";
  return (photoUrl || profileImage || "").trim();
}

export function getProfileInitial(name: string) {
  return (name.trim().match(/[A-Za-z0-9]/)?.[0] ?? "Z").toUpperCase();
}

export function getAvatarColor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function getProfileIdentifier(profile: ProfileIdentity | AuthUser | SellerProfile | ListingSellerProfile | null | undefined) {
  if (!profile) return "";
  if ("profile" in profile) return profile.profile.username?.trim() || profile.id;
  const username = "username" in profile ? profile.username?.trim() : "";
  const userId = "userId" in profile ? profile.userId : "";
  const id = "id" in profile ? profile.id : "";
  return username || userId || id || profile.slug || createSellerSlug(profile.name || "seller");
}

export function getProfilePath(profile: ProfileIdentity | AuthUser | SellerProfile | ListingSellerProfile | null | undefined) {
  const identifier = getProfileIdentifier(profile);
  return `/profile/${encodeURIComponent(identifier || "zylora-member")}`;
}

export function listingOwnerIdentity(listing: ResourceListing): ProfileIdentity {
  if (listing.sellerProfile) {
    return {
      id: listing.sellerProfile.userId,
      userId: listing.sellerProfile.userId,
      name: listing.sellerProfile.name,
      slug: listing.sellerProfile.slug,
      photoUrl: listing.sellerProfile.photoUrl,
      verificationStatus: listing.sellerProfile.verificationStatus
    };
  }

  return {
    id: `listing-${listing.id}`,
    name: listing.seller,
    slug: `listing-${listing.id}`,
    verificationStatus: listing.verificationStatus
  };
}
