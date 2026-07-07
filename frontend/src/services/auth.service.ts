import { httpClient } from "../api/httpClient";
import { auth, googleAuthProvider } from "../config/firebase";
import { clearEmailVerificationBannerDismissal } from "../utils/emailVerificationBanner";
import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  browserSessionPersistence,
  type AuthError,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  setPersistence,
  updateProfile,
  type User
} from "firebase/auth";
import type { AuthResponse, AuthUser, MessageEntry, NotificationSettings, PrivacySettings, UserRole } from "../types/auth";

interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterPayload extends LoginPayload {
  name: string;
  role: UserRole;
}

export interface AccountStatus {
  exists: boolean;
  providers: Array<"google" | "email">;
}

const CURRENT_USER_CACHE_MS = 10_000;
const GOOGLE_REDIRECT_PENDING_KEY = "zylora.googleRedirectPending";
const GOOGLE_REDIRECT_DESTINATION_KEY = "zylora.googleRedirectDestination";
let currentUserRequest: { uid: string; promise: Promise<AuthUser | null> } | null = null;
let currentUserCache: { user: AuthUser | null; expiresAt: number; uid: string | null } = {
  user: null,
  expiresAt: 0,
  uid: null
};

export async function login(payload: LoginPayload) {
  resetCurrentUserCache();
  await setPersistence(auth, payload.rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(auth, payload.email, payload.password);
  await credential.user.reload();
  return syncFirebaseUserOrRollback(credential.user);
}

export async function register(payload: RegisterPayload) {
  await setPersistence(auth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
  await updateProfile(credential.user, { displayName: payload.name });
  void sendEmailVerification(credential.user).catch((error) => {
    logAuthFailure("Email verification could not be sent", error);
  });
  return syncFirebaseUserOrRollback(credential.user, payload.role);
}

export async function startGoogleLogin(destination = "/dashboard/buy") {
  await setPersistence(auth, browserLocalPersistence);

  try {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    return { ...(await syncFirebaseUserOrRollback(credential.user)), destination };
  } catch (error) {
    const code = getFirebaseAuthErrorCode(error);
    const shouldFallbackToRedirect = code === "auth/popup-blocked" || code === "auth/cancelled-popup-request";

    if (!shouldFallbackToRedirect) {
      logAuthFailure("Google popup sign-in failed", error);
      throw error;
    }

    window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "1");
    window.sessionStorage.setItem(GOOGLE_REDIRECT_DESTINATION_KEY, destination);

    try {
      await signInWithRedirect(auth, googleAuthProvider);
      return null;
    } catch (redirectError) {
      window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
      window.sessionStorage.removeItem(GOOGLE_REDIRECT_DESTINATION_KEY);
      logAuthFailure("Google redirect sign-in failed", redirectError);
      throw redirectError;
    }
  }
}

export async function startGoogleRedirectLogin(destination = "/dashboard/buy") {
  await setPersistence(auth, browserLocalPersistence);
  window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "1");
  window.sessionStorage.setItem(GOOGLE_REDIRECT_DESTINATION_KEY, destination);
  try {
    await signInWithRedirect(auth, googleAuthProvider);
    return null;
  } catch (error) {
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_DESTINATION_KEY);
    logAuthFailure("Google redirect sign-in failed", error);
    throw error;
  }
}

export async function getAccountStatus(email: string) {
  const { data } = await httpClient.post<AccountStatus>("/auth/account-status", { email });
  return data;
}

export async function completeRedirectLogin() {
  const destination = window.sessionStorage.getItem(GOOGLE_REDIRECT_DESTINATION_KEY) || "/dashboard/buy";
  const hadPendingRedirect = hadPendingGoogleRedirect();
  try {
    const credential = await getRedirectResult(auth);
    const redirectedUser = credential?.user ?? (hadPendingRedirect ? await waitForRedirectUser() : null);
    if (!redirectedUser) return null;
    const result = await syncFirebaseUserOrRollback(redirectedUser);
    return { ...result, destination };
  } catch (error) {
    logAuthFailure("Google redirect callback failed", error);
    throw error;
  } finally {
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_DESTINATION_KEY);
  }
}

export function hadPendingGoogleRedirect() {
  return window.sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === "1";
}

export async function loadCurrentUser(firebaseUser = auth.currentUser) {
  if (!firebaseUser) {
    resetCurrentUserCache();
    return null;
  }

  const now = Date.now();
  if (
    currentUserCache.user
    && currentUserCache.uid === firebaseUser.uid
    && currentUserCache.expiresAt > now
  ) {
    return currentUserCache.user;
  }

  if (currentUserRequest?.uid === firebaseUser.uid) {
    return currentUserRequest.promise;
  }

  const token = await firebaseUser.getIdToken();
  const promise = httpClient
    .get<{ user: AuthResponse["user"] }>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(({ data }) => {
      currentUserCache = {
        user: data.user,
        uid: firebaseUser.uid,
        expiresAt: Date.now() + CURRENT_USER_CACHE_MS
      };
      return data.user;
    })
    .finally(() => {
      if (currentUserRequest?.promise === promise) {
        currentUserRequest = null;
      }
    });

  currentUserRequest = { uid: firebaseUser.uid, promise };

  return promise;
}

