import type { Response } from "express";

type MessageEventPayload = {
  type: "messages";
  unreadCount: number;
  conversationId?: string;
  conversations?: unknown[];
};

class MessageEventService {
  private readonly clients = new Map<string, Set<Response>>();

  subscribe(userId: string, response: Response, initialPayload?: MessageEventPayload) {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders?.();

    const userClients = this.clients.get(userId) ?? new Set<Response>();
    userClients.add(response);
    this.clients.set(userId, userClients);

    response.write("event: connected\n");
    response.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    if (initialPayload) {
      response.write("event: messages\n");
      response.write(`data: ${JSON.stringify(initialPayload)}\n\n`);
    }

    const heartbeat = setInterval(() => {
      response.write("event: heartbeat\n");
      response.write(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`);
    }, 25_000);

    response.on("close", () => {
      clearInterval(heartbeat);
      userClients.delete(response);
      if (!userClients.size) {
        this.clients.delete(userId);
      }
    });
  }

  publish(userId: string | undefined, payload: MessageEventPayload) {
    if (!userId) return;

    const userClients = this.clients.get(userId);
    if (!userClients?.size) return;

    const eventBody = `event: messages\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of userClients) {
      if (client.destroyed || client.writableEnded) {
        userClients.delete(client);
        continue;
      }
      client.write(eventBody);
    }

    if (!userClients.size) {
      this.clients.delete(userId);
    }
  }
}

export const messageEvents = new MessageEventService();
