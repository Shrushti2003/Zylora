export type PricingEngineInput = {
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
  listingIntent: string;
  imageCount: number;
  videoCount: number;
};

export type PriceEstimate = {
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
};

type FactorBreakdown = {
  ageFactor: number;
  brandFactor: number;
  categoryFactor: number;
  conditionFactor: number;
  expiryFactor: number;
  quantityFactor: number;
  usageFactor: number;
  warrantyFactor: number;
  weightFactor: number;
};

const donationImpactCategories = ["Food Donations", "NGO Requirements", "Community Resources"];
const dayMs = 24 * 60 * 60 * 1000;

export function calculateAIResalePrice(input: PricingEngineInput): PriceEstimate {
  const quantity = Math.max(1, extractPrimaryNumber(input.quantity));
  const originalPrice = Math.max(0, extractPrimaryNumber(input.originalPurchasePrice));
  const ageMonths = calculateAgeMonths(input.purchaseDate, input.currentAge);
  const expiryDays = calculateExpiryDays(input.expiryDate);
  const conditionScore = calculateConditionScore(input.condition);
  const circularEconomyScore = calculateCircularEconomyScore(input, conditionScore, ageMonths);
  const donationMode = input.listingIntent === "donate" || donationImpactCategories.includes(input.category);
  const detectedCategory = input.category || "General reuse category";
  const demandLevel = calculateDemandLevel(input.category, input.productName);

  if (donationMode) {
    return buildDonationEstimate(input, quantity, circularEconomyScore, conditionScore, detectedCategory, demandLevel);
  }

  const factors = calculatePricingFactors(input, ageMonths, expiryDays, conditionScore, quantity);
  const fallbackBase = calculateCategoryBaseValue(input, quantity);
  const rawBase = originalPrice > 0 ? originalPrice : fallbackBase;
  const rawEstimate = rawBase
    * factors.usageFactor
    * factors.conditionFactor
    * factors.ageFactor
    * factors.expiryFactor
    * factors.brandFactor
    * factors.categoryFactor
    * factors.quantityFactor
    * factors.warrantyFactor
    * factors.weightFactor;
  const fairValue = validateResalePrice(rawEstimate, originalPrice);
  const recommendedValue = validateResalePrice(fairValue * 0.96, originalPrice);
  const quickSaleValue = validateResalePrice(recommendedValue * 0.9, originalPrice);
  const premiumValue = validateResalePrice(recommendedValue * 1.08, originalPrice);
  const minValue = validateResalePrice(recommendedValue * 0.84, originalPrice);
  const maxValue = validateResalePrice(Math.max(premiumValue, recommendedValue * 1.12), originalPrice);
  const carbonSavedKg = Math.max(1, Math.round((extractPrimaryNumber(input.weight) || quantity * 2) * (0.72 + circularEconomyScore / 180)));
  const wasteDivertedKg = Math.max(1, Math.round((extractPrimaryNumber(input.weight) || quantity * 1.4) * 0.85));
  const confidence = calculateConfidence(input, originalPrice, factors);

  const explanation = [
    `Resale valuation is capped below the original price${originalPrice > 0 ? ` of ${toRupees(originalPrice)}` : ""}.`,
    `Usage frequency (${input.usageFrequency || "not specified"}), condition, item age, quantity, expiry, brand, category, and warranty were scored together.`,
    input.weight ? "Weight was considered only where it is relevant to the selected category." : "Weight was not provided and is not required for valuation."
  ].join(" ");

  return {
    mode: "resale",
    estimatedMarketPrice: toRupees(fairValue),
    recommendedSellingPrice: toRupees(recommendedValue),
    minimumAcceptablePrice: toRupees(minValue),
    maximumRecommendedPrice: toRupees(maxValue),
    fairMarketValue: toRupees(fairValue),
    quickSalePrice: toRupees(quickSaleValue),
    premiumListingPrice: toRupees(premiumValue),
    negotiationRange: `${toRupees(minValue)} - ${toRupees(maxValue)}`,
    remainingUsefulLife: calculateRemainingUsefulLife(factors, conditionScore),
    sustainabilityImpact: {
      carbonEmissionsSaved: `${carbonSavedKg} kg CO2e`,
      wasteDiverted: `${wasteDivertedKg} kg`,
      resourceConservation: `${Math.max(8, Math.round(circularEconomyScore * 0.82))} recovery units`
    },
    circularEconomyScore,
    confidenceScore: confidence,
    explanation,
    reasoning: explanation,
    demandLevel,
    marketTrend: marketTrendLabel(demandLevel, detectedCategory),
    conditionScore,
    repairSuggestions: repairSuggestionsFor(input, fairValue),
    insights: [
      `Usage frequency is weighted ahead of weight and reduced the value to ${Math.round(factors.usageFactor * 100)}% of the primary base.`,
      `Condition impact is ${Math.round(factors.conditionFactor * 100)}% with continuous age impact at ${Math.round(factors.ageFactor * 100)}%.`,
      `Quantity and expiry adjusted the valuation by ${Math.round(factors.quantityFactor * 100)}% and ${Math.round(factors.expiryFactor * 100)}% respectively.`,
      input.warrantyRemaining ? "Warranty context improved resale confidence." : "Adding warranty details can improve buyer confidence.",
      originalPrice > 0 ? "Server-side validation enforced the price below original purchase price." : "Original purchase price was missing, so category fallback pricing was used."
    ],
    detectedCategory,
    source: "local"
  };
}

