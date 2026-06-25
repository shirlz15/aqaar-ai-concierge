/**
 * Aqaar AI Concierge - Property Card Component
 */

const GRADIENT_STYLES = [
  'linear-gradient(135deg, #111 0%, #242424 55%, #343d17 100%)',
  'linear-gradient(135deg, #0d1117 0%, #1f2933 60%, #b7d11d 160%)',
  'linear-gradient(135deg, #050505 0%, #1a1a1a 60%, #3b3b3b 100%)',
];

function isKnown(value) {
  return value !== undefined && value !== null && value !== '' && value !== 'unknown';
}

const NOT_PUBLISHED = 'Not published by Aqaar';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(value, currency = 'AED') {
  if (!isKnown(value) || Number.isNaN(Number(value))) return NOT_PUBLISHED;
  return `${currency || 'AED'} ${Number(value).toLocaleString()}`;
}

function firstKnown(...values) {
  return values.find(isKnown) || null;
}

/**
 * Render a single property card.
 * @param {object} property - Property data from /recommend or /search
 * @param {number} index - Card index for visual variety
 * @param {function} onEnquire - Callback when Enquire is clicked
 */
export function renderPropertyCard(property, index = 0, onEnquire) {
  const project = property.project || property;
  const units = Array.isArray(property.units) ? property.units : (Array.isArray(project.units) ? project.units : []);
  const unit = units.find(item => item && Object.values(item).some(value => isKnown(value))) || {};
  const summary = property.summary || {};
  const source = property.source || project.source || unit?.source || {};

  const name = firstKnown(project.project_name, project.property_name, property.title) || NOT_PUBLISHED;
  const location = cleanLocation([
    firstKnown(project.community, summary.community),
    firstKnown(project.district, summary.district),
    firstKnown(project.city, summary.city),
  ]);
  const status = firstKnown(project.status, summary.status, property.status);
  const unitTypes = cleanList([
    ...units.map(item => item.unit_type),
    project.sub_type,
    project.property_type,
    summary.sub_type,
    summary.property_type,
    property.property_type,
  ]);
  const bedrooms = firstKnown(project.bedrooms, summary.bedrooms, unit.bedrooms_min);
  const area = isKnown(unit.area_min_sqft) ? `${Number(unit.area_min_sqft).toLocaleString()} sqft` : firstKnown(summary.area, project.area);
  const currency = firstKnown(unit.currency, project.currency, 'AED');
  const price = firstKnown(unit.price_min, summary.price_min, project.price_min, property.price);
  const description = firstKnown(project.description, summary.description);
  const paymentPlan = firstKnown(unit.payment_plan, project.payment_plan, summary.payment_plan);
  const completion = firstKnown(project.completion, summary.completion);
  const amenities = Array.isArray(project.amenities) ? project.amenities : (Array.isArray(summary.amenities) ? summary.amenities : []);
  const image = Array.isArray(project.images) ? project.images.find(isKnown) : null;
  const brochure = firstKnown(project.brochure, summary.brochure);
  const cleanBrochure = isAssetLink(brochure) ? brochure : null;
  const mediaStyle = image
    ? `background-image: linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.62)), url('${esc(image)}'); background-size: cover; background-position: center;`
    : `background: ${GRADIENT_STYLES[index % GRADIENT_STYLES.length]}`;

  const card = document.createElement('div');
  card.className = 'property-card';
  card.setAttribute('role', 'article');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Property: ${name}`);

  card.innerHTML = `
    <div class="property-card-image" style="${mediaStyle}">
      ${status ? `<span class="property-card-badge">${esc(status)}</span>` : ''}
    </div>
    <div class="property-card-body">
      <h3 class="property-card-name">${esc(name)}</h3>
      <p class="property-card-location">${esc(location)}</p>
      ${description ? `<p class="property-card-source">${esc(description.slice(0, 180))}${description.length > 180 ? '...' : ''}</p>` : ''}
      <div class="property-card-details">
        <span class="property-card-detail">Unit types ${esc(unitTypes || NOT_PUBLISHED)}</span>
        <span class="property-card-detail">Bedrooms ${esc(bedrooms || NOT_PUBLISHED)}</span>
        <span class="property-card-detail">Area ${esc(area || NOT_PUBLISHED)}</span>
        <span class="property-card-detail">Completion ${esc(completion || NOT_PUBLISHED)}</span>
      </div>
      <div class="property-card-price">
        ${fmtMoney(price, currency)}<span class="property-card-price-label">published KB value</span>
      </div>
      <p class="property-card-source">Payment plan: ${paymentPlan ? esc(paymentPlan) : NOT_PUBLISHED}</p>
      <p class="property-card-source">Amenities: ${amenities.length ? esc(amenities.slice(0, 5).join(', ')) : NOT_PUBLISHED}</p>
      <div class="property-card-footer">
        ${cleanBrochure ? `<button class="btn btn-primary btn-sm brochure-btn" aria-label="Open brochure for ${esc(name)}">Brochure</button>` : `<span class="btn btn-ghost btn-sm" aria-disabled="true">${NOT_PUBLISHED}</span>`}
        <button class="btn btn-outline btn-sm chat-btn" aria-label="Ask AI about ${esc(name)}">
          Ask AI
        </button>
      </div>
    </div>
  `;

  card.querySelector('.brochure-btn')?.addEventListener('click', (event) => {
    event.stopPropagation();
    window.open(cleanBrochure, '_blank', 'noopener');
  });

  card.querySelector('.chat-btn')?.addEventListener('click', (event) => {
    event.stopPropagation();
    window.location.hash = `/concierge?query=${encodeURIComponent(`Tell me about ${name}`)}`;
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (onEnquire) onEnquire(property, name);
    }
  });

  return card;
}

function cleanLocation(parts) {
  const normalized = [];
  for (const part of parts) {
    if (!isKnown(part)) continue;
    const value = String(part).trim();
    if (!normalized.some(existing => existing.toLowerCase() === value.toLowerCase())) normalized.push(value);
  }
  return normalized.join(', ') || NOT_PUBLISHED;
}

function cleanList(values) {
  const list = [];
  for (const value of values) {
    if (!isKnown(value)) continue;
    const text = String(value).trim();
    if (!list.some(existing => existing.toLowerCase() === text.toLowerCase())) list.push(text);
  }
  return list.slice(0, 5).join(', ');
}

function isAssetLink(value) {
  return isKnown(value) && !/^https?:\/\//i.test(String(value));
}
