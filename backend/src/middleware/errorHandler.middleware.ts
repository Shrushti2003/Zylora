import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({
      message: "Invalid JSON request body"
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Validation failed",
      ...(isDevelopment ? { issues: error.issues } : {})
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({
      message: "The submitted account data is invalid.",
      ...(isDevelopment ? { issues: Object.values(error.errors).map((issue) => issue.message) } : {})
    });
  }

  return response.status(500).json({
    message: "Internal server error",
    ...(isDevelopment && error instanceof Error ? { detail: error.message } : {})
  });
};
