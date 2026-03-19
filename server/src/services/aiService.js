import OpenAI from "openai";
import { env } from "../config.js";
import { normalizeStimulusResult, validateStimulusResult } from "../utils/validate.js";

const TARGET_COUNT = 10;
const FORBIDDEN_WORDS = new Set([
  "\u90bb\u5c45",
  "\u540c\u4e8b",
  "\u540c\u5b66",
  "\u5ba2\u6237",
  "\u6821\u53cb",
  "\u540c\u884c",
  "\u8def\u4eba",
  "\u6e38\u5ba2",
  "\u964c\u751f\u4eba",
  "\u670b\u53cb",
  "\u4eb2\u621a",
  "\u5bb6\u4eba",
]);

const client = new OpenAI({
  apiKey: env.modelscopeSdkToken,
  baseURL: env.modelscopeBaseUrl,
  timeout: 20000,
  maxRetries: 0,
});

function buildMessages(requirement) {
  return [
    {
      role: "system",
      content:
        "You are a design research assistant. Return strict JSON only, no markdown, no explanations. " +
        "All output text must be Simplified Chinese. " +
        "Top-level keys must be near, medium, far only. " +
        `Each group must contain exactly ${TARGET_COUNT} items. ` +
        "Each item must contain exactly two fields: word and detail. " +
        "word must be 2-4 Chinese characters. detail must be short and practical. " +
        "Do not repeat words across near/medium/far. " +
        "All items must be strongly relevant to the given requirement. " +
        "near/medium/far are semantic design distances, not social relationship distances. " +
        "Do not output person labels, social roles, or relationship words. " +
        "near focuses on function/structure/material/performance. " +
        "medium focuses on scenario/behavior/experience. " +
        "far focuses on nature/metaphor/cross-domain ideas.",
    },
    {
      role: "user",
      content: `\u8bbe\u8ba1\u9700\u6c42\uff1a${requirement}`,
    },
  ];
}

