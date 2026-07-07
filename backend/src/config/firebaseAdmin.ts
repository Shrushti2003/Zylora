import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env.js";

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (raw) {
    return JSON.parse(raw.replace(/\\n/g, "\n"));
  }

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  return null;
}

const serviceAccount = parseServiceAccount();
export const hasFirebaseAdminCredentials = Boolean(serviceAccount);

export const firebaseAdminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
      projectId: env.FIREBASE_PROJECT_ID
    });

export const firebaseAdminAuth = getAuth(firebaseAdminApp);
