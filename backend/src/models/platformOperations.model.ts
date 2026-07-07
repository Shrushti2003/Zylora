import { Schema, model, Types, type InferSchemaType } from "mongoose";

const transactionSchema = new Schema(
  {
    listingId: { type: Types.ObjectId, ref: "Listing", required: true },
    donorId: { type: Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
    value: Number
  },
  { timestamps: true }
);

const messageSchema = new Schema(
  {
    senderId: { type: Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    readAt: Date
  },
  { timestamps: true }
);

const notificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ["match", "pickup", "message", "impact", "system"], default: "system" },
    readAt: Date
  },
  { timestamps: true }
);

const impactMetricSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", index: true },
    organizationId: { type: Types.ObjectId, ref: "Organization", index: true },
    wastePreventedKg: { type: Number, default: 0 },
    carbonSavedKg: { type: Number, default: 0 },
    waterSavedLiters: { type: Number, default: 0 },
    resourcesReused: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const reviewSchema = new Schema(
  {
    reviewerId: { type: Types.ObjectId, ref: "User", required: true },
    subjectId: { type: Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String
  },
  { timestamps: true }
);

const pickupTaskSchema = new Schema(
  {
    transactionId: { type: Types.ObjectId, ref: "Transaction", required: true },
    volunteerId: { type: Types.ObjectId, ref: "User", index: true },
    status: { type: String, enum: ["open", "assigned", "in_transit", "completed"], default: "open", index: true },
    pickupWindow: Date,
    routeSummary: String
  },
  { timestamps: true }
);

export type TransactionDocument = InferSchemaType<typeof transactionSchema> & { _id: string };
export type MessageDocument = InferSchemaType<typeof messageSchema> & { _id: string };
export type NotificationDocument = InferSchemaType<typeof notificationSchema> & { _id: string };
export type ImpactMetricDocument = InferSchemaType<typeof impactMetricSchema> & { _id: string };
export type ReviewDocument = InferSchemaType<typeof reviewSchema> & { _id: string };
export type PickupTaskDocument = InferSchemaType<typeof pickupTaskSchema> & { _id: string };

export const TransactionModel = model("Transaction", transactionSchema);
export const MessageModel = model("Message", messageSchema);
export const NotificationModel = model("Notification", notificationSchema);
export const ImpactMetricModel = model("ImpactMetric", impactMetricSchema);
export const ReviewModel = model("Review", reviewSchema);
export const PickupTaskModel = model("PickupTask", pickupTaskSchema);

