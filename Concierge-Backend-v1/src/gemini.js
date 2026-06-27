import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import { config as loadDotenv } from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");

loadDotenv({ path: path.join(backendRoot, ".env"), quiet: true });

export const GEMINI_MODEL = process.env.GEMINI_MODEL;

let geminiClient = null;
let geminiModel = null;

export function getGeminiModel() {
  return process.env.GEMINI_MODEL;
}

export function initializeGemini({ log = false } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to Concierge-Backend-v1/.env before starting the backend.");
  }
  if (!model) {
    throw new Error("GEMINI_MODEL is missing. Add it to Concierge-Backend-v1/.env before starting the backend.");
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
    geminiModel = model;
  }

  if (log) {
    console.log("✓ Gemini initialized");
    console.log(`Model: ${geminiModel}`);
  }

  return { client: geminiClient, model: geminiModel };
}

export async function generateWithGemini({ prompt, model = process.env.GEMINI_MODEL } = {}) {
  const { client, model: configuredModel } = initializeGemini();
  const activeModel = model || configuredModel;
  const models = [...new Set([activeModel, "gemini-2.5-flash", "gemini-1.5-flash"].filter(Boolean))];
  const attempts = [];

  for (const candidateModel of models) {
    const result = await generateWithRetry(client, candidateModel, prompt);
    attempts.push(...(result.attempts || [{ model: candidateModel, reason: result.reason, error: result.error }]));
    if (result.used) {
      return {
        ...result,
        model: result.model || candidateModel,
        model_used: result.model || candidateModel,
        attempted_models: models,
        attempts
      };
    }
  }

  const last = attempts[attempts.length - 1] || {};
  return {
    provider: "gemini",
    model: activeModel,
    model_used: null,
    used: false,
    text: "",
    reason: last.reason || "gemini_unavailable",
    error: last.error || "All Gemini model attempts failed.",
    attempted_models: models,
    attempts
  };
}

async function generateWithRetry(client, activeModel, prompt) {
  const attempts = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await generateOnce(client, activeModel, prompt, attempt);
    attempts.push({
      model: activeModel,
      attempt,
      reason: result.reason,
      error: result.error || null
    });
    if (result.used) return { ...result, retry_used: attempt > 1, attempts };
    logGeminiFailure({ model: activeModel, attempt, reason: result.reason, error: result.error });
    if (attempt < 3) await delay(500 * attempt);
  }
  return { ...attempts[attempts.length - 1], provider: "gemini", model: activeModel, used: false, text: "", attempts };
}

async function generateOnce(client, activeModel, prompt, attempt = 1) {
  try {
    const response = await withTimeout(
      client.models.generateContent({
        model: activeModel,
        contents: prompt
      }),
      Number(process.env.GEMINI_TIMEOUT_MS || 60000)
    );
    const text = String(response.text || "").trim();
    if (!text) {
      return {
        provider: "gemini",
        model: activeModel,
        model_used: null,
        used: false,
        text: "",
        reason: "invalid_response",
        error: "Gemini returned an empty text response.",
        attempt,
        raw_response: summarizeGeminiResponse(response)
      };
    }

    return {
      provider: "gemini",
      model: activeModel,
      model_used: activeModel,
      used: true,
      text,
      reason: "ok",
      attempt,
      raw_response: summarizeGeminiResponse(response)
    };
  } catch (error) {
    return {
      provider: "gemini",
      model: activeModel,
      model_used: null,
      used: false,
      text: "",
      reason: isTimeoutError(error) ? "timeout" : "gemini_error",
      error: parseGeminiError(error),
      attempt
    };
  }
}

export async function testGemini() {
  return generateWithGemini({ prompt: "Say Hello from Gemini." });
}

function parseGeminiError(error) {
  const message = String(error?.message || error || "Unknown Gemini error");
  try {
    const parsed = JSON.parse(message);
    return parsed.error?.message || parsed.error || message;
  } catch {
    return message;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logGeminiFailure({ model, attempt, reason, error }) {
  console.error(`[gemini:error] model=${model} attempt=${attempt} reason=${reason} error=${error || "unknown"}`);
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs))
  ]);
}

function isTimeoutError(error) {
  return /timed out|timeout/i.test(String(error?.message || error || ""));
}

function summarizeGeminiResponse(response) {
  return {
    text_preview: String(response?.text || "").slice(0, 500),
    candidates: (response?.candidates || []).slice(0, 2).map((candidate) => ({
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings,
      text_preview: (candidate.content?.parts || []).map((part) => part.text || "").join("").slice(0, 500)
    }))
  };
}
