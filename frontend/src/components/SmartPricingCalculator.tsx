import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { estimateResalePrice, type PriceEstimate, type PriceEstimateInput } from "../services/pricing.service";

interface SmartPricingCalculatorProps {
  input: PriceEstimateInput;
  onEstimate: (estimate: PriceEstimate) => void;
  onUsePrice?: (price: string) => void;
  onUseMinimumPrice?: (price: string) => void;
  onUseQuickSalePrice?: (price: string) => void;
  onUsePremiumPrice?: (price: string) => void;
  className?: string;
  compact?: boolean;
}

const emptyEstimate: PriceEstimate = {
  mode: "resale",
  estimatedMarketPrice: "",
  recommendedSellingPrice: "",
  minimumAcceptablePrice: "",
  maximumRecommendedPrice: "",
  fairMarketValue: "",
  quickSalePrice: "",
  premiumListingPrice: "",
  negotiationRange: "",
  remainingUsefulLife: 0,
  sustainabilityImpact: {
    carbonEmissionsSaved: "",
    wasteDiverted: "",
    resourceConservation: ""
  },
  circularEconomyScore: 0,
  confidenceScore: 0,
  explanation: "",
  reasoning: "",
  demandLevel: "Medium Demand",
  marketTrend: "",
  conditionScore: 0,
  repairSuggestions: [],
  insights: [],
  detectedCategory: "",
  source: "local"
};
const dayMs = 24 * 60 * 60 * 1000;

export function SmartPricingCalculator({ input, onEstimate, onUsePrice, onUseMinimumPrice, onUseQuickSalePrice, onUsePremiumPrice, className = "", compact = false }: SmartPricingCalculatorProps) {
  const [estimate, setEstimate] = useState<PriceEstimate>(emptyEstimate);
  const [isLoading, setIsLoading] = useState(false);
  const hasRequiredInput = Boolean(
    input.productName.trim()
    && input.category.trim()
    && input.quantity.trim()
    && input.condition.trim()
    && input.purchaseDate.trim()
  );
  const validationMessage = getPricingValidationMessage(input.purchaseDate, input.expiryDate);
  const canRequestEstimate = hasRequiredInput && !validationMessage;
  const summaryRows = useMemo(() => ([
    { label: "Product Weight (kg)", value: input.weight.trim() || "Not added" },
    { label: "Available Quantity", value: input.quantity.trim() || "Required" },
    { label: "Age of Item", value: input.currentAge.trim() || "Auto from purchase date" }
  ]), [input.currentAge, input.quantity, input.weight]);

  useEffect(() => {
    if (!hasRequiredInput) {
      setEstimate(emptyEstimate);
      onEstimate(emptyEstimate);
      return;
    }

    if (validationMessage) {
      const invalidEstimate = {
        ...emptyEstimate,
        explanation: validationMessage,
        reasoning: validationMessage,
        error: validationMessage
      };
      setEstimate(invalidEstimate);
      onEstimate(invalidEstimate);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      estimateResalePrice(input, { signal: controller.signal })
        .then((result) => {
          if (cancelled) return;
          setEstimate(result);
          onEstimate(result);
        })
        .catch(() => {
          if (cancelled) return;
          const unavailableEstimate = {
            ...emptyEstimate,
            explanation: "Pricing service is temporarily unavailable.",
            reasoning: "Pricing service is temporarily unavailable."
          };
          setEstimate(unavailableEstimate);
          onEstimate(unavailableEstimate);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [hasRequiredInput, input, onEstimate, validationMessage]);

  const showResaleActions = canRequestEstimate && estimate.mode === "resale" && Boolean(estimate.recommendedSellingPrice);
  const estimatedPrice = validationMessage ? "Cannot value item" : estimate.recommendedSellingPrice || estimate.fairMarketValue || "Calculating";
  const minimumPrice = estimate.minimumAcceptablePrice || estimate.quickSalePrice || "Rs 0";
  const statusText = !hasRequiredInput
    ? "Add item details to generate a live estimate."
    : validationMessage
      ? validationMessage
    : isLoading
      ? "Analyzing item details..."
      : "Price estimate ready instantly.";

  return (
    <div className={`smart-pricing-panel ai-calculator-shell ${compact ? "compact" : ""} ${isLoading ? "is-loading" : ""} ${className}`}>
      <div className="ai-calculator-heading">
        <h2>AI Calculator</h2>
      </div>

      <div className="ai-calculator-panel">
        <div className="ai-calculator-input-list">
          {summaryRows.map((row) => (
            <article key={row.label} className="ai-calculator-input-row">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </article>
          ))}
        </div>

        <div className="ai-calculator-divider" aria-hidden="true" />

        <div className="ai-calculator-result">
          <div className="ai-calculator-result-copy">
            <span>Estimated Price</span>
            <strong>{hasRequiredInput ? estimatedPrice : "Waiting for details"}</strong>
            <small>{statusText}</small>
          </div>
          <Sparkles className="h-5 w-5" />
        </div>

        {isLoading ? <div className="valuation-skeleton" aria-label="AI valuation loading" /> : null}

        {hasRequiredInput && !validationMessage ? (
          <>
            <div className="ai-price-card-grid compact-metrics">
              <PriceCard label="Minimum Price" value={minimumPrice} />
              <PriceCard label="Quick Sale" value={estimate.quickSalePrice} icon={<TrendingDown className="h-4 w-4" />} />
              <PriceCard label="Premium" value={estimate.premiumListingPrice} icon={<TrendingUp className="h-4 w-4" />} />
              <PriceCard label="Confidence" value={`${estimate.confidenceScore}%`} />
            </div>

            {showResaleActions && onUsePrice ? (
              <div className="valuation-actions">
                <button className="organic-button primary" type="button" onClick={() => onUsePrice(estimate.recommendedSellingPrice)}>
                  Use AI Price
                </button>
                <button className="organic-button secondary" type="button" onClick={() => (onUseMinimumPrice ?? onUsePrice)(minimumPrice)}>
                  Minimum Price
                </button>
                <button className="organic-button secondary" type="button" onClick={() => (onUseQuickSalePrice ?? onUsePrice)(estimate.quickSalePrice)}>
                  Quick Sale
                </button>
                <button className="organic-button secondary" type="button" onClick={() => (onUsePremiumPrice ?? onUsePrice)(estimate.premiumListingPrice)}>
                  Premium
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="ai-calculator-empty">
            <span>Estimated price and AI actions will appear here once the required item details are ready.</span>
          </div>
        )}
      </div>
      <p className="ai-calculator-caption">Get an AI-generated price estimate based on item condition, category, demand, and market trends.</p>
    </div>
  );
}

function getPricingValidationMessage(purchaseDate: string, expiryDate: string) {
  const today = startOfToday();
  const purchased = parseDateOnly(purchaseDate);
  if (purchased && purchased.getTime() - today.getTime() > dayMs / 2) {
    return "Purchase date cannot be in the future.";
  }

  const expiry = parseDateOnly(expiryDate);
  if (expiry && expiry.getTime() < today.getTime()) {
    return "This product has expired and cannot be valued.";
  }

  return "";
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

function PriceCard({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <article className="ai-price-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {icon ? <i>{icon}</i> : null}
    </article>
  );
}
