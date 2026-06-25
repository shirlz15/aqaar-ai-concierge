/**
 * Aqaar AI Concierge — Landing Page (Page 1)
 */
import { search, getDashboard } from '../api.js';
import { renderPropertyCard } from '../components/card.js';
import { openEnquiryModal } from '../components/modal.js';
import { showToast } from '../toast.js';
import { navigate } from '../router.js';
import { state, setIntent } from '../state.js';

const INTENT_CONFIGS = {
  buy: {
    label: 'Buy',
    icon: '🏠',
    headline: 'Find Your Dream Property in Ajman',
    desc: 'Explore freehold apartments, villas, and townhouses across Ajman with transparent pricing and AI-powered guidance.',
    cta: 'Browse Properties for Sale',
    query: 'apartments for sale Ajman',
  },
  rent: {
    label: 'Rent',
    icon: '🔑',
    headline: 'Discover Premium Rentals in Ajman',
    desc: 'Studio to 4-bedroom units with flexible lease terms. Powered by verified Aqaar data.',
    cta: 'Find Rental Properties',
    query: 'apartments for rent Ajman',
  },
  invest: {
    label: 'Invest',
    icon: '📈',
    headline: 'High-Yield Investment Opportunities',
    desc: 'Invest in Ajman\'s growing real estate market with Aqaar\'s curated off-plan and handover-ready projects.',
    cta: 'Explore Investment Projects',
    query: 'investment properties Ajman',
  },
  commercial: {
    label: 'Commercial',
    icon: '🏢',
    headline: 'Commercial Spaces for Your Business',
    desc: 'Office suites, retail outlets, and commercial floors in strategic Ajman locations.',
    cta: 'Find Commercial Units',
    query: 'commercial units Ajman',
  },
};

