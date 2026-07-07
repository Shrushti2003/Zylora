import { AlertTriangle, Ban, Flag, ShieldAlert } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { projectPhotos } from "../data/visuals";

const reportTypes = ["Expired items", "Fake listings", "Misleading information", "Fraud", "Harassment", "Inappropriate behavior"];
const actions = ["Warning", "Suspension", "Permanent Ban"];

export function CompliancePage() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(reportTypes[0]);

  function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Report submitted. The safety team will review evidence and apply warning, suspension, or permanent ban when verified.");
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Legal & Compliance"
        title="Report unsafe, fake, or abusive activity."
        description="Zylora protects communities with reporting flows for expired items, fake listings, fraud, harassment, and misleading information."
        image={projectPhotos.seedling}
        imageAlt="Sustainability and responsible community protection"
      >
        <SurfaceCard>
          <ShieldAlert className="h-7 w-7 text-secondary" />
          <h2 className="mt-4 text-2xl font-semibold">Professional platform notice</h2>
          <p className="mt-3 text-on-surface-variant">
            This is a professional platform. Fraudulent, misleading, abusive, or inappropriate behavior will not be tolerated.
          </p>
        </SurfaceCard>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <SurfaceCard>
            <h2 className="text-2xl font-semibold">Create a report</h2>
            <form className="listing-form" onSubmit={submitReport}>
              {["Listing URL or ID", "Reported user", "Report type", "Evidence or notes"].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  {label === "Report type" ? (
                    <select onChange={(event) => setOpen(event.target.value)}>
                      {reportTypes.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  ) : label === "Evidence or notes" ? (
                    <textarea placeholder="Explain what happened and include pickup/message context." required />
                  ) : (
                    <input placeholder={label === "Listing URL or ID" ? "Example: resource-123" : "Name, phone, or email"} required />
                  )}
                </label>
              ))}
              <button className="organic-button primary auth-submit span-2" type="submit">
              <Flag size={17} /> Submit report
              </button>
            </form>
            {message ? <p className="auth-help mt-3">{message}</p> : null}
          </SurfaceCard>
          <div className="dashboard-side-stack">
            <SurfaceCard>
              <AlertTriangle className="h-6 w-6 text-secondary" />
              <h2 className="mt-4 text-xl font-semibold">Users can report</h2>
              <div className="support-grid">
                {reportTypes.map((item) => <button type="button" className={open === item ? "active" : ""} key={item} onClick={() => setOpen(item)}>{item}</button>)}
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">{open} reports are reviewed with listing history, messages, uploaded evidence, and user account signals.</p>
            </SurfaceCard>
            <SurfaceCard>
              <Ban className="h-6 w-6 text-secondary" />
              <h2 className="mt-4 text-xl font-semibold">If verified</h2>
              <div className="support-grid">
                {actions.map((item) => <span key={item}>{item}</span>)}
              </div>
            </SurfaceCard>
          </div>
        </div>
      </PageShell>
    </PlatformLayout>
  );
}
