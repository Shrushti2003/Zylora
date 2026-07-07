import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";
import {
  createValuation,
  getValuationAnalytics,
  listValuations,
  type ValuationSort
} from "../services/valuation.service.js";
import { AppError } from "../utils/AppError.js";

const valuationEstimateSchema = z.record(z.unknown());

const createValuationSchema = z.object({
  clientValuationId: z.string().trim().min(1).max(160).optional(),
  listingId: z.string().trim().min(1).max(80).optional(),
  productName: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(100),
  mode: z.enum(["resale", "donation"]).default("resale"),
  estimatedValue: z.coerce.number().min(0).max(1_000_000_000).default(0),
  fairMarketValue: z.string().trim().max(80).default(""),
  recommendedSellingPrice: z.string().trim().max(80).default(""),
  circularEconomyScore: z.coerce.number().min(0).max(100).default(0),
  carbonSavingsKg: z.coerce.number().min(0).max(1_000_000).default(0),
  estimate: valuationEstimateSchema.default({})
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(100).optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "oldest", "value_high", "value_low"]).default("newest")
});

function asyncHandler(handler: RequestHandler): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export class ValuationController {
  create = asyncHandler(async (request, response) => {
    if (!request.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const payload = createValuationSchema.parse(request.body);
    const valuation = await createValuation({
      ownerId: request.user.id,
      clientValuationId: payload.clientValuationId,
      listingId: payload.listingId,
      productName: payload.productName,
      category: payload.category,
      mode: payload.mode,
      estimatedValue: payload.estimatedValue,
      fairMarketValue: payload.fairMarketValue,
      recommendedSellingPrice: payload.recommendedSellingPrice,
      circularEconomyScore: payload.circularEconomyScore,
      carbonSavingsKg: payload.carbonSavingsKg,
      estimate: payload.estimate
    });

    response.status(201).json({ valuation });
  });

  analytics = asyncHandler(async (request, response) => {
    if (!request.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    response.status(200).json(await getValuationAnalytics(request.user.id));
  });

  list = asyncHandler(async (request, response) => {
    if (!request.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const query = listQuerySchema.parse(request.query);
    response.status(200).json(await listValuations({
      ownerId: request.user.id,
      page: query.page,
      limit: query.limit,
      search: query.search,
      category: query.category,
      dateFrom: parseDate(query.dateFrom, "start"),
      dateTo: parseDate(query.dateTo, "end"),
      minValue: query.minValue,
      maxValue: query.maxValue,
      sort: query.sort as ValuationSort
    }));
  });
}

function parseDate(value: string | undefined, edge: "start" | "end") {
  if (!value) return undefined;
  const date = new Date(`${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
