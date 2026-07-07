import { CheckCircle2, UploadCloud } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { reportKinds } from "../data/supportContent";

const kindMap: Record<string, (typeof reportKinds)[number]> = {
  user: "Report User",
  listing: "Report Listing",
  scam: "Report Scam",
  copyright: "Report Copyright",
  "technical-issue": "Report Technical Issue",
  bug: "Report Technical Issue"
};

const reasons = [
  "Fake or misleading information",
  "Unsafe or illegal item",
  "Harassment or abuse",
  "Scam or fraud attempt",
  "Copyright or IP issue",
  "Technical bug",
  "Other"
];

export function ReportPage() {
  const { kind = "technical-issue" } = useParams();
  const reportKind = kindMap[kind];
  const [submitted, setSubmitted] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const title = useMemo(() => reportKind ?? "Report Technical Issue", [reportKind]);

  if (!reportKind) {
    return <Navigate to="/not-found" replace />;
  }

  function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Report Center"
        title={title}
        description="Send the safety or support team the details needed to review an issue. Do not include passwords or OTPs."
        image="/FAQ.jpg"
        imageAlt="Support desk reviewing report details"
      >
        {submitted ? (
          <SurfaceCard className="confirmation-card">
            <CheckCircle2 className="h-10 w-10 text-secondary" />
            <h2>Report submitted</h2>
            <p>Thank you. The Zylora team will review your report with the context you provided and follow up when more information is needed.</p>
          </SurfaceCard>
        ) : (
          <SurfaceCard>
            <form className="listing-form report-form" onSubmit={submitReport}>
              <label>
                <span>Reason</span>
                <select required defaultValue="">
                  <option value="" disabled>Select a reason</option>
                  {reasons.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
              </label>
              <label>
                <span>Listing, profile, or page URL</span>
                <input placeholder="Paste a URL or write the listing/profile name" />
              </label>
              <label className="span-2">
                <span>Description</span>
                <textarea required placeholder="Explain what happened, who was involved, and why this needs review." />
              </label>
              <label className="upload-box report-upload span-2">
                <UploadCloud className="h-10 w-10 text-primary" />
                <strong>{fileCount ? `${fileCount} screenshot${fileCount === 1 ? "" : "s"} selected` : "Optional screenshots"}</strong>
                <span>Attach screenshots that help explain the issue.</span>
                <input type="file" accept="image/*" multiple onChange={(event) => setFileCount(event.currentTarget.files?.length ?? 0)} />
              </label>
              <button className="organic-button primary auth-submit span-2" type="submit">Submit report</button>
            </form>
          </SurfaceCard>
        )}
      </PageShell>
    </PlatformLayout>
  );
}
