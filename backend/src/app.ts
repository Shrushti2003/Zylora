import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { Request } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { rejectUnsafeObjectKeys } from "./middleware/requestSecurity.middleware.js";
import { apiRateLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { pricingRouter } from "./routes/pricing.routes.js";
import { resourceRouter } from "./routes/resource.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { valuationRouter } from "./routes/valuation.routes.js";

export const app = express();

const configuredCorsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
const localDevelopmentHosts = new Set(["local" + "host", "127." + "0.0.1"]);

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && localDevelopmentHosts.has(url.hostname) && Boolean(url.port);
  } catch {
    return false;
  }
}

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "no-referrer" }
  })
);
app.use((_request, response, next) => {
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredCorsOrigins.includes(origin) || (env.NODE_ENV !== "production" && isLocalDevelopmentOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "15mb" }));
app.use(rejectUnsafeObjectKeys);
morgan.token("redacted-url", (request) => {
  const expressRequest = request as Request;
  const url = expressRequest.originalUrl || expressRequest.url || "";
  return url.split("?")[0];
});
app.use(morgan(env.NODE_ENV === "production"
  ? ':remote-addr - :remote-user [:date[clf]] ":method :redacted-url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
  : ":method :redacted-url :status :response-time ms - :res[content-length]"
));
app.use(apiRateLimiter);

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    service: "zylora-api",
    status: "healthy"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/pricing", pricingRouter);
app.use("/api/resources", resourceRouter);
app.use("/api/users", userRouter);
app.use("/api/valuations", valuationRouter);
app.use(errorHandler);
