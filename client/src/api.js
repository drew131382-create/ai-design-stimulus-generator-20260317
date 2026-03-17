const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function generateStimuli(requirement) {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requirement }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Generation failed. Please try again.");
  }

  return data;
}