import {
  AlertTriangle,
  BookOpen,
  Bug,
  FileText,
  Flag,
  HelpCircle,
  LifeBuoy,
  LockKeyhole,
  Mail,
  Map,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SupportCategory = {
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
};

export const faqCategories: SupportCategory[] = [
  { title: "Buying", description: "Finding listings, checking condition, wishlisting, and contacting sellers.", icon: Search, items: ["Confirm availability before pickup.", "Inspect item details and photos.", "Use Details to review listing context."] },
  { title: "Selling", description: "Creating, editing, pricing, and managing listings.", icon: WalletCards, items: ["Add honest condition notes.", "Upload real photos.", "Close listings when unavailable."] },
  { title: "Donation", description: "Giving useful items to people, NGOs, schools, and community groups.", icon: LifeBuoy, items: ["Use Donate for free handoffs.", "Add quantity and pickup instructions.", "Do not list expired or unsafe items."] },
  { title: "NGOs", description: "Verification, resource requests, and beneficiary coordination.", icon: ShieldCheck, items: ["Keep organization details current.", "Describe recurring needs clearly.", "Record impact after receiving items."] },
  { title: "Schools", description: "Education materials, classroom needs, and safe donation handling.", icon: BookOpen, items: ["Request specific quantities.", "Assign one pickup coordinator.", "Protect student privacy in updates."] },
  { title: "Accounts", description: "Login, signup, profile editing, privacy, and account deletion.", icon: UserRound, items: ["Use Firebase email or Google login.", "Keep profile details accurate.", "Request deletion from account settings."] },
  { title: "Maps", description: "Nearby discovery and location-aware listing browsing.", icon: Map, items: ["Search by city or area.", "Check pickup practicality.", "Confirm final pickup location in Messages."] },
  { title: "Messaging", description: "Contacting listing owners and coordinating handoffs.", icon: MessageCircle, items: ["Keep conversations on topic.", "Do not share OTPs or passwords.", "Report suspicious requests."] },
  { title: "Notifications", description: "Account, message, listing, and verification alerts.", icon: AlertTriangle, items: ["Review notification preferences.", "Important account notices may still appear.", "Message counts update from backend events."] },
  { title: "Verification", description: "Identity, NGO, school, and seller trust signals.", icon: ShieldCheck, items: ["Submit accurate details.", "Verification status appears on profiles.", "Not every listing is verified by Zylora."] },
  { title: "Profile", description: "Public profiles, posts, donations, and sold items.", icon: UserRound, items: ["Public profiles show seller activity.", "Privacy settings control exposed details.", "Only owned listings appear on real profiles."] },
  { title: "Payments", description: "Currently not supported.", icon: WalletCards, items: ["Payments are currently unavailable.", "Do not send money outside trusted personal judgment.", "Zylora does not process checkout payments yet."] }
];

export const contactSupportOptions: SupportCategory[] = [
  { title: "General Support", description: "Questions about using Zylora.", icon: HelpCircle, items: ["Use the contact form.", "Include your account email.", "Response time depends on issue complexity."] },
  { title: "Technical Support", description: "Login, upload, API, or page errors.", icon: Bug, items: ["Include screenshots.", "Mention device and browser.", "Add the page URL where the issue happened."] },
  { title: "Seller Support", description: "Listing creation, editing, expiry, and buyer contact.", icon: WalletCards, items: ["Include listing title or ID.", "Describe the incorrect listing state.", "Attach relevant photos if helpful."] },
  { title: "Buyer Support", description: "Search, saved listings, contact, and item details.", icon: Search, items: ["Share the listing name.", "Describe what you expected to see.", "Mention filters used."] },
  { title: "NGO Support", description: "Verification and resource matching for NGOs.", icon: ShieldCheck, items: ["Include organization name.", "Describe program need.", "Attach documents only in trusted support channels."] },
  { title: "School Support", description: "Education resource and classroom support.", icon: BookOpen, items: ["Include school location.", "List item quantities.", "Name the pickup coordinator."] },
  { title: "Feature Requests", description: "Ideas for future Zylora improvements.", icon: Flag, items: ["Describe the workflow.", "Explain who it helps.", "Mention urgency or impact."] },
  { title: "Bug Reports", description: "Broken pages, incorrect data, or failed actions.", icon: Bug, items: ["Steps to reproduce.", "Expected result.", "Actual result."] },
  { title: "Live Chat", description: "Coming Soon.", icon: MessageCircle, items: ["Live Chat is not available yet.", "Use Contact Support for now.", "Urgent safety issues should be reported through report pages."] },
  { title: "Support Email", description: "support@zylora.app", icon: Mail, items: ["Use a clear subject.", "Include account email.", "Do not send passwords or OTPs."] },
  { title: "Response Time", description: "Most non-urgent support is reviewed in queue order.", icon: LifeBuoy, items: ["Safety issues are prioritized.", "Bug details speed up triage.", "Coming soon pages do not collect live status."] }
];

export const trustSafetySections: SupportCategory[] = [
  { title: "Community Guidelines", description: "Users must not post fake listings, copyrighted content, harassment, discrimination, spam, illegal goods, malware, impersonation, AI misuse, or listing manipulation.", icon: ShieldCheck, items: ["Warning", "Temporary suspension", "Permanent ban"] },
  { title: "Buyer Safety", description: "Meet in public places, inspect items, avoid sharing OTPs, never send money outside trusted methods, and report suspicious users.", icon: UserRound, items: ["Confirm details before traveling.", "Keep messages factual.", "Stop if something feels unsafe."] },
  { title: "Seller Safety", description: "Describe products honestly, upload real photos, never share passwords, block suspicious buyers, and report fraud.", icon: WalletCards, items: ["Use accurate quantities.", "Keep pickup terms clear.", "Close unavailable listings."] },
  { title: "Report User", description: "Report harassment, impersonation, fraud attempts, spam, or suspicious account behavior.", icon: Flag, items: ["Include profile name.", "Attach screenshots if available.", "Explain what happened."] },
  { title: "Report Listing", description: "Report fake, illegal, unsafe, expired, misleading, or copyrighted listings.", icon: FileText, items: ["Include listing title.", "Describe the violation.", "Do not complete unsafe handoffs."] },
  { title: "Report Scam", description: "Report payment pressure, OTP requests, identity misuse, or off-platform fraud attempts.", icon: AlertTriangle, items: ["Do not share OTPs.", "Keep evidence.", "Stop the transaction or handoff."] },
  { title: "Report Bug", description: "Report technical issues, broken UI, failed uploads, incorrect profile data, or API errors.", icon: Bug, items: ["Steps to reproduce.", "Browser and device.", "Screenshots help."] },
  { title: "Account Security", description: "Use strong passwords, protect your email account, and sign out on shared devices.", icon: LockKeyhole, items: ["Do not share passwords.", "Review account details.", "Reset password if needed."] },
  { title: "Scam Awareness", description: "Be careful with urgent money requests, pickup pressure, fake verification claims, and requests for private codes.", icon: AlertTriangle, items: ["Verify profile context.", "Ask clear questions.", "Report suspicious behavior."] },
  { title: "Suspicious Activity", description: "If a listing, user, or message feels unsafe, pause the handoff and report it.", icon: Flag, items: ["Capture relevant evidence.", "Avoid escalation in messages.", "Wait for support review when needed."] }
];

export type LegalDocument = {
  slug: string;
  title: string;
  updated: string;
  summary: string;
  sections: Array<{ heading: string; body: string[] }>;
};

export const legalDocuments: LegalDocument[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    updated: "July 3, 2026",
    summary: "How Zylora collects, uses, protects, and shares information.",
    sections: [
      { heading: "Introduction", body: ["This Privacy Policy explains how Zylora handles information for accounts, profiles, listings, images, messages, location features, device information, cookies, and analytics."] },
      { heading: "Information We Collect", body: ["We collect personal information such as name, email, profile details, organization information, listing content, uploaded images, message metadata and content needed for conversations, approximate or provided location details, device information, cookies, and analytics events."] },
      { heading: "How We Use Information", body: ["We use information for authentication, recommendations, search, messaging, notifications, fraud prevention, listing safety, account support, profile display, and platform security."] },
      { heading: "Data Sharing", body: ["We never sell personal data. We may use service providers such as Firebase Authentication, Cloudinary or configured image storage, maps providers, hosting providers, and analytics providers only to operate the platform."] },
      { heading: "Account Deletion and User Choices", body: ["Users may request account deletion, download available data, update profile information, change privacy settings, and contact support for data questions."] },
      { heading: "Retention, Security, and Children", body: ["We retain information as needed for account operation, safety review, legal obligations, and abuse prevention. Zylora is not intended for children without appropriate supervision."] },
      { heading: "Changes and Contact", body: ["We may update this policy as Zylora changes. Contact support@zylora.app for privacy questions."] }
    ]
  },
  {
    slug: "terms-of-use",
    title: "Terms of Use",
    updated: "July 3, 2026",
    summary: "Rules for using Zylora responsibly.",
    sections: [
      { heading: "Acceptance and Eligibility", body: ["By using Zylora, you agree to these terms and must be eligible to use the platform in your location."] },
      { heading: "User Responsibilities", body: ["Users are responsible for accurate account details, honest listings, lawful content, respectful messages, and safe handoff decisions."] },
      { heading: "Prohibited Activities", body: ["Do not post fake listings, illegal goods, malware, copyrighted content you do not own, harassment, discrimination, spam, impersonation, AI misuse, or manipulated listing activity."] },
      { heading: "Content Ownership", body: ["You retain ownership of content you upload and grant Zylora permission to display it for platform operation."] },
      { heading: "Marketplace Rules", body: ["Buying, selling, donation, and messaging features support resource discovery and coordination. Payments are currently unavailable on Zylora."] },
      { heading: "Suspension and Termination", body: ["Violations may result in warning, temporary suspension, permanent ban, content removal, or restricted access."] },
      { heading: "Disclaimer, Liability, Changes, Contact", body: ["Zylora provides the platform as available and may update terms. Contact support@zylora.app for questions."] }
    ]
  },
  {
    slug: "copyright-policy",
    title: "Copyright & IP Policy",
    updated: "July 3, 2026",
    summary: "Uploaded content must be owned or authorized.",
    sections: [
      { heading: "Ownership", body: ["Users must own or have permission to upload photos, text, documents, and other content."] },
      { heading: "Infringement Reports", body: ["Copyright owners can report infringing listings or profile content through Report Copyright. Include the copyrighted work, infringing content, contact details, and a good-faith statement."] },
      { heading: "Counter Notice", body: ["Users may submit a counter notice if content was removed by mistake."] },
      { heading: "Removal and Repeat Violations", body: ["Zylora may remove content and suspend accounts for repeat or serious violations."] }
    ]
  },
  {
    slug: "data-and-privacy",
    title: "Data & Privacy",
    updated: "July 3, 2026",
    summary: "User rights and practical privacy controls.",
    sections: [
      { heading: "User Rights", body: ["Users can request access to data, deletion, correction of information, and help with privacy settings."] },
      { heading: "Security Practices", body: ["Zylora uses Firebase Authentication, backend token verification, HTTPS-ready deployment configuration, access controls, and conservative error handling."] },
      { heading: "Cookies and Retention", body: ["Cookies and browser storage support sessions and preferences. Data is retained as needed for platform operation, support, safety, and legal requirements."] },
      { heading: "Compliance", body: ["Zylora does not claim GDPR certification, ISO 27001 certification, PCI compliance, or end-to-end encryption unless those controls are implemented and verified."] }
    ]
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    updated: "July 3, 2026",
    summary: "How cookies and browser storage support the app.",
    sections: [
      { heading: "Essential Cookies", body: ["Used for authentication sessions, security, and keeping the app usable."] },
      { heading: "Preference Cookies", body: ["Used for theme, language, and interface preferences."] },
      { heading: "Analytics Cookies", body: ["If analytics are configured, they help understand app performance and usage patterns."] },
      { heading: "Managing Preferences", body: ["Users can manage browser cookie settings and app preferences from their browser or profile settings."] }
    ]
  },
  {
    slug: "account-deletion",
    title: "Account Deletion",
    updated: "July 3, 2026",
    summary: "How account deletion works.",
    sections: [
      { heading: "Delete Account", body: ["Users can request account deletion from profile/account settings or support."] },
      { heading: "Listings and Messages", body: ["Deletion may remove or anonymize listings, profile information, and messages where practical, subject to safety review and retention rules."] },
      { heading: "Retention Rules", body: ["Some records may be retained temporarily for fraud prevention, support, legal obligations, or abuse investigation."] },
      { heading: "Recovery Period", body: ["A limited recovery period may apply where technically supported."] }
    ]
  }
];

