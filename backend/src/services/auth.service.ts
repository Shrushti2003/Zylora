import { AppError } from "../utils/AppError.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  conversationsChanged,
  createMessage,
  normalizeConversations,
  type MessageAttachment,
  type MessageConversation,
  type MessageDirection,
  type MessageKind
} from "../utils/conversationRepair.js";
import { messageEvents } from "./messageEvent.service.js";

const defaultPrivacySettings = {
  publicProfile: true,
  showEmail: false,
  showSavedResources: true,
  showOnlineStatus: true,
  allowSearchVisibility: true,
  allowMessageRequests: true
};

const defaultNotificationSettings = {
  pushNotifications: true,
  emailNotifications: true,
  messageNotifications: true,
  resourceUpdates: true,
  verificationUpdates: true,
  marketingNotifications: false,
  newFollowerNotifications: true,
  systemAlerts: true
};

const maxAttachmentBytes = 3 * 1024 * 1024;
const maxAttachmentsPerMessage = 6;
const allowedAttachmentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed"
]);
const allowedAttachmentExtensions: Record<string, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "audio/webm": [".webm"],
  "audio/ogg": [".ogg"],
  "audio/mpeg": [".mp3", ".mpeg"],
  "audio/mp4": [".m4a", ".mp4"],
  "audio/wav": [".wav"],
  "audio/x-wav": [".wav"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/plain": [".txt"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"]
};

export class AuthService {
  constructor(private readonly users = new UserRepository()) {}

  async getCurrentUser(userId: string | undefined) {
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError("User no longer exists", 401);
    }

