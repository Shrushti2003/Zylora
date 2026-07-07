import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Cpu,
  Database,
  Dumbbell,
  Eye,
  Factory,
  FileText,
  Fingerprint,
  Flag,
  Globe2,
  Home,
  Hospital,
  Hotel,
  ImagePlus,
  Landmark,
  GraduationCap,
  HandHeart,
  Hammer,
  HardHat,
  Heart,
  Laptop,
  Leaf,
  Lightbulb,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Menu,
  Music,
  Network,
  Newspaper,
  Package,
  Paintbrush,
  Recycle,
  Route,
  Search,
  School,
  ShieldCheck,
  Sparkles,
  Star,
  Shirt,
  Smartphone,
  Stethoscope,
  Store,
  Target,
  TimerReset,
  ToyBrick,
  Truck,
  Utensils,
  Users,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteFooter } from "../components/layout/SiteFooter";
import { projectPhotos } from "../data/visuals";

const realPhotos = {
  logistics: projectPhotos.hero,
  warehouse:
    "https://images.unsplash.com/photo-1684695749267-233af13276d0?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
  computerLab:
    "https://images.unsplash.com/photo-1719159381981-1327b22aff9b?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
  classroom:
    "https://images.unsplash.com/photo-1727473704274-3fbad0dbbd60?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
  seedling:
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
  earth: projectPhotos.earth
};

type IconContent = {
  title: string;
  copy?: string;
  meta?: string;
  icon: LucideIcon;
};

