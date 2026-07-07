import { Eye, Grid2X2, Heart, List, PackagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ContactSellerButton } from "../components/common/ContactSellerButton";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import { getAuthErrorMessage, toggleSavedResourceApi } from "../services/auth.service";
import { deleteResource, loadMyResources, type OwnedResource } from "../services/resource.service";
import { loadPublicProfilePosts, type PublicUserPost, type PublicUserProfile } from "../services/user.service";
import type { AppDispatch, RootState } from "../store/store";
import type { AuthUser } from "../types/auth";
import type { ProfileIdentity } from "../utils/profile";

type ViewMode = "grid" | "list";

export function UserPostsPage() {
  const { identifier = "" } = useParams();
  const signedInUser = useSelector((root: RootState) => root.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<PublicUserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingPostId, setSavingPostId] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    if (!identifier) {
      if (!signedInUser) {
        setProfile(null);
        setPosts([]);
        setIsLoading(false);
        return () => {
          isMounted = false;
        };
      }

      loadMyResources()
        .then((resources) => {
          if (!isMounted) return;
          const posts = resources.map((resource) => ownedResourceToPost(resource, signedInUser));
          setProfile(authUserToPublicProfile(signedInUser, posts.length));
          setPosts(posts);
        })
        .catch(() => {
          if (!isMounted) return;
          setProfile(authUserToPublicProfile(signedInUser, 0));
          setPosts([]);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }

    loadPublicProfilePosts(identifier)
      .then(({ user, posts }) => {
        if (!isMounted) return;
        const sellerPosts = posts.filter((post) => post.authorId === user.id || post.author?.id === user.id);
        setProfile({ ...user, postCount: sellerPosts.length });
        setPosts(sellerPosts);
      })
      .catch(() => {
        if (!isMounted) return;
        setProfile(null);
        setPosts([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [identifier, signedInUser]);

  const sortedPosts = useMemo(() => [...posts].sort((first, second) => {
    return new Date(second.createdAt ?? second.datePosted ?? 0).getTime() - new Date(first.createdAt ?? first.datePosted ?? 0).getTime();
  }), [posts]);
  const isOwnProfile = Boolean(signedInUser && profile && (
    signedInUser.id === profile.id ||
    signedInUser.profile?.username?.toLowerCase() === profile.username.toLowerCase()
  ));

  async function removePost(post: PublicUserPost) {
    const confirmed = window.confirm(`Delete "${post.title}"? This removes the listing from your posts and marketplace data.`);
    if (!confirmed) return;

    await deleteResource(post.id, post.clientResourceId);
    setPosts((current) => current.filter((item) => item.id !== post.id));
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

  if (isLoading) {
    return (
      <PlatformLayout>
        <section className="organic-shell platform-content">
          <SurfaceCard>Loading posts...</SurfaceCard>
        </section>
      </PlatformLayout>
    );
  }

  if (!profile) {
    return (
      <PlatformLayout>
        <section className="organic-shell platform-content">
          <SurfaceCard>
            <h1 className="text-2xl font-semibold">Posts not found</h1>
            <p className="mt-2 text-on-surface-variant">This profile is unavailable or private.</p>
          </SurfaceCard>
        </section>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <PageShell eyebrow="Posts" title="Posts" description="Listings created by this user.">
        {sortedPosts.length ? (
          <SurfaceCard className="user-posts-toolbar">
            <span>{sortedPosts.length} {sortedPosts.length === 1 ? "post" : "posts"}</span>
            <div className="view-toggle" aria-label="Post view mode">
              <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view"><Grid2X2 className="h-4 w-4" /></button>
              <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="List view"><List className="h-4 w-4" /></button>
            </div>
          </SurfaceCard>
        ) : null}

        <div className={viewMode === "grid" ? "user-post-grid" : "user-post-list"}>
          {!sortedPosts.length ? (
            <SurfaceCard className="profile-posts-empty">
              <div className="profile-posts-empty-illustration" aria-hidden="true">
                <span />
                <PackagePlus className="h-9 w-9" />
              </div>
              <h3>No active listings yet.</h3>
              <p>This seller has not posted any active listings.</p>
            </SurfaceCard>
          ) : null}
          {sortedPosts.map((post) => (
            <SurfaceCard key={post.id} className="user-post-card">
              {post.images[0] ? <img src={post.images[0]} alt={post.title} /> : <div className="profile-post-image-fallback"><PackagePlus className="h-7 w-7" /></div>}
              <div>
                <span className="status-pill">{formatPostStatus(post.status)}</span>
                <h3>{post.title}</h3>
                <p>{post.category}</p>
                <div className="listing-meta">
                  <span>{post.resourceType || "Sell"}</span>
                  <span>{post.city || post.address || "Location available on request"}</span>
                  <span>{new Date(post.createdAt ?? post.datePosted ?? Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="profile-post-actions">
                  {profile ? (
                    <>
                      <button type="button" className={signedInUser?.savedResourceIds.includes(post.id) ? "saved-heart heart-only" : "heart-only"} disabled={savingPostId === post.id} onClick={() => void toggleSavedPost(post.id)} aria-label={signedInUser?.savedResourceIds.includes(post.id) ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={signedInUser?.savedResourceIds.includes(post.id) ?? false}>
                        <Heart className="h-4 w-4" fill={signedInUser?.savedResourceIds.includes(post.id) ? "currentColor" : "none"} />
                      </button>
                      <ContactSellerButton seller={postToProfileIdentity(post, profile)} listingId={post.id} listingTitle={post.title} />
                    </>
                  ) : null}
                  {isOwnProfile ? (
                    <>
                      <Link to={`/items/${post.id}`}>
                        <Eye className="h-4 w-4" /> Details
                      </Link>
                      <button type="button" className="profile-post-delete-button" onClick={() => void removePost(post)} aria-label={`Delete ${post.title}`} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <Link to={`/items/${post.id}`}>Details</Link>
                  )}
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </PageShell>
    </PlatformLayout>
  );
}

function formatPostStatus(status = "available") {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function authUserToPublicProfile(user: AuthUser, postCount: number): PublicUserProfile {
  return {
    id: user.id,
    name: user.profile.organizationName || user.name,
    email: user.preferences.privacy.showEmail ? user.email : "",
    username: user.profile.username,
    bio: user.profile.bio,
    organizationName: user.profile.organizationName,
    profileImage: user.profile.photoUrl,
    photoUrl: user.profile.photoUrl,
    location: user.profile.location,
    joinedAt: undefined,
    postCount,
    savedResourceCount: user.preferences.privacy.showSavedResources ? user.savedResourceIds.length : null,
    isOnlineVisible: user.preferences.privacy.showOnlineStatus,
    allowMessageRequests: user.preferences.privacy.allowMessageRequests,
    isVerified: user.verification.isIdentityVerified,
    badge: user.verification.badge
  };
}

function ownedResourceToPost(resource: OwnedResource, user: AuthUser): PublicUserPost {
  return {
    id: resource.id,
    clientResourceId: resource.clientResourceId,
    authorId: user.id,
    title: resource.title,
    description: resource.description,
    category: resource.category,
    resourceType: resource.resourceType || "Sell",
    condition: resource.condition,
    status: resource.status,
    city: resource.city,
    address: resource.address,
    location: resource.city || resource.address,
    images: resource.images.filter(Boolean),
    datePosted: resource.datePosted,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    views: resource.views ?? 0,
    likes: 0,
    comments: 0,
    saveCount: 0,
    shareCount: 0,
    author: authUserToPublicProfile(user, 0)
  };
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
