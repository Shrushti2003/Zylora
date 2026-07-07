import { BarChart3, Building2, ShieldCheck, Users } from "lucide-react";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";

export function AdminDashboardPage() {
  return (
    <PlatformLayout>
      <PageShell eyebrow="Hidden admin" title="Platform operations and verification controls." description="Admin route for user management, listing moderation, organization verification, resource approval, and platform analytics.">
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ["User Management", Users],
            ["Listing Moderation", ShieldCheck],
            ["NGO & Business Verification", Building2],
            ["Analytics Dashboard", BarChart3]
          ].map(([label, Icon]) => (
            <SurfaceCard key={label as string}>
              <Icon className="h-6 w-6 text-secondary" />
              <h2 className="mt-4 text-lg font-semibold">{label as string}</h2>
            </SurfaceCard>
          ))}
        </div>
      </PageShell>
    </PlatformLayout>
  );
}