export async function refreshCurrentUser(firebaseUser = auth.currentUser) {
  resetCurrentUserCache();
  return loadCurrentUser(firebaseUser);
}

export async function saveUserProfile(payload: Partial<AuthUser> & {
  name?: string;
  username?: string;
  organizationName?: string;
  bio?: string;
  photoUrl?: string | null;
  phoneNumber?: string;
  location?: string;
  socialLinks?: AuthUser["profile"]["socialLinks"];
  privacy?: Partial<PrivacySettings>;
  notifications?: Partial<NotificationSettings>;
  theme?: "light" | "dark";
  language?: string;
}) {
  const { data } = await httpClient.patch<AuthResponse>("/auth/profile", payload);
  currentUserRequest = null;
  currentUserCache = {
    user: data.user,
    uid: auth.currentUser?.uid ?? currentUserCache.uid,
    expiresAt: Date.now() + CURRENT_USER_CACHE_MS
  };
  return data.user;
}

export async function toggleSavedResourceApi(resourceId: string) {
  const { data } = await httpClient.post<{ savedResourceIds: string[] }>(`/auth/saved-resources/${resourceId}/toggle`);
  return data.savedResourceIds;
}

export interface MessageConversation {
  conversationId: string;
  sellerKey?: string;
  participantUserId?: string;
  listingId?: string;
  name: string;
  reference: string;
  avatarUrl?: string;
  status?: string;
  phone?: string;
  messages: MessageEntry[];
  unread: number;
  updatedAt: string;
}

export type MessageRealtimeEvent =
  | {
      type: "messages";
      unreadCount: number;
      conversationId?: string;
      conversations?: MessageConversation[];
    }
  | {
      type: "connected" | "heartbeat" | "error";
      unreadCount?: number;
      conversationId?: string;
      conversations?: MessageConversation[];
    };

export async function loadMessages() {
  const { data } = await httpClient.get<{ conversations: MessageConversation[]; unreadCount: number }>("/auth/messages");
  return data;
}

export async function markConversationRead(conversationId: string) {
  const { data } = await httpClient.post<{ conversations: MessageConversation[]; unreadCount: number }>(`/auth/messages/${conversationId}/read`);
  return data;
}

export interface SellerConversationPayload {
  sellerId?: string;
  sellerUserId?: string;
  sellerSlug?: string;
  sellerName: string;
  sellerPhotoUrl?: string;
  sellerStatus?: string;
  sellerPhone?: string;
  listingId?: string;
  listingTitle?: string;
}

export async function openSellerConversation(payload: SellerConversationPayload) {
  const { data } = await httpClient.post<{ conversations: MessageConversation[]; unreadCount: number; conversationId: string }>("/auth/messages/contact", payload);
  return data;
}

export async function sendConversationMessage(
  conversationId: string,
  message: {
    body: string;
    kind?: MessageEntry["kind"];
    direction?: MessageEntry["direction"];
    replyTo?: MessageEntry["replyTo"];
  }
) {
  const { data } = await httpClient.post<{ conversations: MessageConversation[]; unreadCount: number }>(`/auth/messages/${conversationId}`, message);
  return data;
}

export async function uploadConversationMedia(
  conversationId: string,
  payload: {
    body?: string;
    files: Array<{
      name: string;
      mimeType: string;
      size: number;
      dataUrl: string;
    }>;
    replyTo?: MessageEntry["replyTo"];
  }
) {
  const { data } = await httpClient.post<{ conversations: MessageConversation[]; unreadCount: number }>(`/auth/messages/${conversationId}/upload`, payload);
  return data;
}

export async function forwardConversationMessage(conversationId: string, messageId: string, conversationIds: string[]) {
  const { data } = await httpClient.post<{ conversations: MessageConversation[]; unreadCount: number }>(
    `/auth/messages/${conversationId}/${messageId}/forward`,
    { conversationIds }
  );
  return data;
}

export async function editConversationMessage(conversationId: string, messageId: string, body: string) {
  const { data } = await httpClient.patch<{ conversations: MessageConversation[]; unreadCount: number }>(`/auth/messages/${conversationId}/${messageId}`, { body });
  return data;
}

