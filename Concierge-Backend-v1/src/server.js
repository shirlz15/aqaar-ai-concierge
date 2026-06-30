import http from "node:http";
import { fileURLToPath, URL } from "node:url";
import { dashboard, chat, leadScore, qualify, recommend, search } from "./engine.js";
import { loadData } from "./data.js";
import { initializeGemini, testGemini } from "./gemini.js";

function sendJson(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  return JSON.parse(text);
}

export async function createServer(options = {}) {
  initializeGemini({ log: Boolean(options.logGemini) });
  const data = await loadData(options);
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type"
        });
        return res.end();
      }
      const body = req.method === "POST" ? await readBody(req) : {};
      const input = { ...Object.fromEntries(url.searchParams.entries()), ...body };

      if (req.method === "GET" && url.pathname === "/health") {
        return sendJson(res, 200, { ok: true, kb_only: true });
      }
      if (req.method === "GET" && url.pathname === "/test-gemini") {
        const result = await testGemini();
        return sendJson(res, result.used ? 200 : 502, {
          ok: result.used,
          model: result.model,
          response: result.text,
          error: result.error || null
        });
      }
      if (req.method === "POST" && url.pathname === "/chat") return sendJson(res, 200, await chat(data, input));
      if (req.method === "POST" && url.pathname === "/recommend") return sendJson(res, 200, recommend(data, input));
      if (req.method === "POST" && url.pathname === "/qualify") return sendJson(res, 200, qualify(data, input));
      if (req.method === "POST" && url.pathname === "/lead-score") return sendJson(res, 200, leadScore(data, input));
      if ((req.method === "GET" || req.method === "POST") && url.pathname === "/dashboard") return sendJson(res, 200, await dashboard(data));
      if ((req.method === "GET" || req.method === "POST") && url.pathname === "/search") {
        return sendJson(res, 200, search(data, input.query || input.q || input.message, input.limit || 5));
      }

      return sendJson(res, 404, { error: "unknown_endpoint" });
    } catch (error) {
      return sendJson(res, 500, { error: "server_error", message: error.message });
    }
  });
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 8080);
  try {
    const server = await createServer({ logGemini: true });
    server.listen(port, () => {
      console.log(`Aqaar Concierge Backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
