import { Schema, model, type InferSchemaType } from "mongoose";
import { userRoles } from "../types/userRole.js";
import { conversationsChanged, normalizeConversations } from "../utils/conversationRepair.js";

const scoreSchema = new Schema(
  {
    reputation: { type: Number, default: 50 },
    sustainability: { type: Number, default: 0 },
    donation: { type: Number, default: 0 },
    circularEconomy: { type: Number, default: 0 },
    trust: { type: Number, default: 75 },
    carbonSavingsKg: { type: Number, default: 0 }
  },
  { _id: false }
);

const profileSchema = new Schema(
  {
    photoUrl: String,
    username: String,
    organizationName: String,
    bio: String,
    address: String,
    phoneNumber: String,
    locationText: String,
    socialLinks: {
      website: String,
      linkedin: String,
      instagram: String
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }
    },
    achievementBadges: { type: [String], default: [] }
  },
  { _id: false }
);

const verificationSchema = new Schema(
  {
    isEmailVerified: { type: Boolean, default: false },
    isIdentityVerified: { type: Boolean, default: false },
    badge: { type: String, default: "unverified" },
    organizationName: String,
    organizationType: String,
    documents: { type: [String], default: [] },
    notes: String,
    status: { type: String, enum: ["Not Submitted", "Submitted", "Under Review", "Approved", "Rejected"], default: "Not Submitted" },
    submittedAt: Date,
    verifiedAt: Date
  },
  { _id: false }
);

const privacySettingsSchema = new Schema(
  {
    publicProfile: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    showSavedResources: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
    allowSearchVisibility: { type: Boolean, default: true },
    allowMessageRequests: { type: Boolean, default: true }
  },
  { _id: false }
);

const notificationSettingsSchema = new Schema(
  {
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    messageNotifications: { type: Boolean, default: true },
    resourceUpdates: { type: Boolean, default: true },
    verificationUpdates: { type: Boolean, default: true },
    marketingNotifications: { type: Boolean, default: false },
    newFollowerNotifications: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true }
  },
  { _id: false }
);

const preferenceSchema = new Schema(
  {
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    language: { type: String, default: "English" },
    privacy: { type: privacySettingsSchema, default: {} },
    notifications: { type: notificationSettingsSchema, default: {} }
  },
  { _id: false }
);

const savedResourceSchema = new Schema(
  {
    resourceId: { type: String, required: true },
    savedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const messageAttachmentSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    dataUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const messageReplySchema = new Schema(
  {
    messageId: { type: String, required: true },
    body: { type: String, required: true }
  },
  { _id: false }
);

const messageEntrySchema = new Schema(
  {
    id: { type: String, required: true },
    body: { type: String, required: true },
    direction: { type: String, enum: ["incoming", "outgoing", "system"], default: "incoming" },
    kind: { type: String, enum: ["text", "image", "video", "file", "voice", "listing", "location", "schedule"], default: "text" },
    createdAt: { type: Date, default: Date.now },
    attachments: { type: [messageAttachmentSchema], default: [] },
    replyTo: { type: messageReplySchema, default: undefined },
    editedAt: Date,
    deletedForEveryone: { type: Boolean, default: false }
  },
  { _id: false }
);

const messageConversationSchema = new Schema(
  {
    conversationId: { type: String, required: true },
    sellerKey: String,
    participantUserId: String,
    listingId: String,
    name: { type: String, required: true },
    reference: { type: String, required: true },
    avatarUrl: String,
    status: { type: String, default: "Securely connected" },
    phone: String,
    messages: { type: [messageEntrySchema], default: [] },
    unread: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: String,
    role: { type: String, enum: userRoles, default: "individual", index: true },
    profile: { type: profileSchema, default: {} },
    scores: { type: scoreSchema, default: {} },
    verification: { type: verificationSchema, default: {} },
    preferences: { type: preferenceSchema, default: {} },
    savedResources: { type: [savedResourceSchema], default: [] },
    conversations: { type: [messageConversationSchema], default: [] },
    authProviders: {
      googleId: String,
      firebaseUid: { type: String, index: true },
      provider: String,
      providers: { type: [String], default: [] }
    },
    lastLoginAt: Date
  },
  {
    timestamps: true
  }
);

userSchema.index({ "profile.location": "2dsphere" });
userSchema.index({ "profile.username": 1 }, { sparse: true });
userSchema.index({ name: 1 });
userSchema.index({ "profile.organizationName": 1 }, { sparse: true });
userSchema.index({ "preferences.privacy.publicProfile": 1, "preferences.privacy.allowSearchVisibility": 1 });
userSchema.index({ "authProviders.googleId": 1 }, { unique: true, sparse: true });
userSchema.index({ "authProviders.firebaseUid": 1 }, { unique: true, sparse: true });

userSchema.pre("validate", function repairLegacyConversations(next) {
  const conversations = this.get("conversations");
  const normalizedConversations = normalizeConversations(conversations);

  if (conversationsChanged(conversations, normalizedConversations)) {
    this.set("conversations", normalizedConversations);
  }

  next();
});

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: string };
export const UserModel = model("User", userSchema);
