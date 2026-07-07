import { Link } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";

export function NotFoundPage() {
  return (
    <PlatformLayout>
      <PageShell
        eyebrow="404"
        title="Page not found."
        description="The page may have moved, or the link may no longer be available."
        image="/FAQ.jpg"
        imageAlt="Help and support illustration"
      >
        <SurfaceCard className="empty-state-card">
          <h2>Find the right Zylora page</h2>
          <p>Use the Help Center, Browse, or Contact Support to continue.</p>
          <div className="quick-action-grid inline-actions">
            <Link to="/help" className="organic-button primary">Help Center</Link>
            <Link to="/marketplace" className="organic-button secondary">Browse</Link>
            <Link to="/contact" className="organic-button secondary">Contact</Link>
          </div>
        </SurfaceCard>
      </PageShell>
    </PlatformLayout>
  );
}