function buildRepairMessages(requirement, currentJson, schemaError) {
  return [
    {
      role: "system",
      content:
        "Fix JSON only. Return strict JSON, no markdown, no explanations. " +
        "All output text must be Simplified Chinese. " +
        "Top-level keys: near, medium, far only. " +
        `Each group must contain exactly ${TARGET_COUNT} items. ` +
        "Each item must contain exactly two fields: word and detail. " +
        "word must be 2-4 Chinese characters. detail must be short and practical. " +
        "Do not repeat words across near/medium/far. " +
        "All items must stay strongly relevant to the requirement and distance semantics. " +
        "near/medium/far are semantic design distances, not social relationship distances. " +
        "Do not output person labels, social roles, or relationship words.",
    },
    {
      role: "user",
      content:
        `\u8bbe\u8ba1\u9700\u6c42\uff1a${requirement}\n` +
        `\u7ed3\u6784\u9519\u8bef\uff1a${schemaError}\n` +
        "\u8bf7\u4fee\u590d\u4e0b\u65b9 JSON\uff0c\u53ea\u8fd4\u56de\u4fee\u590d\u540e\u7684 JSON\uff1a\n" +
        JSON.stringify(currentJson),
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

function getModelCandidates() {
  const configured = String(env.modelscopeModel || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const defaults = [
    "Qwen/Qwen3-8B",
    "Qwen/Qwen3-1.7B",
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
  ];

  const uniq = [];
  for (const name of [...configured, ...defaults]) {
    if (!uniq.includes(name)) uniq.push(name);
  }

  return uniq;
}

function isJsonModeUnsupported(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("response_format") || message.includes("json_object");
}

function isQuotaError(error) {
  const status = Number(error?.status) || Number(error?.statusCode) || 0;
  const code = String(error?.code || error?.type || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    status === 429 ||
    code.includes("insufficient_quota") ||
    message.includes("quota") ||
    message.includes("insufficient") ||
    message.includes("exceeded")
  );
}

function isModelUnavailable(error) {
  const status = Number(error?.status) || Number(error?.statusCode) || 0;
  const message = String(error?.message || "").toLowerCase();

  return (
    status === 404 ||
    message.includes("no provider supported") ||
    (status === 400 && message.includes("model id")) ||
    (message.includes("model") &&
      (message.includes("not found") || message.includes("invalid") || message.includes("unsupported")))
  );
}

async function createChatCompletion(model, messages, useJsonMode) {
  const payload = {
    model,
    temperature: 0.5,
    messages,
  };

  if (useJsonMode) {
    payload.response_format = { type: "json_object" };
  }

  return client.chat.completions.create(payload);
}

async function requestJson(model, messages) {
  let completion;
  let useJsonMode = true;

  try {
    completion = await createChatCompletion(model, messages, true);
  } catch (error) {
    if (isJsonModeUnsupported(error)) {
      useJsonMode = false;
      completion = await createChatCompletion(model, messages, false);
    } else {
      throw error;
    }
  }

  let content = completion?.choices?.[0]?.message?.content;
  if ((!content || !String(content).trim()) && useJsonMode) {
    completion = await createChatCompletion(model, messages, false);
    content = completion?.choices?.[0]?.message?.content;
  }

  return parseJsonSafely(content);
}

function coerceWord(rawWord) {
  const word = String(rawWord || "")
    .trim()
    .replace(/[\s,.;:|/]/g, "");
  if (!word) return "";
  return [...word].slice(0, 4).join("");
}

function coerceDetail(rawDetail) {
  const detail = String(rawDetail || "").trim();
  if (!detail) return "";
  return [...detail].slice(0, 60).join("");
}

function isForbiddenWord(word) {
  const normalized = String(word || "").trim();
  if (!normalized) return true;
  if (FORBIDDEN_WORDS.has(normalized)) return true;
  return normalized.includes("\u4eba");
}

function coerceGroup(rawGroup, globalWordSet) {
  const source = Array.isArray(rawGroup) ? rawGroup : [];
  const output = [];

  for (const item of source) {
    if (output.length >= TARGET_COUNT) break;
    if (!item || typeof item !== "object") continue;

    const word = coerceWord(item.word);
    const detail = coerceDetail(
      item.detail || item.direction || item.inspiration || item.application || item.risk
    );
    if (!word || !detail || isForbiddenWord(word)) continue;

    const key = word.toLowerCase();
    if (globalWordSet.has(key)) continue;

    globalWordSet.add(key);
    output.push({ word, detail });
  }

  return output;
}

function coerceResult(parsed) {
  const data = parsed && typeof parsed === "object" ? parsed : {};
  const usedWords = new Set();

  return {
    near: coerceGroup(data.near, usedWords),
    medium: coerceGroup(data.medium, usedWords),
    far: coerceGroup(data.far, usedWords),
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
        const parsed = await requestJson(model, buildMessages(requirement));
        let result = coerceResult(parsed);
        let schemaError = validateStimulusResult(result);

        if (schemaError) {
          const repairedParsed = await requestJson(
            model,
            buildRepairMessages(requirement, parsed, schemaError)
          );
          result = coerceResult(repairedParsed);
          schemaError = validateStimulusResult(result);
          if (schemaError) {
            throw new Error(`invalid model output schema: ${schemaError}`);
          }
        }

        return normalizeStimulusResult(result);
      } catch (error) {
        lastError = error;
        if (isQuotaError(error) || isModelUnavailable(error)) {
          break;
        }
      }
    }
  }

  const err = new Error(lastError?.message || "failed to generate stimuli");
  err.status = 502;
  err.userMessage = "\u6a21\u578b\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u70b9\u51fb\u201c\u91cd\u65b0\u751f\u6210\u201d\u518d\u8bd5\u4e00\u6b21\u3002";
  throw err;
}
