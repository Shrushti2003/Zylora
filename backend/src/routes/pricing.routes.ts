import { Router } from "express";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { pricingRateLimiter } from "../middleware/rateLimiter.middleware.js";
import { calculateAIResalePrice, normalizeExternalEstimate, validatePricingInputDates, type PriceEstimate } from "../services/pricingEngine.service.js";
import { AppError } from "../utils/AppError.js";

export const pricingRouter = Router();

function asyncRoute(handler: RequestHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

pricingRouter.post("/estimate", pricingRateLimiter, authenticate, asyncRoute(async (request, response) => {
  const input = sanitizeInput(request.body);
  if (!input.productName || !input.category || !input.quantity) {
    throw new AppError("Product name, category, and quantity are required for pricing.", 400);
  }
  const dateValidationMessage = validatePricingInputDates(input);
  if (dateValidationMessage) {
    throw new AppError(dateValidationMessage, 400);
  }

  const fallbackEstimate = calculateAIResalePrice(input);
  const geminiEstimate = env.GOOGLE_GEMINI_API_KEY ? normalizeExternalEstimate(await requestGeminiEstimate(input), input, fallbackEstimate) : null;

  response.status(200).json({
    estimate: geminiEstimate ?? fallbackEstimate
  });
}));

async function requestGeminiEstimate(input: ReturnType<typeof sanitizeInput>): Promise<PriceEstimate | null> {
  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GOOGLE_GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Return compact JSON only. If listingIntent is "donate" or category is Food Donations, NGO Requirements, or Community Resources, set mode="donation" and hide pricing by using empty price strings. Otherwise set mode="resale". Include: mode, fairMarketValue, quickSalePrice, premiumListingPrice, negotiationRange, remainingUsefulLife, circularEconomyScore, confidenceScore, demandLevel, marketTrend, conditionScore, repairSuggestions array, insights array, detectedCategory, sustainabilityImpact { carbonEmissionsSaved, wasteDiverted, resourceConservation }, estimatedBeneficiaries, socialImpactScore, communityImpactRating, environmentalImpactScore, explanation. Product: ${input.productName}. Brand: ${input.brand || "not specified"}. Category: ${input.category}. Subcategory: ${input.subcategory || "not specified"}. Quantity: ${input.quantity}. Original purchase price: ${input.originalPurchasePrice || "not specified"}. Purchase date: ${input.purchaseDate || "not specified"}. Expiry date: ${input.expiryDate || "not specified"}. Current age: ${input.currentAge || "not specified"}. Usage frequency: ${input.usageFrequency || "not specified"}. Weight: ${input.weight || "not specified"}. Condition: ${input.condition || "not specified"}. Warranty remaining: ${input.warrantyRemaining || "not specified"}. Repair history: ${input.repairHistory || "not specified"}. Damage: ${input.damageDescription || "not specified"}. Location: ${input.location || "not specified"}. Leftover percentage: ${input.leftoverPercentage || "not specified"}. Listing intent: ${input.listingIntent || "sell"}. Uploaded image count: ${input.imageCount}. Uploaded video count: ${input.videoCount}. Analyze category detection, category-specific depreciation, useful life, demand, market trend, quantity, weight, repair history, photo-based condition risk, video availability signal, repair suggestions, circular economy score, and sustainability impact. Use INR strings for price fields and 0-100 numbers for scores.`
          }, ...input.images.map((image) => ({
            inlineData: {
              mimeType: image.mimeType,
              data: image.data
            }
          }))]
        }]
      })
    });

    if (!geminiResponse.ok) {
      return null;
    }

    const data = await geminiResponse.json() as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const normalizedText = String(text).replace(/```json|```/g, "").trim();
    if (!normalizedText) return null;
    const parsed = JSON.parse(normalizedText) as GeminiEstimatePayload;

    return {
      mode: parsed.mode === "donation" ? "donation" : "resale",
      estimatedMarketPrice: String(parsed.estimatedMarketPrice ?? parsed.fairMarketValue ?? ""),
      recommendedSellingPrice: String(parsed.recommendedSellingPrice ?? parsed.quickSalePrice ?? ""),
      minimumAcceptablePrice: String(parsed.minimumAcceptablePrice ?? ""),
      maximumRecommendedPrice: String(parsed.maximumRecommendedPrice ?? parsed.premiumListingPrice ?? ""),
      fairMarketValue: String(parsed.fairMarketValue ?? parsed.estimatedMarketPrice ?? ""),
      quickSalePrice: String(parsed.quickSalePrice ?? parsed.recommendedSellingPrice ?? ""),
      premiumListingPrice: String(parsed.premiumListingPrice ?? parsed.maximumRecommendedPrice ?? ""),
      negotiationRange: String(parsed.negotiationRange ?? ""),
      remainingUsefulLife: score(parsed.remainingUsefulLife),
      sustainabilityImpact: {
        carbonEmissionsSaved: String(parsed.sustainabilityImpact?.carbonEmissionsSaved ?? ""),
        wasteDiverted: String(parsed.sustainabilityImpact?.wasteDiverted ?? ""),
        resourceConservation: String(parsed.sustainabilityImpact?.resourceConservation ?? "")
      },
      circularEconomyScore: score(parsed.circularEconomyScore),
      confidenceScore: Math.max(0, Math.min(100, Number(parsed.confidenceScore ?? 75))),
      demandLevel: normalizeDemandLevel(parsed.demandLevel),
      marketTrend: String(parsed.marketTrend ?? ""),
      conditionScore: score(parsed.conditionScore),
      repairSuggestions: Array.isArray(parsed.repairSuggestions) ? parsed.repairSuggestions.map(String).slice(0, 5) : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights.map(String).slice(0, 6) : [],
      detectedCategory: String(parsed.detectedCategory ?? input.category),
      estimatedBeneficiaries: parsed.estimatedBeneficiaries ? String(parsed.estimatedBeneficiaries) : undefined,
      socialImpactScore: parsed.socialImpactScore === undefined ? undefined : score(parsed.socialImpactScore),
      communityImpactRating: parsed.communityImpactRating ? String(parsed.communityImpactRating) : undefined,
      environmentalImpactScore: parsed.environmentalImpactScore === undefined ? undefined : score(parsed.environmentalImpactScore),
      explanation: String(parsed.explanation ?? parsed.reasoning ?? ""),
      reasoning: String(parsed.explanation ?? parsed.reasoning ?? ""),
      source: "gemini" as const
    };
  } catch {
    return null;
  }
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiEstimatePayload = {
  mode?: string;
  estimatedMarketPrice?: unknown;
  recommendedSellingPrice?: unknown;
  minimumAcceptablePrice?: unknown;
  maximumRecommendedPrice?: unknown;
  fairMarketValue?: unknown;
  quickSalePrice?: unknown;
  premiumListingPrice?: unknown;
  negotiationRange?: unknown;
  remainingUsefulLife?: unknown;
  circularEconomyScore?: unknown;
  confidenceScore?: unknown;
  demandLevel?: unknown;
  marketTrend?: unknown;
  conditionScore?: unknown;
  repairSuggestions?: unknown;
  insights?: unknown;
  detectedCategory?: unknown;
  sustainabilityImpact?: {
    carbonEmissionsSaved?: unknown;
    wasteDiverted?: unknown;
    resourceConservation?: unknown;
  };
  estimatedBeneficiaries?: unknown;
  socialImpactScore?: unknown;
  communityImpactRating?: unknown;
  environmentalImpactScore?: unknown;
  explanation?: unknown;
  reasoning?: unknown;
};

function sanitizeInput(input: unknown) {
  const value = isRecord(input) ? input : {};
  return {
    productName: cleanString(value.productName, 120),
    brand: cleanString(value.brand, 80),
    category: cleanString(value.category, 80),
    subcategory: cleanString(value.subcategory, 80),
    quantity: cleanString(value.quantity, 80),
    originalPurchasePrice: cleanString(value.originalPurchasePrice, 80),
    purchaseDate: cleanString(value.purchaseDate, 40),
    expiryDate: cleanString(value.expiryDate, 40),
    currentAge: cleanString(value.currentAge, 80),
    usageFrequency: cleanString(value.usageFrequency, 80),
    weight: cleanString(value.weight, 80),
    condition: cleanString(value.condition, 80),
    warrantyRemaining: cleanString(value.warrantyRemaining, 80),
    repairHistory: cleanString(value.repairHistory, 300),
    damageDescription: cleanString(value.damageDescription, 300),
    location: cleanString(value.location, 120),
    leftoverPercentage: cleanString(value.leftoverPercentage, 8),
    listingIntent: cleanString(value.listingIntent ?? "sell", 12),
    images: sanitizeImages(value.images),
    imageCount: Array.isArray(value.images) ? Math.min(4, value.images.length) : 0,
    videoCount: Number(value.videoCount ?? 0) || 0
  };
}

function sanitizeImages(images: unknown) {
  if (!Array.isArray(images)) return [];
  return images
    .slice(0, 4)
    .map((image) => {
      const imageRecord = isRecord(image) ? image : {};
      const dataUrl = String(imageRecord.dataUrl ?? "");
      const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
      return match ? { mimeType: match[1] === "image/jpg" ? "image/jpeg" : match[1], data: match[2].slice(0, 1_500_000) } : null;
    })
    .filter(Boolean) as Array<{ mimeType: string; data: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanString(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeDemandLevel(value: unknown): PriceEstimate["demandLevel"] {
  return value === "High Demand" || value === "Medium Demand" || value === "Low Demand" ? value : "Medium Demand";
}

function score(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
}
