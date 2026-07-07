import {
  CalendarDays,
  CheckSquare,
  Clock3,
  Copy,
  Download,
  Edit3,
  FileUp,
  Forward,
  ImagePlus,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Mic,
  MoreVertical,
  Paperclip,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  X
} from "lucide-react";
import { type ChangeEvent, type FormEvent, type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { ProfileAvatar } from "../components/common/ProfileAvatar";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  deleteConversation,
  deleteConversationMessages,
  editConversationMessage,
  fetchMessageAttachment,
  forwardConversationMessage,
  loadMessages,
  markConversationRead,
  sendConversationMessage,
  subscribeToMessageEvents,
  uploadConversationMedia,
  type MessageConversation
} from "../services/auth.service";
import type { AppDispatch, RootState } from "../store/store";
import type { MessageEntry } from "../types/auth";

export function MessagesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("Secure connection ready.");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isLocationDurationOpen, setIsLocationDurationOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voicePreview, setVoicePreview] = useState("");
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocationState | null>(() => loadLiveLocation());
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressLabel, setUploadProgressLabel] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [editingMessage, setEditingMessage] = useState<MessageEntry | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [replyTo, setReplyTo] = useState<MessageEntry | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const [forwardTargetMessage, setForwardTargetMessage] = useState<MessageEntry | null>(null);
  const [selectedForwardConversationIds, setSelectedForwardConversationIds] = useState<string[]>([]);
  const userRef = useRef(user);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const locationWatchRef = useRef<number | null>(null);
  const locationTimerRef = useRef<number | null>(null);
  const locationUpdateRef = useRef(0);
  const refreshMessagesRequestRef = useRef<{ key: string; promise: Promise<void> } | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLInputElement | null>(null);
  const activeIdRef = useRef(activeId);

  const active = conversations.find((conversation) => conversation.conversationId === activeId) ?? conversations[0];
  const selectedCount = selectedMessageIds.length;
  const userId = user?.id;
  const requestedConversationParam = searchParams.get("conversation") ?? "";

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
      if (locationTimerRef.current) {
        window.clearTimeout(locationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.messages, liveLocation]);

  useEffect(() => {
    if (!liveLocation || liveLocation.expiresAt <= Date.now()) {
      if (liveLocation) stopLiveLocation("Live location sharing ended.");
      return;
    }

    window.localStorage.setItem(LIVE_LOCATION_KEY, JSON.stringify(liveLocation));
    const remaining = liveLocation.expiresAt - Date.now();
    locationTimerRef.current = window.setTimeout(() => stopLiveLocation("Live location sharing ended."), remaining);

    return () => {
      if (locationTimerRef.current) {
        window.clearTimeout(locationTimerRef.current);
      }
    };
  }, [liveLocation]);

  useEffect(() => {
    function closeMessageMenu(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".chat-bubble")) {
        setOpenMessageMenuId(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMessageMenuId(null);
      }
    }

    document.addEventListener("pointerdown", closeMessageMenu);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMessageMenu);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const visibleConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        [
          conversation.name,
          conversation.reference,
          conversation.messages[conversation.messages.length - 1]?.body ?? ""
        ]
          .join(" ")
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase())
      ),
    [conversations, debouncedQuery]
  );

  const syncUnreadCount = useCallback((unreadCount: number) => {
    const currentUser = userRef.current;
    if (!currentUser || currentUser.unreadMessageCount === unreadCount) return;
    dispatch(setAuthenticatedUser({ ...currentUser, unreadMessageCount: unreadCount }));
  }, [dispatch]);

  const applyMessageSnapshot = useCallback((data: { conversations: MessageConversation[]; unreadCount: number }, preferredConversationId?: string) => {
    setConversations(data.conversations);
    const requestedConversationId = preferredConversationId ?? requestedConversationParam ?? activeIdRef.current;
    const nextActiveId = requestedConversationId && data.conversations.some((conversation) => conversation.conversationId === requestedConversationId)
      ? requestedConversationId
      : data.conversations[0]?.conversationId ?? "";
    setActiveId(nextActiveId);
    syncUnreadCount(data.unreadCount);
    return nextActiveId;
  }, [requestedConversationParam, syncUnreadCount]);

  const refreshMessages = useCallback(async (preferredConversationId?: string) => {
    const key = preferredConversationId ?? "";
    if (refreshMessagesRequestRef.current?.key === key) {
      return refreshMessagesRequestRef.current.promise;
    }

    const promise = loadMessages()
      .then((data) => {
        applyMessageSnapshot(data, preferredConversationId);
      })
      .finally(() => {
        if (refreshMessagesRequestRef.current?.promise === promise) {
          refreshMessagesRequestRef.current = null;
        }
      });

    refreshMessagesRequestRef.current = { key, promise };
    return promise;
  }, [applyMessageSnapshot]);

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setActiveId("");
      return;
    }
    void refreshMessages();
  }, [refreshMessages, userId]);

  useEffect(() => {
    if (!userId) return undefined;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    subscribeToMessageEvents((event) => {
      if (event.type === "connected") {
        setStatus("Real-time connection active.");
        return;
      }

      if (event.type === "heartbeat") {
        return;
      }

      if (event.type === "error") {
        setStatus("Reconnecting secure messages...");
        return;
      }

      if (event.conversations && typeof event.unreadCount === "number") {
        applyMessageSnapshot({
          conversations: event.conversations,
          unreadCount: event.unreadCount
        }, activeIdRef.current || event.conversationId);
        setStatus("Messages synchronized.");
        return;
      }

      void refreshMessages(activeIdRef.current || event.conversationId);
    }).then((cleanup) => {
      if (!isMounted) {
        cleanup();
        return;
      }
      unsubscribe = cleanup;
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [applyMessageSnapshot, refreshMessages, userId]);

  useEffect(() => {
    if (!active?.conversationId || !active.unread) return;

    let isCurrent = true;
    markConversationRead(active.conversationId)
      .then((data) => {
        if (!isCurrent) return;
        setConversations(data.conversations);
        syncUnreadCount(data.unreadCount);
      })
      .catch(() => {
        setStatus("Conversation read state could not be synced.");
      });

    return () => {
      isCurrent = false;
    };
  }, [active?.conversationId, active?.unread, syncUnreadCount]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || !active) return;

    const body = draft.trim();
    const optimisticMessage: MessageEntry = {
      id: `optimistic-${Date.now()}`,
      body,
      kind: "text",
      direction: "outgoing",
      createdAt: new Date().toISOString(),
      attachments: [],
      replyTo: replyTo ? { messageId: replyTo.id, body: replyTo.body } : undefined
    };
    setConversations((current) => current.map((conversation) =>
      conversation.conversationId === active.conversationId
        ? {
            ...conversation,
            messages: [...conversation.messages, optimisticMessage],
            updatedAt: optimisticMessage.createdAt
          }
        : conversation
    ));
    setDraft("");
    setIsSending(true);
    try {
      const data = await sendConversationMessage(active.conversationId, {
        body,
        kind: "text",
        direction: "outgoing",
        replyTo: replyTo ? { messageId: replyTo.id, body: replyTo.body } : undefined
      });
      setConversations(data.conversations);
      syncUnreadCount(data.unreadCount);
      setReplyTo(null);
      setStatus("Message sent securely.");
      setIsEmojiOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      setConversations((current) => current.map((conversation) =>
        conversation.conversationId === active.conversationId
          ? { ...conversation, messages: conversation.messages.filter((message) => message.id !== optimisticMessage.id) }
          : conversation
      ));
      setDraft(body);
      setStatus(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setIsSending(false);
    }
  }

  async function sendUtilityMessage(body: string, kind: MessageEntry["kind"]) {
    if (!active) return;
    const data = await sendConversationMessage(active.conversationId, {
      body,
      kind,
      direction: "outgoing",
      replyTo: replyTo ? { messageId: replyTo.id, body: replyTo.body } : undefined
    });
    setConversations(data.conversations);
    syncUnreadCount(data.unreadCount);
    setStatus("Shared in conversation.");
    setReplyTo(null);
    setIsMenuOpen(false);
  }

  async function handleFileShare(event: ChangeEvent<HTMLInputElement>, kind: MessageEntry["kind"]) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !active) return;

    setIsUploading(true);
    setUploadProgressLabel(`Preparing ${files.length} file${files.length === 1 ? "" : "s"}...`);

    try {
      validateSelectedFiles(files, kind);
      const payloadFiles = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setUploadProgressLabel(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
        payloadFiles.push({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          dataUrl: await readFileAsDataUrl(file)
        });
      }

      const data = await uploadConversationMedia(active.conversationId, {
        files: payloadFiles,
        replyTo: replyTo ? { messageId: replyTo.id, body: replyTo.body } : undefined
      });
      setConversations(data.conversations);
      syncUnreadCount(data.unreadCount);
      setReplyTo(null);
      setStatus("Attachment shared securely.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgressLabel("");
      event.target.value = "";
      setIsMenuOpen(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      setStatus("Voice preview ready.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVoiceBlob(blob);
        setVoicePreview((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecording(true);
      setStatus("Recording voice note...");
    } catch {
      setStatus("Microphone permission is required for voice notes.");
    }
  }

  async function sendVoiceMessage() {
    if (!active || !voiceBlob) return;
    setIsUploading(true);
    setUploadProgressLabel("Uploading voice note...");
    try {
      const extension = voiceBlob.type.includes("ogg") ? "ogg" : voiceBlob.type.includes("mp4") ? "m4a" : "webm";
      const dataUrl = await readBlobAsDataUrl(voiceBlob);
      const data = await uploadConversationMedia(active.conversationId, {
        body: "Voice note shared.",
        files: [{
          name: `voice-note-${Date.now()}.${extension}`,
          mimeType: voiceBlob.type || "audio/webm",
          size: voiceBlob.size,
          dataUrl
        }],
        replyTo: replyTo ? { messageId: replyTo.id, body: replyTo.body } : undefined
      });
      setConversations(data.conversations);
      syncUnreadCount(data.unreadCount);
      setReplyTo(null);
      clearVoicePreview();
      setStatus("Voice note shared.");
      setIsMenuOpen(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Voice note could not be sent.");
    } finally {
      setIsUploading(false);
      setUploadProgressLabel("");
    }
  }

  function clearVoicePreview() {
    if (voicePreview) URL.revokeObjectURL(voicePreview);
    setVoicePreview("");
    setVoiceBlob(null);
  }

  function startLiveLocation(minutes: number) {
    if (!active) return;
    if (!navigator.geolocation) {
      setStatus("Location sharing is not supported in this browser.");
      return;
    }

    stopLiveLocation("Preparing live location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const next = createLiveLocationState(active.conversationId, minutes, position.coords.latitude, position.coords.longitude);
        setLiveLocation(next);
        await sendUtilityMessage(
          `Live location shared for ${formatDuration(minutes)}: ${next.latitude.toFixed(5)}, ${next.longitude.toFixed(5)}`,
          "location"
        );
        setStatus("Live location active.");
        locationWatchRef.current = navigator.geolocation.watchPosition((update) => {
          const now = Date.now();
          if (now - locationUpdateRef.current < 3000) return;
          locationUpdateRef.current = now;
          setLiveLocation((current) =>
            current
              ? {
                  ...current,
                  latitude: update.coords.latitude,
                  longitude: update.coords.longitude,
                  updatedAt: now
                }
              : current
          );
        });
      },
      () => setStatus("Location permission is required to share location.")
    );
    setIsLocationDurationOpen(false);
    setIsMenuOpen(false);
  }

  function stopLiveLocation(message = "Live location sharing stopped.") {
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
    locationUpdateRef.current = 0;
    if (locationTimerRef.current) {
      window.clearTimeout(locationTimerRef.current);
      locationTimerRef.current = null;
    }
    window.localStorage.removeItem(LIVE_LOCATION_KEY);
    setLiveLocation(null);
    setStatus(message);
  }

  async function schedulePickup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pickupDate || !pickupTime || !active) {
      setStatus("Select both pickup date and time.");
      return;
    }

    await sendUtilityMessage(`Pickup requested for ${pickupDate} at ${pickupTime}.`, "schedule");
    setStatus("Pickup request sent.");
    setPickupDate("");
    setPickupTime("");
    setIsScheduleOpen(false);
  }

  async function openConversation(conversationId: string) {
    setActiveId(conversationId);
    setSelectedMessageIds([]);
    setReplyTo(null);
    setEditingMessage(null);
    const data = await markConversationRead(conversationId);
    setConversations(data.conversations);
    syncUnreadCount(data.unreadCount);
  }

  function toggleMessageSelection(messageId: string) {
    setSelectedMessageIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId]
    );
  }

  function startEditMessage(message: MessageEntry) {
    setEditingMessage(message);
    setEditDraft(message.body);
    setSelectedMessageIds([]);
    setOpenMessageMenuId(null);
    setStatus("Editing message.");
  }

  async function saveEditedMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !editingMessage || !editDraft.trim()) return;

    const data = await editConversationMessage(active.conversationId, editingMessage.id, editDraft.trim());
    setConversations(data.conversations);
    syncUnreadCount(data.unreadCount);
    setEditingMessage(null);
    setEditDraft("");
    setStatus("Message edited.");
  }

  async function deleteMessages(messageIds: string[], mode: "me" | "everyone") {
    if (!active || !messageIds.length) return;
    const label = mode === "everyone" ? "Delete for everyone" : "Delete for me";
    const confirmed = window.confirm(`${label}? This action will update the selected message${messageIds.length === 1 ? "" : "s"}.`);
    if (!confirmed) return;

    const data = await deleteConversationMessages(active.conversationId, messageIds, mode);
    setConversations(data.conversations);
    syncUnreadCount(data.unreadCount);
    setSelectedMessageIds([]);
    setOpenMessageMenuId(null);
    setEditingMessage(null);
    setReplyTo(null);
    setStatus(`${messageIds.length} message${messageIds.length === 1 ? "" : "s"} deleted.`);
  }

  async function removeConversation(conversationId: string, conversationName: string) {
    const confirmed = window.confirm(`Delete conversation with ${conversationName}? This only removes it from your messages.`);
    if (!confirmed) return;

    const data = await deleteConversation(conversationId);
    setConversations(data.conversations);
    setActiveId(data.conversations[0]?.conversationId ?? "");
    syncUnreadCount(data.unreadCount);
    setStatus("Conversation deleted from your messages.");
  }

  async function copyMessage(message: MessageEntry) {
    const text = message.attachments.length
      ? `${message.body}\n${message.attachments.map((attachment) => attachment.name).join("\n")}`
      : message.body;

    await navigator.clipboard.writeText(text);
    setStatus("Message copied.");
    setOpenMessageMenuId(null);
  }

  function forwardMessage(message: MessageEntry) {
    setForwardTargetMessage(message);
    setSelectedForwardConversationIds([]);
    setOpenMessageMenuId(null);
    setStatus("Choose a conversation to forward this message.");
  }

  function toggleForwardRecipient(conversationId: string) {
    setSelectedForwardConversationIds((current) =>
      current.includes(conversationId)
        ? current.filter((id) => id !== conversationId)
        : [...current, conversationId]
    );
  }

  async function submitForwardMessage() {
    if (!active || !forwardTargetMessage || !selectedForwardConversationIds.length) return;
    try {
      const data = await forwardConversationMessage(active.conversationId, forwardTargetMessage.id, selectedForwardConversationIds);
      setConversations(data.conversations);
      syncUnreadCount(data.unreadCount);
      setForwardTargetMessage(null);
      setSelectedForwardConversationIds([]);
      setStatus(`Message forwarded to ${selectedForwardConversationIds.length} conversation${selectedForwardConversationIds.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Message could not be forwarded.");
    }
  }

  function replyToMessage(message: MessageEntry) {
    setReplyTo(message);
    composerInputRef.current?.focus();
    setOpenMessageMenuId(null);
    setStatus("Replying to selected message.");
  }

  function downloadAttachment(attachment: MessageEntry["attachments"][number]) {
    const link = document.createElement("a");
    link.href = attachment.dataUrl;
    link.download = attachment.name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setOpenMessageMenuId(null);
    setStatus(`Downloading ${attachment.name}.`);
  }

  async function refreshAttachment(message: MessageEntry, attachment: MessageEntry["attachments"][number]) {
    if (!active) return;
    try {
      const freshAttachment = await fetchMessageAttachment(active.conversationId, message.id, attachment.id);
      const objectUrl = createAttachmentObjectUrl(freshAttachment);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setOpenMessageMenuId(null);
      setStatus(`Opening ${attachment.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Attachment could not be opened.");
    }
  }

  if (!active) {
    return (
      <PlatformLayout>
        <PageShell eyebrow="Messages / connections" title="Secure conversations for every resource handoff." description="Open a listing contact to start a seller-specific conversation.">
          <SurfaceCard>
            <h2 className="text-2xl font-semibold">No conversations yet</h2>
            <p className="mt-2 text-on-surface-variant">Use Contact on a listing to open a private conversation with that seller.</p>
          </SurfaceCard>
        </PageShell>
      </PlatformLayout>
    );
  }

  const latestMessage = active.messages[active.messages.length - 1];
  const showWelcomeState = active.messages.length === 0;

  return (
    <PlatformLayout>
      <PageShell
        eyebrow="Messages / connections"
        title="Secure conversations for every resource handoff."
        description="Connect, collaborate, and coordinate resource exchanges with a cleaner, more reliable messaging workspace."
        image="/Messages.png"
        imageAlt="Logistics team coordinating resource movement"
      >
        <div className="chat-layout chat-layout-premium">
          <SurfaceCard className="chat-sidebar-card">
            <div className="chat-security chat-security-banner">
              <LockKeyhole className="h-5 w-5" />
              End-to-end encryption active
            </div>
            <label className="chat-search chat-search-premium">
              <Search className="h-4 w-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" />
            </label>
            <div className="chat-conversation-list">
              {visibleConversations.map((conversation) => (
                <div
                  key={conversation.conversationId}
                  role="button"
                  tabIndex={0}
                  className={active.conversationId === conversation.conversationId ? "chat-contact chat-contact-premium active" : "chat-contact chat-contact-premium"}
                  onClick={() => openConversation(conversation.conversationId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void openConversation(conversation.conversationId);
                    }
                  }}
                >
                  <ConversationAvatar conversation={conversation} />
                  <div className="chat-contact-copy">
                    <div className="chat-contact-row">
                      <strong>{conversation.name}</strong>
                      <span>{formatMessageTime(conversation.updatedAt)}</span>
                    </div>
                    <span className="chat-contact-reference">{conversation.reference}</span>
                    <p>{conversation.messages[conversation.messages.length - 1]?.body ?? "New secure conversation ready."}</p>
                  </div>
                  {conversation.unread ? <em className="unread-badge unread-badge-premium">{conversation.unread}</em> : null}
                  <button
                    type="button"
                    className="chat-contact-delete"
                    aria-label={`Delete conversation with ${conversation.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      void removeConversation(conversation.conversationId, conversation.name);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="chat-panel-card">
            <div className="chat-header chat-header-premium">
              <div className="chat-header-profile">
                <ConversationAvatar conversation={active} large />
                <div>
                  <p className="chat-header-label">Secure conversation</p>
                  <h2>{active.name}</h2>
                  <div className="chat-header-meta">
                    <span className="chat-status-dot" aria-hidden="true" />
                    <span>{active.reference}</span>
                    <span>{active.status ?? "Securely connected"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chat-thread chat-thread-premium">
              {selectedCount ? (
                <div className="message-selection-toolbar compact">
                  <strong>{selectedCount} selected</strong>
                  <button type="button" onClick={() => setSelectedMessageIds([])}>
                    <X className="h-4 w-4" /> Clear
                  </button>
                </div>
              ) : null}
              {showWelcomeState ? (
                <div className="message-empty-state">
                  <div className="message-empty-icon" aria-hidden="true">
                    <MessageCircle className="h-12 w-12" />
                    <span />
                    <span />
                  </div>
                  <h3>No messages yet</h3>
                  <p>Send the first message to start the conversation.</p>
                </div>
              ) : (
                active.messages.map((message, index) => (
                  <ChatMessage
                    key={`${message.id}-${message.createdAt}-${index}`}
                    message={message}
                    isSelected={selectedMessageIds.includes(message.id)}
                    isMenuOpen={openMessageMenuId === message.id}
                    selectedCount={selectedCount}
                    onToggleSelect={() => toggleMessageSelection(message.id)}
                    onToggleMenu={() => setOpenMessageMenuId((current) => current === message.id ? null : message.id)}
                    onCloseMenu={() => setOpenMessageMenuId(null)}
                    onCopy={() => copyMessage(message)}
                    onDeleteForMe={() => deleteMessages([message.id], "me")}
                    onDeleteForEveryone={() => deleteMessages([message.id], "everyone")}
                    onDeleteSelected={() => deleteMessages(selectedMessageIds, "me")}
                    onEdit={() => startEditMessage(message)}
                    onReply={() => replyToMessage(message)}
                    onForward={() => forwardMessage(message)}
                    onDownload={downloadAttachment}
                    onView={(attachment) => refreshAttachment(message, attachment)}
                  />
                ))
              )}

              {liveLocation && liveLocation.conversationId === active.conversationId ? (
                <div className="live-location-card live-location-card-premium">
                  <div className="live-location-heading">
                    <strong>Live location active</strong>
                    <span>Ends {new Date(liveLocation.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="map-preview">
                    <MapPin className="h-7 w-7" />
                    <span>{liveLocation.latitude.toFixed(5)}, {liveLocation.longitude.toFixed(5)}</span>
                  </div>
                  <div className="live-location-actions">
                    <a href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`} target="_blank" rel="noreferrer">
                      View on map
                    </a>
                    <button type="button" onClick={() => stopLiveLocation()}>
                      Stop sharing
                    </button>
                  </div>
                </div>
              ) : null}

              <div ref={threadEndRef} />
            </div>

            {replyTo ? (
              <div className="reply-composer-preview">
                <Reply className="h-4 w-4" />
                <span>Replying to: {replyTo.body}</span>
                <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {editingMessage ? (
              <form className="message-edit-panel" onSubmit={saveEditedMessage}>
                <Edit3 className="h-4 w-4" />
                <input value={editDraft} onChange={(event) => setEditDraft(event.target.value)} autoFocus />
                <button type="submit" disabled={!editDraft.trim()}>Save</button>
                <button type="button" onClick={() => setEditingMessage(null)}>Cancel</button>
              </form>
            ) : null}

            <form className="message-composer message-composer-premium" onSubmit={sendMessage}>
              <div className="composer-menu-wrap">
                <button type="button" className="composer-icon-button composer-attach-button" onClick={() => setIsMenuOpen((current) => !current)} aria-label="More message actions">
                  <Paperclip className="h-5 w-5" />
                </button>
                {isMenuOpen ? (
                  <div className="composer-menu composer-menu-premium">
                    <button type="button" onClick={() => imageInputRef.current?.click()}>
                      <ImagePlus className="h-4 w-4" /> Share Image
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()}>
                      <FileUp className="h-4 w-4" /> Share File
                    </button>
                    <button type="button" onClick={toggleRecording}>
                      <Mic className="h-4 w-4" /> {recording ? "Stop Recording" : "Voice Note"}
                    </button>
                    <button type="button" onClick={() => setIsLocationDurationOpen((current) => !current)}>
                      <MapPin className="h-4 w-4" /> Share Location
                    </button>
                  </div>
                ) : null}
              </div>
              <input
                ref={composerInputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type a message..."
              />
              <button type="button" className="composer-icon-button composer-emoji-button" onClick={() => setIsEmojiOpen((current) => !current)} aria-label="Open emoji picker">
                <Smile className="h-4 w-4" />
              </button>
              <button type="submit" disabled={isSending || isUploading || !draft.trim()}>
                <Send className="h-5 w-5" />
                <span>Send</span>
              </button>
            </form>

            {isUploading ? (
              <div className="message-upload-progress">
                <span />
                <strong>{uploadProgressLabel || "Uploading attachment..."}</strong>
              </div>
            ) : null}

            <input ref={imageInputRef} className="hidden-file-input" type="file" accept="image/*" multiple onChange={(event) => handleFileShare(event, "image")} />
            <input ref={fileInputRef} className="hidden-file-input" type="file" multiple onChange={(event) => handleFileShare(event, "file")} />

            {voicePreview ? (
              <div className="voice-preview voice-preview-premium">
                <audio src={voicePreview} controls />
                <div className="voice-preview-actions">
                  <button type="button" onClick={sendVoiceMessage}>Send voice</button>
                  <button type="button" onClick={clearVoicePreview}>Discard</button>
                </div>
              </div>
            ) : null}

            {isLocationDurationOpen ? (
              <div className="location-duration-panel">
                <strong>Select live location duration</strong>
                {[15, 60, 480].map((minutes) => (
                  <button key={minutes} type="button" onClick={() => startLiveLocation(minutes)}>{formatDuration(minutes)}</button>
                ))}
              </div>
            ) : null}

            {isEmojiOpen ? (
              <div className="emoji-picker">
                {emojiGroups.map((group) => (
                  <div key={group.name}>
                    <strong>{group.name}</strong>
                    <span>
                      {group.items.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setDraft((current) => `${current}${emoji}`);
                            setIsEmojiOpen(false);
                            composerInputRef.current?.focus();
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="chat-footer-row">
              <p className="auth-help">{status}</p>
              {latestMessage ? (
                <span className="chat-last-active">
                  <Clock3 className="h-4 w-4" />
                  Last activity {formatMessageTime(latestMessage.createdAt)}
                </span>
              ) : null}
            </div>

            {isScheduleOpen ? (
              <form className="pickup-scheduler" onSubmit={schedulePickup}>
                <label>
                  <CalendarDays className="h-4 w-4" /> Date
                  <input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} required />
                </label>
                <label>
                  Time
                  <input type="time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} required />
                </label>
                <button type="submit">Send pickup request</button>
              </form>
            ) : (
              <div className="message-quick-actions">
                <button className="organic-button secondary" onClick={() => setIsScheduleOpen(true)} type="button">
                  <CalendarDays className="h-4 w-4" />
                  Schedule pickup
                </button>
              </div>
            )}
            {forwardTargetMessage ? (
              <div className="forward-panel">
                <div className="forward-panel-heading">
                  <strong>Forward message</strong>
                  <button type="button" onClick={() => setForwardTargetMessage(null)} aria-label="Close forward picker">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p>{forwardTargetMessage.body}</p>
                <div className="forward-recipient-list">
                  {conversations
                    .filter((conversation) => conversation.conversationId !== active.conversationId)
                    .map((conversation) => (
                      <label key={conversation.conversationId}>
                        <input
                          type="checkbox"
                          checked={selectedForwardConversationIds.includes(conversation.conversationId)}
                          onChange={() => toggleForwardRecipient(conversation.conversationId)}
                        />
                        <ConversationAvatar conversation={conversation} />
                        <span>{conversation.name}</span>
                      </label>
                    ))}
                </div>
                <div className="forward-panel-actions">
                  <button type="button" onClick={() => setForwardTargetMessage(null)}>Cancel</button>
                  <button type="button" onClick={submitForwardMessage} disabled={!selectedForwardConversationIds.length}>Forward</button>
                </div>
              </div>
            ) : null}
          </SurfaceCard>
        </div>
      </PageShell>
    </PlatformLayout>
  );
}

const emojiGroups = [
  { name: "Smileys", items: ["🙂", "😊", "😂", "😍", "🤝", "🙏"] },
  { name: "Actions", items: ["👍", "✅", "📦", "🚚", "📍", "🕒"] },
  { name: "Impact", items: ["🌱", "♻️", "💚", "🏫", "🍲", "🧰"] }
];

const LIVE_LOCATION_KEY = "zylora.liveLocation.v1";

type LiveLocationState = {
  conversationId: string;
  latitude: number;
  longitude: number;
  startedAt: number;
  updatedAt: number;
  expiresAt: number;
};

function ConversationAvatar({ conversation, large = false }: { conversation: MessageConversation; large?: boolean }) {
  const className = large ? "conversation-avatar large" : "conversation-avatar";
  return (
    <ProfileAvatar
      profile={{ id: conversation.conversationId, name: conversation.name, photoUrl: conversation.avatarUrl }}
      className={className}
    />
  );
}

function ChatMessage({
  message,
  isSelected,
  isMenuOpen,
  selectedCount,
  onToggleSelect,
  onToggleMenu,
  onCloseMenu,
  onCopy,
  onDeleteForMe,
  onDeleteForEveryone,
  onDeleteSelected,
  onEdit,
  onReply,
  onForward,
  onDownload,
  onView
}: {
  message: MessageEntry;
  isSelected: boolean;
  isMenuOpen: boolean;
  selectedCount: number;
  onToggleSelect: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onCopy: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onDeleteSelected: () => void;
  onEdit: () => void;
  onReply: () => void;
  onForward: () => void;
  onDownload: (attachment: MessageEntry["attachments"][number]) => void;
  onView: (attachment: MessageEntry["attachments"][number]) => void;
}) {
  const longPressTimerRef = useRef<number | null>(null);

  if (message.direction === "system") {
    return (
      <div className="chat-system-message">
        <span>{message.body}</span>
        <time>{formatMessageTime(message.createdAt)}</time>
      </div>
    );
  }

  const location = parseLocationMessage(message.body);
  const bubbleClass = `chat-bubble ${message.direction === "outgoing" ? "outgoing" : "incoming"} ${isSelected ? "selected" : ""}`;
  const canEdit = message.direction === "outgoing" && !message.deletedForEveryone;

  function startLongPress(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, label, video, audio")) return;
    longPressTimerRef.current = window.setTimeout(onToggleMenu, 420);
  }

  function cancelLongPress() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  return (
    <article
      className={bubbleClass}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
    >
      <label className="message-select-control" title={isSelected ? "Deselect message" : "Select message"}>
        <input type="checkbox" checked={isSelected} onChange={onToggleSelect} />
        <CheckSquare className="h-4 w-4" />
      </label>
      <div className="message-menu-wrap" onPointerDown={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="message-menu-trigger"
          aria-label="Open message actions"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={onToggleMenu}
          onKeyDown={(event) => {
            if (event.key === "Escape") onCloseMenu();
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {isMenuOpen ? (
          <div className="message-context-menu" role="menu">
            <button type="button" role="menuitem" onClick={onReply}><Reply className="h-4 w-4" /> Reply</button>
            {canEdit ? <button type="button" role="menuitem" onClick={onEdit}><Edit3 className="h-4 w-4" /> Edit Message</button> : null}
            <button type="button" role="menuitem" onClick={onCopy}><Copy className="h-4 w-4" /> Copy Message</button>
            <button type="button" role="menuitem" onClick={onForward}><Forward className="h-4 w-4" /> Forward Message</button>
            {message.attachments.map((attachment) => (
              <button key={`view-${attachment.id}`} type="button" role="menuitem" onClick={() => onView(attachment)}>
                <FileUp className="h-4 w-4" /> View Attachment
              </button>
            ))}
            {message.attachments.map((attachment) => (
              <button key={`download-${attachment.id}`} type="button" role="menuitem" onClick={() => onDownload(attachment)}>
                <Download className="h-4 w-4" /> Download Attachment
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleSelect();
                onCloseMenu();
              }}
            >
              <CheckSquare className="h-4 w-4" /> {isSelected ? "Deselect Message" : "Select Message"}
            </button>
            {selectedCount > 1 ? <button type="button" role="menuitem" onClick={onDeleteSelected}><Trash2 className="h-4 w-4" /> Delete Selected Messages</button> : null}
            <button type="button" role="menuitem" onClick={onDeleteForMe}><Trash2 className="h-4 w-4" /> Delete For Me</button>
            <button type="button" role="menuitem" onClick={onDeleteForEveryone}><Trash2 className="h-4 w-4" /> Delete For Everyone</button>
            <div className="message-menu-info" role="menuitem" aria-disabled="true">
              <Clock3 className="h-4 w-4" />
              <span>Sent {formatMessageTime(message.createdAt)}</span>
            </div>
            <div className="message-menu-info" role="menuitem" aria-disabled="true">
              <MessageCircle className="h-4 w-4" />
              <span>{message.attachments.length ? `${message.attachments.length} attachment${message.attachments.length === 1 ? "" : "s"}` : "Text message"}</span>
            </div>
          </div>
        ) : null}
      </div>
      <div className="chat-bubble-content">
        {message.replyTo ? (
          <div className="message-reply-preview">
            <Reply className="h-3 w-3" />
            <span>{message.replyTo.body}</span>
          </div>
        ) : null}
        {message.kind !== "text" ? <span className="chat-bubble-kind">{formatKindLabel(message.kind)}</span> : null}
        {location ? (
          <div className="chat-location-message">
            <strong>Location shared</strong>
            <div className="map-preview">
              <MapPin className="h-5 w-5" />
              <span>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
            </div>
            <a href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} target="_blank" rel="noreferrer">Open map</a>
          </div>
        ) : (
          <p>{message.body}</p>
        )}
        {message.attachments.length ? (
          <div className="message-attachments">
            {message.attachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                onDownload={() => onDownload(attachment)}
                onView={() => onView(attachment)}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="message-meta-row">
        <time>{formatMessageTime(message.createdAt)}</time>
        {message.editedAt ? <span>Edited</span> : null}
      </div>
    </article>
  );
}

function AttachmentPreview({
  attachment,
  onDownload,
  onView
}: {
  attachment: MessageEntry["attachments"][number];
  onDownload: () => void;
  onView: () => void;
}) {
  const uploadedAt = formatMessageTime(attachment.uploadedAt);

  if (attachment.mimeType.startsWith("image/")) {
    return (
      <figure className="message-attachment-preview image">
        <img src={attachment.dataUrl} alt={attachment.name} loading="lazy" />
        <figcaption>
          <strong title={attachment.name}>{attachment.name}</strong>
          <span>{formatFileSize(attachment.size)} - {uploadedAt}</span>
          <AttachmentActions onDownload={onDownload} onView={onView} />
        </figcaption>
      </figure>
    );
  }

  if (attachment.mimeType.startsWith("video/")) {
    return (
      <div className="message-attachment-preview video">
        <video src={attachment.dataUrl} controls preload="metadata" />
        <AttachmentFileMeta attachment={attachment} uploadedAt={uploadedAt} onDownload={onDownload} onView={onView} />
      </div>
    );
  }

  if (attachment.mimeType.startsWith("audio/")) {
    return (
      <div className="message-attachment-preview voice">
        <Mic className="h-5 w-5" />
        <audio src={attachment.dataUrl} controls preload="metadata" />
        <AttachmentFileMeta attachment={attachment} uploadedAt={uploadedAt} onDownload={onDownload} onView={onView} />
      </div>
    );
  }

  return (
    <div className="message-attachment-preview file">
      <FileUp className="h-5 w-5" />
      <AttachmentFileMeta attachment={attachment} uploadedAt={uploadedAt} onDownload={onDownload} onView={onView} />
    </div>
  );
}

function AttachmentFileMeta({
  attachment,
  uploadedAt,
  onDownload,
  onView
}: {
  attachment: MessageEntry["attachments"][number];
  uploadedAt: string;
  onDownload: () => void;
  onView: () => void;
}) {
  return (
    <div className="attachment-file-meta">
      <strong title={attachment.name}>{attachment.name}</strong>
      <span>{attachment.mimeType} - {formatFileSize(attachment.size)} - {uploadedAt}</span>
      <AttachmentActions onDownload={onDownload} onView={onView} />
    </div>
  );
}

function AttachmentActions({ onDownload, onView }: { onDownload: () => void; onView: () => void }) {
  return (
    <span className="attachment-actions">
      <button type="button" onClick={onView}>View</button>
      <button type="button" onClick={onDownload}><Download className="h-3 w-3" /> Download</button>
    </span>
  );
}

function createLiveLocationState(conversationId: string, minutes: number, latitude: number, longitude: number): LiveLocationState {
  const now = Date.now();
  return {
    conversationId,
    latitude,
    longitude,
    startedAt: now,
    updatedAt: now,
    expiresAt: now + minutes * 60_000
  };
}

function loadLiveLocation() {
  try {
    const stored = window.localStorage.getItem(LIVE_LOCATION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as LiveLocationState;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

function parseLocationMessage(message: string) {
  const match = message.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  return {
    latitude: Number(match[1]),
    longitude: Number(match[2])
  };
}

function formatDuration(minutes: number) {
  if (minutes === 15) return "15 Minutes";
  if (minutes === 60) return "1 Hour";
  if (minutes === 480) return "8 Hours";
  return `${minutes} Minutes`;
}

function formatMessageTime(value: string | Date) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatKindLabel(kind: MessageEntry["kind"]) {
  if (kind === "voice") return "Voice note";
  if (kind === "image") return "Image";
  if (kind === "video") return "Video";
  if (kind === "file") return "File";
  if (kind === "listing") return "Listing";
  if (kind === "location") return "Location";
  if (kind === "schedule") return "Pickup";
  return "Message";
}

const maxClientFileBytes = 3 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedAudioTypes = new Set(["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav"]);
const allowedDocumentTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed"
]);

function validateSelectedFiles(files: File[], kind: MessageEntry["kind"]) {
  if (files.length > 6) {
    throw new Error("Upload up to 6 files at a time.");
  }

  for (const file of files) {
    if (file.size > maxClientFileBytes) {
      throw new Error(`${file.name} is too large. Each file must be 3 MB or smaller.`);
    }

    const allowed = kind === "image"
      ? allowedImageTypes
      : new Set([...allowedImageTypes, ...allowedAudioTypes, ...allowedDocumentTypes]);

    if (!allowed.has(file.type)) {
      throw new Error(`${file.name} is not a supported file type.`);
    }
  }
}

function readFileAsDataUrl(file: File) {
  return readBlobAsDataUrl(file, file.name);
}

function readBlobAsDataUrl(blob: Blob, name = "attachment") {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Could not read ${name}.`));
    reader.readAsDataURL(blob);
  });
}

function createAttachmentObjectUrl(attachment: MessageEntry["attachments"][number]) {
  const match = attachment.dataUrl.match(/^data:([^;,]+);base64,(.*)$/);
  if (!match) {
    throw new Error("Attachment data is invalid or no longer available.");
  }

  const [, mimeType, encoded] = match;
  if (mimeType.toLowerCase() !== attachment.mimeType.toLowerCase()) {
    throw new Error("Attachment data does not match its file type.");
  }

  const byteString = window.atob(encoded);
  const bytes = new Uint8Array(byteString.length);
  for (let index = 0; index < byteString.length; index += 1) {
    bytes[index] = byteString.charCodeAt(index);
  }

  return URL.createObjectURL(new Blob([bytes], { type: attachment.mimeType }));
}