export async function deleteConversationMessages(conversationId: string, messageIds: string[], mode: "me" | "everyone") {
  const { data } = await httpClient.delete<{ conversations: MessageConversation[]; unreadCount: number }>(`/auth/messages/${conversationId}`, {
    data: { messageIds, mode }
  });
  return data;
}

export async function deleteConversation(conversationId: string) {
  const { data } = await httpClient.delete<{ conversations: MessageConversation[]; unreadCount: number }>(`/auth/messages/${conversationId}/conversation`);
  return data;
}

type MessageEventListener = (event: MessageRealtimeEvent) => void;

type MessageEventConnection = {
  userId: string;
  source: EventSource | null;
  reconnectTimer?: number;
  listeners: Set<MessageEventListener>;
  closed: boolean;
  retryMs: number;
};

let messageEventConnection: MessageEventConnection | null = null;

export async function subscribeToMessageEvents(onMessage: MessageEventListener) {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    return () => undefined;
  }

  if (!messageEventConnection || messageEventConnection.closed || messageEventConnection.userId !== userId) {
    closeMessageEventConnection();
    messageEventConnection = {
      userId,
      source: null,
      listeners: new Set<MessageEventListener>(),
      closed: false,
      retryMs: 1000
    };
    void connectMessageEventSource(messageEventConnection);
  }

  messageEventConnection.listeners.add(onMessage);

  return () => {
    const connection = messageEventConnection;
    if (!connection) return;
    connection.listeners.delete(onMessage);

    if (!connection.listeners.size) {
      closeMessageEventConnection(connection);
    }
  };
}

function emitMessageEvent(connection: MessageEventConnection, event: MessageRealtimeEvent) {
  for (const listener of connection.listeners) {
    listener(event);
  }
}

async function connectMessageEventSource(connection: MessageEventConnection) {
  const baseUrl = String(httpClient.defaults.baseURL ?? "").replace(/\/$/, "");
  const token = await auth.currentUser?.getIdToken();
  if (!token || connection.closed || messageEventConnection !== connection) return;

  connection.source?.close();
  connection.source = new EventSource(`${baseUrl}/auth/messages/stream?token=${encodeURIComponent(token)}`, { withCredentials: true });

  connection.source.addEventListener("open", () => {
    connection.retryMs = 1000;
  });

  connection.source.addEventListener("connected", (event) => {
    emitMessageEvent(connection, parseMessageEvent(event as MessageEvent, "connected"));
  });

  connection.source.addEventListener("heartbeat", (event) => {
    emitMessageEvent(connection, parseMessageEvent(event as MessageEvent, "heartbeat"));
  });

  connection.source.addEventListener("messages", (event) => {
    emitMessageEvent(connection, parseMessageEvent(event as MessageEvent, "messages"));
  });

  connection.source.onerror = () => {
    connection.source?.close();
    connection.source = null;
    emitMessageEvent(connection, { type: "error" });

    if (connection.closed || messageEventConnection !== connection) return;
    const delay = connection.retryMs;
    connection.retryMs = Math.min(connection.retryMs * 2, 10_000);
    connection.reconnectTimer = window.setTimeout(() => {
      void connectMessageEventSource(connection);
    }, delay);
  };
}

function parseMessageEvent(event: MessageEvent, fallbackType: MessageRealtimeEvent["type"]): MessageRealtimeEvent {
  try {
    const payload = JSON.parse(event.data) as Partial<MessageRealtimeEvent>;
    if (payload.type) return payload as MessageRealtimeEvent;
    if (fallbackType === "messages") {
      return {
        type: "messages",
        unreadCount: typeof payload.unreadCount === "number" ? payload.unreadCount : 0,
        conversationId: payload.conversationId,
        conversations: payload.conversations
      };
    }
    return { type: fallbackType };
  } catch {
    return fallbackType === "messages" ? { type: "heartbeat" } : { type: fallbackType };
  }
}

function closeMessageEventConnection(connection = messageEventConnection) {
  if (!connection) return;
  connection.closed = true;
  if (connection.reconnectTimer) {
    window.clearTimeout(connection.reconnectTimer);
  }
  connection.source?.close();
  connection.listeners.clear();

  if (messageEventConnection === connection) {
    messageEventConnection = null;
  }
}

export async function fetchMessageAttachment(conversationId: string, messageId: string, attachmentId: string) {
  const { data } = await httpClient.get<{ attachment: MessageEntry["attachments"][number] }>(
    `/auth/messages/${conversationId}/${messageId}/attachments/${attachmentId}`
  );
  return data.attachment;
}

export async function submitVerificationApi(payload: { organizationName: string; type: string; documents: string[]; notes: string }) {
  const { data } = await httpClient.post<AuthResponse>("/auth/verification", payload);
  return data.user;
}

export async function logout(userId?: string) {
  closeMessageEventConnection();
  resetCurrentUserCache();
  clearEmailVerificationBannerDismissal(userId);
  await clearBackendSession();
  await signOut(auth);
}

