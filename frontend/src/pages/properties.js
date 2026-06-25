/**
 * Aqaar AI Concierge — Properties Page (Page 4)
 */
import { search, recommend } from '../api.js';
import { renderPropertyCard } from '../components/card.js';
import { openEnquiryModal } from '../components/modal.js';
import { state, setIntent } from '../state.js';

export async function renderProperties() {
  const content = document.getElementById('page-content');
  if (!content) return;

  content.innerHTML = `
    <div class="properties-page" style="min-height:100vh;padding-top:var(--nav-height);">
      <div class="container" style="padding: 48px 24px;">
        <div class="section-header" style="text-align:left;margin-bottom:32px;">
          <h1 class="section-title" style="margin-bottom:8px;">Aqaar Properties</h1>
          <p class="section-subtitle" style="margin:0;">Explore verified property listings from Aqaar's database.</p>
        </div>

        <div class="properties-filters" style="display:flex;gap:12px;margin-bottom:32px;flex-wrap:wrap;">
          <div class="search-box" style="flex:1;min-width:280px;position:relative;">
            <input type="text" id="prop-search-input" class="form-input" placeholder="Search projects, locations, or types..." />
            <button id="prop-search-btn" class="btn btn-primary" style="position:absolute;right:4px;top:4px;bottom:4px;padding:0 16px;">Search</button>
          </div>
          <select class="form-input" id="prop-intent-select" style="width:160px;">
            <option value="all">All Intents</option>
            <option value="buy" ${state.intent === 'buy' ? 'selected' : ''}>Buy</option>
            <option value="rent" ${state.intent === 'rent' ? 'selected' : ''}>Rent</option>
            <option value="invest" ${state.intent === 'invest' ? 'selected' : ''}>Invest</option>
            <option value="commercial" ${state.intent === 'commercial' ? 'selected' : ''}>Commercial</option>
          </select>
        </div>

        <div class="properties-grid" id="all-properties-grid" role="list">
          <div class="spinner-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;

  // Bind Events
  const searchInput = document.getElementById('prop-search-input');
  const searchBtn = document.getElementById('prop-search-btn');
  const intentSelect = document.getElementById('prop-intent-select');

  const doSearch = () => {
    const q = searchInput?.value.trim();
    const intent = intentSelect?.value;
    if (intent !== 'all') setIntent(intent);
    loadProperties(q, intent);
  };

  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
  intentSelect?.addEventListener('change', doSearch);

  // Initial load
  loadProperties('', state.intent || 'all');
}

async function loadProperties(query, intent) {
  const grid = document.getElementById('all-properties-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="spinner-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    let results = [];
    if (query) {
      const data = await search({ query, limit: 12 });
      results = data?.results || [];
    } else {
      const targetIntent = intent === 'all' ? 'buy' : intent;
      const data = await recommend({ intent: targetIntent, limit: 12 });
      results = data?.recommendations || [];
    }

    if (!results.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🏢</div>
          <h3>No properties matched your search</h3>
          <p>Try different keywords or intent filters.</p>
        </div>`;
      return;
    }

    grid.innerHTML = '';
    results.forEach((prop, i) => {
      const card = renderPropertyCard(prop, i, (p, name) => openEnquiryModal(p, name));
      card.setAttribute('role', 'listitem');
      grid.appendChild(card);
    });

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚠️</div>
        <h3>Could not load properties</h3>
        <p>Make sure the backend server is running.</p>
      </div>`;
    console.error('Properties error:', err);
  }
}
