export type MessageDirection = "incoming" | "outgoing" | "system";
export type MessageKind = "text" | "image" | "video" | "file" | "voice" | "listing" | "location" | "schedule";

export type MessageAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: Date;
};

export type MessageReply = {
  messageId: string;
  body: string;
};

export type MessageEntry = {
  id: string;
  body: string;
  direction: MessageDirection;
  kind: MessageKind;
  createdAt: Date;
  attachments: MessageAttachment[];
  replyTo?: MessageReply;
  editedAt?: Date;
  deletedForEveryone?: boolean;
};

export type MessageConversation = {
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
  updatedAt: Date;
};

const messageKinds = new Set<MessageKind>(["text", "image", "video", "file", "voice", "listing", "location", "schedule"]);
const messageDirections = new Set<MessageDirection>(["incoming", "outgoing", "system"]);

export function createMessage(body: string, direction: MessageDirection, kind: MessageKind = "text", createdAt = new Date()): MessageEntry {
  return {
    id: createRuntimeId(createdAt),
    body,
    direction,
    kind,
    createdAt,
    attachments: []
  };
}

export function normalizeConversations(conversations: unknown): MessageConversation[] {
  if (!Array.isArray(conversations)) {
    return [];
  }

  return conversations.map((conversation, index) => normalizeConversation(toPlainObject(conversation), index));
}

export function conversationsChanged(current: unknown, next: MessageConversation[]) {
  return JSON.stringify(toComparable(current)) !== JSON.stringify(toComparable(next));
}

function normalizeConversation(conversation: any, index: number): MessageConversation {
  const messages = normalizeMessages(conversation?.messages);
  const updatedAt = parseDate(messages[messages.length - 1]?.createdAt ?? conversation?.updatedAt);

  return {
    conversationId: getNonEmptyString(conversation?.conversationId, conversation?.id, conversation?._id, `conversation-${index + 1}`),
    sellerKey: getOptionalString(conversation?.sellerKey, conversation?.recipientId, conversation?.sellerId),
    participantUserId: getOptionalString(conversation?.participantUserId, conversation?.peerUserId, conversation?.sellerUserId),
    listingId: getOptionalString(conversation?.listingId, conversation?.resourceId),
    name: getNonEmptyString(conversation?.name, conversation?.recipientName, conversation?.title, "Zylora conversation"),
    reference: getNonEmptyString(conversation?.reference, conversation?.listingTitle, conversation?.subject, "Resource conversation"),
    avatarUrl: getOptionalString(conversation?.avatarUrl, conversation?.avatar, conversation?.photoUrl),
    status: getNonEmptyString(conversation?.status, "Securely connected"),
    phone: getOptionalString(conversation?.phone, conversation?.phoneNumber),
    messages,
    unread: normalizeUnread(conversation?.unread),
    updatedAt
  };
}

function normalizeMessages(messages: unknown): MessageEntry[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const seenIds = new Map<string, number>();

  return messages.flatMap((message, index) => {
    const normalized = normalizeMessage(message, index);
    if (!normalized) return [];
    const previousCount = seenIds.get(normalized.id) ?? 0;
    seenIds.set(normalized.id, previousCount + 1);

    return [previousCount
      ? { ...normalized, id: `${normalized.id}-${previousCount + 1}` }
      : normalized];
  });
}

function normalizeMessage(message: any, index: number): MessageEntry | null {
  if (typeof message === "string") {
    if (!message.trim()) return null;
    const createdAt = new Date();
    return {
      id: createStableId(createdAt, message, index),
      body: message,
      direction: index % 2 === 0 ? "incoming" : "outgoing",
      kind: "text",
      createdAt,
      attachments: []
    };
  }

  const createdAt = parseDate(message?.createdAt ?? message?.timestamp ?? message?.sentAt);
  const body = getNonEmptyString(
    message?.body,
    message?.text,
    message?.content,
    message?.message,
    message?.caption
  );

  if (!body) {
    return null;
  }

  return {
    id: getNonEmptyString(message?.id, message?.messageId, message?._id, createStableId(createdAt, body, index)),
    body,
    direction: normalizeMessageDirection(message?.direction, index),
    kind: normalizeMessageKind(message?.kind ?? message?.type),
    createdAt,
    attachments: normalizeAttachments(message?.attachments),
    replyTo: normalizeReply(message?.replyTo),
    editedAt: message?.editedAt ? parseDate(message.editedAt) : undefined,
    deletedForEveryone: Boolean(message?.deletedForEveryone)
  };
}

