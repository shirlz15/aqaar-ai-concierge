/**
 * Aqaar AI Concierge — Enquiry Modal Component
 */
import { qualify, leadScore } from '../api.js';
import { showToast } from '../toast.js';
import { state } from '../state.js';
import { downloadLeadSummary } from '../summaryDownload.js';

let activeModal = null;

/**
 * Open the enquiry modal
 * @param {object} property - optional property context
 * @param {string} propertyName - display name of selected property
 */
export function openEnquiryModal(property = null, propertyName = '') {
  if (activeModal) closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'enquiry-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Enquiry form');

  overlay.innerHTML = `
    <div class="modal" id="enquiry-modal">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">Enquire Now</h2>
          <p class="modal-subtitle">
            ${propertyName
              ? `Enquiring about <strong>${propertyName}</strong>`
              : 'Our Aqaar consultant will contact you shortly'}
          </p>
        </div>
        <button class="modal-close" id="modal-close-btn" aria-label="Close modal">✕</button>
      </div>
      <div class="modal-body">
        <form class="modal-form" id="enquiry-form" novalidate>
          <div class="modal-form-grid">
            <div class="form-group">
              <label class="form-label" for="eq-name">Full Name *</label>
              <input class="form-input" id="eq-name" type="text" placeholder="Your name" value="${state.lead.name}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="eq-phone">Phone *</label>
              <input class="form-input" id="eq-phone" type="tel" placeholder="+971 50 000 0000" value="${state.lead.phone}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="eq-email">Email</label>
              <input class="form-input" id="eq-email" type="email" placeholder="you@email.com" value="${state.lead.email}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="eq-intent">I am looking to</label>
              <select class="form-input" id="eq-intent">
                <option value="buy" ${state.intent === 'buy' ? 'selected' : ''}>Buy</option>
                <option value="rent" ${state.intent === 'rent' ? 'selected' : ''}>Rent</option>
                <option value="invest" ${state.intent === 'invest' ? 'selected' : ''}>Invest</option>
                <option value="commercial" ${state.intent === 'commercial' ? 'selected' : ''}>Commercial</option>
              </select>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="eq-budget">Budget (AED)</label>
              <input class="form-input" id="eq-budget" type="text" placeholder="e.g. 1,200,000 or Contact Aqaar for details" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="eq-message">Message</label>
              <textarea class="form-input" id="eq-message" rows="3" placeholder="Tell us what you're looking for...">${property ? `Interested in ${propertyName}` : ''}</textarea>
            </div>
          </div>
          <div id="eq-error" style="color:var(--error);font-size:13px;display:none;"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="eq-submit-btn">
              Send Enquiry ✉️
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  activeModal = overlay;

  // Trap focus
  const firstInput = overlay.querySelector('input');
  firstInput?.focus();

  // Close handlers
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);

  // Escape key
  const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', onKey);
  overlay._removeKey = () => document.removeEventListener('keydown', onKey);

  // Form submit
  document.getElementById('enquiry-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSubmit(property, propertyName);
  });
}

async function handleSubmit(property, propertyName) {
  const name = document.getElementById('eq-name')?.value.trim();
  const phone = document.getElementById('eq-phone')?.value.trim();
  const email = document.getElementById('eq-email')?.value.trim();
  const intent = document.getElementById('eq-intent')?.value;
  const budget = document.getElementById('eq-budget')?.value.trim();
  const message = document.getElementById('eq-message')?.value.trim();

  const errorEl = document.getElementById('eq-error');
  const submitBtn = document.getElementById('eq-submit-btn');

  if (!name || !phone) {
    if (errorEl) { errorEl.textContent = 'Please enter your name and phone number.'; errorEl.style.display = 'block'; }
    return;
  }
  if (errorEl) errorEl.style.display = 'none';

  // Update state
  state.lead = { name, phone, email, intent, budget, message };
  state.leadCaptured = true;

  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

  try {
    const leadData = {
      name, phone, email, intent, budget,
      message: message || (propertyName ? `Enquiry about ${propertyName}` : ''),
      property_id: property?.entity_id || 'unknown',
      property_name: propertyName || 'unknown',
    };

    const [qualResult, scoreResult] = await Promise.allSettled([
      qualify(leadData),
      leadScore(leadData),
    ]);

    const score = scoreResult.status === 'fulfilled' ? scoreResult.value?.score : 'unknown';

    closeModal();
    showToast({
      type: 'success',
      title: 'Enquiry Submitted!',
      message: `Thank you ${name}! Our Aqaar consultant will contact you at ${phone} shortly.`,
      duration: 6000,
    });

    // Show lead summary
    showLeadSummary({ name, phone, email, intent, budget, propertyName, score });

  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Submission failed. Please try again or call Aqaar directly.';
      errorEl.style.display = 'block';
    }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Enquiry ✉️'; }
    console.error('Enquiry submit error:', err);
  }
}

function showLeadSummary({ name, phone, email, intent, budget, propertyName, score }) {
  const content = document.getElementById('page-content');
  if (!content) return;

  const scoreNum = typeof score === 'number' ? score : null;
  const scoreLabel = scoreNum !== null ? (scoreNum >= 70 ? 'High' : scoreNum >= 40 ? 'Medium' : 'Low') : 'Contact Aqaar';

  const summary = document.createElement('div');
  summary.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:1800;width:360px;';
  summary.innerHTML = `
    <div class="lead-summary" style="text-align:left;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="font-size:32px;">✅</div>
        <div>
          <h3 style="font-size:15px;font-weight:700;color:var(--accent);">Lead Captured</h3>
          <p style="font-size:12px;color:var(--text-muted);margin:0;">Your consultant will call within 24h</p>
        </div>
      </div>
      <div class="lead-summary-details" style="grid-template-columns:1fr 1fr;">
        <div class="lead-detail-item">
          <div class="lead-detail-label">Name</div>
          <div class="lead-detail-value">${name}</div>
        </div>
        <div class="lead-detail-item">
          <div class="lead-detail-label">Phone</div>
          <div class="lead-detail-value">${phone}</div>
        </div>
        <div class="lead-detail-item">
          <div class="lead-detail-label">Intent</div>
          <div class="lead-detail-value" style="text-transform:capitalize;">${intent}</div>
        </div>
        <div class="lead-detail-item">
          <div class="lead-detail-label">Lead Score</div>
          <div class="lead-detail-value">${scoreLabel}</div>
        </div>
        ${propertyName ? `
        <div class="lead-detail-item" style="grid-column:1/-1">
          <div class="lead-detail-label">Property</div>
          <div class="lead-detail-value">${propertyName}</div>
        </div>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-primary btn-sm" id="dl-summary-btn" style="flex:1">⬇ Download Summary</button>
        <button class="btn btn-ghost btn-sm" id="close-summary-btn">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(summary);

  // Download
  document.getElementById('dl-summary-btn')?.addEventListener('click', () => {
    downloadLeadSummary({ name, phone, email, intent, budget, propertyName, score });
  });

  document.getElementById('close-summary-btn')?.addEventListener('click', () => summary.remove());
  setTimeout(() => summary.remove(), 15000);
}

export function closeModal() {
  if (!activeModal) return;
  if (activeModal._removeKey) activeModal._removeKey();
  activeModal.style.animation = 'overlay-in 0.2s ease reverse forwards';
  activeModal.addEventListener('animationend', () => { activeModal?.remove(); activeModal = null; }, { once: true });
}
