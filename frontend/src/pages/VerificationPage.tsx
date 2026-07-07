import { Building2, FileCheck2, School } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { VerifiedBadge } from "../components/common/VerifiedBadge";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { createId, loadVerifications, saveVerification, syncProfileReferences, verificationTypes, type VerificationRequest } from "../data/mvpData";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import { refreshCurrentUser, submitVerificationApi } from "../services/auth.service";
import type { AppDispatch, RootState } from "../store/store";

const documentRequirements: Record<string, string[]> = {
  NGO: ["Registration Certificate", "PAN", "GST if available", "Address Proof"],
  School: ["Government Recognition Certificate", "Address Proof", "Principal Authorization"],
  College: ["Affiliation Certificate", "Address Proof", "Principal Authorization"],
  Charity: ["Registration Certificate", "PAN", "Address Proof"],
  Foundation: ["Trust Deed", "PAN", "Address Proof"],
  Hotel: ["Business Registration", "Address Verification", "Food Safety License if applicable"],
  Restaurant: ["Business Registration", "Address Verification", "Food Safety License"],
  "Community Organization": ["Local authorization", "Address Proof", "Coordinator ID"]
};

export function VerificationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [requests, setRequests] = useState<VerificationRequest[]>(() => loadVerifications());
  const [organizationName, setOrganizationName] = useState("");
  const [type, setType] = useState("NGO");
  const [notes, setNotes] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const requiredDocs = useMemo(() => documentRequirements[type] ?? [], [type]);

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request: VerificationRequest = {
      id: createId("verification"),
      organizationName,
      type,
      documents: selectedDocuments,
      status: selectedDocuments.length >= Math.min(2, requiredDocs.length) ? "Approved" : "Under Review",
      notes
    };
    const next = saveVerification(request);
    setRequests(next);
    if (user) {
      const updated = await submitVerificationApi({ organizationName, type, documents: selectedDocuments, notes });
      const freshUser = await refreshCurrentUser();
      const nextUser = freshUser ?? updated;
      syncProfileReferences(nextUser);
      dispatch(setAuthenticatedUser(nextUser));
    }
    setOrganizationName("");
    setNotes("");
    setSelectedDocuments([]);
  }

  function advanceStatus(request: VerificationRequest) {
    const flow: VerificationRequest["status"][] = ["Submitted", "Under Review", "Approved", "Rejected"];
    const nextStatus = flow[(flow.indexOf(request.status) + 1) % flow.length];
    const next = saveVerification({ ...request, status: nextStatus });
    setRequests(next);
  }

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Organization verification"
        title="Building trust through transparency."
        description="NGOs, schools, colleges, charities, foundations, hotels, restaurants, and community organizations can submit documents and earn visible verification badges."
        image="/verify.png"
        imageAlt="School classroom supported by community resources"
      >
        <div className="grid gap-5 md:grid-cols-4">
          {[
            { title: "Organization identity", icon: <Building2 className="h-6 w-6 text-secondary" /> },
            { title: "Required documents", icon: <FileCheck2 className="h-6 w-6 text-secondary" /> },
            { title: "Need categories", icon: <School className="h-6 w-6 text-secondary" /> },
            { title: "Blue verification badge", icon: <VerifiedBadge small /> }
          ].map(({ title, icon }) => (
            <SurfaceCard key={title}>
              {icon}
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Approved organizations show a verified badge on profile, listings, stories, and messaging.
              </p>
            </SurfaceCard>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <SurfaceCard>
            <h2 className="text-2xl font-semibold">Submit verification</h2>
            <form className="listing-form" onSubmit={submitVerification}>
              <label>
                <span>Organization name</span>
                <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required />
              </label>
              <label>
                <span>Organization type</span>
                <select value={type} onChange={(event) => { setType(event.target.value); setSelectedDocuments([]); }}>
                  {verificationTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="span-2">
                <span>Service areas and pickup capacity</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Cities served, pickup days, beneficiary groups, resource needs." />
              </label>
              <div className="span-2 checklist-grid">
                {requiredDocs.map((doc) => (
                  <label key={doc} className="check-pill">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc)}
                      onChange={(event) => setSelectedDocuments((current) => event.target.checked ? [...current, doc] : current.filter((item) => item !== doc))}
                    />
                    <span>{doc}</span>
                  </label>
                ))}
              </div>
              <button className="organic-button primary auth-submit span-2" type="submit">Submit for review</button>
            </form>
          </SurfaceCard>
          <SurfaceCard>
            <VerifiedBadge />
            <h2 className="mt-4 text-2xl font-semibold">Review flow</h2>
            {user?.verification?.isIdentityVerified ? <span className="verified-badge mt-3"><VerifiedBadge small /> Blue verified badge active</span> : null}
            <div className="status-flow">
              {["Submitted", "Under Review", "Approved", "Rejected"].map((status) => <span key={status}>{status}</span>)}
            </div>
            <div className="mt-5 grid gap-3">
              {requests.map((request) => (
                <button key={request.id} type="button" className="verification-row" onClick={() => advanceStatus(request)}>
                  <strong>{request.organizationName}</strong>
                  <span>{request.type} - {request.documents.length} documents</span>
                  <em className={request.status === "Approved" ? "verified-badge" : ""}>
                    {request.status === "Approved" ? <VerifiedBadge small /> : null}
                    {request.status}
                  </em>
                </button>
              ))}
              {!requests.length ? <p className="text-sm text-on-surface-variant">Submitted requests will appear here with status controls.</p> : null}
            </div>
          </SurfaceCard>
        </div>
      </PageShell>
    </PlatformLayout>
  );
}
