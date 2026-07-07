import { UserModel } from "../models/user.model.js";
import type { UserRole } from "../types/userRole.js";
import { AppError } from "../utils/AppError.js";
import { Types } from "mongoose";

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  googleId?: string;
  firebaseUid?: string;
  provider?: string;
  photoUrl?: string;
  isEmailVerified?: boolean;
}

interface FirebaseUserInput {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  providers?: string[];
  googleId?: string;
  role?: UserRole;
  isEmailVerified?: boolean;
}

export class UserRepository {
  findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() });
  }

  findById(userId: string) {
    return UserModel.findById(userId);
  }

  findByPublicIdentifier(identifier: string) {
    const normalized = identifier.trim();
    if (!normalized) return null;

    const candidates: any[] = [
      { "profile.username": normalized },
      { "profile.username": normalized.toLowerCase() },
      { email: normalized.toLowerCase() },
      { name: normalized }
    ];

    if (Types.ObjectId.isValid(normalized)) {
      candidates.unshift({ _id: normalized });
    }

    return UserModel.findOne({ $or: candidates });
  }

  findByGoogleId(googleId: string) {
    return UserModel.findOne({ "authProviders.googleId": googleId });
  }

  findByFirebaseUid(firebaseUid: string) {
    return UserModel.findOne({ "authProviders.firebaseUid": firebaseUid });
  }

  create(input: CreateUserInput) {
    return UserModel.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      profile: {
        photoUrl: input.photoUrl
      },
      verification: {
        isEmailVerified: input.isEmailVerified ?? false
      },
      authProviders: {
        googleId: input.googleId,
        firebaseUid: input.firebaseUid,
        provider: input.provider
      }
    });
  }

  async upsertFromFirebase(input: FirebaseUserInput) {
    const fallbackEmail = input.email ?? `${input.uid}@firebase.zylora.local`;
    const fallbackName = input.displayName ?? input.email?.split("@")[0] ?? "Zylora member";
    const existing =
      (await this.findByFirebaseUid(input.uid)) ??
      (input.email ? await this.findByEmail(input.email) : null);

    if (existing) {
      if (existing.authProviders?.firebaseUid && existing.authProviders.firebaseUid !== input.uid) {
        throw new AppError("This email is already linked to another authentication account. Sign in using the method originally used for this email.", 409);
      }
      const nextPhotoUrl = existing.profile?.photoUrl || normalizeFirebasePhotoUrl(input.photoURL);
      const providers = mergeProviders(existing.authProviders?.providers, existing.authProviders?.provider, input.providers);

      existing.name = input.displayName?.trim() || existing.name || fallbackName;
      existing.email = (input.email ?? existing.email).toLowerCase();
      existing.set("profile.photoUrl", nextPhotoUrl);
      existing.set("verification.isEmailVerified", Boolean(input.isEmailVerified) || existing.verification?.isEmailVerified);
      existing.set("authProviders.firebaseUid", input.uid);
      existing.set("authProviders.provider", providers[0] ?? existing.authProviders?.provider);
      existing.set("authProviders.providers", providers);
      if (input.googleId) existing.set("authProviders.googleId", input.googleId);
      existing.lastLoginAt = new Date();
      return existing.save();
    }

    return this.create({
      name: fallbackName,
      email: fallbackEmail,
      role: input.role ?? "individual",
      firebaseUid: input.uid,
      provider: normalizeProvider(input.providers?.[0]),
      googleId: input.googleId,
      photoUrl: normalizeFirebasePhotoUrl(input.photoURL),
      isEmailVerified: Boolean(input.isEmailVerified)
    });
  }

  async getAccountStatus(email: string) {
    const user = await this.findByEmail(email);
    if (!user) return { exists: false, providers: [] as string[] };

    return {
      exists: true,
      providers: mergeProviders(user.authProviders?.providers, user.authProviders?.provider)
    };
  }

  linkGoogleProvider(userId: string, googleId: string) {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        "authProviders.googleId": googleId,
        "verification.isEmailVerified": true
      },
      { new: true }
    );
  }

  markLogin(userId: string) {
    return UserModel.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  }
}

function normalizeProvider(provider?: string | null) {
  if (provider === "google.com" || provider === "google") return "google";
  if (provider === "password" || provider === "email") return "email";
  return provider?.trim() || undefined;
}

function mergeProviders(...providerGroups: Array<string[] | string | null | undefined>) {
  return [...new Set(providerGroups.flatMap((group) => Array.isArray(group) ? group : [group]).map(normalizeProvider).filter(Boolean))] as string[];
}

function normalizeFirebasePhotoUrl(photoUrl?: string) {
  if (!photoUrl) return undefined;

  const trimmed = photoUrl.trim();
  return trimmed.length <= 2048 ? trimmed : undefined;
}
