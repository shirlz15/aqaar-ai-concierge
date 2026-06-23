import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type AnalyticsEvent = {
  id: string;
  type: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

const storageDir = () => path.join(process.cwd(), "..", ".local-data");
const storageFile = () => path.join(storageDir(), "analytics.jsonl");

export function trackAnalyticsEvent(type: string, metadata: Record<string, unknown> = {}) {
  mkdirSync(storageDir(), { recursive: true });
  const event: AnalyticsEvent = {
    id: `event-${randomUUID()}`,
    type,
    created_at: new Date().toISOString(),
    metadata,
  };
  appendFileSync(storageFile(), `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

export function readAnalyticsEvents(): AnalyticsEvent[] {
  if (!existsSync(storageFile())) return [];
  return readFileSync(storageFile(), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as AnalyticsEvent;
      } catch {
        return null;
      }
    })
    .filter((event): event is AnalyticsEvent => Boolean(event));
}

export function summarizeAnalytics() {
  const events = readAnalyticsEvents();
  const counts: Record<string, number> = {
    lead_submitted: 0,
    guide_downloaded: 0,
    property_enquiry: 0,
    chat_started: 0,
    buy_journey_started: 0,
    rent_journey_started: 0,
    invest_journey_started: 0,
  };
  for (const event of events) {
    counts[event.type] = (counts[event.type] || 0) + 1;
  }
  return {
    counts,
    recent: events.slice(-12).reverse(),
  };
}
