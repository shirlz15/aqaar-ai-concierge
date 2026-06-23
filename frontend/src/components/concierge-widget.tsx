"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Building2, Home, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadRequestSchema, type ChatMessage, type ConciergeProfile } from "@/lib/validation";

type Recommendation = {
  project_name: string;
  match_score: number;
  why_recommended: string;
  investment_potential: string;
  estimated_roi: string;
};

const quickActions = [
  { label: "Buy Property", icon: Home },
  { label: "Rent Property", icon: Building2 },
  { label: "Investment Advice", icon: Bot },
  { label: "Commercial Spaces", icon: Building2 },
];

export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to Aqaar AI Concierge. I would be delighted to help you discover the most suitable property.",
    },
  ]);
  const [profile, setProfile] = useState<ConciergeProfile>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [lead, setLead] = useState({ name: "", email: "", phone: "", preferred_contact_method: "phone", consent_given: false });
  const [leadStatus, setLeadStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  async function sendMessage(content: string) {
    const clean = content.trim();
    if (!clean) return;
    setLoading(true);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: clean }];
    setMessages(nextMessages);
    setInput("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: clean, history: messages, profile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Concierge unavailable");
      setProfile(data.profile);
      setRecommendations(data.recommendations || []);
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Thank you for your patience. Our concierge is temporarily unavailable." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadStatus("");
    const payload = { ...lead, session_id: sessionId, profile };
    const parsed = leadRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setLeadStatus("Please complete your contact details and consent.");
      return;
    }
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setLeadStatus(response.ok ? "Thank you. Aqaar will contact you shortly." : "Your details could not be submitted right now.");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="mb-4 flex h-[min(680px,calc(100vh-7rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-aqaar-line bg-aqaar-panel shadow-concierge"
          >
            <header className="flex items-center justify-between border-b border-aqaar-line px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Aqaar AI Concierge</p>
                <p className="text-xs text-white/60">Luxury real estate advisory</p>
              </div>
              <button aria-label="Close concierge" onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[88%] rounded-md px-3 py-2 text-sm leading-6 ${
                    message.role === "assistant" ? "bg-white/[0.08] text-white" : "ml-auto bg-aqaar-lime text-aqaar-dark"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {recommendations.map((item) => (
                <div key={item.project_name} className="rounded-md border border-aqaar-line bg-aqaar-dark/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.project_name}</p>
                    <span className="text-xs text-aqaar-lime">{item.match_score}% match</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/70">{item.why_recommended}</p>
                  <p className="mt-2 text-xs text-white/60">Estimated ROI: {item.estimated_roi}</p>
                </div>
              ))}
              {recommendations.length > 0 && (
                <form onSubmit={submitLead} className="space-y-2 rounded-md border border-aqaar-line bg-aqaar-dark/60 p-3">
                  <p className="text-sm font-semibold">Request a private consultation</p>
                  <input
                    value={lead.name}
                    onChange={(event) => setLead({ ...lead, name: event.target.value })}
                    maxLength={120}
                    className="h-10 w-full rounded-md border border-aqaar-line bg-aqaar-panel px-3 text-sm outline-none focus:border-aqaar-lime"
                    placeholder="Full name"
                  />
                  <input
                    value={lead.email}
                    onChange={(event) => setLead({ ...lead, email: event.target.value })}
                    maxLength={180}
                    className="h-10 w-full rounded-md border border-aqaar-line bg-aqaar-panel px-3 text-sm outline-none focus:border-aqaar-lime"
                    placeholder="Email"
                  />
                  <input
                    value={lead.phone}
                    onChange={(event) => setLead({ ...lead, phone: event.target.value })}
                    maxLength={30}
                    className="h-10 w-full rounded-md border border-aqaar-line bg-aqaar-panel px-3 text-sm outline-none focus:border-aqaar-lime"
                    placeholder="Phone number"
                  />
                  <select
                    value={lead.preferred_contact_method}
                    onChange={(event) => setLead({ ...lead, preferred_contact_method: event.target.value })}
                    className="h-10 w-full rounded-md border border-aqaar-line bg-aqaar-panel px-3 text-sm outline-none focus:border-aqaar-lime"
                  >
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                  <label className="flex gap-2 text-xs leading-5 text-white/65">
                    <input
                      type="checkbox"
                      checked={lead.consent_given}
                      onChange={(event) => setLead({ ...lead, consent_given: event.target.checked })}
                      className="mt-1"
                    />
                    I consent to Aqaar storing my contact details for this property inquiry.
                  </label>
                  <Button className="w-full">Submit Details</Button>
                  {leadStatus && <p className="text-xs text-white/65">{leadStatus}</p>}
                </form>
              )}
              {loading && <p className="text-xs text-white/50">Preparing a tailored recommendation...</p>}
            </div>
            <div className="border-t border-aqaar-line p-4">
              <div className="mb-3 grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => void sendMessage(action.label)}
                    className="flex items-center gap-2 rounded-md border border-aqaar-line px-3 py-2 text-left text-xs text-white/80 hover:border-aqaar-lime"
                  >
                    <action.icon className="h-4 w-4 text-aqaar-lime" />
                    {action.label}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={2000}
                  className="min-w-0 flex-1 rounded-md border border-aqaar-line bg-aqaar-dark px-3 text-sm outline-none focus:border-aqaar-lime"
                  placeholder="Share your preferred property..."
                />
                <Button disabled={loading} aria-label="Send message" className="h-11 w-11 px-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Button onClick={() => setOpen(!open)} className="h-14 w-14 rounded-full px-0 shadow-concierge" aria-label="Open concierge">
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
