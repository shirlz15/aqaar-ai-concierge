import { readFileSync } from "node:fs";
import path from "node:path";

export type CsvRow = Record<string, string>;

function parseLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

export function readCsv(file: string): CsvRow[] {
  const absolute = path.join(process.cwd(), "..", file);
  const content = readFileSync(absolute, "utf8").trim();
  const [headerLine, ...lines] = content.split(/\r?\n/);
  const headers = parseLine(headerLine);
  return lines.map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}
