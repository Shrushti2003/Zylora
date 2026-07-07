import { Filter, Heart, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { ContactSellerButton } from "../components/common/ContactSellerButton";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { ProfileAvatar } from "../components/common/ProfileAvatar";
import { VerifiedBadge } from "../components/common/VerifiedBadge";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { categories, categoryAliases, loadResources, type ResourceListing } from "../data/mvpData";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getAuthErrorMessage, toggleSavedResourceApi } from "../services/auth.service";
import type { AppDispatch, RootState } from "../store/store";
import { getDisplayName, getProfilePath, listingOwnerIdentity } from "../utils/profile";

export function MarketplacePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const [resources, setResources] = useState<ResourceListing[]>(() => loadResources());
  const [savedIds, setSavedIds] = useState<string[]>(() => user?.savedResourceIds ?? []);
  const [query, setQuery] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => getInitialMarketplaceCategory(searchParams));
  const [filter, setFilter] = useState(() => searchParams.get("filter") ?? "All listings");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "Smart suggestions");
  const [message, setMessage] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const relatedSuggestions = useMemo(() => getRelatedSuggestions(debouncedQuery), [debouncedQuery]);
  const matchingUsers = useMemo(() => {
    const lower = debouncedQuery.toLowerCase().trim();
    if (!lower) return [];
    const unique = new Map<string, ReturnType<typeof listingOwnerIdentity>>();
    resources.forEach((resource) => {
      const owner = listingOwnerIdentity(resource);
      const haystack = [owner.name, owner.username, owner.slug].filter(Boolean).join(" ").toLowerCase();
      if (haystack.includes(lower)) {
        unique.set(owner.userId || owner.id || owner.slug || owner.name || resource.seller, owner);
      }
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [debouncedQuery, resources]);

  useEffect(() => {
    const refresh = () => {
      setResources(loadResources());
      setSavedIds(user?.savedResourceIds ?? []);
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [user?.savedResourceIds]);

  useEffect(() => {
    setSavedIds(user?.savedResourceIds ?? []);
  }, [user?.savedResourceIds]);

  useEffect(() => {
    const nextSearch = searchParams.get("search") ?? "";
    const nextCategory = searchParams.get("category");
    const nextFilter = searchParams.get("filter") ?? "All listings";
    const nextSort = searchParams.get("sort") ?? "Smart suggestions";
    const matchedCategory = nextCategory && categories.some((item) => item.name === nextCategory) ? nextCategory : "All categories";

    setQuery(nextSearch || (matchedCategory === "All categories" ? nextCategory ?? "" : ""));
    setCategory(matchedCategory);
    setFilter(["All listings", "Donation", "Affordable"].includes(nextFilter) ? nextFilter : "All listings");
    setSort(["Smart suggestions", "Nearest first", "Highest trust score", "Expiring soon"].includes(nextSort) ? nextSort : "Smart suggestions");
  }, [searchParams]);

  const visibleResources = useMemo(() => {
    const filtered = resources.filter((resource) => {
      const haystack = [
        resource.title,
        resource.category,
        resource.city,
        resource.seller,
        resource.recipient,
        resource.material,
        resource.value,
        resource.description,
        ...(categoryAliases[resource.category] ?? [])
      ].join(" ").toLowerCase();
      const matchesQuery = haystack.includes(debouncedQuery.toLowerCase());
      const matchesCategory = category === "All categories" || resource.category === category;
      const matchesFilter = filter === "All listings" || resource.value === filter;
      return matchesQuery && matchesCategory && matchesFilter;
    });

    return [...filtered].sort((first, second) => {
      if (sort === "Highest trust score") return second.score - first.score;
      if (sort === "Nearest first") return first.city.localeCompare(second.city);
      if (sort === "Expiring soon") return first.expiry.localeCompare(second.expiry);
      return second.score - first.score;
    });
  }, [category, debouncedQuery, filter, resources, sort]);

  async function handleToggleSaved(resourceId: string) {
    if (!user) {
      setMessage("Please sign in to save resources.");
      return;
    }

    try {
      const next = await toggleSavedResourceApi(resourceId);
      setSavedIds(next);
      if (user) {
        dispatch(setAuthenticatedUser({ ...user, savedResourceIds: next }));
      }
      setMessage(next.includes(resourceId) ? "Saved to your resources." : "Removed from saved resources.");
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    }
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Browse items"
        title="Find resources worth reusing."
        description="Browse nearby resources to buy, sell, donate, request, save, or coordinate through Zylora's circular economy marketplace."
        image="/Browse.png"
        imageAlt="Real-world resource sorting and logistics operation"
      >
        <SurfaceCard className="mb-6">
          <div className="advanced-search">
            <label>
              <Search className="h-5 w-5 text-primary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, category, city, NGO, school, seller, or material type"
              />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
              <option>All categories</option>
              {categories.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter listings">
              <option>All listings</option>
              <option>Donation</option>
              <option>Affordable</option>
            </select>
          </div>
          <div className="suggestion-row">
            <span className="flex items-center gap-2 font-bold text-primary"><Sparkles className="h-4 w-4" /> {sort}</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort listings">
              <option>Smart suggestions</option>
              <option>Nearest first</option>
              <option>Highest trust score</option>
              <option>Expiring soon</option>
            </select>
            {["Clothes", "Food", "Furniture", "Construction Materials", "Books", "School Supplies", "Medical Supplies", "Electronics", "Kitchen Items", "Agriculture", "Event Supplies", "Baking Equipment"].map((item) => (
              <button key={item} type="button" onClick={() => setQuery(item)}>{item}</button>
            ))}
            {relatedSuggestions.map((item) => (
              <button key={item} type="button" onClick={() => setQuery(item)}>{item}</button>
            ))}
            <button type="button" onClick={() => { setQuery(""); setCategory("All categories"); setFilter("All listings"); }}>
              <Filter className="h-4 w-4" /> Reset filters
            </button>
          </div>
          <div className="category-strip">
            {categories.map((item) => (
              <button key={item.name} type="button" className={category === item.name ? "active" : ""} onClick={() => setCategory(item.name)}>
                <strong>{item.name}</strong>
                <span>{item.examples.join(", ")}</span>
              </button>
            ))}
          </div>
          {message ? <p className="auth-help mt-3">{message}</p> : null}
        </SurfaceCard>
        {matchingUsers.length ? (
          <SurfaceCard className="mb-6">
            <h2 className="text-2xl font-semibold">Users</h2>
            <div className="user-search-results">
              {matchingUsers.map((owner) => (
                <Link key={owner.userId || owner.id || owner.slug || owner.name} to={getProfilePath(owner)} className="user-search-result">
                  <ProfileAvatar profile={owner} className="seller-photo-empty" />
                  <span>
                    <strong>{getDisplayName(owner)}</strong>
                    <em>{owner.slug ? `@${owner.slug}` : "Zylora profile"}</em>
                  </span>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        ) : null}
        <div className="grid gap-5 md:grid-cols-3">
          {visibleResources.map((resource) => {
            const owner = listingOwnerIdentity(resource);
            return (
            <SurfaceCard key={resource.id} className="overflow-hidden p-0">
              <div className="listing-card-link">
                {resource.media?.[0]?.type === "video" ? <video className="h-44 w-full object-cover" src={resource.media[0].url} controls /> : <img className="h-44 w-full object-cover" src={resource.image} alt={resource.title} />}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link to={`/items/${resource.id}`} className="text-xl font-semibold text-on-surface">{resource.title}</Link>
                      <p className="mt-1 text-sm text-on-surface-variant">{resource.category} - {resource.condition}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {resource.city}
                    </span>
                    <span className="font-semibold text-secondary">{resource.value}</span>
                  </div>
                  <Link to={getProfilePath(owner)} className="seller-mini-link">
                    <ProfileAvatar profile={owner} className="seller-photo-empty" />
                    <span>{getDisplayName(owner)}</span>
                    {owner.verificationStatus === "Verified" || owner.isVerified ? <VerifiedBadge small /> : null}
                  </Link>
                  <p className="mt-3 text-sm text-on-surface-variant">Match: {resource.recipient}</p>
                  {resource.price ? <p className="mt-2 text-sm font-bold text-primary">{resource.price}</p> : null}
                </div>
              </div>
              <div className="listing-actions compact">
                <button type="button" className={savedIds.includes(resource.id) ? "saved-heart heart-only" : "heart-only"} onClick={() => handleToggleSaved(resource.id)} aria-label={savedIds.includes(resource.id) ? "Remove from wishlist" : "Add to wishlist"}>
                  <Heart className="h-4 w-4" fill={savedIds.includes(resource.id) ? "currentColor" : "none"} />
                </button>
                <ContactSellerButton seller={owner} listingId={resource.id} listingTitle={resource.title} onError={setMessage} />
                <Link to={`/items/${resource.id}`}>Details</Link>
              </div>
            </SurfaceCard>
          );
          })}
          {!visibleResources.length ? (
            <SurfaceCard>
              <h2 className="text-2xl font-semibold">No matching resources</h2>
              <p className="mt-2">Try another product, category, city, NGO, school, seller, or material type.</p>
            </SurfaceCard>
          ) : null}
        </div>
      </PageShell>
    </PlatformLayout>
  );
}

function getInitialMarketplaceCategory(searchParams: URLSearchParams) {
  const requestedCategory = searchParams.get("category");
  return requestedCategory && categories.some((item) => item.name === requestedCategory) ? requestedCategory : "All categories";
}

function getRelatedSuggestions(query: string) {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  if (/(house|home|building|renovation|construction)/.test(lower)) return ["Cement", "Tiles", "Bricks", "Steel", "Paint", "Pipes"];
  if (/(school|class|student|education)/.test(lower)) return ["Books", "Notebooks", "Stationery", "Uniforms", "Desks", "Bags"];
  if (/(kitchen|food|meal|cafe)/.test(lower)) return ["Utensils", "Ovens", "Trays", "Mixers", "Groceries", "Storage boxes"];
  if (/(office|work|desk)/.test(lower)) return ["Office chairs", "Printers", "Desks", "Cabinets", "Monitors", "Projectors"];
  return [];
}
