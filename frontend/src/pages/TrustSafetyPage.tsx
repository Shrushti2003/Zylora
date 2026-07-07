import { Link } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { trustSafetySections } from "../data/supportContent";
import { projectPhotos } from "../data/visuals";

export function TrustSafetyPage() {
  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Trust & Safety"
        title="Safe, honest resource sharing."
        description="Community guidelines, buyer safety, seller safety, account security, scam awareness, and reporting paths for suspicious activity."
        image={projectPhotos.seedling}
        imageAlt="Hands holding a seedling symbolizing trusted community care"
      >
        <section className="documentation-layout">
          <aside className="doc-sidebar" aria-label="Trust and safety navigation">
            {trustSafetySections.map((section) => (
              <a key={section.title} href={`#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}>
                {section.title}
              </a>
            ))}
          </aside>
          <div className="doc-article-grid">
            {trustSafetySections.map((section) => {
              const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              return (
                <SurfaceCard key={section.title} id={id} className="support-category-card">
                  <section.icon className="h-6 w-6 text-secondary" />
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  {section.title.startsWith("Report") ? (
                    <Link className="organic-button secondary small" to={`/report/${section.title.replace("Report ", "").toLowerCase().replace(/\s+/g, "-")}`}>
                      Open report form
                    </Link>
                  ) : null}
                </SurfaceCard>
              );
            })}
          </div>
        </section>
      </PageShell>
    </PlatformLayout>
  );
}
