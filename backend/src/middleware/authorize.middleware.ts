import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import type { UserRole } from "../types/userRole.js";

export function authorize(allowedRoles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    return next();
  };
}

