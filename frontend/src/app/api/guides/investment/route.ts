import { NextResponse } from "next/server";

export const runtime = "nodejs";

function escapePdf(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildInvestmentGuidePdf() {
  const lines = [
    "Aqaar Investment Guide",
    "Ajman real estate overview, buyer journey, and project enquiry guide.",
    "",
    "Ajman Overview",
    "Ajman offers a compact, accessible market for waterfront living, branded residences, rental demand, and long-term capital preservation.",
    "",
    "Featured Aqaar Projects",
    "Mawjan: waterfront-led residential positioning for lifestyle buyers and investors seeking distinctive coastal appeal.",
    "Dusit Thani: hospitality-led branded residence positioning for buyers who value service, prestige, and rental potential.",
    "",
    "ROI Overview",
    "Investment suitability should be reviewed through expected rental demand, handover timeline, service profile, payment plan, and exit liquidity.",
    "",
    "Buying Process",
    "1. Identify purchase intent, budget, and preferred timeline.",
    "2. Shortlist suitable Aqaar projects and unit types.",
    "3. Review availability, payment plan, fees, and documents.",
    "4. Reserve the preferred unit and complete compliance checks.",
    "5. Coordinate contract, payment, and handover steps with Aqaar.",
    "",
    "FAQ",
    "Can I compare buy and rent options? Yes, Aqaar advisors can compare lifestyle use, monthly rental logic, and ownership cost.",
    "Can investors request ROI guidance? Yes, recommendations should be validated against current availability and advisor review.",
    "Can I enquire about a specific project? Yes, select a project enquiry and Aqaar will follow up with availability.",
    "",
    "Contact",
    "Visit aqaar.com or request a private consultation through the Aqaar AI Concierge.",
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

export async function GET() {
  return new NextResponse(buildInvestmentGuidePdf(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="aqaar-investment-guide.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
