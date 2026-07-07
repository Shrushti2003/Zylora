import { CalendarDays, CheckCircle2, MapPin, MessageCircle, PackageCheck, Truck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { ContactSellerButton } from "../components/common/ContactSellerButton";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { VerifiedBadge } from "../components/common/VerifiedBadge";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { getSellerProfile, loadResources, type ResourceListing, type ResourceMedia } from "../data/mvpData";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import { refreshCurrentUser } from "../services/auth.service";
import { loadResource, type OwnedResource } from "../services/resource.service";
import type { AppDispatch, RootState } from "../store/store";
import type { AuthUser } from "../types/auth";
import { getProfilePath, listingOwnerIdentity } from "../utils/profile";

export function ItemDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const signedInUser = useSelector((state: RootState) => state.auth.user);
  const localItem = useMemo(() => loadResources().find((resource) => resource.id === id), [id]);
  const [remoteItem, setRemoteItem] = useState<OwnedResource | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(Boolean(id && !localItem));

  useEffect(() => {
    let isMounted = true;

    if (!id || localItem) {
      setRemoteItem(null);
      setIsLoadingRemote(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingRemote(true);
    loadResource(id)
      .then((resource) => {
        if (isMounted) setRemoteItem(resource);
      })
      .catch(() => {
        if (isMounted) setRemoteItem(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRemote(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, localItem]);

  useEffect(() => {
    if (!localItem || !signedInUser || !isListingOwnedByUser(localItem, signedInUser)) return;

    refreshCurrentUser()
      .then((freshUser) => {
        if (freshUser) dispatch(setAuthenticatedUser(freshUser));
      })
      .catch(() => undefined);
  }, [dispatch, localItem, signedInUser]);

  const item = localItem ? localListingToDetails(localItem, signedInUser) : remoteItem ? remoteResourceToDetails(remoteItem) : null;

  if (isLoadingRemote) {
    return (
      <PlatformLayout>
        <section className="organic-shell platform-content">
          <SurfaceCard>Loading listing details...</SurfaceCard>
        </section>
      </PlatformLayout>
    );
  }

  if (!item) {
    return (
      <PlatformLayout>
        <PageShell
          eyebrow="Item not found"
          title="This listing is no longer available."
          description="The resource may have been removed, completed, or the link may be incorrect."
        >
          <SurfaceCard>
            <h2 className="text-2xl font-semibold">Try another resource</h2>
            <p className="mt-2 text-on-surface-variant">Browse the marketplace or use the map to find active listings nearby.</p>
            <div className="hero-actions">
              <Link className="organic-button primary" to="/marketplace">Explore Marketplace</Link>
              <Link className="organic-button secondary" to="/resource-map">View Map</Link>
            </div>
          </SurfaceCard>
        </PageShell>
      </PlatformLayout>
    );
  }
  const isExpired = item.expiryDate ? new Date(`${item.expiryDate}T23:59:59`).getTime() < Date.now() : false;
  const owner = item.owner;
  const detailHighlights = [
    { label: `Available in ${item.city}`, icon: <MapPin className="h-6 w-6 text-secondary" /> },
    { label: `Verified ${item.condition} condition`, icon: <CheckCircle2 className="h-6 w-6 text-secondary" /> },
    {
      label: `${item.verificationStatus} owner`,
      icon: item.verificationStatus === "Verified" ? <VerifiedBadge small /> : <UserRound className="h-6 w-6 text-secondary" />
    },
    { label: `Posted ${new Date(item.postedAt).toLocaleDateString()}`, icon: <CalendarDays className="h-6 w-6 text-secondary" /> },
    { label: `${item.quantity}`, icon: <PackageCheck className="h-6 w-6 text-secondary" /> },
    { label: `Posted by ${owner.name}`, icon: <UserRound className="h-6 w-6 text-secondary" /> },
    { label: "Pickup van recommended", icon: <Truck className="h-6 w-6 text-secondary" /> },
    { label: "Contact", icon: <MessageCircle className="h-6 w-6 text-secondary" /> }
  ];

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Item details"
        title={item.title}
        description={item.description}
        image={item.image}
        imageAlt={item.title}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <SurfaceCard className="platform-image-card">
            {item.media?.[0]?.type === "video" ? <video src={item.media[0].url} controls /> : <img src={item.image} alt={item.title} />}
            {item.media && item.media.length > 1 ? (
              <div className="media-preview-grid p-4">
                {item.media.map((media) => (
                  <div key={media.id} className="media-preview-tile static">
                    {media.type === "video" ? <video src={media.url} controls /> : <img src={media.url} alt={media.name} />}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="p-6">
              <h2 className="text-2xl font-semibold">Material summary</h2>
              <p className="mt-3 leading-7 text-on-surface-variant">
                {item.description} Quantity: {item.quantity}. Value type: {item.value}. Suggested match: {item.recipient}.
              </p>
              <div className="detail-grid">
                {[
                  ["Resource Type", item.value],
                  ["Item Price", item.price ?? (item.value === "Donation" ? "Donation" : "Not specified")],
                  ["Category", item.category],
                  ["Quantity", item.quantity],
                  ["Condition", item.condition],
                  ["Pickup Location", item.address],
                  ["City", item.city],
                  ["Address", item.address],
                  ["Posted By", owner.name],
                  ["Organization/User Name", owner.name],
                  ["Verification Status", item.verificationStatus],
                  ["Date Posted", new Date(item.postedAt).toLocaleDateString()],
                  ["Expiry Status", isExpired ? "Expired" : item.expiry],
                  ["Availability Status", item.availabilityStatus]
                ].map(([label, value]) => (
                  <span key={label}>
                    <strong>{label}</strong>
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </SurfaceCard>
          <div className="space-y-4">
            {detailHighlights.map(({ label, icon }) => (
              <SurfaceCard key={label}>
                {icon}
                {label === "Contact" ? (
                  <ContactSellerButton className="mt-3 font-semibold contact-link-button" seller={owner} listingId={id} listingTitle={item.title}>
                    Contact
                  </ContactSellerButton>
                ) : <p className="mt-3 font-semibold">{label}</p>}
              </SurfaceCard>
            ))}
            <SurfaceCard>
              <UserRound className="h-6 w-6 text-secondary" />
              <Link to={getProfilePath(owner)} className="mt-3 block font-semibold">{owner.name}</Link>
            </SurfaceCard>
          </div>
        </div>
      </PageShell>
    </PlatformLayout>
  );
}

type DetailOwner = {
  id: string;
  name: string;
  username?: string;
  photoUrl?: string;
  isVerified?: boolean;
  badge?: string;
  verificationStatus?: "Verified" | "Unverified";
};

type DetailItem = {
  title: string;
  description: string;
  image: string;
  media?: ResourceMedia[];
  value: string;
  price: string;
  category: string;
  quantity: string;
  condition: string;
  address: string;
  city: string;
  verificationStatus: string;
  postedAt: string;
  expiry: string;
  expiryDate?: string;
  availabilityStatus: string;
  recipient: string;
  owner: DetailOwner;
};

function localListingToDetails(item: ResourceListing, signedInUser: AuthUser | null): DetailItem {
  const liveOwner = signedInUser && isListingOwnedByUser(item, signedInUser) ? signedInUser : null;
  const liveVerificationStatus = liveOwner?.verification?.isIdentityVerified ? "Verified" : null;
  const sellerProfile = item.sellerProfile ? {
    ...getSellerProfile(item.sellerProfile.name),
    ...item.sellerProfile,
    bio: item.sellerProfile.bio || getSellerProfile(item.sellerProfile.name).bio
  } : getSellerProfile(item.seller);

  const owner = listingOwnerIdentity(item);

  return {
    title: item.title,
    description: item.description,
    image: item.image,
    media: item.media,
    value: item.value,
    price: item.price ?? (item.value === "Donation" ? "Donation" : "Not specified"),
    category: item.category,
    quantity: item.quantity,
    condition: item.condition,
    address: item.address,
    city: item.city,
    verificationStatus: liveVerificationStatus ?? item.sellerProfile?.verificationStatus ?? item.verificationStatus,
    postedAt: item.postedAt,
    expiry: item.expiry,
    expiryDate: item.expiryDate,
    availabilityStatus: item.availabilityStatus,
    recipient: item.recipient,
    owner: {
      ...owner,
      id: owner.id ?? item.sellerProfile?.userId ?? item.sellerProfile?.email ?? item.id,
      name: liveOwner?.profile.organizationName || liveOwner?.name || sellerProfile.name,
      photoUrl: liveOwner?.profile.photoUrl || owner.photoUrl,
      isVerified: liveOwner?.verification?.isIdentityVerified ?? owner.isVerified,
      verificationStatus: liveVerificationStatus ?? owner.verificationStatus
    }
  };
}

function isListingOwnedByUser(listing: ResourceListing, user: AuthUser) {
  const owner = listing.sellerProfile;
  const userNames = [user.name, user.profile.organizationName]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().toLowerCase());

  return owner?.userId === user.id ||
    owner?.email?.toLowerCase() === user.email.toLowerCase() ||
    userNames.includes(owner?.name?.trim().toLowerCase() ?? "") ||
    userNames.includes(listing.seller.trim().toLowerCase());
}

function remoteResourceToDetails(item: OwnedResource): DetailItem {
  const owner = item.owner;
  return {
    title: item.title,
    description: item.description,
    image: item.images[0] ?? "",
    media: item.images.map((url, index) => ({
      id: `${item.id}-image-${index}`,
      type: "image",
      url,
      name: `${item.title} image ${index + 1}`
    })),
    value: item.resourceType === "Donate" ? "Donation" : "Affordable",
    price: item.resourceType === "Donate" ? "Donation" : "Not specified",
    category: item.category,
    quantity: "Quantity available on request",
    condition: item.condition,
    address: item.address || item.city,
    city: item.city,
    verificationStatus: owner?.isVerified ? "Verified" : "Unverified",
    postedAt: item.createdAt ?? item.datePosted ?? new Date().toISOString(),
    expiry: "No expiry",
    availabilityStatus: item.status,
    recipient: item.resourceType === "Donate" ? "Donation recipients" : "Buyer marketplace",
    owner: {
      id: owner?.id ?? "",
      name: owner?.name ?? "Zylora member",
      username: owner?.username,
      photoUrl: owner?.photoUrl,
      isVerified: owner?.isVerified,
      badge: owner?.badge
    }
  };
}
