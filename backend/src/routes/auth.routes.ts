import { Router } from "express";
import type { RequestHandler } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { accountStatusRateLimiter, authMeRateLimiter, authSessionRateLimiter, chatRateLimiter, uploadRateLimiter } from "../middleware/rateLimiter.middleware.js";

const controller = new AuthController();

export const authRouter = Router();

function asyncRoute(handler: RequestHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

authRouter.post("/firebase/sync", authSessionRateLimiter, authenticate, asyncRoute(controller.syncFirebaseUser));
authRouter.post("/session", authSessionRateLimiter, authenticate, asyncRoute(controller.createSession));
authRouter.post("/logout", asyncRoute(controller.logout));
authRouter.post("/account-status", accountStatusRateLimiter, asyncRoute(controller.accountStatus));
authRouter.get("/me", authMeRateLimiter, authenticate, asyncRoute(controller.me));
authRouter.patch("/profile", authenticate, asyncRoute(controller.updateProfile));
authRouter.post("/saved-resources/:resourceId/toggle", authenticate, asyncRoute(controller.toggleSavedResource));
authRouter.get("/messages", authenticate, asyncRoute(controller.messages));
authRouter.get("/messages/stream", authenticate, asyncRoute(controller.messageStream));
authRouter.post("/messages/contact", chatRateLimiter, authenticate, asyncRoute(controller.openSellerConversation));
authRouter.post("/messages/:conversationId/read", chatRateLimiter, authenticate, asyncRoute(controller.markMessageRead));
authRouter.post("/messages/:conversationId/upload", uploadRateLimiter, authenticate, asyncRoute(controller.uploadMessageMedia));
authRouter.post("/messages/:conversationId/:messageId/forward", chatRateLimiter, authenticate, asyncRoute(controller.forwardMessage));
authRouter.patch("/messages/:conversationId/:messageId", chatRateLimiter, authenticate, asyncRoute(controller.editMessage));
authRouter.delete("/messages/:conversationId/conversation", chatRateLimiter, authenticate, asyncRoute(controller.deleteConversation));
authRouter.delete("/messages/:conversationId", chatRateLimiter, authenticate, asyncRoute(controller.deleteMessages));
authRouter.get("/messages/:conversationId/:messageId/attachments/:attachmentId", authenticate, asyncRoute(controller.downloadAttachment));
authRouter.post("/messages/:conversationId", chatRateLimiter, authenticate, asyncRoute(controller.sendMessage));
authRouter.post("/verification", authenticate, asyncRoute(controller.submitVerification));
