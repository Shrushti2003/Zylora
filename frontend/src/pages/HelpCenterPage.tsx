import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileQuestion, LifeBuoy, Mail, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { contactSupportOptions, faqCategories } from "../data/supportContent";

const quickActions = [
  ["Contact Support", "/contact", Mail],
  ["Trust & Safety", "/trust-safety", ShieldCheck],
  ["Legal Center", "/legal/privacy-policy", FileQuestion],
  ["Report an Issue", "/report/technical-issue", LifeBuoy]
] as const;

const helpKeywords = ["privacy", "account", "listing", "seller", "buyer", "messages", "donation", "report", "verification"];

export function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const categories = useMemo(() => {
    if (!normalizedQuery) return faqCategories;
    return faqCategories.filter((category) =>
      [category.title, category.description, ...category.items].join(" ").toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Support Center"
        title="Support for every Zylora journey."
        description="Find answers, contact support, manage your account, understand privacy, stay safe, and learn how to use Zylora."
        image="/FAQ.jpg"
        imageAlt="People organizing reusable resources with support guidance"
      >
        <section className="support-hero-panel" aria-labelledby="help-search-title">
          <div>
            <h2 id="help-search-title">How can we help?</h2>
            <label className="help-search-box">
              <Search size={20} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search privacy, account, listing, seller, buyer, messages, donation, report, verification"
                aria-label="Search the Help Center"
              />
            </label>
            <div className="suggestion-row" aria-label="Popular help searches">
              {helpKeywords.map((keyword) => (
                <button key={keyword} type="button" onClick={() => setQuery(keyword)}>
                  {keyword}
                </button>
              ))}
            </div>
          </div>
          <div className="support-illustration" aria-hidden="true">
            <span />
            <strong>Z</strong>
            <small />
          </div>
        </section>

        <div className="quick-action-grid">
          {quickActions.map(([label, to, Icon]) => (
            <Link key={label} to={to} className="quick-action-card">
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>

        <section className="documentation-layout">
          <aside className="doc-sidebar" aria-label="Help sections">
            <Link to="/help">Help Center</Link>
            <Link to="/help/faqs">FAQs</Link>
            <Link to="/trust-safety">Trust & Safety</Link>
            <Link to="/contact">Contact Support</Link>
            <Link to="/legal/privacy-policy">Privacy</Link>
            <Link to="/legal/terms-of-use">Terms</Link>
          </aside>
          <div>
            <div className="doc-heading-row">
              <div>
                <span className="botanical-eyebrow">FAQs</span>
                <h2>Browse by category</h2>
              </div>
              <p>{categories.length} result{categories.length === 1 ? "" : "s"}</p>
            </div>
            <AnimatePresence mode="popLayout">
              <div className="support-category-grid">
                {categories.map((category) => (
                  <motion.article
                    key={category.title}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="organic-card platform-card support-category-card"
                  >
                    <category.icon className="h-6 w-6 text-secondary" />
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                    <ul>
                      {category.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </motion.article>
                ))}
              </div>
            </AnimatePresence>
            {!categories.length ? (
              <SurfaceCard className="empty-state-card">
                <h2>No help articles found</h2>
                <p>Try searching for privacy, account, listing, messages, donation, report, or verification.</p>
              </SurfaceCard>
            ) : null}
          </div>
        </section>

        <section className="support-section-band">
          <div className="doc-heading-row">
            <div>
              <span className="botanical-eyebrow">Contact Support</span>
              <h2>Choose the right support path</h2>
            </div>
            <Link to="/contact" className="organic-button secondary small">Contact</Link>
          </div>
          <div className="support-category-grid compact">
            {contactSupportOptions.map((option) => (
              <SurfaceCard key={option.title} className="support-category-card">
                <option.icon className="h-5 w-5 text-secondary" />
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </SurfaceCard>
            ))}
          </div>
        </section>
      </PageShell>
    </PlatformLayout>
  );
}
