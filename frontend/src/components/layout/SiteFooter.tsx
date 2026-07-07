import { Github, Instagram, Linkedin, Recycle, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const footerGroups = [
  {
    title: "Product",
    links: [
      ["Browse", "/marketplace"],
      ["Donate", "/donate"],
      ["Buy", "/dashboard/buy"],
      ["Sell", "/dashboard/sell"],
      ["Impact", "/impact"],
      ["Stories", "/stories"],
      ["Map", "/resource-map"],
      ["Help", "/help"]
    ]
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Careers (Coming Soon)", "/support/press"],
      ["Blog (Coming Soon)", "/stories"],
      ["Press (Coming Soon)", "/support/press"],
      ["Contact", "/contact"]
    ]
  },
  {
    title: "Resources",
    links: [
      ["Help Center", "/help"],
      ["FAQs", "/help/faqs"],
      ["Community Guidelines", "/trust-safety#community-guidelines"],
      ["Safety Center", "/trust-safety"],
      ["Developer Docs (Coming Soon)", "/support/status"]
    ]
  },
  {
    title: "Legal",
    links: [
      ["Privacy Policy", "/legal/privacy-policy"],
      ["Terms of Use", "/legal/terms-of-use"],
      ["Cookie Policy", "/legal/cookie-policy"],
      ["Copyright Policy", "/legal/copyright-policy"],
      ["Data & Privacy", "/legal/data-and-privacy"]
    ]
  },
  {
    title: "Trust",
    links: [
      ["Report User", "/report/user"],
      ["Report Listing", "/report/listing"],
      ["Report Scam", "/report/scam"],
      ["Status (Coming Soon)", "/support/status"]
    ]
  }
] as const;

const socialLinks = [
  ["GitHub", "https://github.com", Github],
  ["LinkedIn", "https://www.linkedin.com", Linkedin],
  ["Instagram", "https://www.instagram.com", Instagram],
  ["Twitter/X (Coming Soon)", "/support/press", Twitter]
] as const;

export function SiteFooter() {
  return (
    <footer className="botanical-footer">
      <div className="organic-shell footer-inner">
        <div className="footer-brand-block">
          <strong><Recycle size={26} strokeWidth={1.5} /> Zylora</strong>
          <span>AI-powered circular economy marketplace for local resource exchange.</span>
          <small>© 2026 Zylora. Empowering the Circular Economy.</small>
        </div>
        <div className="footer-link-grid" aria-label="Footer navigation">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <strong>{group.title}</strong>
              {group.links.map(([label, to]) => (
                <Link key={label} to={to}>{label}</Link>
              ))}
            </nav>
          ))}
          <nav aria-label="Social">
            <strong>Social</strong>
            {socialLinks.map(([label, to, Icon]) => (
              to.startsWith("http") ? (
                <a key={label} href={to} target="_blank" rel="noreferrer" className="social-footer-link" aria-label={`${label} profile`}>
                  <Icon size={15} strokeWidth={1.8} />
                  {label}
                </a>
              ) : (
                <Link key={label} to={to} className="social-footer-link" aria-label={label}>
                  <Icon size={15} strokeWidth={1.8} />
                  {label}
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
