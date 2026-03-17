import OpenAI from "openai";
import { env } from "../config.js";
import { normalizeStimulusResult, validateStimulusResult } from "../utils/validate.js";

const client = new OpenAI({
  apiKey: env.modelscopeSdkToken,
  baseURL: env.modelscopeBaseUrl,
  timeout: 25000,
  maxRetries: 0,
});
const TARGET_COUNT = 10;

function buildMessages(requirement) {
  return [
    {
      role: "system",
      content:
        "你是设计研究助手。必须仅输出严格 JSON，不要 markdown，不要解释。" +
        "顶层仅允许 near、medium、far 三个字段。每个字段必须是长度 10 的数组。" +
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

function textOrFallback(value, fallback, maxLen) {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.slice(0, maxLen);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueWord(word, used) {
  let base = textOrFallback(word, "补充概念", 24).replace(/\s+/g, "");
  if (!base) base = "补充概念";
  if (!used.has(base.toLowerCase())) {
    used.add(base.toLowerCase());
    return base;
  }
  let idx = 2;
  while (used.has(`${base}${idx}`.toLowerCase())) {
    idx += 1;
  }
  const finalWord = `${base}${idx}`;
  used.add(finalWord.toLowerCase());
  return finalWord;
}

function fallbackByCategory(category) {
  if (category === "near") {
    return {
      inspiration: "从器件结构、材料特性与性能约束中提炼可执行启发。",
      direction: "围绕功能稳定性与制造可行性，优化结构细节与关键参数。",
      application: "先在核心功能模块中小范围试制，再逐步扩展到完整系统。",
      risk: "需关注成本、耐久与加工复杂度，避免过度设计导致落地困难。",
    };
  }
  if (category === "medium") {
    return {
      inspiration: "从用户行为路径、使用场景转换与体验痛点中抽取线索。",
      direction: "重构关键交互节点，提升任务效率、使用反馈与情境适应性。",
      application: "在高频场景中进行分阶段验证，迭代体验策略与服务触点。",
      risk: "需控制学习成本与使用负担，避免新流程引入额外操作阻力。",
    };
  }
  return {
    inspiration: "借鉴自然机理、隐喻关系与跨领域系统逻辑形成新视角。",
    direction: "将抽象机制映射为可设计语言，探索突破式概念与组合方式。",
    application: "先做低保真概念验证，再选择一条路径转化为可测原型。",
    risk: "概念跨度较大，需防止语义漂移并及时回到真实需求边界。",
  };
}

function coerceGroup(group, category, requirement, usedWords) {
  const fallback = fallbackByCategory(category);
  const source = toArray(group);
  const output = [];

  for (let i = 0; i < source.length && output.length < TARGET_COUNT; i += 1) {
    const item = source[i] || {};
    const word = uniqueWord(item.word, usedWords);

    output.push({
      word,
      inspiration: textOrFallback(item.inspiration, fallback.inspiration, 220),
      direction: textOrFallback(item.direction, fallback.direction, 260),
      application: textOrFallback(item.application, fallback.application, 260),
      risk: textOrFallback(item.risk, fallback.risk, 260),
    });
  }

  while (output.length < TARGET_COUNT) {
    const index = output.length + 1;
    const word = uniqueWord(`${category}-${index}`, usedWords);
    output.push({
      word,
      inspiration: fallback.inspiration,
      direction: fallback.direction,
      application: `围绕“${requirement.slice(0, 24)}”补充一个可验证的子方向，逐步推进原型测试。`,
      risk: fallback.risk,
    });
  }

  return output.slice(0, TARGET_COUNT);
}

function coerceStimulusResult(parsed, requirement) {
  const result = parsed && typeof parsed === "object" ? parsed : {};
  const usedWords = new Set();

  return {
    near: coerceGroup(result.near, "near", requirement, usedWords),
    medium: coerceGroup(result.medium, "medium", requirement, usedWords),
    far: coerceGroup(result.far, "far", requirement, usedWords),
  };
}

async function createCompletion(requirement, useJsonMode = true) {
  const model = env.modelscopeModel;
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

function getModelCandidates() {
  const configured = String(env.modelscopeModel || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const fallbacks = [
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
  ];

  const unique = [];
  for (const name of [...configured, ...fallbacks]) {
    if (!unique.includes(name)) unique.push(name);
  }
  return unique;
}

function isJsonModeUnsupported(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("response_format") || message.includes("json_object");
}

function isQuotaError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("quota") || message.includes("exceeded");
}

async function createCompletionByModel(requirement, model, useJsonMode = true) {
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

export async function generateDesignStimuli(requirement) {
  if (!env.modelscopeSdkToken) {
    const err = new Error("server missing MODELSCOPE_SDK_TOKEN");
    err.status = 500;
    throw err;
  }

  const models = getModelCandidates();
  let lastError = null;

  for (const model of models) {
    let useJsonMode = true;

    for (let attempt = 1; attempt <= 1; attempt += 1) {
      try {
        let completion;

        try {
          completion = await createCompletionByModel(requirement, model, useJsonMode);
        } catch (error) {
          if (useJsonMode && isJsonModeUnsupported(error)) {
            useJsonMode = false;
            completion = await createCompletionByModel(requirement, model, false);
          } else {
            throw error;
          }
        }

        let content = completion?.choices?.[0]?.message?.content;
        if ((!content || !String(content).trim()) && useJsonMode) {
          useJsonMode = false;
          completion = await createCompletionByModel(requirement, model, false);
          content = completion?.choices?.[0]?.message?.content;
        }
        const parsed = parseJsonSafely(content);
        const coerced = coerceStimulusResult(parsed, requirement);
        const schemaError = validateStimulusResult(coerced);

        if (schemaError) {
          throw new Error(`invalid model output schema: ${schemaError}`);
        }

        return normalizeStimulusResult(coerced);
      } catch (error) {
        lastError = error;
        if (isQuotaError(error)) {
          break;
        }
      }
    }
  }

  const err = new Error(lastError?.message || "failed to generate stimuli");
  err.status = 502;
  throw err;
}
