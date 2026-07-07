import rateLimit from "express-rate-limit";

function endpointRateLimiter(windowMs: number, limit: number, message: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message }
  });
}

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  skip: (request) => request.path === "/api/auth/me",
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const authMeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1200,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const accountStatusRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many account checks. Please wait a moment before trying again." }
});

export const authSessionRateLimiter = endpointRateLimiter(
  15 * 60 * 1000,
  80,
  "Too many authentication attempts. Please wait a moment before trying again."
);

export const pricingRateLimiter = endpointRateLimiter(
  60 * 1000,
  40,
  "Too many pricing requests. Please wait a moment before trying again."
);

export const uploadRateLimiter = endpointRateLimiter(
  15 * 60 * 1000,
  80,
  "Too many upload requests. Please wait a moment before trying again."
);

export const chatRateLimiter = endpointRateLimiter(
  60 * 1000,
  120,
  "Too many chat requests. Please wait a moment before trying again."
);

export const searchRateLimiter = endpointRateLimiter(
  60 * 1000,
  150,
  "Too many search requests. Please wait a moment before trying again."
);

export const resourceCreationRateLimiter = endpointRateLimiter(
  15 * 60 * 1000,
  60,
  "Too many resource creation requests. Please wait a moment before trying again."
);