    return this.serializeUser(user);
  }

  async getAccountStatus(email: string) {
    return this.users.getAccountStatus(email);
  }

  async syncFirebaseUser(firebaseUid: string | undefined, role?: string, name?: string) {
    if (!firebaseUid) {
      throw new AppError("Authentication required", 401);
    }

    const user = await this.users.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new AppError("Firebase user has not been synced.", 404);
    }

    const validRoles = ["individual", "ngo", "volunteer", "business"] as const;
    const normalizedConversations = normalizeConversations(user.conversations);
    const shouldUpdateRole = validRoles.includes(role as (typeof validRoles)[number]) && user.role !== role;
    const shouldRepairConversations = conversationsChanged(user.conversations, normalizedConversations);
    const normalizedName = typeof name === "string" ? name.trim().slice(0, 120) : "";
    const shouldUpdateName = Boolean(normalizedName && user.name !== normalizedName);

    if (shouldUpdateRole) {
      user.role = role as (typeof validRoles)[number];
    }

    if (shouldRepairConversations) {
      user.set("conversations", normalizedConversations);
    }

    if (shouldUpdateName) {
      user.name = normalizedName;
    }

    if (shouldUpdateRole || shouldRepairConversations || shouldUpdateName) {
      await user.save();
    }

    return {
      user: this.serializeUser(user)
    };
  }

  async updateProfile(userId: string | undefined, input: any) {
    const user = await this.requireUser(userId);

    const normalizedName = this.normalizeText(input.name, 120);
    if (normalizedName) {
      user.name = normalizedName;
    }

    if (input.photoUrl === null) {
      user.set("profile.photoUrl", undefined);
    } else if (typeof input.photoUrl === "string") {
      user.set("profile.photoUrl", this.normalizeProfilePhoto(input.photoUrl));
    }

    user.set("profile.username", typeof input.username === "string" ? this.normalizeText(input.username, 48) : user.profile?.username);
    user.set("profile.organizationName", typeof input.organizationName === "string" ? this.normalizeText(input.organizationName, 120) : user.profile?.organizationName);
    user.set("profile.bio", typeof input.bio === "string" ? this.normalizeText(input.bio, 800) : user.profile?.bio);
    user.set("profile.phoneNumber", typeof input.phoneNumber === "string" ? this.normalizeText(input.phoneNumber, 32) : user.profile?.phoneNumber);
    user.set("profile.locationText", typeof input.location === "string" ? this.normalizeText(input.location, 120) : user.profile?.locationText);

    if (input.socialLinks && typeof input.socialLinks === "object") {
      user.set("profile.socialLinks", {
        website: this.normalizeUrl(input.socialLinks.website),
        linkedin: this.normalizeUrl(input.socialLinks.linkedin),
        instagram: this.normalizeUrl(input.socialLinks.instagram)
      });
    }

    if (input.theme === "dark" || input.theme === "light") {
      user.set("preferences.theme", input.theme);
    }

    if (typeof input.language === "string") {
      user.set("preferences.language", this.normalizeText(input.language, 24));
    }

    this.applyBooleanPreferencePatch(user, "privacy", input.privacy, Object.keys(defaultPrivacySettings));
    this.applyBooleanPreferencePatch(user, "notifications", input.notifications, Object.keys(defaultNotificationSettings));

    await user.save();
    return { user: this.serializeUser(user) };
  }

  async toggleSavedResource(userId: string | undefined, resourceId: string) {
    const user = await this.requireUser(userId);
    const existing = (user.savedResources ?? []).some((item: any) => item.resourceId === resourceId);

    user.savedResources = existing
      ? user.savedResources.filter((item: any) => item.resourceId !== resourceId)
      : [...(user.savedResources ?? []), { resourceId, savedAt: new Date() }];

    await user.save();
    return { savedResourceIds: user.savedResources.map((item: any) => item.resourceId) };
  }

  async getMessages(userId: string | undefined) {
    const user = await this.requireUser(userId);

    const normalizedConversations = normalizeConversations(user.conversations);

    if (conversationsChanged(user.conversations ?? [], normalizedConversations)) {
      user.set("conversations", normalizedConversations);
      await user.save();
    }

    return {
      conversations: normalizedConversations.sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()),
      unreadCount: normalizedConversations.reduce((total: number, conversation: any) => total + (conversation.unread ?? 0), 0)
    };
  }

  async openSellerConversation(userId: string | undefined, input: any) {
    const user = await this.requireUser(userId);
    const peerUser = await this.resolvePeerUserFromInput(user.id, input);
    const name = peerUser
      ? this.getUserDisplayName(peerUser)
      : this.normalizeText(input?.sellerName ?? input?.name, 120);

    if (!name) {
      throw new AppError("Seller name is required", 400);
    }

    const sellerKey = this.createSellerKey(input);
    const conversationId = `contact-${sellerKey}`;
    const conversations = normalizeConversations(user.conversations);
    const existing = conversations.find((conversation) =>
      conversation.sellerKey === sellerKey || conversation.conversationId === conversationId
    );

    if (existing) {
      const nextConversations = conversations.map((conversation) =>
        conversation.conversationId === existing.conversationId
          ? {
              ...conversation,
              sellerKey,
              participantUserId: peerUser?.id ?? conversation.participantUserId,
              listingId: this.normalizeText(input?.listingId, 120) || conversation.listingId,
              name,
              reference: this.normalizeText(input?.listingTitle ?? input?.reference, 160) || conversation.reference,
              avatarUrl: this.normalizeText(input?.sellerPhotoUrl ?? input?.avatarUrl, 1000) || conversation.avatarUrl,
              status: this.normalizeText(input?.sellerStatus ?? input?.status, 120) || conversation.status || "Securely connected",
              phone: this.normalizeText(input?.sellerPhone ?? input?.phone, 48) || conversation.phone
            }
          : conversation
      );
      user.set("conversations", nextConversations);
      await user.save();
      if (peerUser) {
        await this.ensurePeerConversation(peerUser, user, nextConversations.find((conversation) => conversation.conversationId === existing.conversationId), input);
      }
      await this.publishMessages(user.id, existing.conversationId);
      if (peerUser) await this.publishMessages(peerUser.id, existing.conversationId);
      return this.getMessagesWithActive(userId, existing.conversationId);
    }

    const now = new Date();
    const nextConversation: MessageConversation = {
      conversationId,
      sellerKey,
      participantUserId: peerUser?.id,
      listingId: this.normalizeText(input?.listingId, 120) || undefined,
      name,
      reference: this.normalizeText(input?.listingTitle ?? input?.reference, 160) || "Resource conversation",
      avatarUrl: this.normalizeText(input?.sellerPhotoUrl ?? input?.avatarUrl, 1000) || undefined,
      status: this.normalizeText(input?.sellerStatus ?? input?.status, 120) || "Securely connected",
      phone: this.normalizeText(input?.sellerPhone ?? input?.phone, 48) || undefined,
      messages: [],
      unread: 0,
      updatedAt: now
    };

    user.set("conversations", [nextConversation, ...conversations]);
    await user.save();
    if (peerUser) {
      await this.ensurePeerConversation(peerUser, user, nextConversation, input);
      await this.publishMessages(peerUser.id, nextConversation.conversationId);
    }
    await this.publishMessages(user.id, nextConversation.conversationId);
    return this.getMessagesWithActive(userId, nextConversation.conversationId);
  }

  async markConversationRead(userId: string | undefined, conversationId: string) {
    const user = await this.requireUser(userId);
    user.set("conversations", normalizeConversations(user.conversations).map((conversation: any) =>
      conversation.conversationId === conversationId ? { ...conversation, unread: 0 } : conversation
    ));
    await user.save();
    await this.publishMessages(user.id, conversationId);
    return this.getMessages(userId);
  }

  async appendMessage(userId: string | undefined, conversationId: string, input: any) {
    const user = await this.requireUser(userId);
    const body = typeof input?.body === "string" ? input.body.trim() : typeof input === "string" ? input.trim() : "";
    const kind = this.normalizeMessageKind(input?.kind);
    const direction = this.normalizeMessageDirection(input?.direction);

    if (!body) {
      throw new AppError("Message body is required", 400);
    }

    const createdAt = new Date();
    const nextMessage = createMessage(body, direction, kind, createdAt);
    nextMessage.replyTo = this.resolveReply(input?.replyTo);
    let wasUpdated = false;
    let updatedConversation: MessageConversation | undefined;
    user.set("conversations", normalizeConversations(user.conversations).map((conversation: any) => {
      if (conversation.conversationId !== conversationId) {
        return conversation;
      }

      wasUpdated = true;
      updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, nextMessage],
        unread: 0,
        updatedAt: nextMessage.createdAt
      };
      return updatedConversation;
    }));
    if (!wasUpdated) {
      throw new AppError("Conversation not found", 404);
    }
    await user.save();
    const peerUser = await this.resolvePeerUserFromConversation(user.id, updatedConversation);
    if (peerUser && updatedConversation) {
      const peerMessage = { ...nextMessage, direction: "incoming" as MessageDirection };
      await this.appendPeerMessage(peerUser, user, updatedConversation, peerMessage);
      await this.publishMessages(peerUser.id, conversationId);
    }
    await this.publishMessages(user.id, conversationId);
    return this.getMessages(userId);
  }

  async uploadMessageMedia(userId: string | undefined, conversationId: string, input: any) {
    const user = await this.requireUser(userId);
    const files = this.normalizeUploadFiles(input?.files);
    const now = new Date();
    const kind = this.inferMessageKind(files);
    const body = typeof input?.body === "string" && input.body.trim()
      ? input.body.trim()
      : this.createAttachmentBody(files, kind);
    const nextMessage = createMessage(body, "outgoing", kind, now);
    nextMessage.attachments = files;
    nextMessage.replyTo = this.resolveReply(input?.replyTo);

    let wasUpdated = false;
    let updatedConversation: MessageConversation | undefined;
    user.set("conversations", normalizeConversations(user.conversations).map((conversation: any) => {
      if (conversation.conversationId !== conversationId) {
        return conversation;
      }

      wasUpdated = true;
      updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, nextMessage],
        unread: 0,
        updatedAt: nextMessage.createdAt
      };
      return updatedConversation;
    }));
    if (!wasUpdated) {
      throw new AppError("Conversation not found", 404);
    }

    await user.save();
    const peerUser = await this.resolvePeerUserFromConversation(user.id, updatedConversation);
    if (peerUser && updatedConversation) {
      await this.appendPeerMessage(peerUser, user, updatedConversation, { ...nextMessage, direction: "incoming" });
      await this.publishMessages(peerUser.id, conversationId);
    }
    await this.publishMessages(user.id, conversationId);
    return this.getMessages(userId);
  }

  async forwardMessage(userId: string | undefined, sourceConversationId: string, messageId: string, input: any) {
    const user = await this.requireUser(userId);
    const conversations = normalizeConversations(user.conversations);
    const sourceConversation = conversations.find((conversation) => conversation.conversationId === sourceConversationId);
    const sourceMessage = sourceConversation?.messages.find((message) => message.id === messageId);
    const recipientConversationIds: string[] = Array.isArray(input?.conversationIds)
      ? Array.from(new Set<string>(
          input.conversationIds
            .map((id: unknown) => this.normalizeText(id, 180))
            .filter((id: string) => Boolean(id))
        ))
      : [];

    if (!sourceConversation || !sourceMessage || sourceMessage.deletedForEveryone) {
      throw new AppError("Message not found", 404);
    }

    if (!recipientConversationIds.length) {
      throw new AppError("Select at least one conversation to forward to", 400);
    }

    const validRecipientIds = recipientConversationIds.filter((conversationId) =>
      conversationId !== sourceConversationId && conversations.some((conversation) => conversation.conversationId === conversationId)
    );

    if (!validRecipientIds.length) {
      throw new AppError("Select a different conversation to forward to", 400);
    }

    const now = new Date();
    const nextConversations = conversations.map((conversation) => {
      if (!validRecipientIds.includes(conversation.conversationId)) return conversation;

      const forwardedMessage = this.createForwardedMessage(sourceMessage, now);
      return {
        ...conversation,
        messages: [...conversation.messages, forwardedMessage],
        unread: 0,
        updatedAt: forwardedMessage.createdAt
      };
    });

    user.set("conversations", nextConversations);
    await user.save();

    for (const conversationId of validRecipientIds) {
      const updatedConversation = nextConversations.find((conversation) => conversation.conversationId === conversationId);
      const forwardedMessage = updatedConversation?.messages[updatedConversation.messages.length - 1];
      const peerUser = await this.resolvePeerUserFromConversation(user.id, updatedConversation);
      if (peerUser && updatedConversation && forwardedMessage) {
        await this.appendPeerMessage(peerUser, user, updatedConversation, { ...forwardedMessage, direction: "incoming" });
        await this.publishMessages(peerUser.id, conversationId);
      }
    }

    for (const conversationId of validRecipientIds) {
      await this.publishMessages(user.id, conversationId);
    }

    return this.getMessages(userId);
  }

  async editMessage(userId: string | undefined, conversationId: string, messageId: string, input: any) {
    const user = await this.requireUser(userId);
    const body = typeof input?.body === "string" ? input.body.trim() : "";

    if (!body) {
      throw new AppError("Message body is required", 400);
    }

    let wasUpdated = false;
    let updatedConversation: MessageConversation | undefined;
    user.set("conversations", normalizeConversations(user.conversations).map((conversation) => {
      if (conversation.conversationId !== conversationId) return conversation;

      updatedConversation = {
        ...conversation,
        messages: conversation.messages.map((message) => {
          if (message.id !== messageId) return message;
          if (message.direction !== "outgoing") {
            throw new AppError("Only sent messages can be edited", 403);
          }
          if (message.deletedForEveryone) {
            throw new AppError("Deleted messages cannot be edited", 400);
          }

          wasUpdated = true;
          return {
            ...message,
            body,
            editedAt: new Date()
          };
        })
      };
      return updatedConversation;
    }));

    if (!wasUpdated) {
      throw new AppError("Message not found", 404);
    }

    await user.save();
    const peerUser = await this.resolvePeerUserFromConversation(user.id, updatedConversation);
    if (peerUser) {
      await this.updatePeerMessages(peerUser, conversationId, (message) => message.id === messageId
        ? { ...message, body, editedAt: new Date() }
        : message);
      await this.publishMessages(peerUser.id, conversationId);
    }
    await this.publishMessages(user.id, conversationId);
    return this.getMessages(userId);
  }

  async deleteMessages(userId: string | undefined, conversationId: string, input: any) {
    const user = await this.requireUser(userId);
    const messageIds = Array.isArray(input?.messageIds)
      ? input.messageIds.map(String).filter(Boolean)
      : [String(input?.messageId ?? "")].filter(Boolean);
    const mode = input?.mode === "everyone" ? "everyone" : "me";

    if (!messageIds.length) {
      throw new AppError("Select at least one message to delete", 400);
    }

    const selectedIds = new Set(messageIds);
    let deletedCount = 0;
    let updatedConversation: MessageConversation | undefined;
    user.set("conversations", normalizeConversations(user.conversations).map((conversation) => {
      if (conversation.conversationId !== conversationId) return conversation;

      const messages = mode === "me"
        ? conversation.messages.filter((message) => {
            const shouldDelete = selectedIds.has(message.id);
            if (shouldDelete) deletedCount += 1;
            return !shouldDelete;
          })
        : conversation.messages.map((message) => {
            if (!selectedIds.has(message.id)) return message;
            deletedCount += 1;
            return {
              ...message,
              body: "This message was deleted.",
              attachments: [],
              deletedForEveryone: true,
              editedAt: new Date()
            };
          });

      updatedConversation = {
        ...conversation,
        messages,
        updatedAt: messages[messages.length - 1]?.createdAt ?? new Date()
      };
      return updatedConversation;
    }));

    if (!deletedCount) {
      throw new AppError("Message not found", 404);
    }

    await user.save();
    const peerUser = await this.resolvePeerUserFromConversation(user.id, updatedConversation);
    if (peerUser && mode === "everyone") {
      await this.updatePeerMessages(peerUser, conversationId, (message) => {
        if (!selectedIds.has(message.id)) return message;
        return {
          ...message,
          body: "This message was deleted.",
          attachments: [],
          deletedForEveryone: true,
          editedAt: new Date()
        };
      });
      await this.publishMessages(peerUser.id, conversationId);
    }
    await this.publishMessages(user.id, conversationId);
    return this.getMessages(userId);
  }

  async deleteConversation(userId: string | undefined, conversationId: string) {
    const user = await this.requireUser(userId);
    const conversations = normalizeConversations(user.conversations);
    const nextConversations = conversations.filter((conversation) => conversation.conversationId !== conversationId);

    if (nextConversations.length === conversations.length) {
      throw new AppError("Conversation not found", 404);
    }

    user.set("conversations", nextConversations);
    await user.save();
    await this.publishMessages(user.id, conversationId);
    return this.getMessages(userId);
  }

  async getMessageAttachment(userId: string | undefined, conversationId: string, messageId: string, attachmentId: string) {
    const user = await this.requireUser(userId);
    const conversations = normalizeConversations(user.conversations);
    const conversation = conversations.find((item) => item.conversationId === conversationId);
    const message = conversation?.messages.find((item) => item.id === messageId);
    const attachment = message?.attachments.find((item) => item.id === attachmentId);

    if (!attachment) {
      throw new AppError("Attachment not found", 404);
    }

    return attachment;
  }

  async submitVerification(userId: string | undefined, input: any) {
    const user = await this.requireUser(userId);
    const approved = Array.isArray(input.documents) && input.documents.length >= 2;

    user.verification = {
      ...user.verification,
      isIdentityVerified: approved,
      badge: approved ? "verified" : "pending",
      organizationName: input.organizationName,
      organizationType: input.type,
      documents: input.documents ?? [],
      notes: input.notes,
      status: approved ? "Approved" : "Under Review",
      submittedAt: new Date(),
      verifiedAt: approved ? new Date() : user.verification?.verifiedAt
    };

    await user.save();
    return { user: this.serializeUser(user) };
  }

  private async requireUser(userId: string | undefined) {
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError("User no longer exists", 401);
    }

    return user as any;
  }

  private serializeUser(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sustainabilityScore: user.scores?.sustainability ?? 0,
      trustRating: user.scores?.trust ?? 75,
      profile: {
        photoUrl: user.profile?.photoUrl ?? "",
        username: user.profile?.username ?? "",
        organizationName: user.profile?.organizationName ?? "",
        bio: user.profile?.bio ?? "",
        phoneNumber: user.profile?.phoneNumber ?? "",
        location: user.profile?.locationText ?? user.profile?.address ?? "",
        socialLinks: {
          website: user.profile?.socialLinks?.website ?? "",
          linkedin: user.profile?.socialLinks?.linkedin ?? "",
          instagram: user.profile?.socialLinks?.instagram ?? ""
        }
      },
      verification: {
        isEmailVerified: user.verification?.isEmailVerified ?? false,
        isIdentityVerified: user.verification?.isIdentityVerified ?? false,
        badge: user.verification?.badge ?? "unverified",
        status: user.verification?.status ?? "Not Submitted",
        organizationName: user.verification?.organizationName ?? ""
      },
      preferences: {
        theme: user.preferences?.theme ?? "light",
        language: user.preferences?.language ?? "English",
        privacy: { ...defaultPrivacySettings, ...user.preferences?.privacy },
        notifications: { ...defaultNotificationSettings, ...user.preferences?.notifications }
      },
      savedResourceIds: (user.savedResources ?? []).map((item: any) => item.resourceId),
      unreadMessageCount: (user.conversations ?? []).reduce((total: number, conversation: any) => total + (conversation.unread ?? 0), 0)
    };
  }

  private normalizeMessageDirection(direction: unknown, fallbackIndex = 1): MessageDirection {
    if (direction === "incoming" || direction === "outgoing" || direction === "system") {
      return direction;
    }

    return fallbackIndex % 2 === 0 ? "incoming" : "outgoing";
  }

  private normalizeMessageKind(kind: unknown): MessageKind {
    if (kind === "text" || kind === "image" || kind === "video" || kind === "file" || kind === "voice" || kind === "listing" || kind === "location" || kind === "schedule") {
      return kind;
    }

    return "text";
  }

  private normalizeUploadFiles(files: unknown): MessageAttachment[] {
    if (!Array.isArray(files) || !files.length) {
      throw new AppError("Select at least one file to upload", 400);
    }

    if (files.length > maxAttachmentsPerMessage) {
      throw new AppError(`Upload up to ${maxAttachmentsPerMessage} files at a time`, 400);
    }

    return files.map((file, index) => this.normalizeUploadFile(file, index));
  }

  private normalizeUploadFile(file: any, index: number): MessageAttachment {
    const mimeType = String(file?.mimeType ?? file?.type ?? "").trim().toLowerCase();
    const name = this.sanitizeAttachmentName(file?.name, index, mimeType);
    const dataUrl = String(file?.dataUrl ?? "");
    const declaredSize = Number(file?.size ?? 0);
    const size = Number.isFinite(declaredSize) && declaredSize > 0 ? declaredSize : this.estimateDataUrlSize(dataUrl);

    if (!name || !mimeType || !dataUrl) {
      throw new AppError("File name, type, and data are required", 400);
    }

    if (!allowedAttachmentTypes.has(mimeType)) {
      throw new AppError(`File type ${mimeType} is not supported`, 400);
    }

    const extension = this.getFileExtension(name);
    if (!allowedAttachmentExtensions[mimeType]?.includes(extension)) {
      throw new AppError("File extension does not match its declared type", 400);
    }

    if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
      throw new AppError("File data does not match its declared type", 400);
    }

    if (size > maxAttachmentBytes) {
      throw new AppError(`Each file must be ${Math.round(maxAttachmentBytes / 1024 / 1024)} MB or smaller`, 413);
    }

    return {
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      mimeType,
      size,
      dataUrl,
      uploadedAt: new Date()
    };
  }

  private estimateDataUrlSize(dataUrl: string) {
    const encoded = dataUrl.split(",")[1] ?? "";
    return Math.floor((encoded.length * 3) / 4);
  }

  private sanitizeAttachmentName(value: unknown, index: number, mimeType: string) {
    const fallbackExtension = allowedAttachmentExtensions[mimeType]?.[0] ?? ".bin";
    const fallbackName = `attachment-${index + 1}${fallbackExtension}`;
    const rawName = String(value ?? "").split(/[\\/]/).pop() ?? "";
    const sanitized = rawName
      .split("")
      .filter((character) => {
        const code = character.charCodeAt(0);
        return code > 31 && code !== 127;
      })
      .join("")
      .replace(/[<>:"/\\|?*]+/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);

    return sanitized || fallbackName;
  }

  private getFileExtension(name: string) {
    const index = name.lastIndexOf(".");
    return index >= 0 ? name.slice(index).toLowerCase() : "";
  }

  private inferMessageKind(files: MessageAttachment[]): MessageKind {
    if (files.every((file) => file.mimeType.startsWith("image/"))) return "image";
    if (files.every((file) => file.mimeType.startsWith("audio/"))) return "voice";
    return "file";
  }

  private createAttachmentBody(files: MessageAttachment[], kind: MessageKind) {
    const label = kind === "image" ? "image" : kind === "voice" ? "voice note" : "file";
    return `Shared ${files.length} ${label}${files.length === 1 ? "" : "s"}: ${files.map((file) => file.name).join(", ")}`;
  }

  private createForwardedMessage(message: MessageConversation["messages"][number], createdAt: Date) {
    return {
      ...message,
      id: `${createdAt.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
      direction: "outgoing" as MessageDirection,
      createdAt,
      attachments: message.attachments.map((attachment, index) => ({
        ...attachment,
        id: `${createdAt.getTime()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        uploadedAt: createdAt
      })),
      replyTo: undefined,
      editedAt: undefined,
      deletedForEveryone: false
    };
  }

  private normalizeText(value: unknown, maxLength: number) {
    return typeof value === "string"
      ? value
          .replace(/<[^>]*>/g, " ")
          .replace(/[<>]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, maxLength)
      : "";
  }

  private async getMessagesWithActive(userId: string | undefined, conversationId: string) {
    const result = await this.getMessages(userId);
    return {
      ...result,
      conversationId
    };
  }

  private async publishMessages(userId: string | undefined, conversationId?: string) {
    if (!userId) return;
    const result = await this.getMessages(userId);
    messageEvents.publish(userId, {
      type: "messages",
      unreadCount: result.unreadCount,
      conversationId,
      conversations: result.conversations
    });
  }

  private async resolvePeerUserFromInput(currentUserId: string, input: any) {
    const identifiers = [
      input?.sellerUserId,
      input?.sellerId,
      input?.userId,
      input?.sellerSlug,
      input?.slug,
      input?.sellerEmail,
      input?.sellerName,
      input?.name
    ];

    for (const identifier of identifiers) {
      const normalized = this.normalizeText(identifier, 180);
      if (!normalized) continue;
      const peerUser = await this.users.findByPublicIdentifier(normalized);
      if (peerUser && peerUser.id !== currentUserId) return peerUser as any;
    }

    return null;
  }

  private async resolvePeerUserFromConversation(currentUserId: string, conversation: MessageConversation | undefined) {
    if (!conversation) return null;
    const identifiers = [conversation.participantUserId, conversation.sellerKey, conversation.name];

    for (const identifier of identifiers) {
      const normalized = this.normalizeText(identifier, 180);
      if (!normalized) continue;
      const peerUser = await this.users.findByPublicIdentifier(normalized);
      if (peerUser && peerUser.id !== currentUserId) return peerUser as any;
    }

    return null;
  }

  private async ensurePeerConversation(peerUser: any, currentUser: any, sourceConversation: MessageConversation | undefined, input: any) {
    if (!sourceConversation) return;

    const peerConversations = normalizeConversations(peerUser.conversations);
    const existing = peerConversations.find((conversation) => conversation.conversationId === sourceConversation.conversationId);
    const peerConversation: MessageConversation = {
      conversationId: sourceConversation.conversationId,
      sellerKey: this.createUserConversationKey(currentUser),
      participantUserId: currentUser.id,
      listingId: sourceConversation.listingId,
      name: this.getUserDisplayName(currentUser),
      reference: sourceConversation.reference || this.normalizeText(input?.listingTitle ?? input?.reference, 160) || "Resource conversation",
      avatarUrl: currentUser.profile?.photoUrl || undefined,
      status: "Securely connected",
      phone: currentUser.profile?.phoneNumber || undefined,
      messages: existing?.messages ?? [],
      unread: existing?.unread ?? 0,
      updatedAt: existing?.updatedAt ?? new Date()
    };

    peerUser.set("conversations", existing
      ? peerConversations.map((conversation) => conversation.conversationId === sourceConversation.conversationId
        ? { ...conversation, ...peerConversation, messages: conversation.messages, unread: conversation.unread, updatedAt: conversation.updatedAt }
        : conversation)
      : [peerConversation, ...peerConversations]);
    await peerUser.save();
  }

  private async appendPeerMessage(peerUser: any, currentUser: any, sourceConversation: MessageConversation, message: ReturnType<typeof createMessage>) {
    const peerConversations = normalizeConversations(peerUser.conversations);
    const existing = peerConversations.find((conversation) => conversation.conversationId === sourceConversation.conversationId);
    const baseConversation = existing ?? {
      conversationId: sourceConversation.conversationId,
      sellerKey: this.createUserConversationKey(currentUser),
      participantUserId: currentUser.id,
      listingId: sourceConversation.listingId,
      name: this.getUserDisplayName(currentUser),
      reference: sourceConversation.reference,
      avatarUrl: currentUser.profile?.photoUrl || undefined,
      status: "Securely connected",
      phone: currentUser.profile?.phoneNumber || undefined,
      messages: [],
      unread: 0,
      updatedAt: new Date()
    };

    const hasMessage = baseConversation.messages.some((entry) => entry.id === message.id);
    const nextConversation = {
      ...baseConversation,
      participantUserId: currentUser.id,
      messages: hasMessage ? baseConversation.messages : [...baseConversation.messages, message],
      unread: hasMessage ? baseConversation.unread : baseConversation.unread + 1,
      updatedAt: message.createdAt
    };

    peerUser.set("conversations", existing
      ? peerConversations.map((conversation) => conversation.conversationId === sourceConversation.conversationId ? nextConversation : conversation)
      : [nextConversation, ...peerConversations]);
    await peerUser.save();
  }

  private async updatePeerMessages(peerUser: any, conversationId: string, updateMessage: (message: MessageConversation["messages"][number]) => MessageConversation["messages"][number]) {
    let wasUpdated = false;
    const peerConversations = normalizeConversations(peerUser.conversations).map((conversation) => {
      if (conversation.conversationId !== conversationId) return conversation;
      wasUpdated = true;
      return {
        ...conversation,
        messages: conversation.messages.map(updateMessage)
      };
    });

    if (!wasUpdated) return;
    peerUser.set("conversations", peerConversations);
    await peerUser.save();
  }

  private getUserDisplayName(user: any) {
    return this.normalizeText(user.profile?.organizationName, 120) || this.normalizeText(user.name, 120) || "Zylora member";
  }

  private createUserConversationKey(user: any) {
    return this.normalizeText(user.id, 120) || this.normalizeText(user.profile?.username, 120) || this.normalizeText(user.email, 120);
  }

  private createSellerKey(input: any) {
    const raw = this.normalizeText(
      input?.sellerId ?? input?.sellerUserId ?? input?.userId ?? input?.sellerSlug ?? input?.slug ?? input?.sellerEmail ?? input?.sellerName ?? input?.name,
      180
    );

    if (!raw) {
      throw new AppError("Seller identity is required", 400);
    }

    return raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 120) || "seller";
  }

  private normalizeUrl(value: unknown) {
    const text = this.normalizeText(value, 240);
    if (!text) return "";

    if (/^https?:\/\//i.test(text)) {
      return text;
    }

    return `https://${text}`;
  }

  private normalizeProfilePhoto(value: string) {
    const photoUrl = value.trim();
    if (!photoUrl) return "";

    const isDataImage = /^data:image\/(jpeg|png|webp|gif);base64,/i.test(photoUrl);
    const isHttpImage = /^https?:\/\//i.test(photoUrl);

    if (!isDataImage && !isHttpImage) {
      throw new AppError("Profile photo must be a valid image URL or encoded image.", 400);
    }

    if (photoUrl.length > 1_000_000) {
      throw new AppError("Profile photo is too large. Please choose a smaller image.", 413);
    }

    return photoUrl;
  }

  private applyBooleanPreferencePatch(user: any, section: "privacy" | "notifications", patch: unknown, allowedKeys: string[]) {
    if (!patch || typeof patch !== "object") return;

    for (const key of allowedKeys) {
      const value = (patch as Record<string, unknown>)[key];
      if (typeof value === "boolean") {
        user.set(`preferences.${section}.${key}`, value);
      }
    }
  }

  private resolveReply(reply: any) {
    const messageId = typeof reply?.messageId === "string" ? reply.messageId.trim() : "";
    const body = typeof reply?.body === "string" ? reply.body.trim().slice(0, 180) : "";

    return messageId && body ? { messageId, body } : undefined;
  }
}
