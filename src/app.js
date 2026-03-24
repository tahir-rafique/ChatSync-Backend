const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { swaggerUi, swaggerSpec } = require("./config/swagger");
const { errorHandler, notFound } = require("./middlewares/errorHandler");
const logger = require("./utils/logger");

// ── Route Imports ─────────────────────────────────────────
const v1Routes = require("./api/v1/routes");

const app = express();

// ── Security Middlewares ──────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable dynamic CSP for Swagger in development
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow frontend to load images/files
  })
);
app.use(mongoSanitize());

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
].filter(Boolean).map(o => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/$/, "");

      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith(".vercel.app") ||
        process.env.NODE_ENV === "development";

      if (isAllowed) {
        callback(null, true);
      } else {
        // Logging for easier debugging in production
        logger.warn(`CORS blocked for origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// ── General Middlewares ───────────────────────────────────
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ── Static Files (Uploads) ────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// ── Swagger API Docs ──────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health Check ──────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy 🟢", timestamp: new Date() });
});

// ── API Routes ────────────────────────────────────────────
app.use("/api/v1", v1Routes);

// ── 404 & Error Handlers ──────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
