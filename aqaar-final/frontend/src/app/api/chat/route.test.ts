import { describe, expect, it } from "vitest";
import { chatRequestSchema } from "../../../lib/validation";

describe("chatRequestSchema", () => {
  it("rejects empty messages", () => {
    const parsed = chatRequestSchema.safeParse({ session_id: "session-12345", message: "", history: [], profile: {} });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid concierge messages", () => {
    const parsed = chatRequestSchema.safeParse({
      session_id: "session-12345",
      message: "I am interested in Muscat Bay",
      history: [],
      profile: {},
    });
    expect(parsed.success).toBe(true);
  });
});
