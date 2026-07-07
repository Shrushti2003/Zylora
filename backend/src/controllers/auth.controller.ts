import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { createFirebaseSessionCookie } from "../services/firebaseToken.service.js";
import { messageEvents } from "../services/messageEvent.service.js";
import { AppError } from "../utils/AppError.js";

const authService = new AuthService();
const sessionCookieName = "zylora_session";
const sessionDurationMs = 1000 * 60 * 60 * 24 * 5;

export class AuthController {
  async accountStatus(request: Request, response: Response) {
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      response.status(400).json({ message: "Enter a valid email address." });
      return;
    }

    const result = await authService.getAccountStatus(email);
    response.status(200).json(result);
  }

  async syncFirebaseUser(request: Request, response: Response) {
    const result = await authService.syncFirebaseUser(request.user?.firebaseUid, request.body?.role, request.body?.name);
    response.status(200).json(result);
  }

  async createSession(request: Request, response: Response) {
    const idToken = typeof request.body?.idToken === "string" ? request.body.idToken : request.firebaseIdToken;

    if (!idToken) {
      throw new AppError("Firebase ID token is required", 400);
    }

    try {
      const sessionCookie = await createFirebaseSessionCookie(idToken, sessionDurationMs);
      response.cookie(sessionCookieName, sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sessionDurationMs,
        path: "/"
      });
      response.status(204).send();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Auth] Session cookie creation skipped", error instanceof Error ? error.message : error);
      }
      response.status(204).send();
    }
  }

  async logout(_request: Request, response: Response) {
    response.clearCookie(sessionCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    response.status(204).send();
  }

  async me(request: Request, response: Response) {
    const user = await authService.getCurrentUser(request.user?.id);
    response.status(200).json({ user });
  }

  async updateProfile(request: Request, response: Response) {
    const result = await authService.updateProfile(request.user?.id, request.body);
    response.status(200).json(result);
  }

  async toggleSavedResource(request: Request, response: Response) {
    const result = await authService.toggleSavedResource(request.user?.id, request.params.resourceId);
    response.status(200).json(result);
  }

  async messages(request: Request, response: Response) {
    const result = await authService.getMessages(request.user?.id);
    response.status(200).json(result);
  }

  async messageStream(request: Request, response: Response) {
    if (!request.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const initial = await authService.getMessages(request.user.id);
    messageEvents.subscribe(request.user.id, response, {
      type: "messages",
      unreadCount: initial.unreadCount,
      conversations: initial.conversations
    });
  }

  async openSellerConversation(request: Request, response: Response) {
    const result = await authService.openSellerConversation(request.user?.id, request.body);
    response.status(200).json(result);
  }

  async markMessageRead(request: Request, response: Response) {
    const result = await authService.markConversationRead(request.user?.id, request.params.conversationId);
    response.status(200).json(result);
  }

  async sendMessage(request: Request, response: Response) {
    const result = await authService.appendMessage(request.user?.id, request.params.conversationId, request.body);
    response.status(201).json(result);
  }

  async uploadMessageMedia(request: Request, response: Response) {
    const result = await authService.uploadMessageMedia(request.user?.id, request.params.conversationId, request.body);
    response.status(201).json(result);
  }

  async forwardMessage(request: Request, response: Response) {
    const result = await authService.forwardMessage(request.user?.id, request.params.conversationId, request.params.messageId, request.body);
    response.status(201).json(result);
  }

  async editMessage(request: Request, response: Response) {
    const result = await authService.editMessage(request.user?.id, request.params.conversationId, request.params.messageId, request.body);
    response.status(200).json(result);
  }

  async deleteMessages(request: Request, response: Response) {
    const result = await authService.deleteMessages(request.user?.id, request.params.conversationId, request.body);
    response.status(200).json(result);
  }

  async deleteConversation(request: Request, response: Response) {
    const result = await authService.deleteConversation(request.user?.id, request.params.conversationId);
    response.status(200).json(result);
  }

  async downloadAttachment(request: Request, response: Response) {
    const attachment = await authService.getMessageAttachment(
      request.user?.id,
      request.params.conversationId,
      request.params.messageId,
      request.params.attachmentId
    );

    response.status(200).json({ attachment });
  }

  async submitVerification(request: Request, response: Response) {
    const result = await authService.submitVerification(request.user?.id, request.body);
    response.status(200).json(result);
  }
}
