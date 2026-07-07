import { CalendarDays, Grid2X2, Heart, PackageCheck, PackagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ContactSellerButton } from "../components/common/ContactSellerButton";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { ProfileAvatar } from "../components/common/ProfileAvatar";
import { VerifiedBadge } from "../components/common/VerifiedBadge";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { createSellerSlug, getListingsBySellerSlug, getSellerProfile, getSellerProfileBySlug, loadResources, type ResourceListing } from "../data/mvpData";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import { getAuthErrorMessage, toggleSavedResourceApi } from "../services/auth.service";
import { deleteResource } from "../services/resource.service";
import { loadPublicProfilePosts, type PublicUserPost, type PublicUserProfile } from "../services/user.service";
import type { AppDispatch, RootState } from "../store/store";
import type { ProfileIdentity } from "../utils/profile";
import { getProfilePath } from "../utils/profile";

type ProfileState = {
  profile: PublicUserProfile;
};

const tabs = ["Posts", "Donations", "Sold Items"] as const;
const profileSectionDescriptions: Record<(typeof tabs)[number], string> = {
  Posts: "Discover community updates, sustainability insights, and inspiring stories shared by this member.",
  Donations: "Every donation tells a story of reducing waste and creating positive environmental impact.",
  "Sold Items": "A record of successfully exchanged items that helped extend product lifecycles and reduce waste."
};

