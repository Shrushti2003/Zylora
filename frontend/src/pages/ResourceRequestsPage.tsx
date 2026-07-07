import { AlertTriangle, Clock, Plus } from "lucide-react";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { projectPhotos } from "../data/visuals";

const requests = [
  ["School desks", "High", "Open"],
  ["Winter blankets", "Medium", "Matching"],
  ["Laptop for training lab", "High", "Open"]
];

export function ResourceRequestsPage() {
  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Resource requests"
        title="Post needs and track fulfillment."
        description="NGOs, schools, and communities can request desks, books, cement, kitchen tools, instruments, and household items with urgency tags and matching recommendations."
        image={projectPhotos.classroom}
        imageAlt="School classroom benefiting from donated resources"
      >
        <div className="mb-6 flex justify-end">
          <button className="flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
            <Plus className="h-4 w-4" /> Create request
          </button>
        </div>
        <div className="grid gap-4">
          {requests.map(([title, urgency, status]) => (
            <SurfaceCard key={title} className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant"><Clock className="h-4 w-4" /> Request status: {status}</p>
              </div>
              <span className="flex w-fit items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-secondary">
                <AlertTriangle className="h-4 w-4" /> {urgency} urgency
              </span>
            </SurfaceCard>
          ))}
        </div>
      </PageShell>
    </PlatformLayout>
  );
}