export async function sendPasswordResetLink(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export function getAuthErrorMessage(error: unknown, fallback = "We could not complete this request.") {
  const firebaseCode = getFirebaseAuthErrorCode(error);

  if (firebaseCode) {
    const friendlyMessage = getFirebaseAuthErrorFriendlyMessage(firebaseCode, fallback);
    return friendlyMessage;
  }

  if (typeof error === "object" && error !== null && "message" in error && (error as { message?: string }).message === "Network Error") {
    return "Could not reach the Zylora API. Please make sure the backend server is running on port 4000.";
  }

  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string; detail?: string; issues?: Array<{ message: string } | string> } } }).response;
    const serverMessage = response?.data?.message ?? response?.data?.detail;
    const issue = response?.data?.issues?.[0];
    const issueMessage = typeof issue === "string" ? issue : issue?.message;

    if (response?.status === 429) return "Too many requests were sent. Please wait a moment and try again.";
    if (response?.status === 503 && serverMessage?.includes("Authentication service is not configured")) {
      return "Authentication is not configured on the server. Add Firebase Admin credentials or allow the backend to verify Firebase tokens.";
    }
    if (response?.status && response.status >= 500) return "The server could not complete this request. Please try again shortly.";
    return issueMessage || serverMessage || fallback;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
    return "The email or password is incorrect. Please check your details and try again.";
  }

  if (message.includes("auth/email-already-in-use")) {
    return "An account already exists with this email. Please sign in instead.";
  }

  if (message.includes("auth/too-many-requests")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  return fallback;
}

export function logAuthFailure(context: string, error: unknown) {
  const code = getFirebaseAuthErrorCode(error);
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[Auth] ${context}`, {
    code,
    message
  });
}

export function isUnauthorizedAuthError(error: unknown) {
  return Boolean(
    typeof error === "object"
    && error !== null
    && "response" in error
    && (error as { response?: { status?: number } }).response?.status === 401
  );
}

async function syncFirebaseUser(user: User, role?: UserRole): Promise<{ user: AuthUser }> {
  const token = await user.getIdToken(true);
  const { data } = await httpClient.post<AuthResponse>(
    "/auth/firebase/sync",
    { role, name: user.displayName ?? undefined },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  currentUserRequest = null;
  currentUserCache = {
    user: data.user,
    uid: user.uid,
    expiresAt: Date.now() + CURRENT_USER_CACHE_MS
  };
  void createBackendSession(token);
  return data;
}

async function syncFirebaseUserOrRollback(user: User, role?: UserRole) {
  try {
    return await syncFirebaseUser(user, role);
  } catch (error) {
    resetCurrentUserCache();
    await signOut(auth).catch(() => undefined);
    throw error;
  }
}

async function createBackendSession(idToken: string) {
  try {
    await httpClient.post("/auth/session", { idToken });
  } catch {
    // Bearer-token auth remains authoritative when Firebase Admin session
    // cookies are unavailable in local development.
  }
}

async function clearBackendSession() {
  try {
    await httpClient.post("/auth/logout");
  } catch {
    // Firebase sign-out must still complete if the API is offline.
  }
}

function waitForRedirectUser(timeoutMs = 5000) {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise<User | null>((resolve) => {
    const timeout = window.setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      window.clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

function resetCurrentUserCache() {
  currentUserRequest = null;
  currentUserCache = { user: null, expiresAt: 0, uid: null };
}

function getFirebaseAuthErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as AuthError).code;
    return typeof code === "string" && code.startsWith("auth/") ? code : null;
  }

  if (error instanceof Error) {
    return error.message.match(/\((auth\/[^)]+)\)/)?.[1] ?? error.message.match(/auth\/[a-z-]+/)?.[0] ?? null;
  }

  return null;
}

function getFirebaseAuthErrorFriendlyMessage(code: string, fallback: string) {
  switch (code) {
    case "auth/unauthorized-domain":
      return "Google sign-in is blocked because this app domain is not authorized in Firebase Authentication.";
    case "auth/operation-not-allowed":
      return "Google sign-in is disabled for this Firebase project.";
    case "auth/invalid-api-key":
      return "Google sign-in is using an invalid Firebase API key.";
    case "auth/popup-blocked":
      return "The Google sign-in popup was blocked by the browser.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in popup was closed before sign-in finished.";
    case "auth/cancelled-popup-request":
      return "A second Google sign-in attempt cancelled the first popup.";
    case "auth/network-request-failed":
      return "Google sign-in could not reach Firebase. Please check your network connection.";
    case "auth/account-exists-with-different-credential":
      return "This email already has an account using a different sign-in method. Use the method you originally chose.";
    default:
      return fallback;
  }
}
