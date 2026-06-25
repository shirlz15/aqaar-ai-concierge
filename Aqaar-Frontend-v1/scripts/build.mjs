import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const required = [
  "index.html",
  "src/app.js",
  "src/styles.css",
  "package.json",
  "README.md"
];

const missing = [];
for (const file of required) {
  try {
    await readFile(path.join(root, file), "utf8");
  } catch {
    missing.push(file);
  }
}

if (missing.length) {
  console.error(`Missing required frontend files: ${missing.join(", ")}`);
  process.exit(1);
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, "index.html"), path.join(dist, "index.html"));
await cp(path.join(root, "src"), path.join(dist, "src"), { recursive: true });

const manifest = {
  name: "AQAAR Frontend v1",
  built_at: new Date().toISOString(),
  source_policy: "Frontend reads Aqaar data through Concierge-Backend-v1 APIs only.",
  entry: "index.html"
};

await writeFile(path.join(dist, "build-manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Build complete: dist/");
