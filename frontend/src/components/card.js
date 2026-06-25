/**
 * Aqaar AI Concierge — Property Card Component
 */

const PROPERTY_ICONS = ['🏢', '🏗️', '🌆', '🏙️', '🏛️', '🏬'];
const GRADIENT_STYLES = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1a2535 100%)',
  'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f1f0f 100%)',
  'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
];

/**
 * Render a single property card
 * @param {object} property - Property data from /recommend or /search
 * @param {number} index - Card index for visual variety
 * @param {function} onEnquire - Callback when Enquire is clicked
 */
export function renderPropertyCard(property, index = 0, onEnquire) {
  const project = property.project || property;
  const unit = Array.isArray(property.units) ? property.units.find(u => u && Object.values(u).some(v => v && v !== 'unknown')) : null;
  const summary = property.summary || {};
  const source = property.source || project.source || unit?.source || {};

  const name = project.project_name || project.property_name || property.title || 'Contact Aqaar for details';
  const location = [
    project.city || summary.city,
    project.district || summary.district,
    project.community || summary.community,
  ].filter(v => v && v !== 'unknown').join(', ') || 'Contact Aqaar for details';

  const status = project.status || summary.status || property.status || null;
  const unitType = unit?.unit_type || project.sub_type || project.property_type || summary.property_type || property.property_type || null;
  const bedrooms = unit?.bedrooms_min || summary.bedrooms || null;
  const price = unit?.price_min || summary.price_min || property.price || null;
  const currency = unit?.currency && unit.currency !== 'unknown' ? unit.currency : 'AED';
  const developer = project.developer || summary.developer || null;
  const sourceUrl = source.source_url || project.source_url || unit?.source?.source_url || property.source_url || null;

  const icon = PROPERTY_ICONS[index % PROPERTY_ICONS.length];
  const gradient = GRADIENT_STYLES[index % GRADIENT_STYLES.length];

  const card = document.createElement('div');
  card.className = 'property-card';
  card.setAttribute('role', 'article');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Property: ${name}`);

  card.innerHTML = `
    <div class="property-card-image" style="background: ${gradient}">
      <div class="property-card-image-icon" aria-hidden="true">${icon}</div>
      ${status && status !== 'unknown'
        ? `<span class="property-card-badge">${status}</span>`
        : ''}
    </div>
    <div class="property-card-body">
      <h3 class="property-card-name">${name}</h3>
      <p class="property-card-location">📍 ${location}</p>
      <div class="property-card-details">
        ${unitType && unitType !== 'unknown' ? `<span class="property-card-detail">🏠 ${unitType}</span>` : ''}
        ${bedrooms && bedrooms !== 'unknown' ? `<span class="property-card-detail">🛏 ${bedrooms} Bed</span>` : ''}
        ${developer && developer !== 'unknown' ? `<span class="property-card-detail">🏗 ${developer}</span>` : ''}
      </div>
      <div class="property-card-price">
        ${price && price !== 'unknown'
          ? `${currency} ${Number(price).toLocaleString()}<span class="property-card-price-label">published</span>`
          : `<span class="property-card-unknown">Contact Aqaar for details</span>`}
      </div>
      ${sourceUrl && sourceUrl !== 'unknown' ? `<p class="property-card-source">Source: ${sourceUrl}</p>` : ''}
      <div class="property-card-footer">
        <button class="btn btn-primary btn-sm enquire-btn" id="enquire-${index}" aria-label="Enquire about ${name}">
          Enquire Now
        </button>
        <button class="btn btn-outline btn-sm chat-btn" aria-label="Ask AI about ${name}">
          Ask AI 🤖
        </button>
      </div>
    </div>
  `;

  card.querySelector('.enquire-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onEnquire) onEnquire(property, name);
  });

  card.querySelector('.chat-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.hash = `/concierge?query=${encodeURIComponent(`Tell me about ${name}`)}`;
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (onEnquire) onEnquire(property, name);
    }
  });

  return card;
}
