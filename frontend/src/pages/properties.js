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
            <input type="text" id="prop-search-input" class="form-input" placeholder="Search: aj, mawjan, dusit, 2 bedroom..." />
            <button id="prop-search-btn" class="btn btn-primary" style="position:absolute;right:4px;top:4px;bottom:4px;padding:0 16px;">Search</button>
            <div id="prop-search-suggestions" class="search-suggestions" style="display:none;"></div>
          </div>
          <select class="form-input" id="prop-intent-select" style="width:160px;">
            <option value="all">All Intents</option>
            <option value="buy" ${state.intent === 'buy' ? 'selected' : ''}>Buy</option>
            <option value="rent" ${state.intent === 'rent' ? 'selected' : ''}>Rent</option>
            <option value="invest" ${state.intent === 'invest' ? 'selected' : ''}>Invest</option>
            <option value="commercial" ${state.intent === 'commercial' ? 'selected' : ''}>Commercial</option>
          </select>
        </div>
        <div class="search-helper-row" style="display:flex;gap:8px;flex-wrap:wrap;margin:-18px 0 28px;">
          <span style="color:var(--text-muted);font-size:13px;">Try:</span>
          ${['aj', 'mawjan', 'dusit', '2 bedroom'].map(q => `<button class="helper-chip" data-query="${q}">${q}</button>`).join('')}
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
  document.querySelectorAll('.helper-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (searchInput) searchInput.value = btn.dataset.query;
      doSearch();
    });
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
  searchInput?.addEventListener('input', debounce(() => updateSuggestions(searchInput.value), 180));
  intentSelect?.addEventListener('change', doSearch);

  // Initial load
  loadProperties('', state.intent || 'all');
}

async function updateSuggestions(query) {
  const box = document.getElementById('prop-search-suggestions');
  if (!box) return;
  const q = query?.trim();
  if (!q || q.length < 2) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  try {
    const data = await search({ query: q, limit: 8 });
    const suggestions = [];
    for (const result of data?.results || []) {
      const p = result.project || result.summary || {};
      addSuggestion(suggestions, result.title, 'Project');
      addSuggestion(suggestions, p.community, 'Community');
      addSuggestion(suggestions, p.district, 'Location');
      addSuggestion(suggestions, p.city, 'Location');
      addSuggestion(suggestions, p.sub_type || p.property_type, 'Unit type');
      if (Array.isArray(p.units)) p.units.forEach(unit => addSuggestion(suggestions, unit.unit_type, 'Unit type'));
    }
    if (!suggestions.length) {
      box.style.display = 'none';
      return;
    }
    box.innerHTML = suggestions.slice(0, 8).map(item => `
      <button class="search-suggestion" data-query="${escapeAttr(item.value)}">
        <strong>${escapeHtml(item.value)}</strong><span>${item.type}</span>
      </button>
    `).join('');
    box.style.display = 'grid';
    box.querySelectorAll('.search-suggestion').forEach(button => {
      button.addEventListener('click', () => {
        const input = document.getElementById('prop-search-input');
        if (input) input.value = button.dataset.query;
        box.style.display = 'none';
        loadProperties(button.dataset.query, document.getElementById('prop-intent-select')?.value);
      });
    });
  } catch (error) {
    box.style.display = 'none';
  }
}

function addSuggestion(list, value, type) {
  if (!value || value === 'unknown') return;
  const text = String(value).trim();
  if (!text || /^https?:\/\//i.test(text)) return;
  if (!list.some(item => item.value.toLowerCase() === text.toLowerCase())) list.push({ value: text, type });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

const INTENT_QUERY = {
  buy: 'Buy Property',
  rent: 'Rent Property',
  invest: 'Investment',
  commercial: 'Commercial',
};

async function loadProperties(query, intent) {
  const grid = document.getElementById('all-properties-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="spinner-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    let results = [];
    if (query) {
      const data = await search({ query, limit: 12 });
      results = data?.results || [];
      if (!results.length || query.length <= 2) {
        const fallback = await recommend({ limit: 50 });
        const needle = query.toLowerCase();
        results = (fallback?.recommendations || [])
          .filter(item => JSON.stringify(item).toLowerCase().includes(needle))
          .slice(0, 12);
      }
    } else {
      const targetIntent = intent === 'all' ? 'buy' : intent;
      const data = await recommend({ intent: INTENT_QUERY[targetIntent] || targetIntent, limit: 12 });
      results = data?.recommendations || [];
      if (!results.length) {
        const fallback = await recommend({ limit: 12 });
        results = fallback?.recommendations || [];
      }
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
