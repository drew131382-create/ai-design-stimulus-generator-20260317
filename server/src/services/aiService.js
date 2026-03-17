import OpenAI from "openai";
import { env } from "../config.js";
import { normalizeStimulusResult, validateStimulusResult } from "../utils/validate.js";

const client = new OpenAI({
  apiKey: env.deepseekApiKey,
  baseURL: "https://api.deepseek.com",
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

export async function generateDesignStimuli(requirement) {
  if (!env.deepseekApiKey) {
    const err = new Error("server missing DEEPSEEK_API_KEY");
    err.status = 500;
    throw err;
  }

  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    temperature: 1,
    response_format: { type: "json_object" },
    messages: buildMessages(requirement),
  });

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