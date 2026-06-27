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
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL;
  const primary = await generateWithRetry(client, activeModel, prompt);
  if (primary.used || !fallbackModel || fallbackModel === activeModel) return primary;
  const fallback = await generateWithRetry(client, fallbackModel, prompt);
  return fallback.used ? { ...fallback, fallback_model_used: true, primary_error: primary.error } : primary;
}

async function generateWithRetry(client, activeModel, prompt) {
  let result = await generateOnce(client, activeModel, prompt);
  if (result.used || !isRetryableGeminiError(result.error)) return result;
  await delay(500);
  result = await generateOnce(client, activeModel, prompt);
  if (result.used) return { ...result, retry_used: true };
  if (isRetryableGeminiError(result.error)) {
    return { ...result, retry_used: true };
  }
  return result;
}

async function generateOnce(client, activeModel, prompt) {
  try {
    const response = await client.models.generateContent({
      model: activeModel,
      contents: prompt
    });

    return {
      provider: "gemini",
      model: activeModel,
      used: true,
      text: String(response.text || "").trim(),
      reason: "ok"
    };
  } catch (error) {
    return {
      provider: "gemini",
      model: activeModel,
      used: false,
      text: "",
      reason: "gemini_error",
      error: parseGeminiError(error)
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

function isRetryableGeminiError(error) {
  return /high demand|unavailable|overloaded|rate|timeout|temporar/i.test(String(error || ""));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
