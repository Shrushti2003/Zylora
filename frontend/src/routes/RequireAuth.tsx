import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import type { UserRole } from "../types/auth";
import { AuthenticatedLayout } from "../components/layout/AuthenticatedLayout";

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const initialized = useSelector((state: RootState) => state.auth.initialized);
  const hasSession = Boolean(user);

  if (!initialized) {
    return null;
  }

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard/sell" replace />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
