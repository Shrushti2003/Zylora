import { Schema, model, Types, type InferSchemaType } from "mongoose";

const valuationSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    listingId: { type: Types.ObjectId, ref: "Listing", index: true },
    clientValuationId: { type: String, trim: true, index: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    mode: { type: String, enum: ["resale", "donation"], default: "resale", index: true },
    estimatedValue: { type: Number, default: 0, min: 0, index: true },
    fairMarketValue: { type: String, default: "" },
    recommendedSellingPrice: { type: String, default: "" },
    circularEconomyScore: { type: Number, default: 0, min: 0, max: 100 },
    carbonSavingsKg: { type: Number, default: 0, min: 0 },
    estimate: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

valuationSchema.index({ ownerId: 1, createdAt: -1 });
valuationSchema.index({ ownerId: 1, category: 1, createdAt: -1 });
valuationSchema.index({ ownerId: 1, estimatedValue: -1 });
valuationSchema.index({ ownerId: 1, clientValuationId: 1 }, { unique: true, sparse: true });

export type ValuationDocument = InferSchemaType<typeof valuationSchema> & { _id: string };
export const ValuationModel = model("Valuation", valuationSchema);
