import OpenAI from "openai";
import { env } from "../config.js";
import { normalizeStimulusResult, validateStimulusResult } from "../utils/validate.js";

const TARGET_COUNT = 10;

const client = new OpenAI({
  apiKey: env.modelscopeSdkToken,
  baseURL: env.modelscopeBaseUrl,
  timeout: 25000,
  maxRetries: 0,
});

function buildMessages(requirement) {
  return [
    {
      role: "system",
      content:
        "You are a design research assistant. Output strict JSON only; no markdown; no explanation. " +
        "Top-level keys must be near, medium, far only. " +
        `Each group must contain exactly ${TARGET_COUNT} items. ` +
        "Each item must include string fields: word, inspiration, direction, application, risk. " +
        "All text must be in Simplified Chinese. " +
        "word should be short (2-8 Chinese characters). " +
        "No duplicate words across all groups. " +
        "Near focuses on function/structure/material/performance. " +
        "Medium focuses on scenario/behavior/experience. " +
        "Far focuses on nature/metaphor/cross-domain innovation. " +
        "Generate dynamically from user requirement; avoid templates and fixed vocab lists.",
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
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw new Error("model did not return valid JSON");
  }
}

function isJsonModeUnsupported(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("response_format") || message.includes("json_object");
}

function isQuotaError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("quota") || message.includes("exceeded");
}

function getModelCandidates() {
  const configured = String(env.modelscopeModel || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const fallbackModels = [
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
  ];

  const uniq = [];
  for (const name of [...configured, ...fallbackModels]) {
    if (!uniq.includes(name)) uniq.push(name);
  }
  return uniq;
}

async function createCompletion(requirement, model, useJsonMode) {
  const payload = {
    model,
    temperature: 0.6,
    messages: buildMessages(requirement),
  };

  if (useJsonMode) {
    payload.response_format = { type: "json_object" };
  }

  return client.chat.completions.create(payload);
}

function asText(value, fallback, maxLen) {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.slice(0, maxLen);
}

function fallbackByCategory(category) {
  if (category === "near") {
    return {
      inspiration: "从功能结构与材料性能约束中提炼可执行启发。",
      direction: "围绕核心功能可靠性和制造可行性推进细节优化。",
      application: "先在关键功能模块中验证，再扩展到整机方案。",
      risk: "注意成本、耐久和加工复杂度，避免过度设计。",
    };
  }
  if (category === "medium") {
    return {
      inspiration: "从用户行为路径和场景切换中抽取体验线索。",
      direction: "优化关键交互节点，提升效率与可理解性。",
      application: "在高频使用场景中分阶段测试并迭代。",
      risk: "控制学习成本，避免引入额外操作负担。",
    };
  }
  return {
    inspiration: "借鉴自然机理与跨领域系统逻辑形成新视角。",
    direction: "将抽象机制映射为可实现的设计语言。",
    application: "先做低保真验证，再收敛到可测原型。",
    risk: "防止概念漂移，持续对齐真实需求边界。",
  };
}

function coerceGroup(group, category) {
  const source = Array.isArray(group) ? group : [];
  const fallback = fallbackByCategory(category);
  const output = [];
  const seenInGroup = new Set();

  for (const raw of source) {
    if (output.length >= TARGET_COUNT) break;
    if (!raw || typeof raw !== "object") continue;

    const word = String(raw.word || "").trim().replace(/\s+/g, "");
    if (!word) continue;

    const key = word.toLowerCase();
    if (seenInGroup.has(key)) continue;
    seenInGroup.add(key);

    output.push({
      word: word.slice(0, 24),
      inspiration: asText(raw.inspiration, fallback.inspiration, 220),
      direction: asText(raw.direction, fallback.direction, 260),
      application: asText(raw.application, fallback.application, 260),
      risk: asText(raw.risk, fallback.risk, 260),
    });
  }

  return output;
}

function coerceStimulusResult(parsed) {
  const result = parsed && typeof parsed === "object" ? parsed : {};
  return {
    near: coerceGroup(result.near, "near"),
    medium: coerceGroup(result.medium, "medium"),
    far: coerceGroup(result.far, "far"),
  };
}

export async function generateDesignStimuli(requirement) {
  if (!env.modelscopeSdkToken) {
    const err = new Error("server missing MODELSCOPE_SDK_TOKEN");
    err.status = 500;
    throw err;
  }

  const models = getModelCandidates();
  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        let completion;
        let useJsonMode = true;

        try {
          completion = await createCompletion(requirement, model, useJsonMode);
        } catch (error) {
          if (isJsonModeUnsupported(error)) {
            useJsonMode = false;
            completion = await createCompletion(requirement, model, useJsonMode);
          } else {
            throw error;
          }
        }

        let content = completion?.choices?.[0]?.message?.content;
        if ((!content || !String(content).trim()) && useJsonMode) {
          completion = await createCompletion(requirement, model, false);
          content = completion?.choices?.[0]?.message?.content;
        }

        const parsed = parseJsonSafely(content);
        const coerced = coerceStimulusResult(parsed);
        const schemaError = validateStimulusResult(coerced);

        if (schemaError) {
          throw new Error(`invalid model output schema: ${schemaError}`);
        }

        return normalizeStimulusResult(coerced);
      } catch (error) {
        lastError = error;
        if (isQuotaError(error)) break;
      }
    }
  }

  const err = new Error(lastError?.message || "failed to generate stimuli");
  err.status = 502;
  err.userMessage = "模型输出不完整，请点击“重新生成”再试一次。";
  throw err;
}
