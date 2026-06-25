export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export async function generateWithGemini({ prompt, model = GEMINI_MODEL, apiKey = process.env.GEMINI_API_KEY } = {}) {
  if (!apiKey) {
    return {
      provider: "gemini",
      model,
      used: false,
      text: "",
      reason: "missing_gemini_api_key"
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.85,
        maxOutputTokens: 1200
      }
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return {
      provider: "gemini",
      model,
      used: false,
      text: "",
      reason: `gemini_http_${response.status}`,
      detail: body.slice(0, 240)
    };
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("")
    .trim();

  return {
    provider: "gemini",
    model,
    used: Boolean(text),
    text,
    reason: text ? "ok" : "empty_response"
  };
}
