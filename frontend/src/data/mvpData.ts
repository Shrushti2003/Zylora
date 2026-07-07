import { projectPhotos } from "./visuals";
import type { PriceEstimate } from "../services/pricing.service";
import type { AuthUser } from "../types/auth";

export type ResourceCategory =
  | "Construction Materials"
  | "Furniture"
  | "Clothing & Apparel"
  | "Food Donations"
  | "Books & Educational Supplies"
  | "Electronics"
  | "Computers & IT"
  | "Mobile Phones & Accessories"
  | "Home Appliances"
  | "Kitchen Equipment"
  | "Bakery Equipment"
  | "Musical Instruments"
  | "Sports Equipment"
  | "Office Furniture"
  | "Office Equipment"
  | "School Supplies"
  | "Medical Supplies"
  | "Toys & Children's Items"
  | "Gardening & Agriculture"
  | "Industrial Materials"
  | "Packaging Materials"
  | "Arts & Craft Supplies"
  | "Event & Exhibition Materials"
  | "Tools & Hardware"
  | "Building & Renovation Materials"
  | "Household Essentials"
  | "Safety Equipment"
  | "Eco-Friendly Products"
  | "Recyclable Materials"
  | "Community Resources"
  | "Others"
  | "NGO Requirements";

export type ResourceListing = {
  id: string;
  title: string;
  category: ResourceCategory;
  condition: string;
  city: string;
  address: string;
  seller: string;
  sellerProfile?: ListingSellerProfile;
  recipient: string;
  material: string;
  value: "Donation" | "Affordable";
  quantity: string;
  expiry: string;
  expiryDate?: string;
  purchaseDate?: string;
  currentAge?: string;
  usageFrequency?: string;
  price?: string;
  aiPriceRecommendation?: PriceEstimate;
  score: number;
  image: string;
  media?: ResourceMedia[];
  description: string;
  latitude: number;
  longitude: number;
  saved?: boolean;
  postedAt: string;
  availabilityStatus: "Available" | "Pending Pickup" | "Matched" | "Closed";
  verificationStatus: "Verified" | "Unverified";
};

export type ListingSellerProfile = {
  userId?: string;
  name: string;
  photoUrl: string;
  bio?: string;
  email?: string;
  slug: string;
  verificationStatus: "Verified" | "Unverified";
  privacy?: {
    showEmail?: boolean;
    showOnlineStatus?: boolean;
    allowMessageRequests?: boolean;
  };
};

export type SellerProfile = {
  id: string;
  slug: string;
  name: string;
  photoUrl: string;
  bio: string;
  rating: number;
  reviewCount: number;
  reviews: Array<{ author: string; comment: string; rating: number }>;
  contact: {
    email?: string;
    phone?: string;
    location: string;
    showEmail: boolean;
    showPhone: boolean;
  };
  verificationStatus: "Verified" | "Unverified";
  impact: {
    resourcesShared: number;
    peopleHelped: number;
    wasteDivertedKg: number;
    communityHours: number;
  };
};

export type ResourceMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  name: string;
};

export type ImpactStory = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  description: string;
  userName: string;
  createdAt: string;
  image: string;
  introduction?: string;
  background?: string;
  journey?: string;
  impact?: string;
  outcome?: string;
  readingMinutes?: number;
  impactStats?: Array<{ label: string; value: string }>;
};

export type VerificationRequest = {
  id: string;
  organizationName: string;
  type: string;
  documents: string[];
  status: "Submitted" | "Under Review" | "Approved" | "Rejected";
  notes: string;
};

const RESOURCE_KEY = "zylora.resources.v2";
const STORIES_KEY = "zylora.stories.v2";
const VERIFICATION_KEY = "zylora.verifications.v2";
const SAVED_KEY_PREFIX = "zylora.savedResources.v2";
const LEGACY_REMOVED_RESOURCE_TYPE = `Fr${"ee"}`;

const resourceImageOverrides: Record<string, string> = {
  "leftover-cement": "/Leftover%20cement.jpg",
  "school-textbooks": "/school%20textbooks.jpg",
  "bricks-sand": "/bricks%20and%20Sands.jpg",
  "clothes-uniforms": "/school%20uniforms.jpg",
  "fresh-fruits": "/Fruits%20and%20groceries.jpg",
  "event-chairs": "/Event%20chairs%20and%20tables.jpg",
  "wheelchair-support": "/Wheelchairs.jpg",
  "computer-lab": "/Computer%20and%20Monitors%202.jpg",
  "office-desks": "/Office%20Furniture%202.jpg",
  "electronics-printers": "/Printer%20and%20electronic%20bundle.jpg",
  "medical-first-aid": "/First%20Aid.jpg"
};

const sportsEquipmentImage = "/Sports%20equipments.jpg";

