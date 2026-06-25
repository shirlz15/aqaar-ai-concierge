/**
 * Aqaar AI Concierge — Lead Detail Drawer Component
 */
import { state } from '../state.js';
import { showToast } from '../toast.js';

let activeDrawer = null;

/**
 * Open lead detail drawer
 * @param {object} lead - lead object from dashboard data
 */
export function openLeadDrawer(lead) {
  if (activeDrawer) closeDrawer();
  if (!lead) return;

  state.selectedLead = lead;

  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.id = 'drawer-overlay';

  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.id = 'lead-drawer';
  drawer.setAttribute('role', 'complementary');
  drawer.setAttribute('aria-label', 'Lead details');

  const contacted = state.contactedLeads.has(lead.id || lead.name);
  const score = lead.score || lead.lead_score;
  const scoreNum = typeof score === 'number' ? score : parseInt(score);
  const scoreTier = !isNaN(scoreNum)
    ? (scoreNum >= 70 ? 'high' : scoreNum >= 40 ? 'medium' : 'low')
    : 'medium';

  drawer.innerHTML = `
    <div class="drawer-header">
      <div>
        <h2 class="drawer-title">${lead.name || 'Unknown Lead'}</h2>
        <span class="lead-score-badge ${scoreTier}">
          Score: ${!isNaN(scoreNum) ? scoreNum : 'Contact Aqaar'}
        </span>
      </div>
      <button class="modal-close" id="drawer-close-btn" aria-label="Close drawer">✕</button>
    </div>
    <div class="drawer-body">
      <div class="drawer-section">
        <div class="drawer-section-title">Contact Information</div>
        ${drawerField('Name', lead.name)}
        ${drawerField('Phone', lead.phone || lead.contact)}
        ${drawerField('Email', lead.email)}
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Qualification</div>
        ${drawerField('Intent', lead.intent, true)}
        ${drawerField('Budget', lead.budget)}
        ${drawerField('Property Interest', lead.property_name || lead.property)}
        ${drawerField('Message', lead.message || lead.notes)}
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Lead Metrics</div>
        ${drawerField('Lead Score', !isNaN(scoreNum) ? `${scoreNum}/100` : 'Contact Aqaar')}
        ${drawerField('Quality Tier', scoreTier.charAt(0).toUpperCase() + scoreTier.slice(1))}
        ${drawerField('Date', lead.date || lead.created_at || lead.timestamp || 'Contact Aqaar for details')}
        ${drawerField('Session ID', lead.session_id || 'N/A')}
      </div>

      <div class="contacted-toggle">
        <div>
          <div style="font-size:14px;font-weight:600;">Marked as Contacted</div>
          <div style="font-size:12px;color:var(--text-muted);">Toggle when sales rep has reached out</div>
        </div>
        <label class="toggle-switch" aria-label="Mark as contacted">
          <input type="checkbox" id="contacted-toggle" ${contacted ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div style="margin-top:20px;display:flex;gap:10px;">
        <button class="btn btn-primary btn-sm" id="drawer-dl-btn" style="flex:1">⬇ Download Lead</button>
        <button class="btn btn-outline btn-sm" id="drawer-chat-btn" style="flex:1">💬 Chat Context</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  activeDrawer = { overlay, drawer };

  // Close
  overlay.addEventListener('click', closeDrawer);
  document.getElementById('drawer-close-btn')?.addEventListener('click', closeDrawer);
  const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
  document.addEventListener('keydown', onKey);
  overlay._removeKey = () => document.removeEventListener('keydown', onKey);

  // Toggle contacted
  document.getElementById('contacted-toggle')?.addEventListener('change', (e) => {
    const id = lead.id || lead.name;
    if (e.target.checked) {
      state.contactedLeads.add(id);
      showToast({ type: 'success', title: 'Marked as Contacted', message: `${lead.name} has been flagged as contacted.`, duration: 3000 });
    } else {
      state.contactedLeads.delete(id);
    }
  });

  // Download lead
  document.getElementById('drawer-dl-btn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(lead, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aqaar-lead-${(lead.name || 'lead').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Downloaded', message: 'Lead data saved.', duration: 2500 });
  });

  // Chat context
  document.getElementById('drawer-chat-btn')?.addEventListener('click', () => {
    closeDrawer();
    window.location.hash = `/concierge?query=${encodeURIComponent(`I'm following up on ${lead.name}'s enquiry`)}`;
  });
}

function drawerField(label, value, isIntent = false) {
  const display = (!value || value === 'unknown') ? 'Contact Aqaar for details' : value;
  const isCapitalized = isIntent && display !== 'Contact Aqaar for details';
  return `
    <div class="drawer-field">
      <div class="drawer-field-label">${label}</div>
      <div class="drawer-field-value" style="${isCapitalized ? 'text-transform:capitalize;' : ''}">${display}</div>
    </div>
  `;
}

export function closeDrawer() {
  if (!activeDrawer) return;
  if (activeDrawer.overlay._removeKey) activeDrawer.overlay._removeKey();
  activeDrawer.drawer.style.animation = 'drawer-in 0.3s cubic-bezier(0.4,0,0.2,1) reverse forwards';
  activeDrawer.overlay.style.animation = 'overlay-in 0.2s ease reverse forwards';
  activeDrawer.drawer.addEventListener('animationend', () => {
    activeDrawer?.drawer?.remove();
    activeDrawer?.overlay?.remove();
    activeDrawer = null;
  }, { once: true });
}
