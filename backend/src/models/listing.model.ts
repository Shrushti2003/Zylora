import { Schema, model, Types, type InferSchemaType } from "mongoose";

const listingSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    clientResourceId: { type: String, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    resourceType: { type: String, enum: ["Sell", "Buy", "Donate"], default: "Sell", index: true },
    city: { type: String, trim: true, index: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    condition: { type: String, enum: ["excellent", "good", "fair", "poor"], default: "good" },
    location: {
      address: String,
      city: { type: String, trim: true },
      geo: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }
      }
    },
    estimatedValue: Number,
    impactScore: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "available", "matched", "picked_up", "closed"], default: "draft", index: true },
    mediaUrls: { type: [String], default: [] },
    ai: {
      generatedDescription: String,
      confidence: Number,
      suggestedTags: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

listingSchema.index({ "location.geo": "2dsphere" });
listingSchema.index({ ownerId: 1, clientResourceId: 1 }, { unique: true, sparse: true });
listingSchema.index({ status: 1, latitude: 1, longitude: 1 });
listingSchema.index({ ownerId: 1, createdAt: -1 });
listingSchema.pre("validate", function syncLocationFields(next) {
  if (typeof this.latitude === "number" && typeof this.longitude === "number") {
    this.set("location.geo.type", "Point");
    this.set("location.geo.coordinates", [this.longitude, this.latitude]);
  }

  if (this.city) {
    this.set("location.city", this.city);
  } else if (this.location?.city) {
    this.city = this.location.city;
  }

  next();
});

export type ListingDocument = InferSchemaType<typeof listingSchema> & { _id: string };
export const ListingModel = model("Listing", listingSchema);
