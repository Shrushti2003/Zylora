import { Heart, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ContactSellerButton } from "../components/common/ContactSellerButton";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { loadResources } from "../data/mvpData";
import { projectPhotos } from "../data/visuals";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import { toggleSavedResourceApi } from "../services/auth.service";
import type { AppDispatch, RootState } from "../store/store";
import { listingOwnerIdentity } from "../utils/profile";

export function SavedResourcesPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const [removingId, setRemovingId] = useState("");

  const resources = useMemo(() => {
    const saved = new Set(user?.savedResourceIds ?? []);
    return loadResources().filter((resource) => saved.has(resource.id));
  }, [user?.savedResourceIds]);

  async function removeSaved(resourceId: string) {
    setRemovingId(resourceId);
    const savedResourceIds = await toggleSavedResourceApi(resourceId);
    if (user) {
      dispatch(setAuthenticatedUser({ ...user, savedResourceIds }));
    }
    setRemovingId("");
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Saved resources"
        title="Your saved resources, ready when you are."
        description="Review saved donation and affordable listings, contact owners, and open details without searching again."
        image={projectPhotos.community}
        imageAlt="Community resource handoff"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {resources.map((resource) => (
            <SurfaceCard key={resource.id} className="saved-resource-card overflow-hidden p-0">
              <img className="h-40 w-full object-cover" src={resource.image} alt={resource.title} />
              <div className="p-4">
                <Heart className="h-5 w-5 text-red-600" fill="currentColor" />
                <h2 className="mt-3 text-lg font-semibold">{resource.title}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{resource.category} - {resource.price ?? resource.value}</p>
                <p className="mt-2 text-sm text-on-surface-variant">Seller: {resource.seller}</p>
                <p className="mt-3 flex items-center gap-1 text-sm text-on-surface-variant"><MapPin className="h-4 w-4" /> {resource.city}</p>
                <div className="listing-actions compact saved-resource-actions">
                  <button type="button" className="saved-heart heart-only" disabled={removingId === resource.id} onClick={() => removeSaved(resource.id)} aria-label="Remove from wishlist" aria-pressed="true">
                    <Heart className="h-4 w-4" fill="currentColor" />
                  </button>
                  <ContactSellerButton seller={listingOwnerIdentity(resource)} listingId={resource.id} listingTitle={resource.title} />
                  <Link to={`/items/${resource.id}`}>Details</Link>
                </div>
              </div>
            </SurfaceCard>
          ))}
          {!resources.length ? (
            <SurfaceCard>
              <h2 className="text-2xl font-semibold">No saved resources yet</h2>
              <p className="mt-2">Use the heart button on Browse listings to save resources here.</p>
              <Link className="organic-button primary mt-5" to="/marketplace">Browse resources</Link>
            </SurfaceCard>
          ) : null}
        </div>
      </PageShell>
    </PlatformLayout>
  );
}
