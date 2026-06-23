const titles: Record<string, string> = {
  investment: "Ajman Investment Guide",
  "mawjan-brochure": "Mawjan Brochure",
  "dusit-report": "Dusit Thani Investment Report",
  "market-report": "Ajman Market Report",
  "area-guide": "Ajman Area Guide",
};

const filenames: Record<string, string> = {
  investment: "Ajman Investment Guide.pdf",
  "mawjan-brochure": "Mawjan Brochure.pdf",
  "dusit-report": "Dusit Thani Investment Report.pdf",
  "market-report": "Ajman Market Report.pdf",
  "area-guide": "Ajman Area Guide.pdf",
};

function escapePdf(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function getDownloadFilename(kind: string, projectName?: string) {
  if (projectName && !filenames[kind]) return `${projectName} Brochure.pdf`;
  return filenames[kind] || "Aqaar Property Guide.pdf";
}

export function buildGuidePdf(kind: string, projectName?: string) {
  const title = projectName || titles[kind] || "Aqaar Property Guide";
  const lines = [
    title,
    "Prepared by Aqaar AI Concierge",
    "",
    "Ajman Market Overview",
    "Ajman combines waterfront lifestyle, accessibility to Dubai and Sharjah, and a growing investor base for UAE property buyers.",
    "",
    "Recommended Aqaar Opportunities",
    "Mawjan: waterfront apartments for rental demand, lifestyle appeal, and accessible investment entry.",
    "Dusit Thani: branded luxury residences for service-led living, prestige, and long-term capital positioning.",
    "",
    "Buyer Journey",
    "1. Define buy, rent, or investment intent.",
    "2. Confirm budget, location, unit type, and timeline.",
    "3. Review availability, payment plan, service charges, and expected ROI.",
    "4. Submit enquiry and arrange a private consultation.",
    "",
    "Investment Notes",
    "ROI estimates depend on unit mix, handover timing, furnishing, service profile, and current market availability.",
    "",
    "Next Step",
    "Request a private consultation through Aqaar AI Concierge for live availability and advisor review.",
  ];

  const contentLines = [
    "BT",
    "/F1 24 Tf",
    "52 780 Td",
    `( ${escapePdf(lines[0])} ) Tj`,
    "/F1 11 Tf",
    "0 -30 Td",
    ...lines.slice(1).flatMap((line) => ["0 -18 Td", `( ${escapePdf(line)} ) Tj`]),
    "ET",
  ];
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
