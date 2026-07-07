import { Router } from "express";
import type { RequestHandler } from "express";
import { UserController } from "../controllers/user.controller.js";
import { searchRateLimiter } from "../middleware/rateLimiter.middleware.js";

const controller = new UserController();

export const userRouter = Router();

function asyncRoute(handler: RequestHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

userRouter.get("/search", searchRateLimiter, asyncRoute(controller.search));
userRouter.get("/:identifier/posts", asyncRoute(controller.posts));
userRouter.get("/:identifier", asyncRoute(controller.show));
