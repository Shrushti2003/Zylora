export type UserRole = "individual" | "ngo" | "volunteer" | "business" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sustainabilityScore: number;
  trustRating: number;
  profile: {
    photoUrl: string;
    username: string;
    organizationName: string;
    bio: string;
    phoneNumber: string;
    location: string;
    socialLinks: {
      website: string;
      linkedin: string;
      instagram: string;
    };
  };
  verification: {
    isEmailVerified: boolean;
    isIdentityVerified: boolean;
    badge: string;
    status: string;
    organizationName: string;
  };
  preferences: {
    theme: "light" | "dark";
    language: string;
    privacy: PrivacySettings;
    notifications: NotificationSettings;
  };
  savedResourceIds: string[];
  unreadMessageCount: number;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface PrivacySettings {
  publicProfile: boolean;
  showEmail: boolean;
  showSavedResources: boolean;
  showOnlineStatus: boolean;
  allowSearchVisibility: boolean;
  allowMessageRequests: boolean;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  messageNotifications: boolean;
  resourceUpdates: boolean;
  verificationUpdates: boolean;
  marketingNotifications: boolean;
  newFollowerNotifications: boolean;
  systemAlerts: boolean;
}

export interface MessageEntry {
  id: string;
  body: string;
  direction: "incoming" | "outgoing" | "system";
  kind: "text" | "image" | "video" | "file" | "voice" | "listing" | "location" | "schedule";
  createdAt: string;
  attachments: MessageAttachment[];
  replyTo?: {
    messageId: string;
    body: string;
  };
  editedAt?: string;
  deletedForEveryone?: boolean;
}

export interface MessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}
