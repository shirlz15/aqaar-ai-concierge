/**
 * Aqaar AI Concierge — Main Application Entry
 */
import './styles/index.css';
import { initRouter, addRoute } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { renderLanding } from './pages/landing.js';
import { renderConcierge } from './pages/concierge.js';
import { renderProperties } from './pages/properties.js';
import { renderDashboard } from './pages/dashboard.js';
import { state } from './state.js';

// Setup router mapping
addRoute('/', renderLanding);
addRoute('/concierge', renderConcierge);
addRoute('/properties', renderProperties);
addRoute('/dashboard', renderDashboard);

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // 1. Render global components
  renderNavbar();

  // 2. Add global error handler for uncaught promises
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  // 3. Start router (this will render the initial page)
  initRouter();
  
  console.log('Aqaar AI Concierge initialized.');
});

// For HMR / Dev server
if (import.meta.hot) {
  import.meta.hot.accept();
}