export function normalizeExternalEstimate(estimate: PriceEstimate | null, input: PricingEngineInput, localEstimate?: PriceEstimate): PriceEstimate | null {
  if (!estimate || estimate.mode === "donation") return estimate;
  const originalPrice = Math.max(0, extractPrimaryNumber(input.originalPurchasePrice));
  const localFairValue = localEstimate ? extractPrimaryNumber(localEstimate.fairMarketValue || localEstimate.estimatedMarketPrice) : 0;
  const localRecommendedValue = localEstimate ? extractPrimaryNumber(localEstimate.recommendedSellingPrice || localEstimate.fairMarketValue) : 0;
  const fairValue = validateResalePrice(blendWithLocalEstimate(extractPrimaryNumber(estimate.fairMarketValue || estimate.estimatedMarketPrice), localFairValue), originalPrice);
  const recommendedValue = validateResalePrice(blendWithLocalEstimate(extractPrimaryNumber(estimate.recommendedSellingPrice || estimate.quickSalePrice || estimate.fairMarketValue), localRecommendedValue || fairValue), originalPrice);
  const quickSaleValue = validateResalePrice(extractPrimaryNumber(estimate.quickSalePrice) || recommendedValue * 0.9, originalPrice);
  const premiumValue = validateResalePrice(extractPrimaryNumber(estimate.premiumListingPrice) || recommendedValue * 1.08, originalPrice);
  const minimumValue = validateResalePrice(extractPrimaryNumber(estimate.minimumAcceptablePrice) || recommendedValue * 0.84, originalPrice);
  const maximumValue = validateResalePrice(extractPrimaryNumber(estimate.maximumRecommendedPrice) || Math.max(premiumValue, recommendedValue * 1.12), originalPrice);

  return {
    ...estimate,
    estimatedMarketPrice: toRupees(fairValue),
    recommendedSellingPrice: toRupees(recommendedValue),
    minimumAcceptablePrice: toRupees(minimumValue),
    maximumRecommendedPrice: toRupees(maximumValue),
    fairMarketValue: toRupees(fairValue),
    quickSalePrice: toRupees(quickSaleValue),
    premiumListingPrice: toRupees(premiumValue),
    negotiationRange: `${toRupees(minimumValue)} - ${toRupees(maximumValue)}`,
    explanation: `${estimate.explanation || estimate.reasoning || "AI valuation returned by model."} Server-side validation enforced resale value below original purchase price and anchored model output to the deterministic pricing engine.`,
    reasoning: `${estimate.reasoning || estimate.explanation || "AI valuation returned by model."} Server-side validation enforced resale value below original purchase price and anchored model output to the deterministic pricing engine.`
  };
}

function blendWithLocalEstimate(externalValue: number, localValue: number) {
  if (!localValue) return externalValue;
  if (!externalValue) return localValue;
  return localValue * 0.65 + externalValue * 0.35;
}