export function PublicProfilePage() {
  const { identifier = "" } = useParams();
  const signedInUser = useSelector((root: RootState) => root.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [state, setState] = useState<ProfileState | null>(null);
  const [remotePosts, setRemotePosts] = useState<PublicUserPost[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Posts");
  const [savingPostId, setSavingPostId] = useState("");

  useEffect(() => {
    let isMounted = true;
    setStatus("loading");

    loadProfileWithPosts(identifier)
      .then(([profile, postResult]) => {
        if (!isMounted) return;
        setState({ profile });
        setRemotePosts(postResult?.posts ?? []);
        setStatus("ready");
      })
      .catch(() => {
        if (!isMounted) return;
        setState(null);
        setStatus("missing");
      });
    return () => {
      isMounted = false;
    };
  }, [identifier, signedInUser]);

  const visiblePosts = useMemo(() => {
    const profileId = state?.profile.id;
    if (!profileId) return [];

    return remotePosts.filter((post) => post.authorId === profileId || post.author?.id === profileId);
  }, [remotePosts, state?.profile.id]);
  const tabPosts = useMemo(() => {
    if (activeTab === "Donations") {
      return visiblePosts.filter(isDonationTabPost);
    }

    if (activeTab === "Sold Items") {
      return visiblePosts.filter(isSoldItemTabPost);
    }

    return visiblePosts;
  }, [activeTab, visiblePosts]);

  if (status === "loading") {
    return (
      <PlatformLayout>
        <section className="organic-shell platform-content">
          <SurfaceCard>Loading profile...</SurfaceCard>
        </section>
      </PlatformLayout>
    );
  }

  if (!state) {
    return (
      <PlatformLayout>
        <section className="organic-shell platform-content">
          <SurfaceCard>
            <h1 className="text-2xl font-semibold">Profile not found</h1>
            <p className="mt-2 text-on-surface-variant">This public profile is unavailable or private.</p>
            <Link to="/marketplace" className="organic-button primary mt-4">Browse marketplace</Link>
          </SurfaceCard>
        </section>
      </PlatformLayout>
    );
  }

  const profile = state.profile;
  const displayName = profile.organizationName || profile.name;
  const postCount = visiblePosts.length;
  const isOwnProfile = Boolean(signedInUser && (
    signedInUser.id === profile.id ||
    signedInUser.profile?.username?.toLowerCase() === profile.username.toLowerCase()
  ));

  async function removePost(post: PublicUserPost) {
    const confirmed = window.confirm(`Delete "${post.title}"? This removes the listing from your posts and marketplace data.`);
    if (!confirmed) return;

    await deleteResource(post.id, post.clientResourceId);
    setRemotePosts((current) => current.filter((item) => item.id !== post.id));
  }

  async function toggleSavedPost(postId: string) {
    if (!signedInUser) {
      navigate("/login");
      return;
    }

    setSavingPostId(postId);
    try {
      const savedResourceIds = await toggleSavedResourceApi(postId);
      dispatch(setAuthenticatedUser({ ...signedInUser, savedResourceIds }));
    } catch (error) {
      console.warn(getAuthErrorMessage(error, "Could not update wishlist."));
    } finally {
      setSavingPostId("");
    }
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Public profile"
        title={displayName}
        description={profile.bio || `${displayName} shares resources and community activity on Zylora.`}
      >
        <section className="public-profile-cover">
          <div className="public-profile-banner" />
          <div className="public-profile-header">
            <ProfileAvatar profile={{ id: profile.id, name: displayName, photoUrl: profile.photoUrl }} className="public-profile-avatar" />
            <div>
              <div className="public-profile-title-row">
                <h2>{displayName}</h2>
                {profile.isVerified ? <VerifiedBadge className="profile-card-verified-icon" /> : null}
              </div>
              {profile.username ? <p>@{profile.username}</p> : null}
              <span><CalendarDays className="h-4 w-4" /> Joined {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : "Zylora"}</span>
            </div>
            <Link to={`${getProfilePath({ id: profile.id, username: profile.username, name: displayName })}/posts`} className="organic-button primary">
              <Grid2X2 className="h-4 w-4" /> Posts
            </Link>
          </div>
          {profile.bio ? <p className="public-profile-bio">{profile.bio}</p> : null}
          <div className="public-profile-stats">
            <span><strong>{postCount}</strong> Posts</span>
            {profile.savedResourceCount !== null ? <span><strong>{profile.savedResourceCount}</strong> Saved</span> : null}
          </div>
        </section>

        <div className="profile-tabs" role="tablist" aria-label="Profile sections">
          {tabs.map((tab) => (
            <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="profile-post-grid mt-5">
          {tabPosts.map((post) => (
            <article key={post.id} className="profile-post-card">
              {post.images[0] ? (
                <img src={post.images[0]} alt={post.title} />
              ) : (
                <div className="profile-post-image-fallback"><PackagePlus className="h-7 w-7" /></div>
              )}
              <div className="profile-post-card-body">
                <div>
                  <span className="status-pill">{formatPostStatus(post.status)}</span>
                  <h3>{post.title}</h3>
                  <p>{post.category}</p>
                </div>
                <div className="profile-post-meta">
                  <span>{post.resourceType || "Sell"}</span>
                  <span>{post.city || post.address || "Location available on request"}</span>
                  <span>{formatDate(post.createdAt ?? post.datePosted)}</span>
                  <span>{post.views ?? 0} views</span>
                </div>
                <div className="profile-post-actions">
                  <button type="button" className={signedInUser?.savedResourceIds.includes(post.id) ? "saved-heart heart-only" : "heart-only"} disabled={savingPostId === post.id} onClick={() => void toggleSavedPost(post.id)} aria-label={signedInUser?.savedResourceIds.includes(post.id) ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={signedInUser?.savedResourceIds.includes(post.id) ?? false}>
                    <Heart className="h-4 w-4" fill={signedInUser?.savedResourceIds.includes(post.id) ? "currentColor" : "none"} />
                  </button>
                  <ContactSellerButton seller={postToProfileIdentity(post, profile)} listingId={post.id} listingTitle={post.title} />
                  {isOwnProfile ? (
                    <>
                      <Link to={`/items/${post.id}`}>
                        <PackageCheck className="h-4 w-4" /> Details
                      </Link>
                      <button type="button" className="profile-post-delete-button" onClick={() => void removePost(post)} aria-label={`Delete ${post.title}`} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <Link to={`/items/${post.id}`}>
                      <PackageCheck className="h-4 w-4" /> Details
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!tabPosts.length ? (
            <SurfaceCard className="profile-posts-empty">
              <div className="profile-posts-empty-illustration" aria-hidden="true">
                <span />
                <PackagePlus className="h-9 w-9" />
              </div>
              <h3>{emptyStateTitle(activeTab)}</h3>
              <p>{profileSectionDescriptions[activeTab]}</p>
            </SurfaceCard>
          ) : null}
        </div>
      </PageShell>
    </PlatformLayout>
  );
}

function formatDate(value?: string) {
  if (!value) return "Date not available";
  return new Date(value).toLocaleDateString();
}

function formatPostStatus(status = "available") {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function loadProfileWithPosts(identifier: string): Promise<[PublicUserProfile, { posts: PublicUserPost[] }]> {
  try {
    const postResult = await loadPublicProfilePosts(identifier);
    return [postResult.user, { posts: postResult.posts }];
  } catch (error) {
    const local = loadLocalProfileWithPosts(identifier);
    if (local) return local;
    throw error;
  }
}

function loadLocalProfileWithPosts(identifier: string): [PublicUserProfile, { posts: PublicUserPost[] }] | null {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  if (!normalizedIdentifier) return null;

  const listingId = normalizedIdentifier.startsWith("listing-") ? identifier.trim().slice("listing-".length) : "";
  const localListing = listingId
    ? loadResources().find((resource) => resource.id.toLowerCase() === listingId.toLowerCase())
    : null;
  const localListings = localListing ? [localListing] : getListingsBySellerSlug(normalizedIdentifier).slice(0, 1);
  if (!localListings.length) return null;

  const sellerSlug = createSellerSlug(localListings[0].seller);
  const seller = getSellerProfileBySlug(sellerSlug) ?? getSellerProfile(localListings[0].seller);
  const profileId = listingId ? `listing-${localListings[0].id}` : seller.id;
  const profile: PublicUserProfile = {
    id: profileId,
    name: seller.name,
    email: seller.contact.showEmail ? seller.contact.email ?? "" : "",
    username: listingId ? `listing-${localListings[0].id}` : seller.slug,
    bio: seller.bio,
    organizationName: "",
    profileImage: seller.photoUrl,
    photoUrl: seller.photoUrl,
    location: seller.contact.location,
    joinedAt: localListings[0].postedAt,
    postCount: localListings.length,
    savedResourceCount: null,
    isOnlineVisible: true,
    allowMessageRequests: true,
    isVerified: seller.verificationStatus === "Verified",
    badge: seller.verificationStatus === "Verified" ? "verified" : "unverified"
  };

  return [profile, { posts: localListings.map((listing) => localListingToPost(listing, profile)) }];
}

function localListingToPost(listing: ResourceListing, profile: PublicUserProfile): PublicUserPost {
  return {
    id: listing.id,
    authorId: profile.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    resourceType: listing.value === "Donation" ? "Donate" : "Sell",
    condition: listing.condition,
    status: listing.availabilityStatus,
    city: listing.city,
    address: listing.address,
    location: listing.city || listing.address,
    images: listing.media?.filter((media) => media.type === "image").map((media) => media.url) ?? [listing.image],
    datePosted: listing.postedAt,
    createdAt: listing.postedAt,
    views: 0,
    likes: 0,
    comments: 0,
    saveCount: 0,
    shareCount: 0,
    author: profile
  };
}

function isDonationTabPost(post: PublicUserPost) {
  if (isSoldItemTabPost(post)) return false;

  const text = `${post.title} ${post.category} ${post.description}`.toLowerCase();
  return post.resourceType === "Donate" || text.includes("glass");
}

function isSoldItemTabPost(post: PublicUserPost) {
  const text = `${post.title} ${post.category} ${post.description}`.toLowerCase();
  const status = post.status.toLowerCase();
  return text.includes("book") || status === "sold" || status === "closed" || status === "picked_up";
}

function emptyStateTitle(tab: (typeof tabs)[number]) {
  if (tab === "Donations") return "No donations yet.";
  if (tab === "Sold Items") return "No sold items yet.";
  return "No active listings yet.";
}

function postToProfileIdentity(post: PublicUserPost, profile: PublicUserProfile): ProfileIdentity {
  const author = post.author ?? profile;
  return {
    id: author.id || post.authorId || profile.id,
    userId: author.id || post.authorId || profile.id,
    name: author.organizationName || author.name || profile.organizationName || profile.name,
    username: author.username || profile.username,
    photoUrl: author.photoUrl || author.profileImage || profile.photoUrl || profile.profileImage,
    isVerified: author.isVerified ?? profile.isVerified,
    verificationStatus: author.isVerified || profile.isVerified ? "Verified" : "Unverified"
  };
}
