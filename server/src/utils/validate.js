function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function charLen(text) {
  return [...String(text || "")].length;
}

export function validateInput(requirement) {
  if (!isNonEmptyString(requirement)) {
    return "requirement must be a non-empty string";
  }

  const trimmed = requirement.trim();
  if (trimmed.length < 8) {
    return "requirement is too short (minimum: 8 chars)";
  }

  if (trimmed.length > 2000) {
    return "requirement is too long (maximum: 2000 chars)";
  }

  return null;
}

function validateItem(item, groupName, index) {
  if (!item || typeof item !== "object") {
    return `${groupName}[${index}] must be an object`;
  }

  const fields = ["word", "detail"];
  for (const field of fields) {
    if (!isNonEmptyString(item[field])) {
      return `${groupName}[${index}].${field} must be a non-empty string`;
    }
  }

  if (charLen(item.word) > 4) {
    return `${groupName}[${index}].word must be <= 4 chars`;
  }

  if (charLen(item.detail) > 80) {
    return `${groupName}[${index}].detail is too long`;
  }

  return null;
}

export function validateStimulusResult(result) {
  if (!result || typeof result !== "object") {
    return "response must be a JSON object";
  }

  const requiredGroups = ["near", "medium", "far"];
  for (const group of requiredGroups) {
    if (!Array.isArray(result[group])) {
      return `${group} must be an array`;
    }

    if (result[group].length !== 10) {
      return `${group} must contain exactly 10 items`;
    }

    for (let i = 0; i < result[group].length; i += 1) {
      const err = validateItem(result[group][i], group, i);
      if (err) return err;
    }
  }

  const seen = new Set();
  for (const group of requiredGroups) {
    for (const item of result[group]) {
      const key = String(item.word).trim().toLowerCase();
      if (seen.has(key)) {
        return `duplicate word detected: ${item.word}`;
      }
      seen.add(key);
    }
  }

  return null;
}

export function normalizeStimulusResult(result) {
  return {
    near: result.near.map((item) => ({
      word: String(item.word).trim(),
      detail: String(item.detail).trim(),
    })),
    medium: result.medium.map((item) => ({
      word: String(item.word).trim(),
      detail: String(item.detail).trim(),
    })),
    far: result.far.map((item) => ({
      word: String(item.word).trim(),
      detail: String(item.detail).trim(),
    })),
  };
}