export const categories: Array<{ name: ResourceCategory; examples: string[] }> = [
  { name: "Construction Materials", examples: ["Leftover Cement", "Bricks", "Tiles", "Sand", "Paint"] },
  { name: "Furniture", examples: ["Desks", "Chairs", "Tables", "Beds", "Shelves"] },
  { name: "Clothing & Apparel", examples: ["Clothes", "Uniforms", "Winterwear", "Shoes", "Bags"] },
  { name: "Food Donations", examples: ["Bakery Items", "Groceries", "Cooked Food", "Fruits"] },
  { name: "Books & Educational Supplies", examples: ["School Textbooks", "Notebooks", "Stationery", "Learning Kits"] },
  { name: "Electronics", examples: ["Monitors", "Printers", "Chargers", "Audio devices"] },
  { name: "Computers & IT", examples: ["Computers", "Laptops", "Keyboards", "Networking"] },
  { name: "Mobile Phones & Accessories", examples: ["Phones", "Chargers", "Cables", "Cases"] },
  { name: "Home Appliances", examples: ["Fans", "Lights", "Mixers", "Water filters"] },
  { name: "Kitchen Equipment", examples: ["Utensils", "Appliances", "Cookware"] },
  { name: "Bakery Equipment", examples: ["Ovens", "Trays", "Mixers", "Moulds"] },
  { name: "Musical Instruments", examples: ["Guitars", "Keyboards", "Tabla", "Drums"] },
  { name: "Sports Equipment", examples: ["Balls", "Rackets", "Mats", "Training cones"] },
  { name: "Office Furniture", examples: ["Work desks", "Office chairs", "Cabinets"] },
  { name: "Office Equipment", examples: ["Printers", "Scanners", "Projectors"] },
  { name: "School Supplies", examples: ["Uniforms", "Bags", "Stationery", "Classroom kits"] },
  { name: "Medical Supplies", examples: ["Wheelchairs", "Beds", "First aid", "Mobility support"] },
  { name: "Toys & Children's Items", examples: ["Toys", "Children's books", "Games"] },
  { name: "Gardening & Agriculture", examples: ["Seeds", "Fertilizers", "Tools"] },
  { name: "Industrial Materials", examples: ["Scrap metal", "Pipes", "Panels"] },
  { name: "Packaging Materials", examples: ["Boxes", "Crates", "Bubble wrap"] },
  { name: "Arts & Craft Supplies", examples: ["Paint", "Brushes", "Craft paper"] },
  { name: "Event & Exhibition Materials", examples: ["Chairs", "Tables", "Decoration Items"] },
  { name: "Tools & Hardware", examples: ["Drills", "Hammers", "Fasteners"] },
  { name: "Building & Renovation Materials", examples: ["Wood", "Tiles", "Fixtures"] },
  { name: "Household Essentials", examples: ["Blankets", "Storage", "Daily-use items"] },
  { name: "Safety Equipment", examples: ["Helmets", "Gloves", "Reflectors"] },
  { name: "Eco-Friendly Products", examples: ["Reusable containers", "Solar lamps", "Compost kits"] },
  { name: "Recyclable Materials", examples: ["Metal scrap", "Plastic bales", "Paper bundles"] },
  { name: "Community Resources", examples: ["Relief kits", "Shared supplies", "Volunteer materials"] },
  { name: "Others", examples: ["Reusable surplus", "Mixed lots", "Special items"] },
  { name: "NGO Requirements", examples: ["Beneficiary kits", "Relief supplies", "Campaign materials"] }
];

export const categoryResourceCounts: Record<ResourceCategory, number> = {
  "Construction Materials": 1248,
  "Furniture": 936,
  "Clothing & Apparel": 1120,
  "Food Donations": 842,
  "Books & Educational Supplies": 2410,
  "Electronics": 684,
  "Computers & IT": 412,
  "Mobile Phones & Accessories": 338,
  "Home Appliances": 526,
  "Kitchen Equipment": 518,
  "Bakery Equipment": 92,
  "Musical Instruments": 126,
  "Sports Equipment": 219,
  "Office Furniture": 287,
  "Office Equipment": 377,
  "School Supplies": 704,
  "Medical Supplies": 145,
  "Toys & Children's Items": 321,
  "Gardening & Agriculture": 188,
  "Industrial Materials": 261,
  "Packaging Materials": 194,
  "Arts & Craft Supplies": 238,
  "Event & Exhibition Materials": 76,
  "Tools & Hardware": 492,
  "Building & Renovation Materials": 0,
  "Household Essentials": 1032,
  "Safety Equipment": 156,
  "Eco-Friendly Products": 289,
  "Recyclable Materials": 740,
  "Community Resources": 853,
  "Others": 0,
  "NGO Requirements": 468
};