export function calculatePricingFactors(input: PricingEngineInput, ageMonths: number, expiryDays: number | null, conditionScore: number, quantity: number): FactorBreakdown {
  return {
    ageFactor: calculateAgeImpact(ageMonths, input.category),
    brandFactor: calculateBrandMultiplier(input.brand),
    categoryFactor: calculateCategoryMultiplier(input.category),
    conditionFactor: calculateConditionImpact(conditionScore),
    expiryFactor: calculateExpiryImpact(expiryDays, input.category),
    quantityFactor: calculateQuantityImpact(quantity),
    usageFactor: calculateUsageImpact(input.usageFrequency),
    warrantyFactor: calculateWarrantyMultiplier(input.warrantyRemaining),
    weightFactor: calculateWeightInfluence(input.weight, input.category)
  };
}

export function calculateDepreciation(ageMonths: number, category: string) {
  return calculateAgeImpact(ageMonths, category);
}

export function calculateAgeImpact(ageMonths: number, category: string) {
  const monthlyPenalty = /mobile|computer|electronic|appliance/i.test(category)
    ? 0.04
    : /food|grocery|bakery/i.test(category)
      ? 0.032
      : /book|cloth/i.test(category)
        ? 0.02
        : /furniture|tool|construction|industrial/i.test(category)
          ? 0.014
          : 0.018;
  const curve = Math.exp(-monthlyPenalty * Math.max(0, ageMonths));
  return clamp(curve, 0.34, 0.99);
}

export function calculateUsageImpact(usageFrequency: string) {
  const normalized = usageFrequency.trim().toLowerCase();
  if (/never|unused|new/.test(normalized)) return 0.965;
  if (/rare/.test(normalized)) return 0.88;
  if (/occasional/.test(normalized)) return 0.72;
  if (/week|frequent/.test(normalized)) return 0.66;
  if (/daily/.test(normalized)) return 0.48;
  if (/heavy/.test(normalized)) return 0.38;
  return 0.7;
}

export function calculateConditionImpact(conditionScore: number) {
  return clamp(0.4 + conditionScore / 155, 0.38, 0.97);
}

export function calculateBrandMultiplier(brand: string) {
  if (!brand.trim()) return 0.98;
  if (/(apple|sony|samsung|lg|bosch|godrej|dell|hp|lenovo|ikea|nike|adidas)/i.test(brand)) return 1.025;
  if (/(generic|local|unknown|unbranded)/i.test(brand)) return 0.94;
  return 1;
}

function calculateWarrantyMultiplier(warrantyRemaining: string) {
  const months = parseDurationMonths(warrantyRemaining);
  if (!warrantyRemaining.trim() || /none|expired|no/i.test(warrantyRemaining) || months <= 0) return 1;
  return clamp(1 + Math.log1p(months) / 120, 1.008, 1.045);
}

export function calculateExpiryImpact(expiryDays: number | null, category: string) {
  if (expiryDays === null) return 1;
  if (expiryDays < 0) return 0.18;
  if (!/food|grocery|bakery|medical|medicine|cosmetic|chemical|seed|agriculture/i.test(category)) {
    return clamp(0.99 + Math.min(expiryDays, 730) / 73000, 0.99, 1.01);
  }
  const years = expiryDays / 365;
  return clamp(0.24 + 0.75 * (1 - Math.exp(-years * 1.55)), 0.28, 1);
}

export function calculateQuantityImpact(quantity: number) {
  if (quantity <= 1) return 1;
  return clamp(1 + Math.log1p(quantity - 1) * 0.035, 1.01, 1.18);
}

function calculateWeightInfluence(weight: string, category: string) {
  const numericWeight = extractPrimaryNumber(weight);
  if (!numericWeight) return 1;
  if (!/scrap|recyclable|construction|industrial|metal|agriculture|food|grocery|bakery|cement|brick|sand/i.test(category)) {
    return 1;
  }
  return clamp(0.99 + Math.log1p(numericWeight) / 260, 1, 1.035);
}

function validateResalePrice(value: number, originalPrice: number) {
  const safeValue = Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
  if (originalPrice > 1) {
    return Math.max(1, Math.min(safeValue, Math.floor(originalPrice * 0.95)));
  }
  return safeValue;
}

