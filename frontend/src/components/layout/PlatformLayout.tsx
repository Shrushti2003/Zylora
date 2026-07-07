import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, MessageCircle, Recycle, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthenticatedUser } from "../../features/auth/authSlice";
import { logout } from "../../services/auth.service";
import type { AppDispatch, RootState } from "../../store/store";
import { clearEmailVerificationBannerDismissal, dismissEmailVerificationBanner, isEmailVerificationBannerDismissed } from "../../utils/emailVerificationBanner";
import { ProfileAvatar } from "../common/ProfileAvatar";
import { SiteFooter } from "./SiteFooter";

const links = [
  { label: "Browse", to: "/marketplace" },
  { label: "Map", to: "/resource-map" },
  { label: "Donate", to: "/donate" },
  { label: "Verify", to: "/verify" },
  { label: "Stories", to: "/stories" },
  { label: "Impact", to: "/impact" },
  { label: "Help", to: "/help" }
];

const helpLinks = [
  { label: "Help Center", to: "/help" },
  { label: "FAQs", to: "/help/faqs" },
  { label: "Trust & Safety", to: "/trust-safety" },
  { label: "Legal", to: "/legal/privacy-policy" },
  { label: "Privacy", to: "/legal/privacy-policy" },
  { label: "Terms", to: "/legal/terms-of-use" },
  { label: "Community Guidelines", to: "/community-guidelines" },
  { label: "Contact Support", to: "/contact" }
];

export function PlatformLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmailBannerDismissed, setIsEmailBannerDismissed] = useState(false);
  const [isEmailBannerClosing, setIsEmailBannerClosing] = useState(false);
  const emailBannerCloseTimerRef = useRef<number>();
  const userId = user?.id;
  const isEmailVerified = Boolean(user?.verification.isEmailVerified);
  const shouldShowEmailBanner = Boolean(user && !isEmailVerified && !isEmailBannerDismissed);

  useEffect(() => {
    setIsEmailBannerClosing((current) => current ? false : current);

    if (!userId) {
      setIsEmailBannerDismissed((current) => current ? false : current);
      return;
    }

    if (isEmailVerified) {
      clearEmailVerificationBannerDismissal(userId);
      setIsEmailBannerDismissed((current) => current ? false : current);
      return;
    }

    const nextDismissed = isEmailVerificationBannerDismissed(userId);
    setIsEmailBannerDismissed((current) => current === nextDismissed ? current : nextDismissed);
  }, [isEmailVerified, userId]);

  useEffect(() => {
    return () => {
      if (emailBannerCloseTimerRef.current) {
        window.clearTimeout(emailBannerCloseTimerRef.current);
      }
    };
  }, []);

  function handleDismissEmailBanner() {
    if (!userId) return;

    dismissEmailVerificationBanner(userId);
    setIsEmailBannerClosing(true);
    if (emailBannerCloseTimerRef.current) {
      window.clearTimeout(emailBannerCloseTimerRef.current);
    }
    emailBannerCloseTimerRef.current = window.setTimeout(() => {
      setIsEmailBannerDismissed(true);
      setIsEmailBannerClosing(false);
      emailBannerCloseTimerRef.current = undefined;
    }, 220);
  }

  async function handleLogout() {
    try {
      await logout(userId);
    } finally {
      dispatch(clearAuthenticatedUser());
      navigate("/", { replace: true });
    }
  }

  return (
    <main className="botanical-page">
      <div className="paper-texture" aria-hidden="true" />
      <header className="botanical-header">
        <nav className="botanical-nav">
          <Link to="/" className="botanical-brand">
            <span>
              <Recycle size={20} strokeWidth={1.5} />
            </span>
            Zylora
          </Link>
          <div className="botanical-links">
            {links.slice(0, 5).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "active-platform-link" : undefined
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to={links[5].to}
              className={({ isActive }) =>
                isActive ? "active-platform-link" : undefined
              }
            >
              {links[5].label}
            </NavLink>
            <div className={`dashboard-nav-switcher ${isDashboardRoute ? "active-dashboard-nav" : ""}`} aria-label="Buy / Sell dashboard switcher">
              <NavLink to="/dashboard/buy" className={({ isActive }) => isActive ? "active-dashboard-link" : undefined}>
                Buy
              </NavLink>
              <span aria-hidden="true">/</span>
              <NavLink to="/dashboard/sell" className={({ isActive }) => isActive ? "active-dashboard-link" : undefined}>
                Sell
              </NavLink>
            </div>
            <div className="help-nav-dropdown">
              <NavLink
                to={links[6].to}
                className={({ isActive }) =>
                  isActive || location.pathname.startsWith("/legal") || location.pathname.startsWith("/trust-safety") || location.pathname.startsWith("/report") ? "active-platform-link" : undefined
                }
              >
                {links[6].label} <ChevronDown className="h-4 w-4" />
              </NavLink>
              <div className="help-nav-menu" aria-label="Help navigation">
                {helpLinks.map((link) => (
                  <NavLink key={link.to + link.label} to={link.to}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
          <div className="nav-actions">
            <Link to="/messages" className="text-link nav-message-link">
              <MessageCircle className="h-4 w-4" />
              Messages <span>{user?.unreadMessageCount ?? 0}</span>
            </Link>
            <Link to="/profile" className="organic-button secondary small">
              {user ? <ProfileAvatar profile={user} className="nav-avatar" /> : null}
              {user ? `Hi, ${user.name.split(" ")[0]}` : "Profile"}
            </Link>
            {user ? (
              <button type="button" className="icon-text-button" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : null}
            <button
              className="menu-button"
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="platform-mobile-menu"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
        {isMenuOpen ? (
          <div id="platform-mobile-menu" className="mobile-menu">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => isActive ? "active-platform-link" : undefined}
              >
                {link.label}
              </NavLink>
            ))}
            {helpLinks.map((link) => (
              <NavLink key={link.to + link.label} to={link.to} onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/dashboard/buy" onClick={() => setIsMenuOpen(false)}>Buy</NavLink>
            <NavLink to="/dashboard/sell" onClick={() => setIsMenuOpen(false)}>Sell</NavLink>
            <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>Profile</NavLink>
            <NavLink to="/messages" onClick={() => setIsMenuOpen(false)}>Messages</NavLink>
          </div>
        ) : null}
      </header>
      {shouldShowEmailBanner ? (
        <div className={`session-notice ${isEmailBannerClosing ? "is-dismissing" : ""}`} role="status">
          <span>Verify your email to keep account recovery and trust signals up to date.</span>
          <button
            type="button"
            className="session-notice-close"
            aria-label="Dismiss email verification notification"
            onClick={handleDismissEmailBanner}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {children}
      <SiteFooter />
    </main>
  );
}
