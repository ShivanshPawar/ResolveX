import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import env from "../config/env.js";

// Allow CLIENT_URL plus comma-separated list via CLIENT_URL_EXTRA
const allowedOrigins = [env.clientUrl, ...(process.env.CLIENT_URL_EXTRA || "").split(",").filter(Boolean)];

export const commonMiddlewares = [
  helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
  morgan("dev"),
  mongoSanitize(),
  hpp(),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith("/api/v1/analytics"), // public analytics not rate-limited
  }),
];
