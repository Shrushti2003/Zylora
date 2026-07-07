import { Types, type FilterQuery, type SortOrder } from "mongoose";
import { ValuationModel, type ValuationDocument } from "../models/valuation.model.js";

export type ValuationSort = "newest" | "oldest" | "value_high" | "value_low";

export type ValuationListParams = {
  ownerId: string;
  page: number;
  limit: number;
  search?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minValue?: number;
  maxValue?: number;
  sort: ValuationSort;
};

export type CreateValuationInput = {
  ownerId: string;
  clientValuationId?: string;
  listingId?: string;
  productName: string;
  category: string;
  mode: "resale" | "donation";
  estimatedValue: number;
  fairMarketValue: string;
  recommendedSellingPrice: string;
  circularEconomyScore: number;
  carbonSavingsKg: number;
  estimate: Record<string, unknown>;
};

type LeanValuation = Pick<ValuationDocument,
  "_id" |
  "clientValuationId" |
  "productName" |
  "category" |
  "mode" |
  "estimatedValue" |
  "fairMarketValue" |
  "recommendedSellingPrice" |
  "circularEconomyScore" |
  "carbonSavingsKg" |
  "createdAt" |
  "updatedAt"
>;

type ValuationFilter = FilterQuery<ValuationDocument>;

export async function createValuation(input: CreateValuationInput) {
  const payload = {
    ownerId: input.ownerId,
    clientValuationId: input.clientValuationId,
    listingId: input.listingId,
    productName: input.productName,
    category: input.category,
    mode: input.mode,
    estimatedValue: input.estimatedValue,
    fairMarketValue: input.fairMarketValue,
    recommendedSellingPrice: input.recommendedSellingPrice,
    circularEconomyScore: input.circularEconomyScore,
    carbonSavingsKg: input.carbonSavingsKg,
    estimate: input.estimate
  };

  const valuation = input.clientValuationId
    ? await ValuationModel.findOneAndUpdate(
      { ownerId: input.ownerId, clientValuationId: input.clientValuationId },
      { $set: payload },
      { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true }
    )
    : await ValuationModel.create(payload);

  return valuation.toObject();
}

