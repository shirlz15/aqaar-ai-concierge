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
  const name = property.title || property.property_name || 'Contact Aqaar for details';
  const location = [
    property.summary?.city,
    property.summary?.district,
    property.summary?.community,
  ].filter(v => v && v !== 'unknown').join(', ') || 'Contact Aqaar for details';

  const status = property.summary?.status || property.status || null;
  const unitType = property.summary?.property_type || property.property_type || null;
  const bedrooms = property.summary?.bedrooms || null;
  const price = property.summary?.price_min || property.price || null;
  const developer = property.summary?.developer || null;

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
          ? `AED ${Number(price).toLocaleString()}<span class="property-card-price-label">starting</span>`
          : `<span class="property-card-unknown">Contact Aqaar for details</span>`}
      </div>
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
