import type { UserRole } from "./userRole.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        firebaseUid?: string;
      };
      firebaseUser?: {
        uid: string;
        email?: string;
        displayName?: string;
        photoURL?: string;
        provider?: string;
      };
      firebaseIdToken?: string;
      authSource?: "bearer" | "cookie";
    }
  }
}

export {};
