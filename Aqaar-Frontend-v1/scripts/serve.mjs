import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "dist");
const port = Number(process.argv[2] || process.env.PORT || 5173);
const backendOrigin = process.env.AQAAR_BACKEND_ORIGIN || "http://localhost:8080";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    const proxyPath = url.pathname.replace(/^\/api/, "") + url.search;
    const proxyReq = http.request(`${backendOrigin}${proxyPath}`, {
      method: req.method,
      headers: { ...req.headers, host: new URL(backendOrigin).host }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on("error", () => {
      res.writeHead(502, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "backend_unavailable" }));
    });
    req.pipe(proxyReq);
    return;
  }
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(publicRoot, requested));
  if (!filePath.startsWith(publicRoot)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    await stat(filePath);
    res.writeHead(200, { "content-type": types[path.extname(filePath)] || "application/octet-stream" });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Aqaar frontend listening on http://localhost:${port}`);
});
