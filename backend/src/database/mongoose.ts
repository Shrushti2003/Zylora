import mongoose from "mongoose";
import { env } from "../config/env.js";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  mongoose.set("strictQuery", true);
  connectionPromise = mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  }).catch((error) => {
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
}
