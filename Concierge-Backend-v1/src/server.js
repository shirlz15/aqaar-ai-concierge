import http from "node:http";
import { URL } from "node:url";
import { dashboard, chat, leadScore, qualify, recommend, search } from "./engine.js";
import { loadData } from "./data.js";

function sendJson(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
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
  const data = await loadData(options);
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const body = req.method === "POST" ? await readBody(req) : {};
      const input = { ...Object.fromEntries(url.searchParams.entries()), ...body };

      if (req.method === "GET" && url.pathname === "/health") {
        return sendJson(res, 200, { ok: true, kb_only: true });
      }
      if (req.method === "POST" && url.pathname === "/chat") return sendJson(res, 200, chat(data, input));
      if (req.method === "POST" && url.pathname === "/recommend") return sendJson(res, 200, recommend(data, input));
      if (req.method === "POST" && url.pathname === "/qualify") return sendJson(res, 200, qualify(data, input));
      if (req.method === "POST" && url.pathname === "/lead-score") return sendJson(res, 200, leadScore(data, input));
      if ((req.method === "GET" || req.method === "POST") && url.pathname === "/dashboard") return sendJson(res, 200, dashboard(data));
      if ((req.method === "GET" || req.method === "POST") && url.pathname === "/search") {
        return sendJson(res, 200, search(data, input.query || input.q || input.message, input.limit || 5));
      }

      return sendJson(res, 404, { error: "unknown_endpoint" });
    } catch (error) {
      return sendJson(res, 500, { error: "server_error", message: error.message });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 8080);
  const server = await createServer();
  server.listen(port, () => {
    console.log(`Aqaar Concierge Backend listening on http://localhost:${port}`);
  });
}