function normalizeAttachments(attachments: unknown): MessageAttachment[] {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .map((attachment, index) => normalizeAttachment(toPlainObject(attachment), index))
    .filter((attachment): attachment is MessageAttachment => Boolean(attachment));
}

function normalizeAttachment(attachment: any, index: number): MessageAttachment | null {
  const name = getNonEmptyString(attachment?.name, attachment?.fileName, `attachment-${index + 1}`);
  const mimeType = getNonEmptyString(attachment?.mimeType, attachment?.type, "application/octet-stream");
  const dataUrl = getNonEmptyString(attachment?.dataUrl, attachment?.url);
  const size = Number(attachment?.size ?? 0);

  if (!dataUrl) return null;

  return {
    id: getNonEmptyString(attachment?.id, attachment?._id, createStableId(parseDate(attachment?.uploadedAt), name, index)),
    name,
    mimeType,
    size: Number.isFinite(size) && size > 0 ? Math.floor(size) : estimateDataUrlSize(dataUrl),
    dataUrl,
    uploadedAt: parseDate(attachment?.uploadedAt)
  };
}

function normalizeReply(reply: unknown): MessageReply | undefined {
  const plainReply = toPlainObject(reply) as any;
  if (!plainReply || typeof plainReply !== "object") return undefined;

  const messageId = getNonEmptyString(plainReply.messageId, plainReply.id);
  const body = getNonEmptyString(plainReply.body, plainReply.text, plainReply.content);

  return messageId && body ? { messageId, body } : undefined;
}

function normalizeMessageDirection(direction: unknown, fallbackIndex = 1): MessageDirection {
  return typeof direction === "string" && messageDirections.has(direction as MessageDirection)
    ? direction as MessageDirection
    : fallbackIndex % 2 === 0 ? "incoming" : "outgoing";
}

function normalizeMessageKind(kind: unknown): MessageKind {
  return typeof kind === "string" && messageKinds.has(kind as MessageKind) ? kind as MessageKind : "text";
}

function normalizeUnread(unread: unknown) {
  const value = Number(unread);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function parseDate(value: unknown) {
  const parsed = value ? new Date(value as string | number | Date) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function createStableId(createdAt: Date, seed: string, index = 0) {
  const suffix = Buffer.from(`${seed}-${index}`).toString("base64url").slice(0, 8) || "message";
  return `${createdAt.getTime()}-${suffix}`;
}

function createRuntimeId(createdAt: Date) {
  return `${createdAt.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
}

function estimateDataUrlSize(dataUrl: string) {
  const encoded = dataUrl.split(",")[1] ?? "";
  return Math.floor((encoded.length * 3) / 4);
}

function getNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value && typeof value === "object" && "toString" in value) {
      const text = String(value);
      if (text && text !== "[object Object]") {
        return text;
      }
    }
  }

  return "";
}

function getOptionalString(...values: unknown[]) {
  const value = getNonEmptyString(...values);
  return value || undefined;
}

function toComparable(value: unknown): unknown {
  const plainValue = toPlainObject(value);

  if (plainValue !== value) {
    return toComparable(plainValue);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(toComparable);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "__v")
        .map(([key, entry]) => [key, toComparable(entry)])
    );
  }

  return value;
}

function toPlainObject(value: unknown): unknown {
  if (value && typeof value === "object" && "toObject" in value && typeof (value as { toObject?: unknown }).toObject === "function") {
    return (value as { toObject: () => unknown }).toObject();
  }

  return value;
}
