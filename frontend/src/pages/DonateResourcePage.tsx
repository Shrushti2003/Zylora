import { type ChangeEvent, FormEvent, useMemo, useState } from "react";
import { BookOpen, Gift, Heart, HeartHandshake, ImagePlus, Leaf, Shirt, Trash2, UploadCloud, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { categories, createId, createSellerSlug, saveResource, type ListingSellerProfile, type ResourceCategory, type ResourceListing, type ResourceMedia } from "../data/mvpData";
import { projectPhotos } from "../data/visuals";
import { readListingMediaFiles } from "../services/listingMedia.service";
import { createResource, prepareResourceImages } from "../services/resource.service";
import { calculateCurrentAgeLabel } from "../utils/productAge";
import type { RootState } from "../store/store";
import type { AuthUser } from "../types/auth";

const defaultForm = {
  title: "",
  brand: "",
  quantity: "",
  subcategory: "",
  purchaseDate: "",
  currentAge: "",
  usageFrequency: "Occasional",
  weight: "",
  city: "",
  address: "",
  category: "Construction Materials" as ResourceCategory,
  condition: "Good",
  warrantyRemaining: "",
  repairHistory: "",
  damageDescription: "",
  leftoverPercentage: "75",
  expiryDate: "",
  description: ""
};

export function DonateResourcePage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [form, setForm] = useState(defaultForm);
  const [media, setMedia] = useState<ResourceMedia[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const assistant = useMemo(() => {
    const category = detectCategory(form.title, form.description, form.category);
    const practicalDescription = form.description.trim() || `${form.title || "This resource"} can be reused by schools, NGOs, community kitchens, or families in ${form.city || "your city"}.`;
    return {
      practicalDescription,
      category,
      conditionNotes: `${form.condition || "Good"} condition. Recipient should confirm quantity, pickup access, and suitability before handoff.`,
      suggestions: category === "Books & Educational Supplies" || category === "School Supplies" ? "Best matches: schools, learning centers, NGO libraries." : category === "Food Donations" ? "Best matches: same-day community kitchens and food banks." : "Best matches: verified NGOs, schools, and community organizations."
    };
  }, [form]);

  function handleMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setError("");

    if (!files.length) return;
    const accepted = files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    if (accepted.length !== files.length) {
      setError("Please choose only image or video files.");
      return;
    }

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isPublishing || isProcessingMedia) return;

    if (!form.title.trim() || !form.quantity.trim() || !form.city.trim() || !form.address.trim() || !form.expiryDate) {
      setError("Please complete item title, quantity, city, pickup location, and expiry date.");
      return;
    }

    if (new Date(`${form.expiryDate}T23:59:59`).getTime() < Date.now()) {
      setError("Expired donations cannot be published. Choose a future expiry date.");
      return;
    }

    if (!user) {
      setError("Sign in before donating so this listing can be saved to your real-time profile.");
      return;
    }

    setIsPublishing(true);
    const donorName = getDonorName(user);
    const listingMedia = media.length
      ? media
      : [{ id: createId("media"), type: "image" as const, url: projectPhotos.community, name: "Default donation image" }];
    const primaryImage = listingMedia.find((item) => item.type === "image")?.url || projectPhotos.community;
    const listing: ResourceListing = {
      id: createId("resource"),
      title: form.title.trim(),
      category: assistant.category,
      condition: form.condition,
      city: form.city.trim(),
      address: form.address.trim(),
      seller: donorName,
      sellerProfile: user ? createDonationSellerProfile(user) : undefined,
      recipient: assistant.suggestions,
      material: form.title.trim(),
      value: "Donation",
      quantity: form.quantity.trim(),
      expiry: `Expires on ${new Date(`${form.expiryDate}T00:00:00`).toLocaleDateString()}`,
      expiryDate: form.expiryDate,
      purchaseDate: form.purchaseDate || undefined,
      currentAge: form.currentAge || undefined,
      usageFrequency: form.usageFrequency,
      score: 84,
      image: primaryImage,
      media: listingMedia,
      description: `${assistant.practicalDescription} Brand: ${form.brand || "not specified"}. Repair history: ${form.repairHistory || "not provided"}. Damage: ${form.damageDescription || "not provided"}.`,
      latitude: 19.076,
      longitude: 72.8777,
      postedAt: new Date().toISOString(),
      availabilityStatus: "Available",
      verificationStatus: "Unverified"
    };

    try {
      const syncedResource = await createResource({
        clientResourceId: listing.id,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        resourceType: "Donate",
        condition: toApiCondition(listing.condition),
        status: "available",
        city: listing.city,
        address: listing.address,
        images: prepareResourceImages(
          listing.media?.filter((item) => item.type === "image").map((item) => item.url) ?? [],
          projectPhotos.community
        ),
        latitude: listing.latitude,
        longitude: listing.longitude
      });
      saveResource({
        ...listing,
        id: syncedResource.id,
        postedAt: syncedResource.createdAt ?? listing.postedAt
      });
      setMessage("Donation published. It now appears on Browse, Buyer Dashboard, local map results, and your Posts page.");
      setForm(defaultForm);
      setMedia([]);
      setTimeout(() => navigate("/marketplace"), 700);
    } catch {
      saveResource(listing);
      setMessage("Donation published. It now appears on Browse, Buyer Dashboard, local map results, and your Posts page.");
      setForm(defaultForm);
      setMedia([]);
      setTimeout(() => navigate("/marketplace"), 700);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Donate"
        title="Donate & Make an Impact"
        description="Help people, reduce waste, and build a stronger community. Donate books, furniture, clothes, electronics, food, educational materials, and household essentials in good condition."
        image={projectPhotos.community}
        imageAlt="Community donation drive supporting children and families"
      >
        <div className="post-item-layout">
          <SurfaceCard>
            <form onSubmit={handleSubmit}>
              <label className="upload-box">
                {media[0]?.type === "video" ? <video src={media[0].url} controls /> : media[0] ? <img src={media[0].url} alt="Selected listing preview" /> : <UploadCloud className="h-12 w-12 text-primary" />}
                <strong>{isProcessingMedia ? "Uploading..." : media.length ? `${media.length} media file${media.length > 1 ? "s" : ""} ready` : "Upload donation photos or videos"}</strong>
                <span>Photos help recipients understand condition, quantity, and pickup needs.</span>
                <input type="file" accept="image/*,video/*" multiple onChange={handleMedia} disabled={isProcessingMedia || isPublishing} />
                <em><ImagePlus className="h-4 w-4" /> Choose media</em>
              </label>
              {media.length ? (
                <div className="media-preview-grid">
                  {media.map((item) => (
                    <div key={item.id} className="media-preview-tile">
                      {item.type === "video" ? <video src={item.url} controls /> : <img src={item.url} alt={item.name} />}
                      <button type="button" onClick={() => setMedia((current) => current.filter((mediaItem) => mediaItem.id !== item.id))} aria-label={`Remove ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span>Item title</span>
                  <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Example: Books, clothes, furniture, utensils" />
                </label>
                <label className="block">
                  <span>Brand</span>
                  <input value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} placeholder="Apple, Dell, local brand..." />
                </label>
                <label className="block">
                  <span>Subcategory</span>
                  <input value={form.subcategory} onChange={(event) => setForm((current) => ({ ...current, subcategory: event.target.value }))} placeholder="Smartphone, dining table, cement lot..." />
                </label>
                <label className="block">
                  <span>Quantity</span>
                  <input value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} placeholder="Example: 8 bags, 42 tiles" />
                </label>
                <label className="block">
                  <span>Purchase Date</span>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(event) => {
                      const purchaseDate = event.target.value;
                      setForm((current) => ({ ...current, purchaseDate, currentAge: calculateCurrentAgeLabel(purchaseDate) }));
                    }}
                  />
                </label>
                <label className="block">
                  <span>Current Age</span>
                  <input value={form.currentAge} readOnly placeholder="Auto-calculated from purchase date" />
                </label>
                <label className="block">
                  <span>Usage Frequency</span>
                  <select value={form.usageFrequency} onChange={(event) => setForm((current) => ({ ...current, usageFrequency: event.target.value }))}>
                    <option>Rare</option>
                    <option>Occasional</option>
                    <option>Weekly</option>
                    <option>Daily</option>
                    <option>Heavy</option>
                  </select>
                </label>
                <label className="block">
                  <span>Weight (grams/kg)</span>
                  <input value={form.weight} onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))} placeholder="Example: 50 kg" />
                </label>
                <label className="block">
                  <span>City</span>
                  <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Example: Nagpur" />
                </label>
                <label className="block">
                  <span>Pickup location</span>
                  <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Street, landmark, or area" />
                </label>
                <label className="block">
                  <span>Category</span>
                  <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ResourceCategory }))}>
                    {categories.map((item) => <option key={item.name}>{item.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span>Condition</span>
                  <select value={form.condition} onChange={(event) => setForm((current) => ({ ...current, condition: event.target.value }))}>
                    {["Brand New", "Like New", "Excellent", "Good", "Fair", "Poor", "Damaged"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span>Warranty Remaining</span>
                  <input value={form.warrantyRemaining} onChange={(event) => setForm((current) => ({ ...current, warrantyRemaining: event.target.value }))} placeholder="None, 6 months..." />
                </label>
                <label className="block">
                  <span>Leftover Material (%)</span>
                  <input type="number" min="0" max="100" value={form.leftoverPercentage} onChange={(event) => setForm((current) => ({ ...current, leftoverPercentage: event.target.value }))} />
                </label>
                <label className="block">
                  <span>Expiry date</span>
                  <input type="date" value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))} />
                </label>
              </div>
              <label className="block mt-4">
                <span>Donation description</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe condition, pickup needs, and who this donation can help." />
              </label>
              <label className="block mt-4">
                <span>Repair History</span>
                <textarea value={form.repairHistory} onChange={(event) => setForm((current) => ({ ...current, repairHistory: event.target.value }))} placeholder="Repairs, servicing, part replacements..." />
              </label>
              <label className="block mt-4">
                <span>Damage Description</span>
                <textarea value={form.damageDescription} onChange={(event) => setForm((current) => ({ ...current, damageDescription: event.target.value }))} placeholder="Scratches, cracks, missing parts, wear and tear..." />
              </label>
              {error ? <p className="auth-error mt-4">{error}</p> : null}
              {message ? <p className="auth-help mt-4">{message}</p> : null}
              <button className="organic-button primary auth-submit" type="submit" disabled={isPublishing || isProcessingMedia}>
                {isPublishing ? "Publishing..." : isProcessingMedia ? "Uploading..." : "Donate Resource"}
              </button>
            </form>
          </SurfaceCard>
          <aside className="donation-impact-shell" aria-label="Donation impact">
            <SurfaceCard className="donation-impact-card">
              <div className="donation-glass-visual" aria-hidden="true">
                <span><Heart className="h-5 w-5" /></span>
                <span><HeartHandshake className="h-5 w-5" /></span>
                <span><Gift className="h-5 w-5" /></span>
                <span><Leaf className="h-5 w-5" /></span>
              </div>
              <div className="donation-info-scroll">
                <section>
                  <span className="botanical-eyebrow">Why donate through Zylora?</span>
                  <h2>Meaningful giving, made simple.</h2>
                  <ul className="donation-info-list">
                    <li><HeartHandshake className="h-4 w-4" /> Help families and individuals in need.</li>
                    <li><Leaf className="h-4 w-4" /> Reduce landfill waste and promote sustainability.</li>
                    <li><Users className="h-4 w-4" /> Support NGOs, schools, communities, and social initiatives.</li>
                    <li><Gift className="h-4 w-4" /> Give unused items a second life.</li>
                    <li><Heart className="h-4 w-4" /> Create measurable positive impact in your community.</li>
                  </ul>
                </section>

                <section>
                  <h3>Items You Can Donate</h3>
                  <div className="donation-chip-grid">
                    {[
                      ["Books & Educational Materials", BookOpen],
                      ["Furniture", Gift],
                      ["Clothing & Apparel", Shirt],
                      ["Electronics", Gift],
                      ["Kitchen Equipment", Gift],
                      ["Food Supplies", HeartHandshake],
                      ["Household Essentials", Gift],
                      ["School Supplies", BookOpen],
                      ["Medical Supplies", Heart],
                      ["Toys & Children's Items", Gift],
                      ["Community Resources", Users]
                    ].map(([label, Icon]) => (
                      <span key={label as string}><Icon className="h-4 w-4" /> {label as string}</span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3>Your Impact Matters</h3>
                  <p>Every donated item has the potential to help someone in need, support education, reduce environmental waste, strengthen local communities, and encourage responsible resource sharing.</p>
                  <div className="donation-impact-counters">
                    <span><strong>1 item</strong> can meet an urgent local need</span>
                    <span><strong>Free access</strong> keeps giving fair</span>
                    <span><strong>Less waste</strong> supports a cleaner city</span>
                  </div>
                </section>
              </div>
            </SurfaceCard>
          </aside>
        </div>
      </PageShell>
    </PlatformLayout>
  );
}

function getDonorName(user: AuthUser | null) {
  return user?.profile?.organizationName?.trim() || user?.name?.trim() || "Zylora donor";
}

function createDonationSellerProfile(user: AuthUser): ListingSellerProfile {
  const name = getDonorName(user);
  return {
    userId: user.id,
    name,
    photoUrl: user.profile?.photoUrl?.trim() || "",
    bio: user.profile?.bio,
    email: user.email,
    slug: createSellerSlug(name),
    verificationStatus: user.verification?.isIdentityVerified ? "Verified" : "Unverified",
    privacy: {
      showEmail: user.preferences?.privacy?.showEmail,
      showOnlineStatus: user.preferences?.privacy?.showOnlineStatus,
      allowMessageRequests: user.preferences?.privacy?.allowMessageRequests
    }
  };
}

function toApiCondition(condition: string): "excellent" | "good" | "fair" | "poor" {
  const normalized = condition.trim().toLowerCase();
  if (normalized.includes("excellent")) return "excellent";
  if (normalized.includes("fair")) return "fair";
  if (normalized.includes("poor")) return "poor";
  return "good";
}

function detectCategory(title: string, description: string, fallback: ResourceCategory): ResourceCategory {
  const text = `${title} ${description}`.toLowerCase();
  if (/(cloth|apparel|uniform|shoe|bag)/.test(text)) return "Clothing & Apparel";
  if (/(book|notebook|learning)/.test(text)) return "Books & Educational Supplies";
  if (/(stationery|school|classroom)/.test(text)) return "School Supplies";
  if (/(food|fruit|grocery|cooked)/.test(text)) return "Food Donations";
  if (/(bakery|oven|baking)/.test(text)) return "Bakery Equipment";
  if (/(chair|table|decoration|event|exhibition)/.test(text)) return "Event & Exhibition Materials";
  if (/(kitchen|utensil|appliance|cookware)/.test(text)) return "Kitchen Equipment";
  if (/(medical|wheelchair|bed|health)/.test(text)) return "Medical Supplies";
  if (/(computer|monitor|printer|laptop|keyboard)/.test(text)) return "Computers & IT";
  if (/(phone|mobile|charger|cable)/.test(text)) return "Mobile Phones & Accessories";
  if (/(seed|fertilizer|farm|agri|garden)/.test(text)) return "Gardening & Agriculture";
  if (/(cement|brick|tile|sand|paint|wood)/.test(text)) return "Construction Materials";
  return fallback;
}