function calculateCategoryBaseValue(input: PricingEngineInput, quantity: number) {
  const base = /mobile|computer|electronic/i.test(input.category)
    ? 180
    : /furniture|appliance/i.test(input.category)
      ? 96
      : /construction|industrial/i.test(input.category)
        ? 72
        : /book|cloth/i.test(input.category)
          ? 38
          : 58;
  return Math.max(1, Math.round(base * Math.max(1, quantity)));
}

function calculateCategoryMultiplier(category: string) {
  if (/mobile|computer|electronic/i.test(category)) return 1.02;
  if (/construction|industrial/i.test(category)) return 1.01;
  if (/book|cloth|food/i.test(category)) return 0.96;
  return 1;
}

function calculateConditionScore(condition: string) {
  if (/brand new|new|unused/i.test(condition)) return 96;
  if (/like new/i.test(condition)) return 90;
  if (/excellent/i.test(condition)) return 84;
  if (/good|working|usable/i.test(condition)) return 74;
  if (/fair|minor|repair/i.test(condition)) return 58;
  if (/poor/i.test(condition)) return 38;
  if (/damaged|scrap/i.test(condition)) return 20;
  return 66;
}

function calculateRemainingUsefulLife(factors: FactorBreakdown, conditionScore: number) {
  return clampScore(Math.round(conditionScore * 0.54 + factors.ageFactor * 28 + factors.usageFactor * 18));
}

function calculateCircularEconomyScore(input: PricingEngineInput, conditionScore: number, ageMonths: number) {
  const repairability = /Tools|Furniture|Appliances|Computer|Mobile|Musical/i.test(input.category) ? 82 : 62;
  const materialRecovery = /Recyclable|Construction|Industrial|Metal|Electronics|Computer|Mobile/i.test(input.category) ? 88 : 60;
  return clampScore(Math.round(conditionScore * 0.36 + repairability * 0.24 + materialRecovery * 0.18 + Math.max(0, 22 - ageMonths * 0.2)));
}

function calculateConfidence(input: PricingEngineInput, originalPrice: number, factors: FactorBreakdown) {
  return clampScore(
    48 +
    (originalPrice ? 14 : 0) +
    (input.usageFrequency ? 10 : 0) +
    (input.condition ? 8 : 0) +
    (input.purchaseDate ? 7 : 0) +
    (input.expiryDate ? 3 : 0) +
    (input.brand ? 4 : 0) +
    (factors.warrantyFactor > 1 ? 4 : 0) +
    Math.min(6, input.imageCount * 2)
  );
}

function buildDonationEstimate(input: PricingEngineInput, quantity: number, circularScore: number, conditionScore: number, detectedCategory: string, demandLevel: PriceEstimate["demandLevel"]): PriceEstimate {
  const carbonSavedKg = Math.max(1, Math.round((extractPrimaryNumber(input.weight) || quantity * 2) * 1.1));
  const explanation = `Impact estimate based on ${detectedCategory}, quantity, condition, usage frequency, and circular recovery potential.`;

  return {
    mode: "donation",
    estimatedMarketPrice: "",
    recommendedSellingPrice: "",
    minimumAcceptablePrice: "",
    maximumRecommendedPrice: "",
    fairMarketValue: "",
    quickSalePrice: "",
    premiumListingPrice: "",
    negotiationRange: "",
    remainingUsefulLife: clampScore(Math.round(conditionScore * 0.7 + circularScore * 0.3)),
    sustainabilityImpact: {
      carbonEmissionsSaved: `${carbonSavedKg} kg CO2e`,
      wasteDiverted: `${Math.max(1, Math.round((extractPrimaryNumber(input.weight) || quantity * 1.5) * 0.9))} kg`,
      resourceConservation: `${Math.max(8, Math.round(circularScore * 0.9))} recovery units`
    },
    circularEconomyScore: circularScore,
    confidenceScore: clampScore(58 + (input.condition ? 8 : 0) + (input.usageFrequency ? 8 : 0) + Math.min(6, input.imageCount * 2)),
    explanation,
    reasoning: explanation,
    demandLevel,
    marketTrend: marketTrendLabel(demandLevel, detectedCategory),
    conditionScore,
    repairSuggestions: [],
    insights: ["Donation mode hides resale prices and focuses on social and environmental impact."],
    detectedCategory,
    estimatedBeneficiaries: `${Math.max(1, Math.round(quantity * 3))} people`,
    socialImpactScore: clampScore(circularScore + 10),
    communityImpactRating: circularScore > 78 ? "Very High" : circularScore > 58 ? "High" : "Moderate",
    environmentalImpactScore: circularScore,
    source: "local"
  };
}

