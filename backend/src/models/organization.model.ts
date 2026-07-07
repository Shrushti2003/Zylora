import { Schema, model, Types, type InferSchemaType } from "mongoose";

const organizationSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["ngo", "business", "school", "community"], required: true, index: true },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    documents: { type: [String], default: [] },
    address: String,
    impactSummary: {
      resourcesReceived: { type: Number, default: 0 },
      resourcesDonated: { type: Number, default: 0 },
      carbonSavedKg: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export type OrganizationDocument = InferSchemaType<typeof organizationSchema> & { _id: string };
export const OrganizationModel = model("Organization", organizationSchema);

