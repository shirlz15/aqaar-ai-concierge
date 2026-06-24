export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows.shift().map((header) => header.trim());
  return rows
    .filter((values) => values.some((value) => String(value || "").trim()))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()]))
    );
}

export function isKnown(value) {
  return value !== undefined && value !== null && String(value).trim() !== "" && String(value).trim().toLowerCase() !== "unknown";
}

export function knownOrUnknown(value) {
  return isKnown(value) ? String(value).trim() : "unknown";
}
