import { Schema, model, Types, type InferSchemaType } from "mongoose";

const resourceRequestSchema = new Schema(
  {
    requesterId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true, index: true },
    quantity: { type: Number, default: 1 },
    urgency: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium", index: true },
    status: { type: String, enum: ["open", "matching", "fulfilled", "closed"], default: "open", index: true },
    location: {
      address: String,
      geo: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }
      }
    }
  },
  { timestamps: true }
);

resourceRequestSchema.index({ "location.geo": "2dsphere" });

export type ResourceRequestDocument = InferSchemaType<typeof resourceRequestSchema> & { _id: string };
export const ResourceRequestModel = model("ResourceRequest", resourceRequestSchema);

