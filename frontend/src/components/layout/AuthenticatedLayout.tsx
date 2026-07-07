import type { PropsWithChildren } from "react";

/**
 * Marks routes that require a live Firebase session. Their page-level platform
 * layout supplies the shared global background and navigation.
 */
export function AuthenticatedLayout({ children }: PropsWithChildren) {
  return <div className="authenticated-layout">{children}</div>;
}
