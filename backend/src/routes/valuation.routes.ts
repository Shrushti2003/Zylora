import { Router } from "express";
import { ValuationController } from "../controllers/valuation.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const controller = new ValuationController();

export const valuationRouter = Router();

valuationRouter.use(authenticate);
valuationRouter.get("/analytics", controller.analytics);
valuationRouter.get("/", controller.list);
valuationRouter.post("/", controller.create);
