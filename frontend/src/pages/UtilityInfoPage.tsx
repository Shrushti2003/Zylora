import { Navigate, Link, useParams } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { utilityPages } from "../data/supportContent";
import { projectPhotos } from "../data/visuals";

export function UtilityInfoPage() {
  const { slug = "status" } = useParams();
  const page = utilityPages.find((item) => item.slug === slug);

  if (!page) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Resources"
        title={page.title}
        description={page.summary}
        image={projectPhotos.seedling}
        imageAlt="Zylora resource information"
      >
        <section className="documentation-layout">
          <aside className="doc-sidebar" aria-label="Resource navigation">
            {utilityPages.map((item) => (
              <Link key={item.slug} to={`/support/${item.slug}`} className={item.slug === page.slug ? "active" : undefined}>
                {item.title}
              </Link>
            ))}
          </aside>
          <SurfaceCard className="legal-document">
            {page.sections.map((section) => <p key={section}>{section}</p>)}
          </SurfaceCard>
        </section>
      </PageShell>
    </PlatformLayout>
  );
}
