import { Router } from "express";
import { ResourceController } from "../controllers/resource.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { resourceCreationRateLimiter, searchRateLimiter } from "../middleware/rateLimiter.middleware.js";

const controller = new ResourceController();

export const resourceRouter = Router();

resourceRouter.get("/me", authenticate, controller.mine);
resourceRouter.get("/", searchRateLimiter, controller.list);
resourceRouter.get("/nearby", searchRateLimiter, controller.nearby);
resourceRouter.get("/:resourceId", controller.show);
resourceRouter.post("/", resourceCreationRateLimiter, authenticate, controller.create);
resourceRouter.delete("/:resourceId", authenticate, controller.remove);
