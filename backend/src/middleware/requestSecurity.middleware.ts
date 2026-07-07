import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

const unsafeObjectKeys = new Set(["__proto__", "prototype", "constructor"]);

function hasUnsafeObjectKey(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== "object" || depth > 20) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeObjectKey(item, depth + 1));
  }

  for (const key of Object.keys(value)) {
    if (unsafeObjectKeys.has(key)) {
      return true;
    }

    if (hasUnsafeObjectKey((value as Record<string, unknown>)[key], depth + 1)) {
      return true;
    }
  }

  return false;
}

export function rejectUnsafeObjectKeys(request: Request, _response: Response, next: NextFunction) {
  if (hasUnsafeObjectKey(request.body) || hasUnsafeObjectKey(request.query) || hasUnsafeObjectKey(request.params)) {
    next(new AppError("Request contains unsupported object keys", 400));
    return;
  }

  next();
}
