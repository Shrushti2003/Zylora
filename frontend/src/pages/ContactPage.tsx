import { Building2, HandHeart, Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { projectPhotos } from "../data/visuals";

export function ContactPage() {
  const [message, setMessage] = useState("");

  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Inquiry sent. The Zylora team will follow up with the contact details you provided.");
    event.currentTarget.reset();
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Contact"
        title="Start a donation, school, NGO, or community partnership."
        description="Reach out for resource drives, construction reuse, affordable item programs, verification support, and circular economy pilots."
        image={projectPhotos.seedling}
        imageAlt="Hands holding a seedling as a symbol of community sustainability"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <SurfaceCard>
            <form onSubmit={submitInquiry}>
            <div className="grid gap-4 sm:grid-cols-2">
              {["Name", "Email", "Organization", "Inquiry type"].map((label) => (
                <label key={label}>
                  <span className="text-sm text-on-surface-variant">{label}</span>
                  <input
                    className="mt-2 w-full rounded-md border border-primary/15 bg-surface-container px-3 py-3 outline-none"
                    type={label === "Email" ? "email" : "text"}
                    required={label !== "Organization"}
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-sm text-on-surface-variant">Message</span>
              <textarea className="mt-2 min-h-36 w-full rounded-md border border-primary/15 bg-surface-container px-3 py-3 outline-none" required />
            </label>
            <button type="submit" className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
              <Send className="h-4 w-4" /> Send inquiry
            </button>
            {message ? <p className="auth-help mt-3" role="status">{message}</p> : null}
            </form>
          </SurfaceCard>
          <div className="space-y-4">
            {[
              ["Community Drive", Building2],
              ["NGO or School Verification", HandHeart],
              ["Donation Partnership", Mail]
            ].map(([label, Icon]) => (
              <SurfaceCard key={label as string}>
                <Icon className="h-6 w-6 text-secondary" />
                <p className="mt-3 font-semibold">{label as string}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </PageShell>
    </PlatformLayout>
  );
}