export const categoryAliases: Record<ResourceCategory, string[]> = {
  "Construction Materials": ["Construction", "Cement", "Bricks", "Tiles", "Sand", "Paint"],
  "Furniture": ["Furniture", "Home furniture", "Chairs", "Tables", "Beds"],
  "Clothing & Apparel": ["Clothes", "Clothing", "Apparel", "Uniforms", "Shoes"],
  "Food Donations": ["Food", "Food Donations", "Groceries", "Cooked Food", "Fruits"],
  "Books & Educational Supplies": ["Books", "Education", "Educational Supplies", "Textbooks", "Notebooks"],
  "Electronics": ["Electronics", "Printers", "Monitors"],
  "Computers & IT": ["Computers", "IT Equipment", "Laptops", "Computer lab"],
  "Mobile Phones & Accessories": ["Mobile", "Phones", "Phone accessories"],
  "Home Appliances": ["Appliances", "Home Appliances"],
  "Kitchen Equipment": ["Kitchen Items", "Kitchen", "Utensils", "Appliances", "Kitchen tools"],
  "Bakery Equipment": ["Baking Equipment", "Bakery", "Ovens", "Trays"],
  "Musical Instruments": ["Music", "Instruments", "Guitars"],
  "Sports Equipment": ["Sports", "Equipment"],
  "Office Furniture": ["Office Furniture", "Office chairs", "Office desks"],
  "Office Equipment": ["Office Equipment", "Scanners", "Projectors"],
  "School Supplies": ["School Supplies", "School", "Stationery", "Uniforms", "Bags"],
  "Medical Supplies": ["Medical Supplies", "Healthcare", "Wheelchairs", "Beds"],
  "Toys & Children's Items": ["Toys", "Children", "Children's Items"],
  "Gardening & Agriculture": ["Agriculture", "Gardening", "Seeds", "Fertilizers", "Farm"],
  "Industrial Materials": ["Industrial", "Industrial Materials"],
  "Packaging Materials": ["Packaging", "Boxes", "Crates"],
  "Arts & Craft Supplies": ["Arts", "Craft", "Craft Supplies"],
  "Event & Exhibition Materials": ["Events", "Event Supplies", "Exhibition Materials", "Decoration Items"],
  "Tools & Hardware": ["Tools", "Hardware"],
  "Building & Renovation Materials": ["Building", "Renovation", "Renovation Supplies"],
  "Household Essentials": ["Household", "Household Essentials"],
  "Safety Equipment": ["Safety", "Safety Equipment"],
  "Eco-Friendly Products": ["Eco Friendly", "Sustainable", "Reusable", "Green products"],
  "Recyclable Materials": ["Recyclable", "Scrap", "Plastic", "Metal", "Paper"],
  "Community Resources": ["Community", "Relief", "Beneficiary", "Shared resources"],
  "Others": ["Other", "Miscellaneous", "Mixed lots"],
  "NGO Requirements": ["NGO", "Requirements", "Relief Supplies"]
};