const navItems = [
  { label: "How it works", href: "#how" },
  { label: "Platform", href: "#platform" },
  { label: "Map", href: "#map-preview" },
  { label: "Impact", href: "#impact" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Stories", href: "#stories" }
];

const flowSteps = [
  {
    icon: Store,
    title: "List",
    copy: "Sell, donate, request, or share a reusable resource."
  },
  {
    icon: MapPin,
    title: "Discover",
    copy: "Find nearby listings, requests, and verified organizations."
  },
  {
    icon: Sparkles,
    title: "Match",
    copy: "AI ranks fit by location, category, urgency, and trust."
  },
  {
    icon: BarChart3,
    title: "Impact",
    copy: "Track reuse, pickup status, and environmental value."
  }
];

const stats = [
  { value: 12847, suffix: "+", label: "Resources redistributed" },
  { value: 482, suffix: "t", label: "Carbon saved" },
  { value: 650, suffix: "+", label: "Communities supported" },
  { value: 92, suffix: "%", label: "Pickup success rate" },
  { value: 218, suffix: "+", label: "Verified organizations" },
  { value: 36, suffix: "h", label: "Average match time" },
  { value: 1840, suffix: "+", label: "Volunteer hours" },
  { value: 740, suffix: "+", label: "Monthly exchanges" }
];

const trustItems: IconContent[] = [
  { title: "Verified ecosystem", icon: BadgeCheck },
  { title: "AI matching", icon: Sparkles },
  { title: "Live map discovery", icon: MapPin },
  { title: "Exchange tracking", icon: ClipboardCheck },
  { title: "Carbon Impact Reports", icon: Leaf },
  { title: "Secure messaging", icon: MessageCircle },
  { title: "Privacy protected", icon: LockKeyhole },
  { title: "Hyperlocal pickup", icon: Truck }
];

const audiences: IconContent[] = [
  { title: "Individuals", icon: Users },
  { title: "Businesses", icon: BriefcaseBusiness },
  { title: "Manufacturers", icon: Factory },
  { title: "Builders", icon: HardHat },
  { title: "Restaurants", icon: Utensils },
  { title: "Hotels", icon: Hotel },
  { title: "Schools", icon: School },
  { title: "Colleges", icon: GraduationCap },
  { title: "Hospitals", icon: Hospital },
  { title: "NGOs", icon: HandHeart },
  { title: "Publishers", icon: Newspaper },
  { title: "Offices", icon: Building2 },
  { title: "Housing Societies", icon: Home },
  { title: "Community Groups", icon: Users },
  { title: "Government Organizations", icon: Landmark }
];

const comparisonCards = [
  {
    title: "Generic Marketplace",
    tone: "muted",
    points: [
      "Sell to anyone",
      "No urgency matching",
      "No verification",
      "Limited location intelligence",
      "No impact layer",
      "Weak pickup coordination"
    ]
  },
  {
    title: "Zylora",
    tone: "primary",
    points: [
      "Verified recipients",
      "AI priority matching",
      "Interactive map discovery",
      "Impact tracking",
      "Carbon reduction metrics",
      "Secure communication",
      "Community reputation"
    ]
  }
];

const platformFeatures: IconContent[] = [
  { title: "AI Smart Matching", copy: "Rank the best exchange by fit, distance, and urgency.", icon: Sparkles },
  { title: "Live Marketplace", copy: "Buy, sell, donate, and request reusable resources.", icon: Store },
  { title: "Interactive Map", copy: "Explore nearby listings, clusters, and pickup routes.", icon: MapPin },
  { title: "Organization Profiles", copy: "Review trust, history, needs, and verification.", icon: BadgeCheck },
  { title: "Impact Dashboard", copy: "Track reuse, carbon savings, and completed exchanges.", icon: BarChart3 },
  { title: "Exchange Analytics", copy: "Give teams clean records for reuse and reporting.", icon: Database },
  { title: "Pickup Scheduling", copy: "Coordinate timing across buyers, sellers, NGOs, and volunteers.", icon: Clock3 },
  { title: "Secure Messaging", copy: "Keep handoff details inside the platform.", icon: MessageCircle },
  { title: "Notifications", copy: "Stay updated on matches, messages, and pickups.", icon: Bell },
  { title: "Favorites", copy: "Save listings, organizations, and priority categories.", icon: Heart },
  { title: "Category Filters", copy: "Filter materials, furniture, books, food, medical, and more.", icon: Search },
  { title: "Image Uploads", copy: "Show condition clearly before anyone commits.", icon: ImagePlus },
  { title: "Verification", copy: "Layer identity, organization, and community trust signals.", icon: ShieldCheck },
  { title: "Volunteer Coordination", copy: "Support transport when help is needed.", icon: Route },
  { title: "Resource Tracking", copy: "Follow each listing from discovery to completion.", icon: ClipboardCheck }
];

const missionResources = ["Furniture", "Construction materials", "Books", "Electronics", "Kitchen equipment", "Office assets", "Medical supplies"];

const aiCapabilities: IconContent[] = [
  { title: "Priority Scoring", copy: "Ranks urgent, nearby, high-fit exchanges.", icon: Target },
  { title: "Distance Optimization", copy: "Suggests practical pickup paths.", icon: Route },
  { title: "Category Matching", copy: "Connects listings to the right demand.", icon: Boxes },
  { title: "Urgency Detection", copy: "Highlights time-sensitive resources.", icon: TimerReset },
  { title: "Smart Recommendations", copy: "Surfaces relevant listings faster.", icon: Sparkles },
  { title: "Duplicate Detection", copy: "Keeps marketplace data cleaner.", icon: Fingerprint },
  { title: "Verification Assistance", copy: "Flags details for safer review.", icon: ShieldCheck },
  { title: "Intelligent Search", copy: "Understands product, city, and material intent.", icon: Search }
];

const safetyItems: IconContent[] = [
  { title: "Identity Verification", icon: Fingerprint },
  { title: "NGO Verification", icon: BadgeCheck },
  { title: "Fraud Detection", icon: ShieldCheck },
  { title: "Secure Messaging", icon: MessageCircle },
  { title: "Pickup Confirmation", icon: ClipboardCheck },
  { title: "Community Reporting", icon: Flag },
  { title: "Privacy Protection", icon: LockKeyhole },
  { title: "Verified Organizations", icon: Building2 },
  { title: "Spam Prevention", icon: Eye },
  { title: "Scam Detection", icon: ShieldCheck },
  { title: "Safety Guidelines", icon: FileText }
];

const marketplacePreview = [
  { title: "Wooden Desk", city: "Nagpur", status: "For sale", icon: Home },
  { title: "Office Chairs", city: "Pune", status: "Pickup tomorrow", icon: BriefcaseBusiness },
  { title: "Projector", city: "Mumbai", status: "Verified buyer", icon: Laptop },
  { title: "Books", city: "Hyderabad", status: "Request open", icon: BookOpen },
  { title: "Medical Supplies", city: "Delhi", status: "Priority match", icon: Stethoscope },
  { title: "Construction Materials", city: "Bangalore", status: "Nearby cluster", icon: Hammer }
];

const productPreviews: IconContent[] = [
  { title: "Marketplace", meta: "Live listings with trust, distance, and availability", icon: Store },
  { title: "Interactive Map", meta: "Nearby listings, clusters, routes, and city search", icon: MapPin },
  { title: "Listing Details", meta: "Images, condition, seller profile, and pickup options", icon: FileText },
  { title: "User Profiles", meta: "Verification, listings, saved resources, and public reputation", icon: Users },
  { title: "Chat", meta: "Secure coordination before and after pickup", icon: MessageCircle },
  { title: "Business Dashboard", meta: "Inventory reuse, sales history, and CSR-ready records", icon: BriefcaseBusiness },
  { title: "NGO Dashboard", meta: "Requests, matching, volunteer coordination, and tracking", icon: Building2 },
  { title: "Impact Dashboard", meta: "Demo impact metrics clearly labeled until live data is connected", icon: BarChart3 },
];

const businessBenefits = [
  "Reduce disposal costs",
  "CSR reporting",
  "Exchange history",
  "Environmental impact reports",
  "Inventory reuse",
  "Verified recipients",
  "Employee engagement",
  "Tax documentation support where applicable"
];

const ngoBenefits = [
  "Receive verified resources",
  "Priority matching",
  "Volunteer coordination",
  "Delivery tracking",
  "Resource management",
  "Organization profile",
  "Request resources",
  "Impact reporting"
];

const lifecycleSteps: IconContent[] = [
  { title: "List Resource", icon: ImagePlus },
  { title: "AI Analysis", icon: Cpu },
  { title: "Map Discovery", icon: MapPin },
  { title: "AI Matching", icon: Network },
  { title: "Verification", icon: ShieldCheck },
  { title: "Pickup Scheduled", icon: Truck },
  { title: "Delivery Confirmed", icon: ClipboardCheck },
  { title: "Impact Recorded", icon: BarChart3 },
  { title: "Carbon Saved", icon: Leaf }
];

const pickupSteps: IconContent[] = [
  { title: "Lister", copy: "Adds item details and pickup window.", icon: Store },
  { title: "Interest", copy: "A buyer, NGO, school, or community member responds.", icon: ClipboardCheck },
  { title: "Plan", copy: "Map and chat clarify timing, distance, and route.", icon: MapPin },
  { title: "Pickup", copy: "The resource moves through the agreed handoff.", icon: Truck },
  { title: "Confirm", copy: "Both sides close the exchange.", icon: CheckCircle2 },
  { title: "Record", copy: "Reuse and impact are logged.", icon: BarChart3 }
];

const categoryHighlights = [
  "Trending",
  "Recently Added",
  "Popular Categories",
  "Urgent Requests",
  "Most Exchanged",
  "Featured Resources"
];

const popularSearches = ["office chairs", "unused cement", "medical supplies", "school desks", "used laptops", "kitchen equipment"];
const recentSearches = ["laptops in Pune", "furniture near Nagpur", "map view near me"];
const suggestedKeywords = ["for sale", "free pickup", "priority match", "bulk lot", "verified seller"];

const mapFeatures: IconContent[] = [
  { title: "Nearby discovery", copy: "Find resources around your current area.", icon: MapPin },
  { title: "Distance search", copy: "Filter by city, radius, and pickup practicality.", icon: Route },
  { title: "Live map view", copy: "See listings, requests, and organizations together.", icon: Globe2 },
  { title: "Resource clustering", copy: "Spot dense areas of reusable supply.", icon: Network },
  { title: "Pickup planning", copy: "Preview route, timing, and handoff distance.", icon: Truck },
  { title: "Local recommendations", copy: "Get location-aware matches from AI.", icon: Sparkles }
];

const resourceExamples = [
  {
    title: "Leftover cement and tiles",
    detail: "Unused construction materials moved to a community repair project.",
    impact: "340 kg waste avoided",
    icon: Factory,
    image: projectPhotos.construction
  },
  {
    title: "Books and learning material",
    detail: "Textbooks and notebooks prepared for a neighborhood learning center.",
    impact: "38 students enabled",
    icon: BookOpen,
    image: projectPhotos.books
  },
  {
    title: "Baking and kitchen tools",
    detail: "Extra equipment offered affordably to a community food program.",
    impact: "Same-day confirmation",
    icon: HandHeart,
    image: projectPhotos.kitchen
  }
];

const requests = [
  { org: "Bright Future School", need: "Classroom desks", distance: "3.2 km", match: "96%" },
  { org: "Hope Learning Trust", need: "Used laptops", distance: "5.8 km", match: "92%" },
  { org: "Care Kitchen Network", need: "Meal boxes", distance: "2.4 km", match: "89%" }
];

const categories = [
  { title: "Construction Materials", count: "1,248", icon: Hammer },
  { title: "Furniture", count: "936", icon: Home },
  { title: "Clothing & Apparel", count: "1,120", icon: Shirt },
  { title: "Food & Essentials", count: "842", icon: Utensils },
  { title: "Books & Educational Supplies", count: "2,410", icon: BookOpen },
  { title: "Electronics", count: "684", icon: Laptop },
  { title: "Computers & IT", count: "412", icon: Laptop },
  { title: "Mobile Phones & Accessories", count: "338", icon: Smartphone },
  { title: "Home Appliances", count: "526", icon: Lightbulb },
  { title: "Kitchen Equipment", count: "518", icon: Utensils },
  { title: "Bakery Equipment", count: "92", icon: ChefHat },
  { title: "Musical Instruments", count: "126", icon: Music },
  { title: "Sports Equipment", count: "219", icon: Dumbbell },
  { title: "Office Furniture", count: "287", icon: BriefcaseBusiness },
  { title: "Office Equipment", count: "377", icon: Boxes },
  { title: "School Supplies", count: "704", icon: School },
  { title: "Medical Supplies", count: "145", icon: Stethoscope },
  { title: "Toys & Children's Items", count: "321", icon: ToyBrick },
  { title: "Gardening & Agriculture", count: "188", icon: Leaf },
  { title: "Industrial Materials", count: "261", icon: Factory },
  { title: "Packaging Materials", count: "194", icon: Package },
  { title: "Arts & Craft Supplies", count: "238", icon: Paintbrush },
  { title: "Event & Exhibition Materials", count: "76", icon: Paintbrush },
  { title: "Tools & Hardware", count: "492", icon: Hammer },
  { title: "Building & Renovation Materials", count: "611", icon: HardHat },
  { title: "Household Essentials", count: "1,032", icon: Home },
  { title: "Safety Equipment", count: "156", icon: ShieldCheck },
  { title: "NGO Requests", count: "468", icon: HandHeart },
  { title: "Community Resources", count: "853", icon: Users },
  { title: "Eco-Friendly Products", count: "289", icon: Leaf },
  { title: "Recyclable Materials", count: "740", icon: Recycle },
  { title: "Others", count: "Open", icon: Boxes }
];

const heroSlides = [
  {
    src: "https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "People organizing reusable household essentials for local exchange",
    label: "Local Resource Exchange",
    shape: "shape-community"
  },
  {
    src: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "Rows of reusable books ready for marketplace discovery",
    label: "Circular Marketplace Infrastructure",
    shape: "shape-home"
  },
  {
    src: "https://tnfusa.org/wp-content/uploads/2018/12/Columbus-Tamil-Sangam-women-receiving-tiles-from-Rajarethinam-Prabhkar-and-Anand-Padmanabhan.jpg",
    alt: "Indian community members receiving reusable roof tiles and building materials",
    label: "Reuse Valuable Resources",
    shape: "shape-build"
  },
  {
    src: "https://akm-img-a-in.tosshub.com/indiatoday/images/story/201609/slum-children-education-647_091216011328.jpg?VersionId=HXjAE.psfXMB1r_Rv1xDCt1_tNKKkeGI&size=690%3A388",
    alt: "Smiling Indian children from an underserved community posing together",
    label: "Turning Surplus Into Opportunity",
    shape: "shape-school"
  },
  {
    src: "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "People working together outdoors for sustainable reuse",
    label: "Sustainability in Action",
    shape: "shape-earth"
  },
  {
    src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "People connecting around a shared community impact moment",
    label: "Real Product. Real Impact.",
    shape: "shape-impact"
  }
];

const successStories = [
  {
    audience: "School",
    title: "Desks found a classroom in 36 hours.",
    story: "An office listed surplus desks. Zylora matched them to a verified school and coordinated pickup.",
    image: realPhotos.classroom,
    metrics: ["25 desks reused", "74 students supported", "36 hour timeline"],
    outcome: "The school gained study space without new procurement."
  },
  {
    audience: "NGO",
    title: "Kitchen equipment moved to a local program.",
    story: "A restaurant listed extra trays and vessels. A nearby nonprofit claimed them for meal prep.",
    image: projectPhotos.kitchen,
    metrics: ["420 meals enabled", "Same-week pickup", "Equipment reused"],
    outcome: "The team redirected funds toward ingredients."
  },
  {
    audience: "Family",
    title: "Furniture reached a family nearby.",
    story: "A housing society listed reusable beds, tables, and storage after a move-out.",
    image: realPhotos.warehouse,
    metrics: ["6 items delivered", "1 family supported", "Landfill avoided"],
    outcome: "Useful items stayed in circulation."
  }
];

const emptyStates = [
  {
    title: "No nearby resources.",
    copy: "Show suggested categories, wider radius search, and alerts for new local listings.",
    icon: MapPin
  },
  {
    title: "No current requests.",
    copy: "Invite organizations to publish needs or save a draft request for later.",
    icon: ClipboardCheck
  },
  {
    title: "No exchanges yet.",
    copy: "Guide first-time users toward listing, photos, pricing, and pickup.",
    icon: HandHeart
  }
];

const investorSignals: IconContent[] = [
  { title: "Mission", copy: "Keep useful resources circulating where they still create value.", icon: HandHeart },
  { title: "Vision", copy: "Build trusted circular infrastructure for cities and organizations.", icon: Eye },
  { title: "Environmental Goals", copy: "Reduce landfill pressure and make carbon savings visible at the handoff level.", icon: Leaf },
  { title: "Circular Economy", copy: "Move from one-time disposal to documented reuse, repair, redistribution, and recovery.", icon: Recycle },
  { title: "SDG Alignment", copy: "Support responsible consumption, climate action, education, health, and resilient communities.", icon: Globe2 },
  { title: "Long-term Sustainability", copy: "Grow through verified supply, local demand, and practical trust systems.", icon: Star }
];

const faqs = [
  {
    question: "What can I do on Zylora?",
    answer: "You can buy, sell, donate, request, save, message, and discover nearby reusable resources."
  },
  {
    question: "Who uses the marketplace?",
    answer: "Individuals, NGOs, schools, businesses, housing societies, community groups, and local organizations."
  },
  {
    question: "Can businesses join?",
    answer: "Yes. Businesses can list surplus, track exchange history, support CSR records, and reduce disposal costs."
  },
  {
    question: "Can I donate as well as sell?",
    answer: "Yes. Donation is one workflow alongside buying, selling, requesting, and local discovery."
  },
  {
    question: "How are NGOs verified?",
    answer: "Organizations can be reviewed through identity details, profile information, public records where available, community signals, and platform moderation."
  },
  {
    question: "How are pickups arranged?",
    answer: "The lister and interested party coordinate timing, pickup, route, and confirmation through map context and chat."
  },
  {
    question: "Which cities are supported?",
    answer: "The product is designed for Indian city and neighborhood workflows. Public availability should be treated as early access or pilot coverage until live operations expand."
  },
  {
    question: "Are there prohibited items?",
    answer: "Unsafe, illegal, expired, counterfeit, hazardous, or unsanitary items should not be listed. Food, medicine, and medical supplies need stricter handling rules."
  },
  {
    question: "How is environmental impact calculated?",
    answer: "Impact estimates use item category, quantity, approximate weight, reuse status, and avoided disposal. Demo values are clearly labeled until live verified data is available."
  },
  {
    question: "Can I keep my profile private?",
    answer: "Public visibility can stay limited, but Zylora still needs enough information for trust and safety."
  },
  {
    question: "How does AI matching work?",
    answer: "AI uses category, urgency, distance, recipient fit, duplicate signals, and verification context to recommend practical matches."
  },
  {
    question: "Is there any platform fee?",
    answer: "The landing page does not claim a public fee model. Pricing can be introduced transparently as the pilot program matures."
  }
];

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

export function LandingPage() {
  return (
    <main className="botanical-page">
      <LandingMetadata />
      <PaperTexture />
      <Header />
      <Hero />
      <TrustBar />
      <SearchExperience />
      <CategoryExplorer />
      <AudienceSection />
      <ComparisonSection />
      <PlatformFeaturesSection />
      <MapPreviewSection />
      <MissionSection />
      <AISection />
      <TrustSafetySection />
      <MarketplacePreviewSection />
      <ProductPreviewSection />
      <AudienceBenefitsSection />
      <ResourceLifecycleSection />
      <PickupSection />
      <HowItWorksSection />
      <ImpactSection />
      <ResourceExamplesSection />
      <RequestsSection />
      <EmptyStatesSection />
      <InvestorReadinessSection />
      <StorySection />
      <FAQSection />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

function LandingMetadata() {
  useEffect(() => {
    const title = "Zylora | AI-powered Circular Economy Marketplace";
    const description =
      "Buy, sell, donate, request, and discover nearby reusable resources through an AI-powered circular economy marketplace with maps, matching, and impact tracking.";
    document.title = title;

    const metaEntries: Array<
      | { name: string; content: string; property?: never }
      | { property: string; content: string; name?: never }
    > = [
      { name: "description", content: description },
      { name: "keywords", content: "Zylora, circular economy marketplace, resource exchange, reuse marketplace, interactive map, AI matching, sustainable marketplace" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: window.location.origin },
      { property: "og:image", content: projectPhotos.hero },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: projectPhotos.hero }
    ];

    metaEntries.forEach((entry) => {
      const selector = entry.name !== undefined ? `meta[name="${entry.name}"]` : `meta[property="${entry.property}"]`;
      let tag = document.head.querySelector<HTMLMetaElement>(selector);
      if (!tag) {
        tag = document.createElement("meta");
        if (entry.name !== undefined) tag.setAttribute("name", entry.name);
        if (entry.property !== undefined) tag.setAttribute("property", entry.property);
        document.head.appendChild(tag);
      }
      tag.content = entry.content;
    });

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/";

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Zylora",
      url: window.location.origin,
      description,
      sameAs: ["https://www.linkedin.com", "https://www.instagram.com", "https://www.facebook.com", "https://x.com"]
    };
    let script = document.head.querySelector<HTMLScriptElement>("#zylora-structured-data");
    if (!script) {
      script = document.createElement("script");
      script.id = "zylora-structured-data";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }, []);

  return null;
}

function CategoryExplorer() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    carouselRef.current?.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth"
    });
  };

  return (
    <section className="organic-shell category-section" aria-label="Resource categories">
      <div className="category-heading">
        <div>
          <span className="botanical-eyebrow">Resource categories</span>
          <h2>Explore useful items by category.</h2>
        </div>
        <div className="category-controls">
          <button type="button" onClick={() => scroll("left")} aria-label="Previous categories">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => scroll("right")} aria-label="Next categories">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="category-carousel" ref={carouselRef}>
        {categories.map((category) => (
          <Link className="category-card" key={category.title} to={`/marketplace?category=${encodeURIComponent(category.title)}`}>
            <category.icon size={24} strokeWidth={1.5} />
            <strong>{category.title}</strong>
            <span>{category.count} resources</span>
          </Link>
        ))}
      </div>
      <div className="category-highlight-row" aria-label="Category discovery shortcuts">
        {categoryHighlights.map((highlight) => (
          <span key={highlight}>{highlight}</span>
        ))}
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section className="organic-shell" aria-labelledby="who-uses-title">
      <SectionHeading eyebrow="Who uses Zylora" title={<>A marketplace for every reusable <em>resource</em>.</>} />
      <div id="who-uses-title" className="audience-grid">
        {audiences.map((audience) => (
          <article className="audience-card" key={audience.title}>
            <audience.icon size={20} strokeWidth={1.6} />
            <span>{audience.title}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="organic-shell" aria-labelledby="why-zylora-title">
      <SectionHeading eyebrow="Why Zylora" title={<>Marketplace speed with circular-economy <em>trust</em>.</>} />
      <div id="why-zylora-title" className="comparison-grid">
        {comparisonCards.map((card) => (
          <article className={`comparison-card ${card.tone}`} key={card.title}>
            <h3>{card.title}</h3>
            <ul>
              {card.points.map((point) => (
                <li key={point}>
                  <CheckCircle2 size={17} strokeWidth={1.7} />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlatformFeaturesSection() {
  return (
    <section id="platform" className="organic-shell" aria-labelledby="platform-features-title">
      <SectionHeading eyebrow="Platform features" title={<>Buy, sell, donate, request, and coordinate in one <em>place</em>.</>} />
      <div id="platform-features-title" className="feature-tile-grid">
        {platformFeatures.map((feature) => (
          <IconTile key={feature.title} item={feature} />
        ))}
      </div>
    </section>
  );
}

function MapPreviewSection() {
  return (
    <section id="map-preview" className="organic-shell split-section map-preview-section" aria-labelledby="map-preview-title">
      <Reveal>
        <div className="map-preview-ui" aria-label="Interactive map preview">
          <div className="map-preview-toolbar">
            <span>Pune</span>
            <strong>12 resources nearby</strong>
          </div>
          <div className="map-grid-lines" aria-hidden="true" />
          {[
            ["desk", "28%", "34%"],
            ["books", "54%", "24%"],
            ["tiles", "68%", "58%"],
            ["ngo", "38%", "66%"],
            ["kitchen", "76%", "36%"]
          ].map(([label, left, top]) => (
            <Link
              key={label}
              className={`map-pin map-pin-${label}`}
              style={{ left, top }}
              to="/resource-map"
              aria-label={`View ${label} resources on map`}
            >
              <MapPin size={18} strokeWidth={2} />
            </Link>
          ))}
          <div className="map-route-line" aria-hidden="true" />
          <div className="map-preview-cardlet">
            <strong>Office chairs</strong>
            <span>2.4 km away - pickup tomorrow</span>
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="section-copy">
          <span className="botanical-eyebrow">
            <MapPin size={16} strokeWidth={1.5} />
            Flagship map
          </span>
          <h2 id="map-preview-title">Discover resources around you.</h2>
          <p>
            Use the live map to search by area, compare distance, spot clusters, plan pickup, and see location-based
            AI recommendations.
          </p>
          <div className="compact-icon-grid map-feature-grid">
            {mapFeatures.map((item) => (
              <IconTile key={item.title} item={item} compact />
            ))}
          </div>
          <div className="hero-actions">
            <Link className="organic-button primary" to="/resource-map">
              View Map
              <ArrowRight size={17} />
            </Link>
            <Link className="organic-button secondary" to="/marketplace">
              Explore Resources
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="organic-shell split-section mission-section" aria-labelledby="mission-title">
      <Reveal>
        <div className="mission-photo">
          <img src={projectPhotos.community} alt="Indian community worker distributing useful resources to children" loading="lazy" />
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="section-copy">
          <span className="botanical-eyebrow">
            <Globe2 size={16} strokeWidth={1.5} />
            Mission
          </span>
          <h2 id="mission-title">Useful resources should keep moving.</h2>
          <p>
            Zylora turns surplus into local supply for buyers, sellers, NGOs, schools, businesses, and communities.
            Less waste. More access.
          </p>
          <div className="mission-resource-list">
            {missionResources.map((resource) => (
              <span key={resource}>{resource}</span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function AISection() {
  return (
    <section className="organic-shell split-section reverse ai-section" aria-labelledby="ai-title">
      <Reveal>
        <div className="ai-orbit-panel">
          <Cpu size={34} strokeWidth={1.4} />
          <strong>AI helps useful items move faster to the people most likely to use them.</strong>
          <span>Simple recommendations, cleaner matching, and safer operations.</span>
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div>
          <div className="section-copy">
            <span className="botanical-eyebrow">AI layer</span>
          <h2 id="ai-title">Smarter matches. Less searching.</h2>
          <p>
            AI ranks listings, requests, distance, urgency, duplicates, and trust signals so users reach the right
            exchange faster.
            </p>
          </div>
          <div className="compact-icon-grid">
            {aiCapabilities.map((item) => (
              <IconTile key={item.title} item={item} compact />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function TrustSafetySection() {
  return (
    <section className="organic-shell" aria-labelledby="trust-safety-title">
      <SectionHeading eyebrow="Trust and safety" title={<>Verified exchange, safer <em>handoffs</em>.</>} />
      <div id="trust-safety-title" className="safety-grid">
        {safetyItems.map((item) => (
          <article className="safety-pill" key={item.title}>
            <item.icon size={17} strokeWidth={1.7} />
            {item.title}
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketplacePreviewSection() {
  return (
    <section id="marketplace-preview" className="organic-shell" aria-labelledby="marketplace-preview-title">
      <SectionHeading eyebrow="Marketplace preview" title={<>Real listings. Local signals. Fast <em>actions</em>.</>} />
      <div id="marketplace-preview-title" className="marketplace-preview-grid">
        {marketplacePreview.map((item, index) => (
          <Link className="market-preview-card" key={item.title} to="/marketplace">
            <div>
              <item.icon size={24} strokeWidth={1.6} />
              <span>{index < 2 ? "Available" : index < 4 ? "Needs review" : "Priority"}</span>
            </div>
            <h3>{item.title}</h3>
            <p>
              <MapPin size={15} strokeWidth={1.7} />
              {item.city}
            </p>
            <strong>{item.status}</strong>
          </Link>
        ))}
      </div>
      <div className="landing-cta-row">
        <Link className="organic-button secondary" to="/marketplace">
          Explore Resources
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

function ProductPreviewSection() {
  return (
    <section className="organic-shell product-preview-section" aria-labelledby="product-preview-title">
      <SectionHeading eyebrow="Product preview" title={<>A full product, not a concept <em>page</em>.</>} />
      <div id="product-preview-title" className="product-preview-grid">
        {productPreviews.map((preview) => (
          <Link className="product-preview-card" key={preview.title} to={getProductPreviewPath(preview.title)}>
            <div className="product-window-bar" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <preview.icon size={28} strokeWidth={1.5} />
            <h3>{preview.title}</h3>
            <p>{preview.meta}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AudienceBenefitsSection() {
  return (
    <section className="organic-shell audience-benefits" aria-labelledby="audience-benefits-title">
      <SectionHeading eyebrow="Dedicated workflows" title={<>Tools for organizations that move resources at <em>scale</em>.</>} />
      <div id="audience-benefits-title" className="benefit-grid">
        <BenefitPanel
          eyebrow="Businesses"
          title="Move surplus with cleaner records."
          copy="Sell, donate, reuse, and report from one workflow."
          cta="Become a Business Partner"
          to="/register"
          benefits={businessBenefits}
          icon={BriefcaseBusiness}
        />
        <BenefitPanel
          eyebrow="NGOs"
          title="Request and receive what communities need."
          copy="Publish needs, match faster, coordinate pickup, and track outcomes."
          cta="Register Your Organization"
          to="/register"
          benefits={ngoBenefits}
          icon={HandHeart}
        />
      </div>
    </section>
  );
}

function ResourceLifecycleSection() {
  return (
    <section className="organic-shell" aria-labelledby="resource-lifecycle-title">
      <SectionHeading eyebrow="Resource lifecycle" title={<>From listing to reuse record.</>} />
      <Timeline id="resource-lifecycle-title" items={lifecycleSteps} />
    </section>
  );
}

function PickupSection() {
  return (
    <section className="organic-shell" aria-labelledby="pickup-title">
      <SectionHeading eyebrow="Pickup planning" title={<>Know the route before the handoff.</>} />
      <div id="pickup-title" className="pickup-grid">
        {pickupSteps.map((step, index) => (
          <article className="pickup-card" key={step.title}>
            <span>0{index + 1}</span>
            <step.icon size={24} strokeWidth={1.5} />
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmptyStatesSection() {
  return (
    <section className="organic-shell" aria-labelledby="empty-states-title">
      <SectionHeading eyebrow="Empty states" title={<>No dead ends.</>} />
      <div id="empty-states-title" className="empty-state-grid">
        {emptyStates.map((state) => (
          <article className="empty-state-card" key={state.title}>
            <state.icon size={26} strokeWidth={1.5} />
            <h3>{state.title}</h3>
            <p>{state.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InvestorReadinessSection() {
  return (
    <section className="organic-shell investor-section" aria-labelledby="investor-readiness-title">
      <SectionHeading eyebrow="Investor readiness" title={<>Built for measurable circular <em>commerce</em>.</>} />
      <div id="investor-readiness-title" className="feature-tile-grid investor-grid">
        {investorSignals.map((signal) => (
          <IconTile key={signal.title} item={signal} />
        ))}
      </div>
    </section>
  );
}

function BenefitPanel({
  eyebrow,
  title,
  copy,
  cta,
  to,
  benefits,
  icon: Icon
}: {
  eyebrow: string;
  title: string;
  copy: string;
  cta: string;
  to: string;
  benefits: string[];
  icon: LucideIcon;
}) {
  return (
    <Reveal>
      <article className="benefit-panel">
        <span className="botanical-eyebrow">
          <Icon size={16} strokeWidth={1.5} />
          {eyebrow}
        </span>
        <h3>{title}</h3>
        <p>{copy}</p>
        <ul>
          {benefits.map((benefit) => (
            <li key={benefit}>
              <CheckCircle2 size={16} strokeWidth={1.7} />
              {benefit}
            </li>
          ))}
        </ul>
        <Link className="organic-button secondary" to={to}>
          {cta}
          <ArrowRight size={17} />
        </Link>
      </article>
    </Reveal>
  );
}

function Timeline({ items, id }: { items: IconContent[]; id: string }) {
  return (
    <div id={id} className="resource-timeline">
      {items.map((item, index) => (
        <article className="timeline-step" key={item.title}>
          <div>
            <item.icon size={22} strokeWidth={1.5} />
          </div>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item.title}</strong>
        </article>
      ))}
    </div>
  );
}

function IconTile({ item, compact = false }: { item: IconContent; compact?: boolean }) {
  return (
    <article className={compact ? "icon-tile compact" : "icon-tile"}>
      <item.icon size={compact ? 18 : 24} strokeWidth={1.6} />
      <h3>{item.title}</h3>
      {item.copy ? <p>{item.copy}</p> : null}
    </article>
  );
}

function ChipGroup({ title, items, onSelect }: { title: string; items: string[]; onSelect: (item: string) => void }) {
  return (
    <div className="chip-group">
      <strong>{title}</strong>
      <div>
        {items.map((item) => (
          <button key={item} type="button" onClick={() => onSelect(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="botanical-header">
      <nav className="botanical-nav">
        <Link className="botanical-brand" to="/" aria-label="Zylora home">
          <span>
            <Recycle size={20} strokeWidth={1.5} />
          </span>
          Zylora
        </Link>
        <div className="botanical-links">
          {navItems.map((item) => (
            item.href.startsWith("/") ? (
              <Link key={item.label} to={item.href}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            )
          ))}
        </div>
        <div className="nav-actions">
          <Link className="text-link" to="/login">
            Sign In
          </Link>
          <Link className="organic-button primary small" to="/register">
            Get Started
          </Link>
          <button className="menu-button" type="button" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      {open ? (
        <div className="mobile-menu">
          {navItems.map((item) => (
            item.href.startsWith("/") ? (
              <Link key={item.label} to={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            )
          ))}
        </div>
      ) : null}
    </header>
  );
}

function Hero() {
  return (
    <section className="organic-shell hero-botanical">
      <div className="hero-words">
        <Reveal>
          <span className="botanical-eyebrow">
            <Leaf size={16} strokeWidth={1.5} />
            AI-powered circular economy marketplace
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h1>
            Give every useful resource a <em>second life</em>.
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p>
            Buy, sell, donate, request, and discover nearby reusable resources through a trusted marketplace powered by
            AI matching, live maps, and measurable impact.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="hero-actions">
            <Link className="organic-button primary" to="/register">
              Get Started
              <ArrowRight size={17} />
            </Link>
            <Link className="organic-button secondary" to="/marketplace">
              Explore Marketplace
            </Link>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className="hero-photo-wrap">
          <HeroSlideshow />
          <div className="hero-journey" aria-label="Impact journey">
            {flowSteps.map((step) => (
              <article className="hero-journey-card" key={step.title}>
                <step.icon size={18} strokeWidth={1.5} />
                <strong>{step.title}</strong>
                <span>{step.copy}</span>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="trust-strip" aria-label="Zylora trust signals">
      {trustItems.map((item) => (
        <span key={item.title}>
          <item.icon size={16} strokeWidth={1.7} />
          {item.title}
        </span>
      ))}
    </section>
  );
}

function SearchExperience() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function openMarketplace(nextQuery: string) {
    const trimmed = nextQuery.trim();
    navigate(trimmed ? `/marketplace?search=${encodeURIComponent(trimmed)}` : "/marketplace");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openMarketplace(query);
  }

  return (
    <section className="organic-shell search-experience" aria-labelledby="search-experience-title">
      <Reveal>
        <div className="search-panel">
          <div className="search-panel-copy">
            <span className="botanical-eyebrow">
              <Search size={16} strokeWidth={1.5} />
              Search marketplace
            </span>
            <h2 id="search-experience-title">Search by item, city, category, or need.</h2>
            <p>Jump into listings, requests, map results, and verified profiles.</p>
          </div>
          <form className="landing-search" onSubmit={handleSubmit} role="search">
            <Search size={18} strokeWidth={1.6} />
            <input
              id="landing-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search desks, cement, books, laptops..."
              aria-label="Search Zylora resources"
            />
            <button type="submit">Search</button>
          </form>
          <ChipGroup title="Popular" items={popularSearches} onSelect={openMarketplace} />
          <ChipGroup title="Trending" items={categoryHighlights} onSelect={openMarketplace} />
          <ChipGroup title="Suggestions" items={suggestedKeywords} onSelect={openMarketplace} />
          <ChipGroup title="Recent" items={recentSearches} onSelect={openMarketplace} />
        </div>
      </Reveal>
    </section>
  );
}

function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={`hero-slideshow ${heroSlides[active].shape}`} aria-label="Resource sharing slideshow">
      {heroSlides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={index === active ? "active" : ""}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="hero-slide-caption">
        <span>{heroSlides[active].label}</span>
        <strong>Resource Sharing • Reuse • Sustainability • Community Impact</strong>
      </div>
      <div className="hero-flow-badges" aria-hidden="true">
        <span>List</span>
        <span>Reuse</span>
        <span>Impact</span>
      </div>
      <div className="hero-slide-dots" aria-label="Slideshow navigation">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.label}
            type="button"
            className={index === active ? "active" : ""}
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1}: ${slide.label}`}
          />
        ))}
      </div>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section id="how" className="organic-shell">
      <SectionHeading eyebrow="How Zylora works" title={<>List. Discover. Match. Exchange.</>} />
      <div className="organic-grid four">
        {flowSteps.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.05}>
            <article className={`organic-card feature-card ${index % 2 === 1 ? "staggered" : ""}`}>
              <step.icon size={28} strokeWidth={1.5} />
              <span>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ImpactSection() {
  return (
    <section id="impact" className="organic-shell split-section">
      <Reveal>
        <div className="section-copy">
          <span className="botanical-eyebrow">Impact dashboard</span>
          <h2>
            Impact without guesswork.
          </h2>
          <p>
            Completed exchanges can record waste prevented, carbon saved, match time, pickup success, and community value.
            Demo values stay clearly labeled.
          </p>
          <span className="demo-data-badge">Pilot demo values - not public impact claims</span>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="impact-stack">
          <div className="impact-photo">
            <img src={realPhotos.seedling} alt="Hands holding a young seedling as a symbol of environmental recovery" />
            <div className="impact-photo-note">
              <Leaf size={16} strokeWidth={1.5} />
              <span>Reuse keeps useful resources circulating and waste out of landfills.</span>
            </div>
          </div>
          <div className="impact-panel">
            {stats.map((stat) => (
              <div className="impact-stat" key={stat.label}>
                <strong>
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function ResourceExamplesSection() {
  return (
    <section id="resources" className="organic-shell">
      <SectionHeading eyebrow="Resource examples" title={<>Everyday items ready for a <em>second use</em>.</>} />
      <div className="organic-grid three">
        {resourceExamples.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.06}>
            <Link className={`donation-card ${index === 1 ? "staggered" : ""}`} to="/marketplace">
              <div className="donation-image">
                <img src={item.image} alt={item.title} />
              </div>
              <div className="donation-body">
                <item.icon size={24} strokeWidth={1.5} />
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <span>{item.impact}</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function RequestsSection() {
  return (
    <section className="organic-shell split-section reverse">
      <Reveal>
        <div className="request-board">
          {requests.map((request) => (
            <div className="request-row" key={request.org}>
              <span>
                <GraduationCap size={20} strokeWidth={1.5} />
              </span>
              <div>
                <strong>{request.org}</strong>
                <small>{request.need}</small>
              </div>
              <em>{request.match}</em>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="section-copy">
          <span className="botanical-eyebrow">Verified matching</span>
          <h2>
            Requests make demand visible.
          </h2>
          <p>
            Schools, NGOs, businesses, and communities can publish needs so resources move with purpose.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

function StorySection() {
  return (
    <section id="stories" className="organic-shell story-section">
      <SectionHeading eyebrow="Stories" title={<>Reuse in the real world.</>} />
      <div className="success-story-grid">
        {successStories.map((story, index) => (
          <Reveal key={story.title} delay={index * 0.06}>
            <article className="story-card compact-story-card">
              <img src={story.image} alt={`${story.audience} impact story`} loading="lazy" />
              <div>
                <span className="botanical-eyebrow">
                  <HandHeart size={16} strokeWidth={1.5} />
                  {story.audience}
                </span>
                <h2>{story.title}</h2>
                <p>{story.story}</p>
                <div className="story-metrics">
                  {story.metrics.map((metric) => (
                    <span key={metric}>{metric}</span>
                  ))}
                </div>
                <p className="story-outcome">{story.outcome}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="organic-shell narrow">
      <SectionHeading eyebrow="FAQ" title={<>Fast answers.</>} />
      <div className="faq-list">
        {faqs.map((item, index) => (
          <div className="faq-item" key={item.question}>
            <button type="button" onClick={() => setOpen(open === index ? -1 : index)}>
              <span>{item.question}</span>
              <ChevronDown className={open === index ? "open" : ""} size={20} />
            </button>
            <div className={open === index ? "faq-answer open" : "faq-answer"}>
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="organic-shell">
      <div className="final-botanical">
        <span className="botanical-eyebrow">
          <Users size={16} strokeWidth={1.5} />
          Circular economy marketplace
        </span>
        <h2>
          Buy, sell, donate, request, and discover what is already nearby.
        </h2>
        <div className="hero-actions center-actions">
          <Link className="organic-button primary" to="/register">
            Get Started
            <ArrowRight size={17} />
          </Link>
          <Link className="organic-button secondary" to="/marketplace">
            Explore Marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}

function getProductPreviewPath(title: string) {
  const routes: Record<string, string> = {
    Marketplace: "/marketplace",
    "Interactive Map": "/resource-map",
    "Listing Details": "/items/school-textbooks",
    "User Profiles": "/profile/meera-housing-society",
    Chat: "/messages",
    "Business Dashboard": "/business",
    "NGO Dashboard": "/ngo",
    "Impact Dashboard": "/impact"
  };
  return routes[title] ?? "/marketplace";
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: ReactNode }) {
  return (
    <Reveal>
      <div className="section-heading">
        <span className="botanical-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
    </Reveal>
  );
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min((time - start) / 1300, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

function PaperTexture() {
  return (
    <div
      className="paper-texture"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}
    />
  );
}
