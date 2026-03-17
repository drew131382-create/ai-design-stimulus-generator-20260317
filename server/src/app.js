import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config.js";
import generateRouter from "./routes/generate.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const allowedOrigins = env.allowedOrigin
  ? env.allowedOrigin.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", apiLimiter);
app.use("/api", generateRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  const status = Number(err.status) || (err.message === "Not allowed by CORS" ? 403 : 500);
  const message = status >= 500 ? "Internal server error" : err.message;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message });
});

export default app;