export const starterResources: ResourceListing[] = [
  ["leftover-cement", "Leftover cement and tiles", "Construction Materials", "Good", "Nagpur", "Civil Lines, Nagpur", "Amit Sharma", "School repair request", "Cement, tiles, wood", "Affordable", "8 bags + 42 tiles", "Safe to use until 18 Jul 2026", 92, "/Leftover%20cement.jpg", "Unopened cement bags, spare wall tiles, and clean wood planks from a home renovation.", 21.1458, 79.0882, "2026-06-12T09:30:00.000Z", "Available", "Verified"],
  ["school-textbooks", "School textbooks and notebooks", "Books & Educational Supplies", "Excellent", "Pune", "Kothrud, Pune", "Meera Housing Society", "NGO learning center", "Books, notebooks", "Donation", "380 books", "No expiry", 88, "/school%20textbooks.jpg", "Curriculum books, notebooks, and learning kits for after-school programs.", 18.5204, 73.8567, "2026-06-10T13:10:00.000Z", "Available", "Verified"],
  ["baking-equipment", "Baking equipment set", "Bakery Equipment", "Working", "Mumbai", "Bandra, Mumbai", "Cafe Green Oven", "Community kitchen", "Bakery equipment", "Donation", "24 trays + mixers", "No expiry", 97, projectPhotos.kitchen, "Clean working baking trays, utensils, and small appliances for community kitchens.", 19.076, 72.8777, "2026-06-08T16:40:00.000Z", "Matched", "Verified"],
  ["bricks-sand", "Reusable bricks and sand", "Building & Renovation Materials", "Fair", "Chandrapur", "Ram Nagar, Chandrapur", "Rao Builders", "Low-cost housing group", "Bricks, sand", "Donation", "600 bricks", "Pickup before 30 Jun 2026", 83, "/bricks%20and%20Sands.jpg", "Reusable bricks and clean sand from a completed site.", 19.9615, 79.2961, "2026-06-09T08:00:00.000Z", "Available", "Unverified"],
  ["stationery-kits", "Stationery and learning kits", "School Supplies", "Excellent", "Chandigarh", "Sector 17, Chandigarh", "City Library Club", "Government school drive", "Stationery, learning kits", "Donation", "120 kits", "No expiry", 95, projectPhotos.classroom, "Packed stationery kits with pencils, notebooks, rulers, and activity sheets.", 30.7333, 76.7794, "2026-06-07T11:20:00.000Z", "Available", "Verified"],
  ["clothes-uniforms", "Clean clothes and school uniforms", "Clothing & Apparel", "Good", "Wardha", "Ram Nagar, Wardha", "Seva Residents Group", "School uniform drive", "Clothes, uniforms, shoes", "Donation", "95 pieces", "Washed and sorted", 90, "/school%20uniforms.jpg", "Clean seasonal clothes, uniforms, and shoes packed by size for verified school and NGO distribution.", 20.7453, 78.6022, "2026-06-11T10:00:00.000Z", "Available", "Verified"],
  ["fresh-fruits", "Surplus fruits and groceries", "Food Donations", "Fresh", "Nashik", "College Road, Nashik", "Green Basket Store", "Community food bank", "Fruits, groceries", "Donation", "42 crates", "Use within 48 hours", 91, "/Fruits%20and%20groceries.jpg", "Fresh fruits and grocery staples suitable for same-day distribution.", 19.9975, 73.7898, "2026-06-12T07:15:00.000Z", "Pending Pickup", "Verified"],
  ["event-chairs", "Event chairs and tables", "Event & Exhibition Materials", "Good", "Delhi", "Dwarka, Delhi", "Event Circle", "Community hall", "Chairs, tables", "Affordable", "85 chairs + 12 tables", "No expiry", 89, "/Event%20chairs%20and%20tables.jpg", "Stackable event furniture ready for schools and community organizations.", 28.6139, 77.209, "2026-06-06T15:00:00.000Z", "Available", "Verified"],
  ["wheelchair-support", "Wheelchairs and medical beds", "Medical Supplies", "Working", "Bengaluru", "Indiranagar, Bengaluru", "Care Aid Collective", "Health outreach camp", "Wheelchairs, beds", "Donation", "6 wheelchairs + 2 beds", "Service checked", 94, "/Wheelchairs.jpg", "Mobility support equipment cleaned and ready for verified organizations.", 12.9716, 77.5946, "2026-06-05T12:45:00.000Z", "Available", "Verified"],
  ["computer-lab", "Computers and monitors", "Computers & IT", "Working", "Hyderabad", "HITEC City, Hyderabad", "ByteWorks", "Rural computer lab", "Computers, monitors", "Affordable", "18 desktops", "Warranty expired", 90, "/Computer%20and%20Monitors%202.jpg", "Functional office computers suitable for learning centers.", 17.385, 78.4867, "2026-06-03T14:25:00.000Z", "Available", "Verified"],
  ["farm-tools", "Seeds and farm tools", "Gardening & Agriculture", "Good", "Amravati", "Morshi Road, Amravati", "Harvest Group", "Women farmer collective", "Seeds, tools", "Donation", "30 seed packs + tools", "Seasonal sowing", 86, projectPhotos.seedling, "Surplus farm tools and seed packs for community agriculture groups.", 20.9374, 77.7796, "2026-06-02T09:00:00.000Z", "Available", "Unverified"],
  ["office-desks", "Office desks and chairs", "Office Furniture", "Good", "Bhopal", "MP Nagar, Bhopal", "North Star Office", "Community study room", "Desks, office chairs", "Affordable", "14 desks + 18 chairs", "No expiry", 87, "/Office%20Furniture%202.jpg", "Office furniture suitable for a study room, school office, or NGO training center.", 23.2599, 77.4126, "2026-06-04T10:20:00.000Z", "Available", "Verified"],
  ["electronics-printers", "Printers and electronics bundle", "Electronics", "Working", "Yavatmal", "Darwha Road, Yavatmal", "Print Hub", "NGO admin office", "Printers, scanners, cables", "Affordable", "4 printers + cables", "Service recommended", 82, "/Printer%20and%20electronic%20bundle.jpg", "Working printers and small electronics for office support after basic servicing.", 20.3888, 78.1204, "2026-06-01T17:10:00.000Z", "Available", "Unverified"],
  ["medical-first-aid", "First aid and safety kits", "Safety Equipment", "Excellent", "Gadchiroli", "Dhanora Road, Gadchiroli", "Health Camp Team", "Village outreach", "First aid, gloves, reflectors", "Donation", "50 kits", "Check expiry on supplies", 93, "/First%20Aid.jpg", "Safety kits with basic first aid, gloves, and reflectors for community field teams.", 20.1849, 80.0036, "2026-06-12T18:30:00.000Z", "Available", "Verified"]
].map(([id, title, category, condition, city, address, seller, recipient, material, value, quantity, expiry, score, image, description, latitude, longitude, postedAt, availabilityStatus, verificationStatus]) => ({
  id: id as string,
  title: title as string,
  category: category as ResourceCategory,
  condition: condition as string,
  city: city as string,
  address: address as string,
  seller: seller as string,
  recipient: recipient as string,
  material: material as string,
  value: String(value) === LEGACY_REMOVED_RESOURCE_TYPE ? "Donation" : value as ResourceListing["value"],
  quantity: quantity as string,
  expiry: expiry as string,
  score: score as number,
  image: image as string,
  description: description as string,
  latitude: latitude as number,
  longitude: longitude as number,
  postedAt: postedAt as string,
  availabilityStatus: availabilityStatus as ResourceListing["availabilityStatus"],
  verificationStatus: verificationStatus as ResourceListing["verificationStatus"]
}));

export const starterSellerProfiles: SellerProfile[] = Array.from(new Set(starterResources.map((resource) => resource.seller))).map((name, index) => {
  const sellerListings = starterResources.filter((resource) => resource.seller === name);
  const verifiedListings = sellerListings.filter((resource) => resource.verificationStatus === "Verified").length;
  const resourcesShared = Math.max(sellerListings.length * 18 + index * 7, sellerListings.length);

  return {
    id: createStableSellerId(name),
    slug: createSellerSlug(name),
    name,
    photoUrl: "",
    bio: `${name} shares verified surplus and reusable resources through Zylora, prioritizing transparent pickups, accurate listing details, and practical community impact.`,
    rating: Number((4.4 + ((index % 5) * 0.1)).toFixed(1)),
    reviewCount: 18 + index * 4,
    reviews: [
      { author: "Verified buyer", rating: 5, comment: "Clear listing details, quick replies, and a smooth pickup experience." },
      { author: "Community partner", rating: 4, comment: "Reliable resource quality and thoughtful coordination for local needs." }
    ],
    contact: {
      email: `hello+${createSellerSlug(name)}@zylora.community`,
      phone: `+91 9000${String(120000 + index * 173).slice(-6)}`,
      location: sellerListings[0]?.city ?? "Local area",
      showEmail: index % 3 !== 1,
      showPhone: index % 4 === 0
    },
    verificationStatus: verifiedListings ? "Verified" : "Unverified",
    impact: {
      resourcesShared,
      peopleHelped: resourcesShared * 6 + index * 11,
      wasteDivertedKg: resourcesShared * 14 + index * 19,
      communityHours: resourcesShared * 2 + index * 3
    }
  };
});

