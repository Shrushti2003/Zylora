import {
  AlertTriangle,
  Baby,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Dumbbell,
  Factory,
  Folder,
  GraduationCap,
  HeartHandshake,
  Heart,
  HeartPulse,
  Home,
  ImagePlus,
  Monitor,
  Music,
  PackageCheck,
  Palette,
  Printer,
  Recycle,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sofa,
  Sparkles,
  Sprout,
  Smartphone,
  Trash2,
  Trophy,
  Utensils,
  Wrench
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SmartPricingCalculator } from "../components/SmartPricingCalculator";
import { ContactSellerButton } from "../components/common/ContactSellerButton";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { ProfileAvatar } from "../components/common/ProfileAvatar";
import { VerifiedBadge } from "../components/common/VerifiedBadge";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { categories, categoryAliases, categoryResourceCounts, createId, createSellerSlug, getSellerProfile, loadResources, saveResource, saveResources, type ListingSellerProfile, type ResourceCategory, type ResourceListing, type ResourceMedia, type SellerProfile } from "../data/mvpData";
import { projectPhotos } from "../data/visuals";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getAuthErrorMessage, toggleSavedResourceApi } from "../services/auth.service";
import { readListingMediaFiles } from "../services/listingMedia.service";
import { createResource, prepareResourceImages } from "../services/resource.service";
import { calculateCurrentAgeLabel } from "../utils/productAge";
import { getProfilePath } from "../utils/profile";
import type { AppDispatch, RootState } from "../store/store";
import type { AuthUser } from "../types/auth";
import type { PriceEstimate, PriceEstimateInput } from "../services/pricing.service";
import type { UserRole } from "../types/auth";

type DashboardRole = Exclude<UserRole, "admin">;
type AccountMode = "seller" | "buyer";

const defaultListingForm = {
  productName: "",
  brand: "",
  category: "Construction Materials" as ResourceCategory,
  subcategory: "",
  quantity: "",
  originalPurchasePrice: "",
  purchaseDate: "",
  currentAge: "",
  usageFrequency: "Occasional",
  weight: "",
  condition: "Good",
  warrantyRemaining: "",
  repairHistory: "",
  damageDescription: "",
  location: "",
  leftoverPercentage: "75",
  pickupLocation: "",
  sellingPrice: "",
  expiryDate: ""
};

const roleLabels: Record<DashboardRole, string> = {
  individual: "Seller",
  ngo: "NGO",
  business: "Community Organization",
  volunteer: "School"
};

const buyerDashboardSlogan = "Where thoughtful buying meets meaningful impact, helping you discover more than just products.";
const dayMs = 24 * 60 * 60 * 1000;

const categoryIcons: Partial<Record<ResourceCategory, LucideIcon>> = {
  "Construction Materials": Building2,
  "Furniture": Sofa,
  "Clothing & Apparel": Shirt,
  "Food Donations": HeartHandshake,
  "Books & Educational Supplies": BookOpen,
  "Electronics": Monitor,
  "Computers & IT": Monitor,
  "Mobile Phones & Accessories": Smartphone,
  "Home Appliances": Home,
  "Kitchen Equipment": Utensils,
  "Bakery Equipment": Utensils,
  "Musical Instruments": Music,
  "Sports Equipment": Dumbbell,
  "Office Furniture": Briefcase,
  "Office Equipment": Printer,
  "School Supplies": GraduationCap,
  "Medical Supplies": HeartPulse,
  "Toys & Children's Items": Baby,
  "Gardening & Agriculture": Sprout,
  "Industrial Materials": Factory,
  "Packaging Materials": PackageCheck,
  "Arts & Craft Supplies": Palette,
  "Event & Exhibition Materials": CalendarDays,
  "Tools & Hardware": Wrench,
  "Building & Renovation Materials": Building2,
  "Household Essentials": Home,
  "Safety Equipment": ShieldCheck,
  "NGO Requirements": HeartHandshake,
  "Community Resources": Sparkles,
  "Eco-Friendly Products": Sprout,
  "Recyclable Materials": Recycle,
  "Others": Folder
};

const visibleRoleTabs: DashboardRole[] = ["ngo", "business", "volunteer"];

