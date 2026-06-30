import { showToast } from './toast.js';
import { state } from './state.js';

function safe(value, fallback = 'Not provided') {
  const text = String(value ?? '').trim();
  return text && !/^unknown$/i.test(text) ? text : fallback;
}

function slug(value) {
  return safe(value, state.sessionId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || state.sessionId;
}

function textFromMessages(messages = []) {
  return messages
    .slice(-10)
    .map((message) => `${message.role === 'user' ? 'User' : 'Aqaar AI'}: ${String(message.content || '').replace(/\s+/g, ' ').trim()}`)
    .filter(Boolean)
    .join('\n');
}

function shortlistedProperties(explicit = []) {
  const fromMessages = state.messages
    .flatMap((message) => Array.isArray(message.cards) ? message.cards : [])
    .map((card) => card.project || card.project_name || card.property_name)
    .filter(Boolean);
  return [...new Set([...(explicit || []), ...fromMessages])];
}

export function downloadLeadSummary(input = {}) {
  console.log('Generating summary');
  const lead = { ...state.lead, ...input };
  const properties = shortlistedProperties(input.shortlisted_properties || (input.propertyName ? [input.propertyName] : []));
  const timestamp = new Date().toISOString();
  const rows = [
    ['Lead name', safe(lead.name)],
    ['Phone', safe(lead.phone)],
    ['Email', safe(lead.email, 'Not provided')],
    ['Intent', safe(lead.intent || state.intent)],
    ['Budget', safe(lead.budget)],
    ['Location', safe(lead.location)],
    ['Property type', safe(lead.property_type || lead.propertyType)],
    ['Shortlisted properties', properties.length ? properties.join(', ') : 'Not provided'],
    ['Timestamp', timestamp],
  ];
  const conversationSummary = safe(input.conversation_summary || lead.message || textFromMessages(state.messages), 'No conversation summary available');
  const fileName = `aqaar-lead-summary-${slug(lead.name || state.sessionId)}.pdf`;

  try {
    const pdfText = [
      'Aqaar Lead Summary',
      'Generated from Aqaar AI Concierge',
      '',
      ...rows.map(([label, value]) => `${label}: ${value}`),
      '',
      'Conversation Summary:',
      conversationSummary
    ];
    const pdfBytes = createPdf(pdfText);
    console.log('PDF generated');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    console.log('Download started');
    if (typeof anchor.remove === 'function') anchor.remove();
    else if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast({ type: 'success', title: 'Summary downloaded', message: `${fileName} has been generated.`, duration: 3000 });
    return true;
  } catch (error) {
    console.error('Lead summary download failed:', error);
    showToast({
      type: 'error',
      title: 'Download failed',
      message: error?.message || 'Your browser blocked the summary download.',
      duration: 6000
    });
    return false;
  }
}

function createPdf(lines) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const lineHeight = 15;
  const maxChars = 86;
  const wrapped = lines.flatMap((line) => wrapLine(String(line || ''), maxChars));
  const visible = wrapped.slice(0, Math.floor((pageHeight - margin * 2) / lineHeight));
  const contentLines = visible.map((line, index) => {
    const y = pageHeight - margin - (index * lineHeight);
    const fontSize = index === 0 ? 18 : 10;
    return `BT /F1 ${fontSize} Tf ${margin} ${y} Td (${pdfEscape(line)}) Tj ET`;
  }).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${byteLength(contentLines)} >>\nstream\n${contentLines}\nendstream`
  ];
  return encodePdf(objects);
}

function encodePdf(objects) {
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(body);
}

function wrapLine(line, maxChars) {
  if (!line) return [''];
  const words = line.split(/\s+/);
  const out = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) out.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) out.push(current);
  return out;
}

function pdfEscape(value) {
  return String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function byteLength(value) {
  return new TextEncoder().encode(String(value)).length;
}
