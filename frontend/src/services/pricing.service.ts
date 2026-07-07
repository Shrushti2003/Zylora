import { httpClient } from "../api/httpClient";

export interface PriceEstimateInput {
  productName: string;
  brand: string;
  category: string;
  subcategory: string;
  quantity: string;
  originalPurchasePrice: string;
  purchaseDate: string;
  expiryDate: string;
  currentAge: string;
  usageFrequency: string;
  weight: string;
  condition: string;
  warrantyRemaining: string;
  repairHistory: string;
  damageDescription: string;
  location: string;
  leftoverPercentage: string;
  listingIntent: "donate" | "sell";
  images?: Array<{ name: string; type: string; dataUrl: string }>;
  videoCount?: number;
}

export interface PriceEstimate {
  mode: "resale" | "donation";
  estimatedMarketPrice: string;
  recommendedSellingPrice: string;
  minimumAcceptablePrice: string;
  maximumRecommendedPrice: string;
  fairMarketValue: string;
  quickSalePrice: string;
  premiumListingPrice: string;
  negotiationRange: string;
  remainingUsefulLife: number;
  sustainabilityImpact: {
    carbonEmissionsSaved: string;
    wasteDiverted: string;
    resourceConservation: string;
  };
  circularEconomyScore: number;
  confidenceScore: number;
  explanation: string;
  reasoning: string;
  demandLevel: "High Demand" | "Medium Demand" | "Low Demand";
  marketTrend: string;
  conditionScore: number;
  repairSuggestions: string[];
  insights: string[];
  detectedCategory: string;
  estimatedBeneficiaries?: string;
  socialImpactScore?: number;
  communityImpactRating?: string;
  environmentalImpactScore?: number;
  source: "gemini" | "local";
  error?: string;
}

export const donationImpactCategories = ["Food Donations", "NGO Requirements", "Community Resources"];

export async function estimateResalePrice(input: PriceEstimateInput, options?: { signal?: AbortSignal }): Promise<PriceEstimate> {
  const { data } = await httpClient.post<{ estimate: PriceEstimate }>("/pricing/estimate", sanitizeInput(input), {
    signal: options?.signal
  });

  return data.estimate;
}

function sanitizeInput(input: PriceEstimateInput): PriceEstimateInput {
  return {
    productName: input.productName.trim(),
    brand: input.brand.trim(),
    category: input.category.trim(),
    subcategory: input.subcategory.trim(),
    quantity: input.quantity.trim(),
    originalPurchasePrice: input.originalPurchasePrice.trim(),
    purchaseDate: input.purchaseDate.trim(),
    expiryDate: input.expiryDate.trim(),
    currentAge: input.currentAge.trim(),
    usageFrequency: input.usageFrequency.trim(),
    weight: input.weight.trim(),
    condition: input.condition.trim(),
    warrantyRemaining: input.warrantyRemaining.trim(),
    repairHistory: input.repairHistory.trim(),
    damageDescription: input.damageDescription.trim(),
    location: input.location.trim(),
    leftoverPercentage: input.leftoverPercentage.trim(),
    listingIntent: input.listingIntent,
    images: input.images ?? [],
    videoCount: input.videoCount ?? 0
  };
}
