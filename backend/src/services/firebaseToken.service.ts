import { createVerify } from "node:crypto";
import { firebaseAdminAuth, hasFirebaseAdminCredentials } from "../config/firebaseAdmin.js";
import { env } from "../config/env.js";

type FirebaseJwtHeader = {
  alg?: string;
  kid?: string;
};

type FirebaseJwtPayload = {
  aud?: string;
  email?: string;
  email_verified?: boolean;
  exp?: number;
  firebase?: {
    identities?: Record<string, string[]>;
    sign_in_provider?: string;
  };
  iat?: number;
  iss?: string;
  name?: string;
  picture?: string;
  sub?: string;
  user_id?: string;
};

export type VerifiedFirebaseToken = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  firebase?: {
    identities?: Record<string, string[]>;
    sign_in_provider?: string;
  };
  name?: string;
  picture?: string;
};

const firebaseCertsUrl = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const maxTokenAgeSeconds = 60 * 60 * 24;

let cachedCerts: Record<string, string> | null = null;
let cachedCertsExpiresAt = 0;

export async function verifyFirebaseIdToken(token: string): Promise<VerifiedFirebaseToken> {
  if (!hasFirebaseAdminCredentials) {
    return verifyWithGooglePublicCerts(token);
  }

  try {
    return await firebaseAdminAuth.verifyIdToken(token);
  } catch {
    return verifyWithGooglePublicCerts(token);
  }
}

export async function verifyFirebaseSessionCookie(cookie: string): Promise<VerifiedFirebaseToken> {
  if (!hasFirebaseAdminCredentials) {
    throw new Error("Firebase Admin credentials are required to verify session cookies.");
  }

  return firebaseAdminAuth.verifySessionCookie(cookie, true);
}

export async function createFirebaseSessionCookie(idToken: string, expiresInMs: number) {
  if (!hasFirebaseAdminCredentials) {
    throw new Error("Firebase Admin credentials are required to create session cookies.");
  }

  return firebaseAdminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });
}

async function verifyWithGooglePublicCerts(token: string): Promise<VerifiedFirebaseToken> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Invalid Firebase session");
  }

  const header = parseJwtPart<FirebaseJwtHeader>(encodedHeader);
  const payload = parseJwtPart<FirebaseJwtPayload>(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Invalid Firebase token header");
  }

  const cert = (await getFirebaseCerts())[header.kid];

  if (!cert) {
    throw new Error("Unknown Firebase token key");
  }

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const isSignatureValid = verifier.verify(cert, Buffer.from(encodedSignature, "base64url"));

  if (!isSignatureValid) {
    throw new Error("Invalid Firebase token signature");
  }

  validateFirebasePayload(payload);

  return {
    uid: payload.sub ?? payload.user_id ?? "",
    email: payload.email,
    email_verified: payload.email_verified,
    firebase: payload.firebase,
    name: payload.name,
    picture: payload.picture
  };
}

function validateFirebasePayload(payload: FirebaseJwtPayload) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;

  if (payload.aud !== env.FIREBASE_PROJECT_ID) {
    throw new Error("Firebase token has an invalid audience");
  }

  if (payload.iss !== expectedIssuer) {
    throw new Error("Firebase token has an invalid issuer");
  }

  if (!payload.sub || payload.sub.length > 128) {
    throw new Error("Firebase token has an invalid subject");
  }

  if (!payload.exp || payload.exp <= nowSeconds) {
    throw new Error("Firebase session has expired");
  }

  if (!payload.iat || payload.iat > nowSeconds + 300 || nowSeconds - payload.iat > maxTokenAgeSeconds) {
    throw new Error("Firebase token was issued outside the accepted time window");
  }
}

async function getFirebaseCerts() {
  if (cachedCerts && cachedCertsExpiresAt > Date.now()) {
    return cachedCerts;
  }

  const response = await fetch(firebaseCertsUrl);

  if (!response.ok) {
    throw new Error("Could not load Firebase public certificates");
  }

  cachedCerts = await response.json() as Record<string, string>;
  cachedCertsExpiresAt = Date.now() + getMaxAgeMs(response.headers.get("cache-control"));

  return cachedCerts;
}

function getMaxAgeMs(cacheControl: string | null) {
  const maxAge = cacheControl?.match(/max-age=(\d+)/)?.[1];
  return maxAge ? Number(maxAge) * 1000 : 60 * 60 * 1000;
}

function parseJwtPart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}
