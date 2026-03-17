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
        "You are a design research assistant. Output strict JSON only, no markdown, no explanation. " +
        "Top-level keys must be near, medium, far only. Each key must map to an array of exactly 10 items. " +
        "Each item must have string fields: word, inspiration, direction. " +
        "word must be short; inspiration and direction must be concise; no duplicate words. " +
        "Near = function/structure/material/performance. " +
        "Medium = scenario/behavior/experience. " +
        "Far = nature/metaphor/cross-domain. " +
        "Generate dynamically based on the user's requirement. Avoid templates and fixed vocab lists.",
    },
    {
      role: "user",
      content: `Design requirement: ${requirement}`,
    },
  ];
}

function parseJsonSafely(content) {
  if (!content || typeof content !== "string") {
    throw new Error("model returned empty content");
  }

  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const maybeJson = content.slice(start, end + 1);
      return JSON.parse(maybeJson);
    }
    throw new Error("model did not return valid JSON");
  }
}

async function createCompletion(requirement, useJsonMode = true) {
  const payload = {
    model: env.modelscopeModel,
    temperature: 1,
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

  let completion;
  try {
    completion = await createCompletion(requirement, true);
  } catch (error) {
    // Some OpenAI-compatible providers may not support response_format.
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("response_format") || message.includes("json_object")) {
      completion = await createCompletion(requirement, false);
    } else {
      throw error;
    }
  }

  const content = completion?.choices?.[0]?.message?.content;
  const parsed = parseJsonSafely(content);
  const schemaError = validateStimulusResult(parsed);

  if (schemaError) {
    const err = new Error(`invalid model output schema: ${schemaError}`);
    err.status = 502;
    throw err;
  }

  return normalizeStimulusResult(parsed);
}
