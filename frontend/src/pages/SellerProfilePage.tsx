import { Navigate, useParams } from "react-router-dom";

export function SellerProfilePage() {
  const { slug = "" } = useParams();

  return <Navigate to={`/profile/${encodeURIComponent(slug || "zylora-member")}`} replace />;
}