export async function renderLanding() {
  const content = document.getElementById('page-content');
  if (!content) return;

  const cfg = INTENT_CONFIGS[state.intent] || INTENT_CONFIGS.buy;

  content.innerHTML = `
    <!-- ══ HERO ══════════════════════════════════════════════ -->
    <section class="hero" id="hero-section" aria-label="Hero section">
      <div class="hero-bg">
        <div class="hero-glow"></div>
        <div class="hero-particles" id="hero-particles" aria-hidden="true"></div>
        <svg class="hero-skyline" viewBox="0 0 1440 500" preserveAspectRatio="none" aria-hidden="true" role="img">
          <!-- Animated Ajman / Aqaar skyline silhouette -->
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#c8e63c" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#c8e63c" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Tower 1 (centre) -->
          <rect x="680" y="60" width="80" height="440" fill="url(#skyGrad)"/>
          <rect x="700" y="20" width="40" height="50" fill="url(#skyGrad)"/>
          <rect x="714" y="0" width="12" height="28" fill="#c8e63c" opacity="0.8"/>
          <!-- Tower 2 left -->
          <rect x="440" y="120" width="60" height="380" fill="url(#skyGrad)"/>
          <rect x="455" y="90" width="30" height="38" fill="url(#skyGrad)"/>
          <!-- Tower 3 far left -->
          <rect x="200" y="180" width="70" height="320" fill="url(#skyGrad)"/>
          <rect x="218" y="150" width="34" height="38" fill="url(#skyGrad)"/>
          <!-- Tower 4 right -->
          <rect x="900" y="100" width="65" height="400" fill="url(#skyGrad)"/>
          <rect x="916" y="68" width="32" height="40" fill="url(#skyGrad)"/>
          <!-- Tower 5 far right -->
          <rect x="1140" y="200" width="55" height="300" fill="url(#skyGrad)"/>
          <!-- Low buildings -->
          <rect x="0" y="350" width="200" height="150" fill="url(#skyGrad)"/>
          <rect x="320" y="370" width="120" height="130" fill="url(#skyGrad)"/>
          <rect x="560" y="380" width="120" height="120" fill="url(#skyGrad)"/>
          <rect x="760" y="360" width="140" height="140" fill="url(#skyGrad)"/>
          <rect x="1000" y="370" width="140" height="130" fill="url(#skyGrad)"/>
          <rect x="1200" y="360" width="240" height="140" fill="url(#skyGrad)"/>
          <!-- Windows / Lights (animated via CSS) -->
          <g class="skyline-windows" opacity="0.5">
            ${Array.from({length:30}, () =>
              `<rect x="${Math.floor(Math.random()*1400)}" y="${Math.floor(Math.random()*400+50)}" width="6" height="8" fill="#c8e63c" opacity="${(Math.random()*0.5+0.2).toFixed(2)}"/>`
            ).join('')}
          </g>
        </svg>
      </div>

      <div class="hero-content">
        <div class="hero-inner">
          <div class="hero-left" id="hero-left">
            <div class="hero-tag">
              <span class="hero-tag-dot"></span>
              Aqaar AI Concierge • Live
            </div>
            <h1 class="hero-title" id="hero-title">
              ${cfg.headline.replace(/Ajman/g, '<span>Ajman</span>')}
            </h1>
            <p class="hero-subtitle" id="hero-subtitle">${cfg.desc}</p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-xl" id="hero-cta" aria-label="${cfg.cta}">
                🤖 ${cfg.cta}
              </button>
              <button class="btn btn-outline btn-xl" id="hero-enquire" aria-label="Make an enquiry">
                ✉️ Enquire Now
              </button>
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <div class="hero-stat-number" id="hero-project-count">Loading</div>
                <div class="hero-stat-label">KB Projects</div>
              </div>
              <div class="hero-stat">
                <div class="hero-stat-number">24/7</div>
                <div class="hero-stat-label">AI Concierge</div>
              </div>
              <div class="hero-stat">
                <div class="hero-stat-number">100%</div>
                <div class="hero-stat-label">Verified Data</div>
              </div>
            </div>
          </div>

          <div class="hero-visual" aria-hidden="true">
            <div class="concierge-bubble-hero">
              <div class="bubble-rings">
                <div class="bubble-ring"></div>
                <div class="bubble-ring"></div>
                <div class="bubble-ring"></div>
              </div>
              <div class="concierge-avatar-icon">🤖</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ INTENT TABS ══════════════════════════════════════ -->
    <div class="intent-bar" id="intent-bar" role="tablist" aria-label="Property intent filter">
      <div class="intent-bar-inner">
        ${Object.entries(INTENT_CONFIGS).map(([key, cfg]) => `
          <button
            class="intent-tab ${state.intent === key ? 'active' : ''}"
            data-intent="${key}"
            role="tab"
            aria-selected="${state.intent === key}"
            id="intent-tab-${key}"
          >
            <span class="intent-tab-icon" aria-hidden="true">${cfg.icon}</span>
            ${cfg.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- ══ FEATURED PROPERTIES ══════════════════════════════ -->
    <section class="section" id="properties-section" aria-label="Featured properties">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">✦ Verified Properties</div>
          <h2 class="section-title" id="props-title">${cfg.cta}</h2>
          <p class="section-subtitle" id="props-subtitle">
            All properties sourced directly from Aqaar's verified knowledge base. Data accuracy guaranteed.
          </p>
        </div>
        <div class="properties-grid" id="properties-grid" role="list" aria-label="Property listings">
          <div class="spinner-overlay"><div class="spinner"></div></div>
        </div>
        <div style="text-align:center;margin-top:36px;">
          <button class="btn btn-outline btn-lg" id="view-all-btn" aria-label="View all properties">
            View All Properties →
          </button>
        </div>
      </div>
    </section>

    <!-- ══ HOW IT WORKS ═════════════════════════════════════ -->
    <section class="section" style="background:var(--bg-section);" aria-label="How Aqaar AI Concierge works">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">✦ The Process</div>
          <h2 class="section-title">How Your AI Concierge Works</h2>
          <p class="section-subtitle">Three steps to your perfect Ajman property</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;" class="how-grid">
          ${[
            { icon: '💬', step: '01', title: 'Chat with AI', desc: 'Tell our concierge your requirements — budget, location, bedrooms, and timeline.' },
            { icon: '🔍', step: '02', title: 'Smart Matching', desc: 'Our AI searches Aqaar\'s verified database to find properties matching your exact criteria.' },
            { icon: '🤝', step: '03', title: 'Expert Handoff', desc: 'A dedicated Aqaar consultant contacts you to schedule viewings and finalize your decision.' },
          ].map(s => `
            <div class="kpi-card" style="text-align:center;padding:32px;">
              <div style="font-size:40px;margin-bottom:12px;">${s.icon}</div>
              <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.15em;margin-bottom:8px;">STEP ${s.step}</div>
              <h3 style="font-size:18px;font-weight:700;margin-bottom:10px;">${s.title}</h3>
              <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">${s.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- ══ SUBSCRIBE STRIP ══════════════════════════════════ -->
    <div class="subscribe-strip" id="subscribe-strip">
      <div class="subscribe-inner">
        <div class="subscribe-text">
          <h3>Stay Ahead of the Market</h3>
          <p>Get verified property launches and market updates directly from Aqaar.</p>
        </div>
        <form class="subscribe-form" id="subscribe-form" novalidate>
          <input
            class="subscribe-input"
            id="subscribe-email"
            type="email"
            placeholder="Enter your email"
            aria-label="Email address for newsletter"
            required
          />
          <button type="submit" class="btn btn-primary" id="subscribe-btn">Subscribe</button>
        </form>
      </div>
    </div>

    <!-- ══ FOOTER ════════════════════════════════════════════ -->
    <footer class="footer" role="contentinfo">
      <div class="footer-inner">
        <div class="footer-top">
          <div>
            <div class="footer-brand-logo">
              <div class="navbar-logo-icon" style="width:32px;height:32px;" aria-hidden="true"></div>
              <div class="navbar-logo-text">
                <span class="navbar-logo-name" style="font-size:18px;">AQAAR</span>
                <span class="navbar-logo-sub">AI Concierge</span>
              </div>
            </div>
            <p class="footer-brand-desc">
              Aqaar drives excellence in Ajman's real estate sector, advancing with competence and innovation.
              1st Floor, Grand Mall — Sheikh Khalifa Bin Zayed St, Ajman, UAE.
            </p>
            <div class="footer-socials">
              <a href="#" class="footer-social" aria-label="LinkedIn">in</a>
              <a href="#" class="footer-social" aria-label="Twitter/X">𝕏</a>
              <a href="#" class="footer-social" aria-label="Instagram">📷</a>
            </div>
          </div>
          <div>
            <div class="footer-section-title">Quick Links</div>
            <ul class="footer-links">
              <li><a href="#/">Home</a></li>
              <li><a href="#/concierge">AI Concierge</a></li>
              <li><a href="#/properties">Properties</a></li>
              <li><a href="https://www.aqaar.com" target="_blank" rel="noopener">Aqaar.com</a></li>
            </ul>
          </div>
          <div>
            <div class="footer-section-title">Services</div>
            <ul class="footer-links">
              <li><a href="#/concierge">Buy Property</a></li>
              <li><a href="#/concierge">Rent Property</a></li>
              <li><a href="#/concierge">Invest</a></li>
              <li><a href="#/concierge">Commercial</a></li>
            </ul>
          </div>
          <div>
            <div class="footer-section-title">Contact</div>
            <ul class="footer-links">
              <li><a href="tel:+97167480000">Tel: +971 6 748 0000</a></li>
              <li><a href="mailto:info@aqaar.com">info@aqaar.com</a></li>
              <li><a href="#/dashboard">Admin Dashboard</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-copyright">© 2026 Aqaar. All Rights Reserved. Powered by Aqaar AI Concierge.</p>
          <nav class="footer-legal" aria-label="Legal links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Disclaimer</a>
          </nav>
        </div>
      </div>
    </footer>
  `;

  // ── Bind events ────────────────────────────────────────────
  // Hero CTAs
  document.getElementById('hero-cta')?.addEventListener('click', () => navigate('/concierge'));
  document.getElementById('hero-enquire')?.addEventListener('click', () => openEnquiryModal());
  document.getElementById('view-all-btn')?.addEventListener('click', () => navigate('/properties'));

  // Intent tabs
  document.querySelectorAll('.intent-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const intent = tab.dataset.intent;
      setIntent(intent);
      // Update tab active state
      document.querySelectorAll('.intent-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.intent === intent);
        t.setAttribute('aria-selected', t.dataset.intent === intent);
      });
      // Update hero text
      const cfg = INTENT_CONFIGS[intent];
      const titleEl = document.getElementById('hero-title');
      const subtitleEl = document.getElementById('hero-subtitle');
      const ctaEl = document.getElementById('hero-cta');
      const propsTitleEl = document.getElementById('props-title');
      if (titleEl) titleEl.innerHTML = cfg.headline.replace(/Ajman/g, '<span>Ajman</span>');
      if (subtitleEl) subtitleEl.textContent = cfg.desc;
      if (ctaEl) ctaEl.textContent = `🤖 ${cfg.cta}`;
      if (propsTitleEl) propsTitleEl.textContent = cfg.cta;
      // Reload properties
      loadProperties(cfg.query);
    });
  });

  // Subscribe form
  document.getElementById('subscribe-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('subscribe-email')?.value.trim();
    if (!email || !email.includes('@')) {
      showToast({ type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address.', duration: 3000 });
      return;
    }
    showToast({
      type: 'success',
      title: 'Subscribed!',
      message: `Thank you! You'll receive Aqaar property updates at ${email}.`,
      duration: 5000,
    });
    document.getElementById('subscribe-email').value = '';
  });

  // ── Spawn particles ────────────────────────────────────────
  spawnParticles();

  // ── Load properties ────────────────────────────────────────
  loadProperties(cfg.query);
  loadDashboardStats();
}

