import dotenv from "dotenv";

dotenv.config();

function readEnv(name, fallback = "") {
  const value = process.env[name] || fallback;
  return typeof value === "string" ? value.trim() : "";
}

export const env = {
  port: Number(readEnv("PORT", "3000")) || 3000,
  deepseekApiKey: readEnv("DEEPSEEK_API_KEY"),
  allowedOrigin: readEnv("ALLOWED_ORIGIN"),
};

if (!env.deepseekApiKey) {
  // Keep process alive for health checks; generation route will return clear error.
  console.warn("[warn] DEEPSEEK_API_KEY is not set. /api/generate will fail until configured.");
}
