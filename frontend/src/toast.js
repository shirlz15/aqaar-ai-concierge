/**
 * Aqaar AI Concierge — Toast Notification System
 */

/**
 * Show a toast notification
 * @param {object} options
 * @param {'success'|'error'|'info'|'warning'} options.type
 * @param {string} options.title
 * @param {string} [options.message]
 * @param {number} [options.duration] - ms, default 4000
 */
export function showToast({ type = 'info', title, message = '', duration = 4000 } = {}) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close notification">✕</button>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  toast.querySelector('.toast-close').addEventListener('click', remove);

  if (duration > 0) {
    setTimeout(remove, duration);
  }
}