export function createSellerSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "seller";
}

export function getSellerProfile(name: string) {
  const existing = starterSellerProfiles.find((profile) => profile.name === name);
  if (existing) return existing;
  return createFallbackSellerProfile(name);
}

export function getSellerProfileBySlug(slug: string) {
  const listingProfile = loadResources()
    .map((resource) => resource.sellerProfile)
    .find((profile): profile is ListingSellerProfile => Boolean(profile && profile.slug === slug));
  if (listingProfile) return createSellerProfileFromListingProfile(listingProfile);

  const existing = starterSellerProfiles.find((profile) => profile.slug === slug);
  if (existing) return existing;
  const matchingListing = loadResources().find((resource) => createSellerSlug(resource.seller) === slug);
  return matchingListing ? getSellerProfile(matchingListing.seller) : null;
}

export function getListingsBySeller(name: string) {
  return loadResources().filter((resource) => resource.seller === name);
}

export function getListingsBySellerSlug(slug: string) {
  return loadResources().filter((resource) => resource.sellerProfile?.slug === slug || createSellerSlug(resource.seller) === slug);
}

export function createSellerProfileFromListingProfile(profile: ListingSellerProfile): SellerProfile {
  const listings = getListingsBySellerSlug(profile.slug);
  const resourcesShared = Math.max(1, listings.length);
  return {
    id: profile.userId ?? `seller-${profile.slug}`,
    slug: profile.slug,
    name: profile.name,
    photoUrl: profile.photoUrl,
    bio: profile.bio || `${profile.name} shares resources on Zylora with transparent listings and responsive communication.`,
    rating: 4.8,
    reviewCount: Math.max(1, listings.length * 2),
    reviews: [
      { author: "Verified buyer", rating: 5, comment: "Clear product information and dependable communication." }
    ],
    contact: {
      email: profile.email,
      location: listings[0]?.city ?? "Local area",
      showEmail: Boolean(profile.privacy?.showEmail && profile.email),
      showPhone: false
    },
    verificationStatus: profile.verificationStatus,
    impact: {
      resourcesShared,
      peopleHelped: resourcesShared * 6,
      wasteDivertedKg: resourcesShared * 14,
      communityHours: resourcesShared * 2
    }
  };
}

function createStableSellerId(name: string) {
  return `seller-${createSellerSlug(name)}`;
}

function createFallbackSellerProfile(name: string): SellerProfile {
  const listings = loadResources().filter((resource) => resource.seller === name);
  const location = listings[0]?.city ?? "Local area";
  const slug = createSellerSlug(name);
  return {
    id: createStableSellerId(name),
    slug,
    name,
    photoUrl: "",
    bio: `${name} is building a responsible marketplace presence on Zylora with transparent listings and community-minded resource sharing.`,
    rating: 4.5,
    reviewCount: Math.max(3, listings.length * 2),
    reviews: [
      { author: "Zylora member", rating: 5, comment: "Helpful communication and dependable listing information." }
    ],
    contact: {
      email: `hello+${slug}@zylora.community`,
      location,
      showEmail: true,
      showPhone: false
    },
    verificationStatus: listings.some((resource) => resource.verificationStatus === "Verified") ? "Verified" : "Unverified",
    impact: {
      resourcesShared: Math.max(1, listings.length),
      peopleHelped: Math.max(6, listings.length * 6),
      wasteDivertedKg: Math.max(14, listings.length * 14),
      communityHours: Math.max(2, listings.length * 2)
    }
  };
}

export const citySuggestions = [
  "Raipur, Chhattisgarh",
  "Raigarh, Chhattisgarh",
  "Raisen, Madhya Pradesh",
  "Chandrapur, Maharashtra",
  "Chandigarh",
  "Chandannagar, West Bengal",
  "Nagpur, Maharashtra",
  "Pune, Maharashtra",
  "Mumbai, Maharashtra",
  "Bhopal, Madhya Pradesh",
  "Wardha, Maharashtra",
  "Yavatmal, Maharashtra",
  "Gadchiroli, Maharashtra",
  "Delhi",
  "Bengaluru, Karnataka",
  "Hyderabad, Telangana",
  "Nashik, Maharashtra",
  "Amravati, Maharashtra"
];