export async function getRecentValuations(ownerId: string, limit = 5) {
  const valuations = await ValuationModel.find({ ownerId })
    .select("clientValuationId productName category mode estimatedValue fairMarketValue recommendedSellingPrice circularEconomyScore carbonSavingsKg createdAt updatedAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<LeanValuation[]>();

  return valuations.map(toValuationSummary);
}

export async function getInventoryValue(ownerId: string) {
  const [result] = await ValuationModel.aggregate<{ total: number }>([
    { $match: { ownerId: toObjectId(ownerId), mode: "resale" } },
    { $group: { _id: null, total: { $sum: "$estimatedValue" } } }
  ]);

  return Math.round(result?.total ?? 0);
}

export async function getAverageValuation(ownerId: string) {
  const [result] = await ValuationModel.aggregate<{ average: number }>([
    { $match: { ownerId: toObjectId(ownerId), mode: "resale" } },
    { $group: { _id: null, average: { $avg: "$estimatedValue" } } }
  ]);

  return Math.round(result?.average ?? 0);
}

export async function getCircularEconomyImpact(ownerId: string) {
  const [result] = await ValuationModel.aggregate<{ averageScore: number; evaluations: number }>([
    { $match: { ownerId: toObjectId(ownerId) } },
    {
      $group: {
        _id: null,
        averageScore: { $avg: "$circularEconomyScore" },
        evaluations: { $sum: 1 }
      }
    }
  ]);

  return {
    averageScore: Math.round(result?.averageScore ?? 0),
    evaluations: result?.evaluations ?? 0
  };
}

export async function getCarbonSavings(ownerId: string) {
  const [result] = await ValuationModel.aggregate<{ total: number }>([
    { $match: { ownerId: toObjectId(ownerId) } },
    { $group: { _id: null, total: { $sum: "$carbonSavingsKg" } } }
  ]);

  return Math.round(result?.total ?? 0);
}

export async function getValuationTrend(ownerId: string, days = 30) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const trend = await ValuationModel.aggregate<{ date: string; value: number }>([
    {
      $match: {
        ownerId: toObjectId(ownerId),
        mode: "resale",
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        value: { $sum: "$estimatedValue" }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", value: { $round: ["$value", 0] } } }
  ]);

  return trend;
}

export async function getValuationAnalytics(ownerId: string) {
  const [
    recent,
    inventoryValue,
    averageValuation,
    circularEconomyImpact,
    carbonSavingsKg,
    trend
  ] = await Promise.all([
    getRecentValuations(ownerId, 5),
    getInventoryValue(ownerId),
    getAverageValuation(ownerId),
    getCircularEconomyImpact(ownerId),
    getCarbonSavings(ownerId),
    getValuationTrend(ownerId, 30)
  ]);

  return {
    summary: {
      averageEstimatedValue: averageValuation,
      totalInventoryValue: inventoryValue,
      sustainabilityContribution: circularEconomyImpact.averageScore,
      circularEconomyImpact: circularEconomyImpact.evaluations,
      carbonSavingsKg
    },
    trend,
    recent
  };
}

export async function listValuations(params: ValuationListParams) {
  const filter = buildFilter(params);
  const skip = (params.page - 1) * params.limit;
  const sort = sortFor(params.sort);

  const [items, total] = await Promise.all([
    ValuationModel.find(filter)
      .select("clientValuationId productName category mode estimatedValue fairMarketValue recommendedSellingPrice circularEconomyScore carbonSavingsKg createdAt updatedAt")
      .sort(sort)
      .skip(skip)
      .limit(params.limit)
      .lean<LeanValuation[]>(),
    ValuationModel.countDocuments(filter)
  ]);

  return {
    valuations: items.map(toValuationSummary),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit))
    }
  };
}

function buildFilter(params: ValuationListParams): ValuationFilter {
  const filter: ValuationFilter = { ownerId: params.ownerId };

  if (params.search) {
    filter.$or = [
      { productName: { $regex: params.search, $options: "i" } },
      { category: { $regex: params.search, $options: "i" } }
    ];
  }

  if (params.category) {
    filter.category = params.category;
  }

  if (params.dateFrom || params.dateTo) {
    filter.createdAt = {};
    if (params.dateFrom) filter.createdAt.$gte = params.dateFrom;
    if (params.dateTo) filter.createdAt.$lte = params.dateTo;
  }

  if (typeof params.minValue === "number" || typeof params.maxValue === "number") {
    filter.estimatedValue = {};
    if (typeof params.minValue === "number") filter.estimatedValue.$gte = params.minValue;
    if (typeof params.maxValue === "number") filter.estimatedValue.$lte = params.maxValue;
  }

  return filter;
}

function sortFor(sort: ValuationSort): Record<string, SortOrder> {
  if (sort === "oldest") return { createdAt: 1 };
  if (sort === "value_high") return { estimatedValue: -1, createdAt: -1 };
  if (sort === "value_low") return { estimatedValue: 1, createdAt: -1 };
  return { createdAt: -1 };
}

function toValuationSummary(valuation: LeanValuation) {
  return {
    id: String(valuation._id),
    clientValuationId: valuation.clientValuationId,
    productName: valuation.productName,
    category: valuation.category,
    mode: valuation.mode,
    estimatedValue: valuation.estimatedValue,
    fairMarketValue: valuation.fairMarketValue,
    recommendedSellingPrice: valuation.recommendedSellingPrice,
    circularEconomyScore: valuation.circularEconomyScore,
    carbonSavingsKg: valuation.carbonSavingsKg,
    createdAt: valuation.createdAt,
    updatedAt: valuation.updatedAt
  };
}

function toObjectId(ownerId: string) {
  return Types.ObjectId.isValid(ownerId) ? new Types.ObjectId(ownerId) : ownerId;
}
