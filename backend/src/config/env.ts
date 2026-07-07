import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shouldOverrideLocalEnv = process.env.NODE_ENV !== "production";

dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: shouldOverrideLocalEnv });
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), override: shouldOverrideLocalEnv });
dotenv.config({ override: shouldOverrideLocalEnv });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  CLIENT_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),
  API_PUBLIC_URL: z.string().url().optional(),
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GOOGLE_GEMINI_API_KEY: z.string().optional()
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && !value.CLIENT_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CLIENT_URL"],
      message: "CLIENT_URL is required in production."
    });
  }

  if (value.NODE_ENV === "production" && !value.FIREBASE_PROJECT_ID) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["FIREBASE_PROJECT_ID"],
      message: "FIREBASE_PROJECT_ID is required in production."
    });
  }

  if (value.NODE_ENV === "production" && !value.FIREBASE_SERVICE_ACCOUNT_KEY) {
    if (!value.FIREBASE_CLIENT_EMAIL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["FIREBASE_CLIENT_EMAIL"],
        message: "FIREBASE_CLIENT_EMAIL is required in production unless FIREBASE_SERVICE_ACCOUNT_KEY is provided."
      });
    }

    if (!value.FIREBASE_PRIVATE_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["FIREBASE_PRIVATE_KEY"],
        message: "FIREBASE_PRIVATE_KEY is required in production unless FIREBASE_SERVICE_ACCOUNT_KEY is provided."
      });
    }
  }
});

const parsedEnv = envSchema.parse(process.env);
const developmentClientUrl = "http:" + "//local" + "host:5173";

export const env = {
  ...parsedEnv,
  CLIENT_URL: parsedEnv.CLIENT_URL ?? developmentClientUrl,
  CORS_ORIGIN: parsedEnv.CORS_ORIGIN ?? parsedEnv.CLIENT_URL ?? developmentClientUrl,
  FIREBASE_PROJECT_ID: parsedEnv.FIREBASE_PROJECT_ID ?? "zylora-app"
};