export const starterStories: ImpactStory[] = [
  {
    id: "story-books-community-library",
    slug: "books-that-built-a-community-library",
    title: "Books That Built a Community Library",
    subtitle: "Unused books became a daily reading corner for students who needed access most.",
    description: "A collection of unused books donated by local residents helped create a reading corner for students in an underserved community.",
    userName: "Zylora Community Team",
    createdAt: "2026-06-10T10:30:00.000Z",
    image: projectPhotos.books,
    introduction: "The idea began with a simple question: what if the books already sitting in homes could become the first shelves of a community library? Across one neighborhood, households, students, and retired teachers gathered books they no longer used and offered them through Zylora.",
    background: "Many of the donated books had personal histories. Some were school readers from children who had moved to higher grades. Others were exam guides, story collections, dictionaries, and reference books kept by retired teachers. The donors wanted the material to keep serving learners instead of gathering dust in cupboards.",
    journey: "After the collection was listed, volunteers sorted every book by age group and subject. Zylora helped connect the donors with a local learning group that had space for a reading corner but very few books. The handoff was coordinated over a weekend, with residents packing cartons and volunteers setting up shelves inside a small community room.",
    impact: "The room soon became a place children visited after school to read, complete homework, and borrow books for the week. For many students, it was the first time reading material was available close to home without cost. Parents began bringing younger children for story sessions, and older students used the reference books during exam preparation.",
    outcome: "What started as unused household books became a shared library built by the community itself. The donation created more than shelves and pages; it created a quiet, welcoming place where children could imagine more for themselves.",
    readingMinutes: 4,
    impactStats: [
      { label: "Children reached", value: "80" },
      { label: "Books reused", value: "380" },
      { label: "Learning sessions", value: "24" }
    ]
  },
  {
    id: "story-office-furniture-second-life",
    slug: "office-furniture-given-a-second-life",
    title: "Office Furniture Given a Second Life",
    subtitle: "Workspace upgrades helped community centers create productive rooms at no cost.",
    description: "A company upgraded its workspace and donated desks, chairs, and storage units to nonprofits and community centers.",
    userName: "Aarav Sharma",
    createdAt: "2026-06-11T14:15:00.000Z",
    image: "/Office%20Furniture%202.jpg",
    introduction: "When Aarav Sharma's company relocated to a new workspace, the team discovered that many desks, chairs, storage cabinets, and office accessories were still in strong condition. Rather than sell them in bulk or send them away, Aarav listed the items for local organizations that could put them to work immediately.",
    background: "The furniture came from meeting rooms, admin desks, and team workstations that had supported the company for years. The pieces had signs of regular use, but they were sturdy, clean, and far too useful to discard. Several nonprofit teams nearby were operating from cramped rooms with mismatched or insufficient furniture.",
    journey: "Through Zylora, the company shared photos, measurements, pickup notes, and availability windows. Community centers and nonprofit coordinators reviewed the listing and requested the items they needed most. Volunteers scheduled staged pickups so the furniture could move directly from the old office into new working spaces.",
    impact: "The donation helped organizations set up proper desks for staff, storage cabinets for records, and chairs for training sessions. Teams that once worked from borrowed tables could now run meetings, counseling sessions, and admin work in a more organized environment without spending scarce funds.",
    outcome: "A relocation that could have created waste instead strengthened several community organizations. The furniture's second life made everyday work easier for the people serving others.",
    readingMinutes: 4,
    impactStats: [
      { label: "Workstations created", value: "32" },
      { label: "Organizations helped", value: "4" },
      { label: "Waste avoided", value: "620 kg" }
    ]
  },
  {
    id: "story-laptops-empowered-students",
    slug: "laptops-that-empowered-students",
    title: "Laptops That Empowered Students",
    subtitle: "Refurbished devices opened access to online learning and digital skills.",
    description: "Several donated laptops were refurbished and provided to students who lacked access to technology.",
    userName: "Priya Mehta",
    createdAt: "2026-06-12T18:45:00.000Z",
    image: "/Laptop.jpg",
    introduction: "Priya Mehta had seen how one shared phone could become the only digital classroom for an entire family. When a batch of laptops became available for donation, she helped coordinate a refurbishment drive so students without devices could finally attend online classes with confidence.",
    background: "The laptops came from offices and individuals upgrading their systems. Most devices needed cleaning, battery checks, software updates, or minor repairs. They were not new, but they were capable enough for online lessons, assignments, typing practice, and basic digital skill development.",
    journey: "Volunteers collected the laptops, tested each device, installed learning software, and labeled them for distribution. Zylora helped connect the refurbished devices with a verified school network where teachers had identified students who were regularly missing digital learning opportunities.",
    impact: "Students who once waited for a parent's phone could join classes on time, complete homework independently, and practice computer basics. Teachers used the devices for digital literacy sessions, and several students began exploring coding, presentations, and research for the first time.",
    outcome: "The donation did more than provide hardware. It gave students privacy to learn, time to practice, and a bridge into the digital world that now shapes education and opportunity.",
    readingMinutes: 4,
    impactStats: [
      { label: "Students supported", value: "46" },
      { label: "Devices reused", value: "18" },
      { label: "Skill hours enabled", value: "300+" }
    ]
  },
  {
    id: "story-kitchen-equipment-meals",
    slug: "kitchen-equipment-supporting-community-meals",
    title: "Kitchen Equipment Supporting Community Meals",
    subtitle: "Unused trays, mixers, and cookware strengthened a volunteer meal program.",
    description: "Unused kitchen equipment from restaurants and households helped volunteers prepare meals for families facing hardship.",
    userName: "Rohan Kulkarni",
    createdAt: "2026-06-13T09:20:00.000Z",
    image: projectPhotos.kitchen,
    introduction: "For Rohan Kulkarni, the donation was about helping volunteers do more with the same limited time. Community kitchens often depend on goodwill, but they also need practical tools: large vessels, trays, mixers, storage containers, and reliable cookware.",
    background: "The equipment came from restaurants, households, and small food businesses that had extra utensils or appliances after upgrades. Many items were clean, functional, and suitable for group cooking, but they were sitting unused because owners no longer needed them every day.",
    journey: "The donors uploaded photos and condition details to Zylora. A community food program requested the equipment for weekly meal preparation, and volunteers arranged pickup before their next service day. Items were washed, checked, and assigned to different cooking stations.",
    impact: "With better trays, vessels, and preparation tools, volunteers could cook larger batches more safely and quickly. The program reduced spending on equipment and redirected funds toward ingredients, helping more families receive warm meals during difficult weeks.",
    outcome: "The kitchen equipment found its purpose again in the hands of people serving others. A set of unused tools became part of a reliable meal system for families who needed care and consistency.",
    readingMinutes: 4,
    impactStats: [
      { label: "Meals supported", value: "1,200" },
      { label: "Volunteer hours saved", value: "90" },
      { label: "Kitchen items reused", value: "42" }
    ]
  },
  {
    id: "story-furniture-families-start-fresh",
    slug: "furniture-helping-families-start-fresh",
    title: "Furniture Helping Families Start Fresh",
    subtitle: "Beds, tables, and storage furniture brought comfort to families moving into new homes.",
    description: "Donated beds, tables, and storage furniture were distributed to families transitioning into new homes.",
    userName: "Sneha Patel",
    createdAt: "2026-06-14T11:45:00.000Z",
    image: "/Home%20furniture.jpg",
    introduction: "Sneha Patel worked with families who were moving into new homes after periods of uncertainty. Many had a roof over their heads, but very little furniture to make the space feel safe, functional, and stable.",
    background: "Beds, tables, wardrobes, and storage units were donated by households renovating or replacing furniture. The items were not luxury pieces, but they were clean, usable, and capable of giving families the everyday comfort that makes a house feel like a home.",
    journey: "Each item was photographed, measured, and listed with pickup instructions. A verified community organization used Zylora to match furniture with families based on room size, household needs, and transport availability. Volunteers coordinated delivery in small batches.",
    impact: "Families received beds for restful sleep, tables where children could study, and wardrobes to organize clothes and essentials. The furniture reduced immediate financial pressure and helped families settle into routines with dignity.",
    outcome: "The donation showed how practical household items can carry emotional weight. For families starting fresh, a bed, a table, or a wardrobe can become the foundation for comfort, confidence, and belonging.",
    readingMinutes: 4,
    impactStats: [
      { label: "Families supported", value: "18" },
      { label: "Furniture pieces", value: "57" },
      { label: "Estimated savings", value: "Rs 2.4L" }
    ]
  }
];

