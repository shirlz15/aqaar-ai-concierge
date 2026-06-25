/**
 * Aqaar AI Concierge — Navbar Component
 */
import { navigate } from '../router.js';

export function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <div class="navbar-inner">
      <a class="navbar-logo" id="nav-logo" href="#/" aria-label="Aqaar Home">
        <div class="navbar-logo-icon" aria-hidden="true"></div>
        <div class="navbar-logo-text">
          <span class="navbar-logo-name">AQAAR</span>
          <span class="navbar-logo-sub">AI Concierge</span>
        </div>
      </a>

      <ul class="navbar-links" role="navigation" aria-label="Main navigation">
        <li><a href="#/" id="nav-home" class="nav-link">Home</a></li>
        <li><a href="#/concierge" id="nav-concierge" class="nav-link">AI Concierge</a></li>
        <li><a href="#/properties" id="nav-properties" class="nav-link">Properties</a></li>
        <li><a href="#/dashboard" id="nav-dashboard" class="nav-link">Dashboard</a></li>
      </ul>

      <div class="navbar-actions">
        <button class="btn btn-primary btn-sm" id="nav-cta" aria-label="Start AI Concierge chat">
          🤖 Talk to Concierge
        </button>
      </div>

      <button class="navbar-hamburger" id="nav-hamburger" aria-label="Toggle mobile menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

  // CTA button
  document.getElementById('nav-cta')?.addEventListener('click', () => navigate('/concierge'));

  // Active link highlighting
  const updateActive = () => {
    const path = window.location.hash.replace('#', '') || '/';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === path || (href !== '/' && path.startsWith(href)));
    });
  };
  window.addEventListener('hashchange', updateActive);
  updateActive();

  // Scroll effect
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Hamburger (mobile)
  const hamburger = document.getElementById('nav-hamburger');
  hamburger?.addEventListener('click', () => {
    const links = nav.querySelector('.navbar-links');
    const actions = nav.querySelector('.navbar-actions');
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    if (links) links.style.display = isOpen ? '' : 'flex';
    if (actions) actions.style.display = isOpen ? '' : 'flex';
  });
}
