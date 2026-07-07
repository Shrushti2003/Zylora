import { Navigate, useParams } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { legalDocuments } from "../data/supportContent";
import { projectPhotos } from "../data/visuals";

export function LegalDocumentPage() {
  const { slug = "privacy-policy" } = useParams();
  const document = legalDocuments.find((item) => item.slug === slug);

  if (!document) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Legal Center"
        title={document.title}
        description={document.summary}
        image={projectPhotos.community}
        imageAlt="Community resource exchange legal information"
      >
        <section className="documentation-layout legal-layout">
          <aside className="doc-sidebar" aria-label="Legal navigation">
            {legalDocuments.map((item) => (
              <a key={item.slug} href={`/legal/${item.slug}`} className={item.slug === document.slug ? "active" : undefined}>
                {item.title}
              </a>
            ))}
          </aside>
          <article className="legal-document">
            <div className="doc-meta">
              <span>Last Updated</span>
              <strong>{document.updated}</strong>
            </div>
            <SurfaceCard className="table-of-contents">
              <h2>Table of contents</h2>
              {document.sections.map((section) => (
                <a key={section.heading} href={`#${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}>
                  {section.heading}
                </a>
              ))}
            </SurfaceCard>
            {document.sections.map((section) => {
              const id = section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              return (
                <section key={section.heading} id={id} className="legal-section">
                  <h2>{section.heading}</h2>
                  {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>
              );
            })}
          </article>
        </section>
      </PageShell>
    </PlatformLayout>
  );
}