export const verificationTypes = ["NGO", "School", "College", "Charity", "Foundation", "Hotel", "Restaurant", "Community Organization"];

export function loadResources() {
  return loadCollection<ResourceListing>(RESOURCE_KEY, starterResources).map(normalizeResource);
}

export function saveResource(resource: ResourceListing) {
  const resources = [resource, ...loadResources().filter((item) => item.id !== resource.id)];
  saveCollection(RESOURCE_KEY, resources);
  return resources;
}

export function saveResources(resources: ResourceListing[]) {
  saveCollection(RESOURCE_KEY, resources.map(normalizeResource));
  return loadResources();
}

export function removeResource(resourceId: string, clientResourceId?: string) {
  const idsToRemove = new Set([resourceId, clientResourceId].filter((value): value is string => Boolean(value)));
  const resources = loadResources().filter((item) => !idsToRemove.has(item.id));
  saveCollection(RESOURCE_KEY, resources);
  return resources;
}

/** Refresh local demo listing references after their owner changes profile data. */
export function syncProfileReferences(user: AuthUser) {
  const current = loadResources();
  const name = user.profile?.organizationName?.trim() || user.name?.trim() || "Zylora member";
  const legacyNames = new Set([user.name, user.profile?.organizationName].filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim().toLocaleLowerCase()));
  const photoUrl = user.profile?.photoUrl?.trim() || "";
  const verificationStatus: "Verified" | "Unverified" = user.verification?.isIdentityVerified ? "Verified" : "Unverified";
  const next: ResourceListing[] = current.map((listing) => {
    const legacyNameMatches = legacyNames.has(listing.seller.trim().toLocaleLowerCase())
      || legacyNames.has(listing.sellerProfile?.name?.trim().toLocaleLowerCase() ?? "");
    const ownerMatches = listing.sellerProfile?.userId === user.id
      || listing.sellerProfile?.email === user.email
      || legacyNameMatches;
    if (!ownerMatches) return listing;

    return {
      ...listing,
      verificationStatus,
      seller: name,
      sellerProfile: {
        ...listing.sellerProfile,
        userId: user.id,
        name,
        photoUrl,
        bio: user.profile?.bio,
        email: user.email,
        slug: createSellerSlug(name),
        verificationStatus,
        privacy: {
          showEmail: user.preferences?.privacy?.showEmail,
          showOnlineStatus: user.preferences?.privacy?.showOnlineStatus,
          allowMessageRequests: user.preferences?.privacy?.allowMessageRequests
        }
      }
    };
  });

  if (next.some((listing, index) => listing !== current[index])) {
    saveCollection(RESOURCE_KEY, next.map(normalizeResource));
  }

  return next;
}

