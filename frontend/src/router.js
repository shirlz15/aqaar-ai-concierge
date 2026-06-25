/**
 * Aqaar AI Concierge — Hash-based SPA Router
 */

const routes = new Map();

export function addRoute(hash, handler) {
  routes.set(hash, handler);
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function getCurrentRoute() {
  return window.location.hash.replace('#', '') || '/';
}

export function initRouter() {
  const handleRoute = () => {
    const path = getCurrentRoute();
    // Match exact or prefix
    let handler = routes.get(path);
    if (!handler) {
      // Try to find partial match (e.g., /dashboard/leads → /dashboard)
      for (const [key, fn] of routes) {
        if (path.startsWith(key) && key !== '/') { handler = fn; break; }
      }
    }
    if (!handler) handler = routes.get('/'); // fallback to landing

    const content = document.getElementById('page-content');
    if (content) {
      content.style.animation = 'none';
      content.offsetHeight; // reflow
      content.style.animation = '';
    }
    if (handler) handler(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  return {
    navigate,
    destroy: () => window.removeEventListener('hashchange', handleRoute),
  };
}
