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
  modelscopeModel: readEnv(
    "MODELSCOPE_MODEL",
    "Qwen/Qwen3-8B,Qwen/Qwen3-1.7B,deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
  ),
  allowedOrigin: readEnv("ALLOWED_ORIGIN"),
};

if (!env.modelscopeSdkToken) {
  console.warn("[warn] MODELSCOPE_SDK_TOKEN is not set. /api/generate will fail until configured.");
}