function repairSuggestionsFor(input: PricingEngineInput, fairValue: number) {
  const suggestions: string[] = [];
  if (/battery|phone|laptop|mobile|computer/i.test(`${input.productName} ${input.category}`)) {
    suggestions.push(`A battery or service check could improve buyer trust around ${toRupees(Math.max(300, fairValue * 0.05))}.`);
  }
  if (/scratch|crack|damage|wear|tear/i.test(input.damageDescription)) {
    suggestions.push("Fixing visible damage can improve conversion and reduce negotiation pressure.");
  }
  return suggestions.length ? suggestions : ["Upload clear photos and mention usage history to improve valuation confidence."];
}

function calculateDemandLevel(category: string, productName: string): PriceEstimate["demandLevel"] {
  const text = `${category} ${productName}`.toLowerCase();
  if (/(book|school|computer|mobile|cement|brick|furniture|tool|medical)/.test(text)) return "High Demand";
  if (/(office|kitchen|appliance|electronics|sports|toy|clothing)/.test(text)) return "Medium Demand";
  return "Low Demand";
}

function marketTrendLabel(demandLevel: PriceEstimate["demandLevel"], detectedCategory: string) {
  if (demandLevel === "High Demand") return `Strong resale relevance in ${detectedCategory.toLowerCase()} with active local demand.`;
  if (demandLevel === "Medium Demand") return `Stable resale potential in ${detectedCategory.toLowerCase()} when usage and condition are clear.`;
  return `Niche demand for ${detectedCategory.toLowerCase()}; pricing competitively will improve conversion.`;
}

function calculateAgeMonths(purchaseDate: string, currentAge: string) {
  if (purchaseDate) {
    const purchased = new Date(`${purchaseDate}T00:00:00`);
    if (!Number.isNaN(purchased.getTime())) {
      const today = startOfToday();
      return Math.max(0, (today.getTime() - purchased.getTime()) / dayMs / 30.4375);
    }
  }

  const years = Number(currentAge.match(/(\d+)\s+year/)?.[1] ?? 0);
  const months = Number(currentAge.match(/(\d+)\s+month/)?.[1] ?? 0);
  return Math.max(0, years * 12 + months);
}

export function validatePricingInputDates(input: PricingEngineInput) {
  const today = startOfToday();
  const purchaseDate = parseDateOnly(input.purchaseDate);
  if (purchaseDate && purchaseDate.getTime() > today.getTime()) {
    return "Purchase date cannot be in the future.";
  }

  const expiryDate = parseDateOnly(input.expiryDate);
  if (expiryDate && expiryDate.getTime() < today.getTime()) {
    return "This product has expired and cannot be valued.";
  }

  return "";
}

function calculateExpiryDays(expiryDate: string) {
  const parsed = parseDateOnly(expiryDate);
  if (!parsed) return null;
  return Math.ceil((parsed.getTime() - startOfToday().getTime()) / dayMs);
}

function parseDateOnly(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseDurationMonths(value: string) {
  const normalized = value.toLowerCase();
  if (!normalized.trim()) return 0;
  const years = Number(normalized.match(/(\d+(?:\.\d+)?)\s*(?:year|yr)/)?.[1] ?? 0);
  const months = Number(normalized.match(/(\d+(?:\.\d+)?)\s*(?:month|mo)/)?.[1] ?? 0);
  const days = Number(normalized.match(/(\d+(?:\.\d+)?)\s*(?:day)/)?.[1] ?? 0);
  if (years || months || days) return years * 12 + months + days / 30.4375;
  return /lifetime|valid|active/i.test(normalized) ? 24 : 0;
}

function extractPrimaryNumber(value: string) {
  return Number(value.match(/\d+(\.\d+)?/)?.[0] ?? 0);
}

function toRupees(value: number) {
  return `Rs ${Math.max(0, Math.round(value)).toLocaleString("en-IN")}`;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}
