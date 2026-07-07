import type { NextFunction, Request, Response } from "express";
import { UserRepository } from "../repositories/user.repository.js";
import { verifyFirebaseIdToken, verifyFirebaseSessionCookie } from "../services/firebaseToken.service.js";
import { AppError } from "../utils/AppError.js";
import type { UserRole } from "../types/userRole.js";

const users = new UserRepository();

export async function authenticate(request: Request, _response: Response, next: NextFunction) {
  const header = request.get("authorization");
  const streamToken = request.path.endsWith("/messages/stream") && typeof request.query.token === "string" ? request.query.token : null;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : streamToken;
  const sessionCookie = typeof request.cookies?.zylora_session === "string" ? request.cookies.zylora_session : null;

  if (!bearerToken && !sessionCookie) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const decodedToken = bearerToken
      ? await verifyFirebaseIdToken(bearerToken)
      : await verifyFirebaseSessionCookie(sessionCookie ?? "");
    const providers = Object.keys(decodedToken.firebase?.identities ?? {});
    const provider = decodedToken.firebase?.sign_in_provider;
    if (provider) providers.push(provider);
    const googleId = decodedToken.firebase?.identities?.["google.com"]?.[0];
    const user = await users.upsertFromFirebase({
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      providers,
      googleId: typeof googleId === "string" ? googleId : undefined,
      isEmailVerified: decodedToken.email_verified
    });

    request.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      provider
    };
    request.firebaseIdToken = bearerToken ?? undefined;
    request.authSource = bearerToken ? "bearer" : "cookie";
    request.user = {
      id: user.id,
      role: user.role as UserRole,
      firebaseUid: decodedToken.uid
    };
    return next();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Auth] Firebase session rejected", message);
    }

    if (
      message.includes("Could not load Firebase public certificates")
      || message.includes("fetch failed")
      || message.includes("Firebase Admin credentials are required")
    ) {
      return next(new AppError("Authentication service is not configured. Add Firebase Admin credentials or allow the backend to reach Google's Firebase public certificates.", 503));
    }

    return next(new AppError("Invalid or expired authentication session", 401));
  }
}