export function RoleDashboardPage({
  initialRole = "individual",
  initialMode = "seller"
}: {
  initialRole?: DashboardRole;
  initialMode?: AccountMode;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [role, setRole] = useState<DashboardRole>(initialRole);
  const mode = initialMode;
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [listings, setListings] = useState<ResourceListing[]>(() => loadResources());

  useEffect(() => {
    const refresh = () => setListings(loadResources());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  useEffect(() => {
    if (!user) return;
    const sellerName = getCurrentSellerName(user, "");
    if (!sellerName) return;
    if (!listings.some((listing) => isGenericSellerName(listing.seller))) return;

    const migratedListings = listings.map((listing) => isGenericSellerName(listing.seller) ? {
      ...listing,
      seller: sellerName,
      sellerProfile: createListingSellerProfile(user, listing.verificationStatus),
      description: listing.description.replace(/listed by\s+(Donor\s*\/\s*Seller|Donor|Seller)/i, `listed by ${sellerName}`)
    } : listing);
    setListings(saveResources(migratedListings));
  }, [listings, user]);

  const filteredListings = useMemo(
    () => listings.filter((item) =>
      [item.title, item.seller, item.category, item.city, item.condition, item.value, item.material].join(" ").toLowerCase().includes(debouncedQuery.toLowerCase())
    ),
    [debouncedQuery, listings]
  );

  const title = role === "individual" ? (mode === "seller" ? "Seller Dashboard" : "Buyer Dashboard") : mode === "seller" ? `${roleLabels[role]} Seller Dashboard` : `${roleLabels[role]} Buyer Dashboard`;
  const description = title === "Buyer Dashboard"
    ? buyerDashboardSlogan
    : "Manage listings, optimize pricing, track inventory, monitor sales performance, and connect with potential buyers from one powerful seller workspace.";

  return (
    <PlatformLayout>
      <PageShell
        eyebrow={<span>{mode === "seller" ? "Seller view" : "Buyer view"}</span>}
        title={title}
        description={description}
        image={mode === "seller" ? "/Sell.png" : "/Buy.png"}
        imageAlt="Resource redistribution and verified community support"
      >
        <section className="dashboard-switcher">
          <div className="role-tabs">
            {visibleRoleTabs.map((item) => (
              <button key={item} type="button" onClick={() => setRole(item)} className={role === item ? "active" : ""}>
                {roleLabels[item]}
              </button>
            ))}
          </div>
        </section>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            {mode === "buyer" ? (
              <BuyerDashboard query={query} setQuery={setQuery} listings={filteredListings} onAction={setDashboardMessage} />
            ) : (
              <SellerDashboard resources={listings} roleLabel={role === "individual" ? "Seller" : roleLabels[role]} onPublished={(next) => { setListings(next); setDashboardMessage("Listing published and visible in Buyer Dashboard, Browse, filters, and item details."); }} />
            )}
          </motion.div>
        </AnimatePresence>
        {dashboardMessage ? <p className="auth-help mt-4">{dashboardMessage}</p> : null}

      </PageShell>
    </PlatformLayout>
  );
}

function SellerDashboard({
  resources,
  roleLabel,
  onPublished
}: {
  resources: ResourceListing[];
  roleLabel: string;
  onPublished: (resources: ResourceListing[]) => void;
}) {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [form, setForm] = useState(defaultListingForm);
  const [media, setMedia] = useState<ResourceMedia[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [estimate, setEstimate] = useState<PriceEstimate>(() => ({
    mode: "resale",
    estimatedMarketPrice: "",
    recommendedSellingPrice: "",
    minimumAcceptablePrice: "",
    maximumRecommendedPrice: "",
    fairMarketValue: "",
    quickSalePrice: "",
    premiumListingPrice: "",
    negotiationRange: "",
    remainingUsefulLife: 0,
    sustainabilityImpact: { carbonEmissionsSaved: "", wasteDiverted: "", resourceConservation: "" },
    circularEconomyScore: 0,
    confidenceScore: 0,
    explanation: "",
    reasoning: "",
    demandLevel: "Medium Demand",
    marketTrend: "",
    conditionScore: 0,
    repairSuggestions: [],
    insights: [],
    detectedCategory: "",
    source: "local"
  }));
  const handleEstimate = useCallback((nextEstimate: PriceEstimate) => {
    setEstimate(nextEstimate);
  }, []);

  const expiry = useMemo(() => {
    if (!form.expiryDate) return { blocked: false, label: "Add expiry date", days: null as number | null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${form.expiryDate}T00:00:00`);
    const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    return {
      blocked: days < 0,
      label: days < 0 ? "Expired item blocked" : `Expires in ${days} days`,
      days
    };
  }, [form.expiryDate]);

  const sellerName = getCurrentSellerName(user, roleLabel);
  const sellerListings = useMemo(
    () => resources.filter((listing) => createSellerSlug(listing.seller) === createSellerSlug(sellerName)),
    [resources, sellerName]
  );
  const sellerMetrics = useMemo(() => {
    const donations = sellerListings.filter((listing) => listing.value === "Donation").length;
    const sales = sellerListings.filter((listing) => listing.value === "Affordable").length;
    const wasteKg = sellerListings.reduce((total, listing) => total + parseQuantityWeight(listing.quantity), 0);
    return [
      ["Total Listings", String(sellerListings.length || 0), PackageCheck],
      ["Donations", String(donations), HeartHandshake],
      ["Sales", String(sales), ShoppingBag],
      ["Impact Created", `${Math.max(0, donations * 42 + sales * 18)} people`, Trophy],
      ["Resources Saved From Waste", `${(wasteKg / 1000).toFixed(wasteKg >= 1000 ? 1 : 2)} t`, BarChart3]
    ] as const;
  }, [sellerListings]);
  const pricingInput = useMemo<PriceEstimateInput>(() => ({
    productName: form.productName,
    brand: form.brand,
    category: form.category,
    subcategory: form.subcategory,
    quantity: form.quantity,
    originalPurchasePrice: form.originalPurchasePrice,
    purchaseDate: form.purchaseDate,
    expiryDate: form.expiryDate,
    currentAge: form.currentAge,
    usageFrequency: form.usageFrequency,
    weight: form.weight,
    condition: form.condition,
    warrantyRemaining: form.warrantyRemaining,
    repairHistory: form.repairHistory,
    damageDescription: form.damageDescription,
    location: form.location || form.pickupLocation,
    leftoverPercentage: form.leftoverPercentage,
    listingIntent: "sell",
    images: media.filter((item) => item.type === "image").map((item) => ({ name: item.name, type: "image", dataUrl: item.url })),
    videoCount: media.filter((item) => item.type === "video").length
  }), [form, media]);
  const purchaseDateError = useMemo(() => getPurchaseDateError(form.purchaseDate), [form.purchaseDate]);

  function updateForm<K extends keyof typeof defaultListingForm>(field: K, value: (typeof defaultListingForm)[K]) {
    setError("");
    setSuccessMessage("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updatePurchaseDate(purchaseDate: string) {
    setForm((current) => ({
      ...current,
      purchaseDate,
      currentAge: calculateCurrentAgeLabel(purchaseDate)
    }));
  }

  function handleMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const accepted = files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    if (accepted.length !== files.length) {
      setError("Choose only image or video files.");
      return;
    }
    if (!accepted.length) return;

    setError("");
    setSuccessMessage("");
    setIsProcessingMedia(true);
    readListingMediaFiles(accepted)
      .then((items) => {
        setMedia((current) => [...current, ...items]);
        event.target.value = "";
      })
      .catch(() => {
        setError("Image upload failed. Please try again.");
      })
      .finally(() => setIsProcessingMedia(false));
  }

  async function publishListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (isPublishing || isProcessingMedia) return;

    if (!form.productName.trim() || !form.quantity.trim() || !form.pickupLocation.trim() || !form.expiryDate) {
      setError("Complete product name, quantity, pickup location, and expiry date.");
      return;
    }

    if (!form.sellingPrice.trim() && !estimate.confidenceScore) {
      setError("Enter an item price or use the AI recommended price before publishing.");
      return;
    }

    if (expiry.blocked) {
      setError("Expired listings cannot be published.");
      return;
    }

    if (purchaseDateError) {
      setError(purchaseDateError);
      return;
    }

    setIsPublishing(true);
    const sellerProfile = user ? createListingSellerProfile(user, "Unverified") : undefined;
    const listingMedia = media.length
      ? media
      : [{ id: createId("media"), type: "image" as const, url: projectPhotos.construction, name: "Default listing image" }];
    const primaryImage = listingMedia.find((item) => item.type === "image")?.url || projectPhotos.construction;
    const listing: ResourceListing = {
      id: createId("resource"),
      title: form.productName.trim(),
      category: form.category,
      condition: form.condition.trim() || "Good",
      city: "Local area",
      address: form.pickupLocation.trim(),
      seller: sellerName,
      sellerProfile,
      recipient: "Buyer marketplace",
      material: form.productName.trim(),
      value: "Affordable",
      quantity: form.quantity.trim(),
      expiry: `Expires on ${new Date(`${form.expiryDate}T00:00:00`).toLocaleDateString()}`,
      expiryDate: form.expiryDate,
      price: form.sellingPrice.trim() || estimate.recommendedSellingPrice,
      aiPriceRecommendation: estimate,
      score: 86,
      image: primaryImage,
      media: listingMedia,
      description: `${form.productName.trim()} listed by ${sellerName}. Brand: ${form.brand || "not specified"}. Quantity: ${form.quantity.trim()}. Weight: ${form.weight || "not specified"}. Leftover material: ${form.leftoverPercentage || "not specified"}%.`,
      latitude: 19.076,
      longitude: 72.8777,
      postedAt: new Date().toISOString(),
      availabilityStatus: "Available",
      verificationStatus: "Unverified"
    };
    if (!user) {
      setIsPublishing(false);
      setError("Sign in before publishing so this listing can be saved to your real-time profile.");
      return;
    }

    try {
      const syncedResource = await createResource({
        clientResourceId: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        resourceType: "Sell",
        condition: toApiCondition(listing.condition),
        status: "available",
        city: listing.city,
        address: listing.address,
        images: prepareResourceImages(
          listing.media?.filter((item) => item.type === "image").map((item) => item.url) ?? [],
          projectPhotos.construction
        ),
        latitude: listing.latitude,
        longitude: listing.longitude
      });
      const next = saveResource({
        ...listing,
        id: syncedResource.id,
        postedAt: syncedResource.createdAt ?? listing.postedAt
      });
      setForm(defaultListingForm);
      setMedia([]);
      setSuccessMessage("Listing Published Successfully. Your listing is now live in the marketplace.");
      onPublished(next);
      setTimeout(() => navigate("/profile/posts"), 650);
    } catch {
      const next = saveResource(listing);
      setForm(defaultListingForm);
      setMedia([]);
      setSuccessMessage("Listing Published Successfully. Your listing is now live in the marketplace.");
      onPublished(next);
      setTimeout(() => navigate("/profile/posts"), 650);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <>
      <div className="dashboard-metrics">
        {sellerMetrics.map(([label, value, Icon]) => (
          <SurfaceCard key={label as string}>
            <Icon className="h-6 w-6 text-secondary" />
            <strong>{value as string}</strong>
            <span>{label as string}</span>
          </SurfaceCard>
        ))}
      </div>

      <div className="dashboard-grid">
        <SurfaceCard>
          <h2 className="mt-5 text-2xl font-semibold">Create listing</h2>
          <form className="listing-form" onSubmit={publishListing}>
            <label>
              <span>Product Name</span>
              <input name="productName" value={form.productName} onChange={(event) => updateForm("productName", event.target.value)} required />
            </label>
            <label>
              <span>Brand</span>
              <input name="brand" value={form.brand} onChange={(event) => updateForm("brand", event.target.value)} placeholder="Apple, Dell, Godrej..." />
            </label>
            <label>
              <span>Category</span>
              <select name="category" value={form.category} onChange={(event) => updateForm("category", event.target.value as ResourceCategory)}>
                {categories.map((item) => <option key={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label>
              <span>Subcategory</span>
              <input name="subcategory" value={form.subcategory} onChange={(event) => updateForm("subcategory", event.target.value)} placeholder="Dining table, smartphone, cement lot..." />
            </label>
            <label>
              <span>Quantity</span>
              <input name="quantity" value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} required />
            </label>
            <label>
              <span>Original Purchase Price</span>
              <input name="originalPurchasePrice" value={form.originalPurchasePrice} onChange={(event) => updateForm("originalPurchasePrice", event.target.value)} placeholder="Rs 45,000" />
            </label>
            <label>
              <span>Purchase Date</span>
              <input name="purchaseDate" className={purchaseDateError ? "field-invalid" : ""} type="date" value={form.purchaseDate} onChange={(event) => updatePurchaseDate(event.target.value)} aria-invalid={Boolean(purchaseDateError)} aria-describedby={purchaseDateError ? "purchase-date-error" : undefined} />
              {purchaseDateError ? <em id="purchase-date-error" className="field-error-text">{purchaseDateError}</em> : null}
            </label>
            <label>
              <span>Current Age</span>
              <input name="currentAge" value={form.currentAge} readOnly placeholder="Auto-calculated from purchase date" />
            </label>
            <label>
              <span>Usage Frequency</span>
              <select name="usageFrequency" value={form.usageFrequency} onChange={(event) => updateForm("usageFrequency", event.target.value)}>
                <option>Never Used</option>
                <option>Rarely Used</option>
                <option>Occasional</option>
                <option>Frequently Used</option>
                <option>Daily</option>
                <option>Heavy</option>
              </select>
            </label>
            <label>
              <span>Weight (grams/kg)</span>
              <input name="weight" value={form.weight} onChange={(event) => updateForm("weight", event.target.value)} placeholder="Example: 50 kg" />
            </label>
            <label>
              <span>Condition</span>
              <select name="condition" value={form.condition} onChange={(event) => updateForm("condition", event.target.value)}>
                {["Brand New", "Like New", "Excellent", "Good", "Fair", "Poor", "Damaged"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Warranty Remaining</span>
              <input name="warrantyRemaining" value={form.warrantyRemaining} onChange={(event) => updateForm("warrantyRemaining", event.target.value)} placeholder="None, 6 months..." />
            </label>
            <label>
              <span>Location</span>
              <input name="location" value={form.location} onChange={(event) => updateForm("location", event.target.value)} placeholder="City or region" />
            </label>
            <label>
              <span>Leftover Material (%)</span>
              <input name="leftoverPercentage" type="number" min="0" max="100" value={form.leftoverPercentage} onChange={(event) => updateForm("leftoverPercentage", event.target.value)} />
            </label>
            <label>
              <span>Final Selling Price</span>
              <div className="final-price-field">
                <input name="sellingPrice" value={form.sellingPrice} onChange={(event) => updateForm("sellingPrice", event.target.value)} placeholder="Rs 15,000" />
                {estimate.recommendedSellingPrice ? (
                  <button type="button" className="inline-price-action" onClick={() => updateForm("sellingPrice", estimate.recommendedSellingPrice)}>
                    Use AI Price
                  </button>
                ) : null}
              </div>
              {priceWarning(form.sellingPrice, estimate) ? <em className="price-warning">{priceWarning(form.sellingPrice, estimate)}</em> : null}
            </label>
            <label>
              <span>Pickup Location</span>
              <input name="pickupLocation" value={form.pickupLocation} onChange={(event) => updateForm("pickupLocation", event.target.value)} required />
            </label>
            <label className="span-2">
              <span>Repair History</span>
              <textarea name="repairHistory" value={form.repairHistory} onChange={(event) => updateForm("repairHistory", event.target.value)} placeholder="Repairs, servicing, part replacements..." />
            </label>
            <label className="span-2">
              <span>Damage Description</span>
              <textarea name="damageDescription" value={form.damageDescription} onChange={(event) => updateForm("damageDescription", event.target.value)} placeholder="Scratches, cracks, missing parts, wear and tear..." />
            </label>
            <label>
              <span>Expiry Date (Mandatory if applicable)</span>
              <input name="expiryDate" type="date" value={form.expiryDate} onChange={(event) => updateForm("expiryDate", event.target.value)} required />
            </label>
            <label className="span-2 media-input-label">
              <ImagePlus className="h-4 w-4" />
              <span>{isProcessingMedia ? "Uploading..." : "Upload images or videos"}</span>
              <input name="listingMedia" type="file" accept="image/*,video/*" multiple onChange={handleMedia} disabled={isProcessingMedia || isPublishing} />
            </label>
            {media.length ? (
              <div className="media-preview-grid span-2">
                {media.map((item) => (
                  <div key={item.id} className="media-preview-tile">
                    {item.type === "video" ? <video src={item.url} controls /> : <img src={item.url} alt={item.name} />}
                    <button type="button" onClick={() => setMedia((current) => current.filter((mediaItem) => mediaItem.id !== item.id))}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {error ? <p className="auth-error span-2">{error}</p> : null}
            {successMessage ? <p className="auth-help span-2">{successMessage}</p> : null}
            <div className={expiry.blocked ? "expiry-card blocked span-2" : "expiry-card span-2"}>
              <AlertTriangle size={18} />
              <div>
                <strong>{expiry.blocked ? "Publishing blocked" : "Expiry protection active"}</strong>
                <span>{expiry.label}. Safe to Use Until: {form.expiryDate || "Not set"}</span>
              </div>
            </div>
            <button className="organic-button primary auth-submit span-2" type="submit" disabled={expiry.blocked || isPublishing || isProcessingMedia}>
              {isPublishing ? "Publishing..." : isProcessingMedia ? "Uploading..." : expiry.blocked ? "Expired item blocked" : "Publish listing"}
            </button>
          </form>
        </SurfaceCard>

        <div className="dashboard-side-stack">
          <div className="post-item-valuation-shell">
            <SurfaceCard className="post-item-valuation-sidebar">
              <SmartPricingCalculator
                input={pricingInput}
                onEstimate={handleEstimate}
                onUsePrice={(price) => updateForm("sellingPrice", price)}
                onUseMinimumPrice={(price) => updateForm("sellingPrice", price)}
                onUseQuickSalePrice={(price) => updateForm("sellingPrice", price)}
                onUsePremiumPrice={(price) => updateForm("sellingPrice", price)}
              />
            </SurfaceCard>
          </div>
          <SurfaceCard>
            <ShieldCheck className="h-7 w-7 text-secondary" />
            <h2 className="mt-4 text-2xl font-semibold">Professional trust</h2>
            <ul className="trust-list">
              <li>Verified Users</li>
              <li>Verified NGOs</li>
              <li>Account Protection</li>
              <li>Responsible Resource Sharing</li>
              <li>Sustainability Metrics</li>
              <li>Community Impact Tracking</li>
            </ul>
          </SurfaceCard>
        </div>
      </div>
    </>
  );
}

function BuyerDashboard({
  query,
  setQuery,
  listings,
  onAction
}: {
  query: string;
  setQuery: (value: string) => void;
  listings: ResourceListing[];
  onAction: (message: string) => void;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const [savedIds, setSavedIds] = useState<string[]>(() => user?.savedResourceIds ?? []);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const debouncedCategorySearch = useDebouncedValue(categorySearch, 350);
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | "All">("All");
  const [now, setNow] = useState(() => Date.now());
  const debouncedQuery = useDebouncedValue(query, 350);
  const suggestions = useMemo(() => getRelatedSuggestions(debouncedQuery), [debouncedQuery]);
  const visibleCategories = useMemo(() => {
    const lower = debouncedCategorySearch.toLowerCase().trim();
    return categories.filter((category) => {
      const haystack = [category.name, category.examples.join(" "), ...(categoryAliases[category.name] ?? [])].join(" ").toLowerCase();
      return !lower || haystack.includes(lower);
    });
  }, [debouncedCategorySearch]);
  const categoryFilteredListings = useMemo(() => {
    if (activeCategory === "All") return listings;
    return listings.filter((listing) => listing.category === activeCategory);
  }, [activeCategory, listings]);
  const wishlistResources = useMemo(() => categoryFilteredListings.filter((listing) => savedIds.includes(listing.id)), [categoryFilteredListings, savedIds]);

  useEffect(() => {
    setSavedIds(user?.savedResourceIds ?? []);
  }, [user?.savedResourceIds]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  async function toggleWishlist(id: string, title: string) {
    const wasSaved = savedIds.includes(id);
    const next = wasSaved ? savedIds.filter((item) => item !== id) : [...savedIds, id];
    setSavedIds(next);
    onAction(next.includes(id) ? `${title} added to wishlist.` : `${title} removed from wishlist.`);
    try {
      const savedResourceIds = await toggleSavedResourceApi(id);
      setSavedIds(savedResourceIds);
      if (user) {
        dispatch(setAuthenticatedUser({ ...user, savedResourceIds }));
      }
    } catch (error) {
      setSavedIds(savedIds);
      onAction(getAuthErrorMessage(error));
    }
  }

  return (
    <>
      <SurfaceCard className="wishlist-hub">
        <button type="button" className="wishlist-hub-trigger" onClick={() => setIsWishlistOpen((current) => !current)} aria-label="Open wishlist">
          <Heart className="h-5 w-5" fill={savedIds.length ? "currentColor" : "none"} />
          <span>Wishlist</span>
          <strong>{savedIds.length}</strong>
        </button>
        {isWishlistOpen ? (
          <div className="wishlist-hub-panel">
            {wishlistResources.length ? wishlistResources.map((item) => (
              <article key={item.id} className="wishlist-hub-item">
                <img src={item.image} alt={item.title} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.price ?? item.value} - {item.seller}</p>
                  <div className="listing-actions compact">
                    <Link to={`/items/${item.id}`}>Details</Link>
                    <ContactSellerButton seller={getListingSellerProfile(item, user)} listingId={item.id} listingTitle={item.title} onError={onAction} />
                    <button type="button" onClick={() => toggleWishlist(item.id, item.title)}>Remove</button>
                  </div>
                </div>
              </article>
            )) : (
              <p className="text-on-surface-variant">No wishlisted products yet. Tap hearts on products to add them here.</p>
            )}
          </div>
        ) : null}
      </SurfaceCard>
      <SurfaceCard className="category-explorer-card">
        <div className="category-explorer-heading">
          <div>
            <span className="botanical-eyebrow">Category explorer</span>
            <h2>Browse by resource category</h2>
          </div>
          <label>
            <Search size={18} />
            <input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Search categories"
            />
          </label>
        </div>
        <div className="category-card-grid">
          <button type="button" className={activeCategory === "All" ? "active" : ""} onClick={() => setActiveCategory("All")}>
            <Folder className="h-5 w-5" />
            <strong>All categories</strong>
            <span>{listings.length} current listings</span>
          </button>
          {visibleCategories.map((category) => {
            const Icon = categoryIcons[category.name] ?? Folder;
            return (
              <button key={category.name} type="button" className={activeCategory === category.name ? "active" : ""} onClick={() => setActiveCategory(category.name)}>
                <Icon className="h-5 w-5" />
                <strong>{category.name}</strong>
                <span>{categoryResourceCounts[category.name].toLocaleString("en-IN")} resources</span>
              </button>
            );
          })}
        </div>
      </SurfaceCard>
      <SurfaceCard>
        <div className="advanced-search">
          <label>
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, category, city, NGO, school, seller, or material type"
            />
          </label>
          <select aria-label="Filter products">
            <option>All filters</option>
            <option>View donations</option>
            <option>View affordable sales</option>
            <option>Safe to use</option>
          </select>
          <select aria-label="Sort products">
            <option>Smart suggestions</option>
            <option>Nearest first</option>
            <option>Expiring soon</option>
            <option>Lowest price</option>
          </select>
        </div>
        <div className="suggestion-row">
          {(suggestions.length ? suggestions : ["cement in Nagpur", "NGO books", "school furniture", "bakery equipment", "verified seller"]).map((item) => (
            <button key={item} type="button" onClick={() => setQuery(item)}>
              {item}
            </button>
          ))}
        </div>
      </SurfaceCard>
      <div className="buyer-listings">
        {activeCategory !== "All" ? (
          <div className="active-filter-note">
            <span>{activeCategory}</span>
            <button type="button" onClick={() => setActiveCategory("All")}>Clear category</button>
          </div>
        ) : null}
        {categoryFilteredListings.length ? (
          categoryFilteredListings.map((listing) => {
            const sellerProfile = getListingSellerProfile(listing, user);
            const liked = savedIds.includes(listing.id);
            return (
            <SurfaceCard key={listing.id} className="buyer-listing-card">
              <div className="seller-row">
                <Link to={getProfilePath(sellerProfile)}>
                  <ProfileAvatar profile={sellerProfile} className="seller-photo-empty" />
                </Link>
                <div>
                  <Link to={getProfilePath(sellerProfile)}><strong>{sellerProfile.name}</strong></Link>
                  <span>
                    {sellerProfile.verificationStatus === "Verified" ? "Verified Seller - " : ""}
                    Posted {formatRelativeTime(listing.postedAt, now)}
                  </span>
                </div>
                {sellerProfile.verificationStatus === "Verified" ? <VerifiedBadge small className="seller-verified" /> : null}
              </div>
              <div className="buyer-card-body">
                <img className="buyer-card-image" src={listing.image} alt={listing.title} />
                <div>
              <h2 className="mt-4 text-xl font-semibold">{listing.title}</h2>
              <p className="mt-2">{listing.city} - {listing.recipient}</p>
              <div className="listing-meta">
                <span>{listing.category}</span>
                <span>{listing.condition}</span>
                <span>{listing.quantity}</span>
                <span>{listing.expiry}</span>
                <span>{listing.value}</span>
              </div>
                </div>
              </div>
              <div className="listing-actions">
                <button type="button" className={liked ? "saved-heart heart-only" : "heart-only"} onClick={() => toggleWishlist(listing.id, listing.title)} aria-pressed={liked} aria-label={`${liked ? "Remove from" : "Add to"} wishlist`}>
                  <Heart className="h-6 w-6" color={liked ? "#e11d48" : "currentColor"} fill={liked ? "#e11d48" : "none"} strokeWidth={liked ? 2.6 : 2.2} />
                </button>
                <ContactSellerButton seller={sellerProfile} listingId={listing.id} listingTitle={listing.title} onError={onAction} />
                <Link to={`/items/${listing.id}`}>Details</Link>
              </div>
            </SurfaceCard>
          );
          })
        ) : (
          <SurfaceCard>
            <h2 className="text-2xl font-semibold">No listings found</h2>
            <p className="mt-2">Try searching by product, city, school, NGO, seller, or material type.</p>
          </SurfaceCard>
        )}
      </div>
    </>
  );
}

function parseQuantityWeight(value: string) {
  const matches = value.match(/\d+(\.\d+)?/g);
  if (!matches?.length) return 0;
  return matches.reduce((total, item) => total + Number(item), 0);
}

function priceWarning(price: string, estimate: PriceEstimate) {
  const manual = parseRupees(price);
  const recommended = parseRupees(estimate.recommendedSellingPrice || estimate.fairMarketValue);
  if (!manual || !recommended || estimate.mode === "donation") return "";
  if (manual > recommended * 1.2) return "Your asking price is significantly above estimated market value.";
  if (manual < recommended * 0.78) return "Your item may be undervalued.";
  return "";
}

function parseRupees(value: string) {
  const amount = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function getPurchaseDateError(value: string) {
  if (!value) return "";
  const selected = new Date(`${value}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected.getTime() - today.getTime() > dayMs / 2 ? "Purchase date cannot be in the future." : "";
}

function getRelatedSuggestions(query: string) {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  if (/(house|home|building|renovation|construction)/.test(lower)) return ["Cement", "Tiles", "Bricks", "Steel", "Paint", "Pipes"];
  if (/(school|class|education|student)/.test(lower)) return ["Books", "Notebooks", "Stationery", "Uniforms", "Desks", "Bags"];
  if (/(kitchen|food|meal|cafe)/.test(lower)) return ["Utensils", "Ovens", "Trays", "Mixers", "Groceries", "Storage boxes"];
  if (/(office|work|desk)/.test(lower)) return ["Office chairs", "Printers", "Desks", "Cabinets", "Monitors", "Projectors"];
  return ["Nearby verified listings", "Donation items", "Affordable sales", "Expiring soon", "High trust score"];
}

function getCurrentSellerName(user: AuthUser | null, fallback: string) {
  return user?.profile?.organizationName?.trim() || user?.name?.trim() || fallback;
}

function getCurrentSellerPhoto(user: AuthUser | null) {
  return user?.profile?.photoUrl?.trim() || "";
}

function createListingSellerProfile(user: AuthUser, fallbackVerification: "Verified" | "Unverified"): ListingSellerProfile {
  const name = getCurrentSellerName(user, "Zylora member");
  return {
    userId: user.id,
    name,
    photoUrl: getCurrentSellerPhoto(user),
    bio: user.profile?.bio,
    email: user.email,
    slug: createSellerSlug(name),
    verificationStatus: user.verification?.isIdentityVerified ? "Verified" : fallbackVerification,
    privacy: {
      showEmail: user.preferences?.privacy?.showEmail,
      showOnlineStatus: user.preferences?.privacy?.showOnlineStatus,
      allowMessageRequests: user.preferences?.privacy?.allowMessageRequests
    }
  };
}

function isGenericSellerName(name: string) {
  return /^(donor|seller|donor\s*\/\s*seller)$/i.test(name.trim());
}

function toApiCondition(condition: string): "excellent" | "good" | "fair" | "poor" {
  const normalized = condition.trim().toLowerCase();
  if (normalized.includes("excellent")) return "excellent";
  if (normalized.includes("fair")) return "fair";
  if (normalized.includes("poor")) return "poor";
  return "good";
}

function getListingSellerProfile(listing: ResourceListing, user: AuthUser | null): SellerProfile {
  if (listing.sellerProfile) {
    return {
      ...getSellerProfile(listing.sellerProfile.name || listing.seller),
      id: listing.sellerProfile.userId ?? listing.sellerProfile.email ?? listing.sellerProfile.slug,
      slug: listing.sellerProfile.slug,
      name: listing.sellerProfile.name || listing.seller,
      photoUrl: listing.sellerProfile.photoUrl,
      bio: listing.sellerProfile.bio || getSellerProfile(listing.sellerProfile.name || listing.seller).bio,
      verificationStatus: listing.sellerProfile.verificationStatus
    };
  }

  const currentSellerName = user ? getCurrentSellerName(user, "") : "";
  if (user && (isGenericSellerName(listing.seller) || listing.seller === currentSellerName)) {
    const name = getCurrentSellerName(user, listing.seller);
    const slug = createSellerSlug(name);
    return {
      ...getSellerProfile(name),
      id: user.id,
      slug,
      name,
      photoUrl: getCurrentSellerPhoto(user),
      verificationStatus: user.verification?.isIdentityVerified ? "Verified" : listing.verificationStatus
    };
  }

  return {
    ...getSellerProfile(listing.seller),
    id: `listing-${listing.id}`,
    slug: `listing-${listing.id}`
  };
}

function formatRelativeTime(timestamp: string, now: number) {
  const elapsed = Math.max(0, now - new Date(timestamp).getTime());
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (elapsed < minute) return "Just now";
  if (elapsed < hour) {
    const minutes = Math.floor(elapsed / minute);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (elapsed < day) {
    const hours = Math.floor(elapsed / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (elapsed < week) {
    const days = Math.floor(elapsed / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (elapsed < month) {
    const weeks = Math.floor(elapsed / week);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (elapsed < year) {
    const months = Math.floor(elapsed / month);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.floor(elapsed / year);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