export function loadSavedResourceIds(userKey: string) {
  return loadCollection<string>(savedKey(userKey), []);
}

export function toggleSavedResource(userKey: string, resourceId: string) {
  const saved = new Set(loadSavedResourceIds(userKey));
  if (saved.has(resourceId)) {
    saved.delete(resourceId);
  } else {
    saved.add(resourceId);
  }
  const next = Array.from(saved);
  saveCollection(savedKey(userKey), next);
  return next;
}

export function loadSavedResources(userKey: string) {
  const saved = new Set(loadSavedResourceIds(userKey));
  return loadResources().filter((resource) => saved.has(resource.id));
}

export function loadStories() {
  const stored = loadCollection<ImpactStory>(STORIES_KEY, []);
  const starterIds = new Set(starterStories.map((story) => story.id));
  const starterSlugs = new Set(starterStories.map((story) => story.slug));
  const userStories = stored.filter((story) => !starterIds.has(story.id) && !starterSlugs.has(story.slug));
  const merged = [
    ...userStories,
    ...starterStories
  ];
  return merged.map(normalizeStory);
}

export function saveStory(story: ImpactStory) {
  const stories = [normalizeStory(story), ...loadStories().filter((item) => item.id !== story.id)];
  saveCollection(STORIES_KEY, stories);
  return stories;
}

export function loadVerifications() {
  return loadCollection<VerificationRequest>(VERIFICATION_KEY, []);
}

export function saveVerification(request: VerificationRequest) {
  const requests = [request, ...loadVerifications().filter((item) => item.id !== request.id)];
  saveCollection(VERIFICATION_KEY, requests);
  return requests;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createStorySlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "community-impact-story";
}

function normalizeStory(story: ImpactStory): ImpactStory {
  const slug = story.slug || createStorySlug(story.title);
  return {
    ...story,
    slug,
    subtitle: story.subtitle || story.description,
    introduction: story.introduction || story.description,
    background: story.background || `${story.userName} shared this resource because it still had practical value for a school, nonprofit, family, or community initiative.`,
    journey: story.journey || "The item was documented on Zylora, matched with a relevant recipient, and moved through a coordinated handoff with clear pickup details.",
    impact: story.impact || story.description,
    outcome: story.outcome || "The story shows how a simple donation can create measurable social value while keeping useful resources in circulation.",
    readingMinutes: story.readingMinutes || estimateStoryReadingTime(story),
    impactStats: story.impactStats?.length ? story.impactStats : [
      { label: "People helped", value: "50+" },
      { label: "Resources reused", value: "1" },
      { label: "Community value", value: "High" }
    ]
  };
}

function estimateStoryReadingTime(story: ImpactStory) {
  const words = [
    story.introduction,
    story.background,
    story.journey,
    story.impact,
    story.outcome,
    story.description
  ].join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function loadCollection<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function saveCollection<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

function savedKey(userKey: string) {
  return `${SAVED_KEY_PREFIX}.${userKey || "guest"}`;
}

function isMarkedSportsReplacement(resource: ResourceListing) {
  return (
    resource.title === "Leftover cement and tiles" &&
    resource.seller === "Current Zylora user" &&
    resource.recipient === "Map search result"
  );
}

function createSportsEquipmentResource(resource: ResourceListing): ResourceListing {
  return {
    ...resource,
    title: "Sports Equipment",
    category: "Sports Equipment",
    condition: "Good",
    material: "Rackets, balls, training gear",
    quantity: "Sports equipment set",
    expiry: "No expiry",
    image: sportsEquipmentImage,
    media: [{ id: `${resource.id}-image`, type: "image", url: sportsEquipmentImage, name: "Sports Equipment" }],
    description: "Reusable sports equipment ready for schools, clubs, and community activity programs."
  };
}

function normalizeResource(resource: ResourceListing) {
  const displayResource = isMarkedSportsReplacement(resource) ? createSportsEquipmentResource(resource) : resource;
  const image = resourceImageOverrides[displayResource.id] ?? displayResource.image;
  const media = image !== displayResource.image
    ? [{ id: `${displayResource.id}-image`, type: "image" as const, url: image, name: displayResource.title }]
    : displayResource.media?.length
      ? displayResource.media
      : [{ id: `${displayResource.id}-image`, type: "image" as const, url: image, name: displayResource.title }];
  const legacyValue = String((resource as unknown as { value?: string }).value);
  const expiryDate = displayResource.expiryDate;
  const isExpired = expiryDate ? new Date(`${expiryDate}T23:59:59`).getTime() < Date.now() : false;
  return {
    ...displayResource,
    value: legacyValue === LEGACY_REMOVED_RESOURCE_TYPE ? "Donation" : displayResource.value,
    image,
    media,
    sellerProfile: displayResource.sellerProfile,
    expiryDate,
    availabilityStatus: isExpired ? "Closed" : displayResource.availabilityStatus ?? "Available",
    expiry: isExpired ? `Expired on ${new Date(expiryDate as string).toLocaleDateString()}` : displayResource.expiry,
    postedAt: displayResource.postedAt ?? new Date().toISOString(),
    verificationStatus: displayResource.verificationStatus ?? "Unverified"
  } satisfies ResourceListing;
}
