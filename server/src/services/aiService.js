import OpenAI from "openai";
import { env } from "../config.js";
import { normalizeStimulusResult, validateStimulusResult } from "../utils/validate.js";

const client = new OpenAI({
  apiKey: env.modelscopeSdkToken,
  baseURL: env.modelscopeBaseUrl,
});

function buildMessages(requirement) {
  return [
    {
      role: "system",
      content:
        "你是设计研究助手。必须仅输出严格 JSON，不要 markdown，不要解释。" +
        "顶层仅允许 near、medium、far 三个字段。每个字段必须是长度 16 的数组。" +
        "每个元素必须包含并仅包含这些字符串字段：word、inspiration、direction、application、risk。" +
        "全部内容必须使用简体中文。word 要短（2-8字），三组词语不能重复。" +
        "inspiration 说明启发来源（20-50字）；direction 说明设计推进方向（30-70字）；" +
        "application 说明可落地场景与实现要点（30-70字）；risk 说明约束或风险提醒（20-50字）。" +
        "Near 聚焦功能/结构/材料/性能；Medium 聚焦场景/行为/体验；Far 聚焦自然/隐喻/跨领域。" +
        "必须根据用户输入动态生成，不允许模板化与固定词库。",
    },
    {
      role: "user",
      content: `设计需求：${requirement}`,
    },
  ];
}

function parseJsonSafely(content) {
  if (!content || typeof content !== "string") {
    throw new Error("model returned empty content");
  }

  const clean = content.trim();

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const maybeJson = clean.slice(start, end + 1);
      return JSON.parse(maybeJson);
    }
    throw new Error("model did not return valid JSON");
  }
}

async function createCompletion(requirement, useJsonMode = true) {
  const payload = {
    model: env.modelscopeModel,
    temperature: 0.9,
    messages: buildMessages(requirement),
  };

  if (useJsonMode) {
    payload.response_format = { type: "json_object" };
  }

  return client.chat.completions.create(payload);
}

export async function generateDesignStimuli(requirement) {
  if (!env.modelscopeSdkToken) {
    const err = new Error("server missing MODELSCOPE_SDK_TOKEN");
    err.status = 500;
    throw err;
  }

  let useJsonMode = true;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      let completion;

      try {
        completion = await createCompletion(requirement, useJsonMode);
      } catch (error) {
        const message = String(error?.message || "").toLowerCase();
        if (useJsonMode && (message.includes("response_format") || message.includes("json_object"))) {
          useJsonMode = false;
          completion = await createCompletion(requirement, false);
        } else {
          throw error;
        }
      }

      const content = completion?.choices?.[0]?.message?.content;
      const parsed = parseJsonSafely(content);
      const schemaError = validateStimulusResult(parsed);

      if (schemaError) {
        throw new Error(`invalid model output schema: ${schemaError}`);
      }

      return normalizeStimulusResult(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  const err = new Error(lastError?.message || "failed to generate stimuli");
  err.status = 502;
  throw err;
}