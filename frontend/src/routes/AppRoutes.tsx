import { Navigate, Route, Routes } from "react-router-dom";
import { AboutPage } from "../pages/AboutPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { ContactPage } from "../pages/ContactPage";
import { CompliancePage } from "../pages/CompliancePage";
import { DonateResourcePage } from "../pages/DonateResourcePage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { HelpCenterPage } from "../pages/HelpCenterPage";
import { ImpactDashboardPage } from "../pages/ImpactDashboardPage";
import { ItemDetailsPage } from "../pages/ItemDetailsPage";
import { LandingPage } from "../pages/LandingPage";
import { LegalDocumentPage } from "../pages/LegalDocumentPage";
import { MarketplacePage } from "../pages/MarketplacePage";
import { MessagesPage } from "../pages/MessagesPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfileSettingsPage } from "../pages/ProfileSettingsPage";
import { PublicProfilePage } from "../pages/PublicProfilePage";
import { ReportPage } from "../pages/ReportPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResourceMap } from "../pages/ResourceMap";
import { ResourceRequestsPage } from "../pages/ResourceRequestsPage";
import { RoleDashboardPage } from "../pages/RoleDashboardPage";
import { SignInPage } from "../pages/SignInPage";
import { SuccessStoriesPage } from "../pages/SuccessStoriesPage";
import { StoryDetailsPage } from "../pages/StoryDetailsPage";
import { TrustSafetyPage } from "../pages/TrustSafetyPage";
import { UtilityInfoPage } from "../pages/UtilityInfoPage";
import { VerificationPage } from "../pages/VerificationPage";
import { SavedResourcesPage } from "../pages/SavedResourcesPage";
import { SellerProfilePage } from "../pages/SellerProfilePage";
import { UserPostsPage } from "../pages/UserPostsPage";
import { RequireAuth } from "./RequireAuth";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/browse-items" element={<MarketplacePage />} />
      <Route path="/donate" element={<RequireAuth><DonateResourcePage /></RequireAuth>} />
      <Route path="/post-item" element={<RequireAuth><DonateResourcePage /></RequireAuth>} />
      <Route path="/items/:id" element={<ItemDetailsPage />} />
      <Route path="/item-details" element={<ItemDetailsPage />} />
      <Route path="/sellers/:slug" element={<SellerProfilePage />} />
      <Route path="/profile/posts" element={<RequireAuth><UserPostsPage /></RequireAuth>} />
      <Route path="/profile/:identifier" element={<PublicProfilePage />} />
      <Route path="/profile/:identifier/posts" element={<UserPostsPage />} />
      <Route path="/requests" element={<ResourceRequestsPage />} />
      <Route path="/resource-map" element={<ResourceMap />} />
      <Route path="/map" element={<ResourceMap />} />
      <Route path="/verify" element={<VerificationPage />} />
      <Route path="/stories" element={<SuccessStoriesPage />} />
      <Route path="/stories/:slug" element={<StoryDetailsPage />} />
      <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
      <Route path="/help" element={<HelpCenterPage />} />
      <Route path="/help/faqs" element={<HelpCenterPage />} />
      <Route path="/trust-safety" element={<TrustSafetyPage />} />
      <Route path="/safety" element={<TrustSafetyPage />} />
      <Route path="/legal" element={<Navigate to="/legal/privacy-policy" replace />} />
      <Route path="/legal/:slug" element={<LegalDocumentPage />} />
      <Route path="/privacy" element={<Navigate to="/legal/privacy-policy" replace />} />
      <Route path="/terms" element={<Navigate to="/legal/terms-of-use" replace />} />
      <Route path="/community-guidelines" element={<TrustSafetyPage />} />
      <Route path="/report/:kind" element={<ReportPage />} />
      <Route path="/support/:slug" element={<UtilityInfoPage />} />
      <Route path="/compliance" element={<CompliancePage />} />
      <Route path="/impact" element={<ImpactDashboardPage />} />
      <Route path="/dashboard" element={<Navigate to="/dashboard/sell" replace />} />
      <Route path="/dashboard/sell" element={<RequireAuth><RoleDashboardPage initialMode="seller" /></RequireAuth>} />
      <Route path="/dashboard/buy" element={<RequireAuth><RoleDashboardPage initialMode="buyer" /></RequireAuth>} />
      <Route path="/ngo" element={<RequireAuth><RoleDashboardPage initialRole="ngo" /></RequireAuth>} />
      <Route path="/business" element={<RequireAuth><RoleDashboardPage initialRole="business" /></RequireAuth>} />
      <Route path="/volunteer" element={<RequireAuth><RoleDashboardPage initialRole="volunteer" /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfileSettingsPage /></RequireAuth>} />
      <Route path="/saved" element={<RequireAuth><SavedResourcesPage /></RequireAuth>} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin" element={<RequireAuth roles={["admin"]}><AdminDashboardPage /></RequireAuth>} />
      <Route path="/login" element={<SignInPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