async function loadProperties(query) {
  const grid = document.getElementById('properties-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="spinner-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>`;

  try {
    const data = await search({ query, limit: 6 });
    const results = data?.results || [];

    if (!results.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🔍</div>
          <h3>No properties found</h3>
          <p>Try a different intent or <a href="#/concierge" style="color:var(--accent)">chat with our AI Concierge</a></p>
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
        <p>Backend may not be running. Please start the Concierge-Backend-v1 server.<br/>
        <a href="#/concierge" style="color:var(--accent)">Chat with AI</a> or call Aqaar directly.</p>
      </div>`;
    console.warn('Properties load error:', err.message);
  }
}

async function loadDashboardStats() {
  try {
    const data = await getDashboard();
    const metrics = data?.metrics || [];
    const projectCount = metrics.find(m => m.metric_id === 'project_records')?.metric_value;
    const ragCount = metrics.find(m => m.metric_id === 'rag_chunks')?.metric_value;
    const projectEl = document.getElementById('hero-project-count');
    const verifiedEl = document.querySelectorAll('.hero-stat-number')[2];
    if (projectEl) projectEl.textContent = projectCount || 'Contact Aqaar';
    if (verifiedEl) verifiedEl.textContent = ragCount ? `${ragCount}` : 'Verified';
  } catch (err) {
    const projectEl = document.getElementById('hero-project-count');
    if (projectEl) projectEl.textContent = 'Contact Aqaar';
  }
}

function spawnParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 8;
    const duration = Math.random() * 10 + 8;
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${left}%;
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    `;
    container.appendChild(p);
  }
}