export const reportKinds = [
  "Report User",
  "Report Listing",
  "Report Scam",
  "Report Copyright",
  "Report Technical Issue"
] as const;

export const utilityPages = [
  { slug: "press", title: "Press / Media", summary: "Coming Soon.", sections: ["Press resources and media contact information are coming soon."] },
  { slug: "accessibility", title: "Accessibility Statement", summary: "Zylora aims to be usable by everyone.", sections: ["We use semantic routes, accessible buttons, visible focus states, keyboard-friendly navigation, and responsive layouts. Report accessibility issues through Contact Support."] },
  { slug: "security", title: "Security", summary: "Implemented security features.", sections: ["Firebase Authentication is used for sign in and signup.", "Backend requests verify Firebase ID tokens.", "Protected routes require authenticated sessions.", "Users should never share passwords or OTPs.", "Zylora does not claim end-to-end encryption or formal security certifications."] },
  { slug: "responsible-disclosure", title: "Responsible Disclosure", summary: "Report vulnerabilities responsibly.", sections: ["Send vulnerability details to support@zylora.app with reproduction steps and impact.", "Do not access, modify, or exfiltrate other users' data.", "Give the team time to investigate before public disclosure."] },
  { slug: "status", title: "Status", summary: "Coming Soon.", sections: ["A live public status dashboard is coming soon. For now, report outages through Technical Support."] },
  { slug: "changelog", title: "Changelog / Release Notes", summary: "Recent platform updates.", sections: ["Support Center, Legal Center, Trust & Safety, report pages, footer navigation, SEO metadata, and profile listing accuracy improvements."] },
  { slug: "sitemap", title: "Sitemap", summary: "Important Zylora routes.", sections: ["/", "/marketplace", "/dashboard/buy", "/dashboard/sell", "/donate", "/resource-map", "/stories", "/impact", "/help", "/trust-safety", "/legal/privacy-policy", "/contact"] }
];
