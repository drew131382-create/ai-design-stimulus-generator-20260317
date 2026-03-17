import dotenv from "dotenv";

dotenv.config();

function readEnv(name, fallback = "") {
  const value = process.env[name] || fallback;
  return typeof value === "string" ? value.trim() : "";
}

export const env = {
  port: Number(readEnv("PORT", "3000")) || 3000,
  modelscopeSdkToken: readEnv("MODELSCOPE_SDK_TOKEN"),
  modelscopeBaseUrl: readEnv("MODELSCOPE_BASE_URL", "https://api-inference.modelscope.cn/v1"),
  modelscopeModel: readEnv("MODELSCOPE_MODEL", "Qwen/Qwen2.5-7B-Instruct"),
  allowedOrigin: readEnv("ALLOWED_ORIGIN"),
};

if (!env.modelscopeSdkToken) {
  // Keep process alive for health checks; generation route will return clear error.
  console.warn("[warn] MODELSCOPE_SDK_TOKEN is not set. /api/generate will fail until configured.");
}
