"use client";

export function trackClientEvent(type: string, metadata: Record<string, unknown> = {}) {
  return fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, metadata }),
    keepalive: true,
  }).catch(() => undefined);
}

export function openConcierge(preference?: string) {
  window.dispatchEvent(new CustomEvent("aqaar:open-concierge", { detail: { preference } }));
}

export function openLeadModal(preference: string, selectedProject = "") {
  window.dispatchEvent(new CustomEvent("aqaar:open-lead", { detail: { preference, selectedProject } }));
}

export function requestDownload(kind: string, projectName?: string) {
  window.dispatchEvent(new CustomEvent("aqaar:download", { detail: { kind, projectName } }));
}
