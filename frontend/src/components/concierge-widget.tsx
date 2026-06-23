"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Building2,
  Home,
  Send,
  X,
  Sparkles,
  TrendingUp,
  MapPin,
  ChevronRight,
  Award,
} from "lucide-react";
import { leadRequestSchema, type ChatMessage, type ConciergeProfile } from "@/lib/validation";

type Recommendation = {
  project_name: string;
  match_score: number;
  why_recommended: string;
  investment_potential: string;
  estimated_roi: string;
};

const quickActions = [
  { label: "Buy Property", icon: Home, prompt: "I want to buy a property" },
  { label: "Rent Property", icon: Building2, prompt: "I want to rent a property" },
  { label: "Investment Advice", icon: TrendingUp, prompt: "I need investment advice" },
  { label: "Dusit Thani", icon: Award, prompt: "Tell me about Dusit Thani Residences" },
  { label: "Mawjan", icon: MapPin, prompt: "Tell me about Mawjan waterfront" },
  { label: "ROI Analysis", icon: TrendingUp, prompt: "What is the ROI potential in Ajman?" },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-aqaar-line bg-aqaar-card px-4 py-3">
      <div className="flex gap-1">
        <div className="typing-dot h-2 w-2 rounded-full bg-aqaar-lime/60" />
        <div className="typing-dot h-2 w-2 rounded-full bg-aqaar-lime/60" />
        <div className="typing-dot h-2 w-2 rounded-full bg-aqaar-lime/60" />
      </div>
      <span className="text-xs text-white/40">Advisor is thinking...</span>
    </div>
  );
}

function RecommendationCard({ item }: { item: Recommendation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-aqaar-lime/20 bg-aqaar-lime/5 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{item.project_name}</p>
          <p className="mt-0.5 text-xs text-aqaar-lime">{item.investment_potential}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="rounded-full bg-aqaar-lime px-2.5 py-1">
            <span className="text-[11px] font-bold text-aqaar-dark">
              {item.match_score}% match
            </span>
          </div>
          <span className="text-[11px] text-white/50">ROI: {item.estimated_roi}</span>
        </div>
      </div>
      <p className="mt-2.5 text-xs leading-5 text-white/60">{item.why_recommended}</p>
      <button className="group mt-3 flex items-center gap-1.5 text-xs font-semibold text-aqaar-lime hover:gap-2 transition-all">
        View details
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}

/* ── Floating button widget (legacy behavior, enhanced) ── */
export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome. I'm your Aqaar AI Property Advisor.\n\nI can help you discover premium properties in Ajman, analyze investment opportunities, and arrange private consultations. How may I assist you today?",
    },
  ]);
  const [profile, setProfile] = useState<ConciergeProfile>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [lead, setLead] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_contact_method: "phone",
    consent_given: false,
  });
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
        {
          role: "assistant",
          content: "Thank you for your patience. Our concierge is temporarily unavailable. Please try again shortly.",
        },
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
      setLeadStatus("Please complete all fields and provide consent.");
      return;
    }
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setLeadStatus(
      response.ok
        ? "Thank you. A private advisor will contact you shortly."
        : "Your details could not be submitted right now. Please try again."
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-4 flex h-[min(700px,calc(100vh-6rem))] w-[min(440px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-aqaar-line bg-aqaar-panel shadow-concierge"
          >
            {/* Header */}
            <div className="relative overflow-hidden border-b border-aqaar-line bg-gradient-to-r from-aqaar-card to-aqaar-panel px-5 py-4">
              {/* Lime accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-aqaar-lime via-aqaar-lime/50 to-transparent" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-aqaar-lime">
                    <Sparkles className="h-5 w-5 text-aqaar-dark" />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-aqaar-panel bg-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Aqaar AI Advisor</p>
                    <p className="text-xs text-aqaar-lime">● Online — Luxury Real Estate</p>
                  </div>
                </div>
                <button
                  aria-label="Close concierge"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aqaar-lime mt-1">
                      <Sparkles className="h-3 w-3 text-aqaar-dark" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "assistant"
                        ? "rounded-tl-sm border border-aqaar-line bg-aqaar-card text-white/90"
                        : "rounded-tr-sm bg-aqaar-lime text-aqaar-dark font-medium"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aqaar-lime mt-1">
                    <Sparkles className="h-3 w-3 text-aqaar-dark" />
                  </div>
                  <TypingIndicator />
                </div>
              )}

              {/* Recommendations */}
              {recommendations.map((item) => (
                <RecommendationCard key={item.project_name} item={item} />
              ))}

              {/* Lead capture */}
              {recommendations.length > 0 && (
                <motion.form
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={submitLead}
                  className="space-y-3 rounded-xl border border-aqaar-lime/20 bg-aqaar-lime/5 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-aqaar-lime" />
                    <p className="text-sm font-bold text-white">Request Private Consultation</p>
                  </div>
                  <input
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                    maxLength={120}
                    className="h-10 w-full rounded-lg border border-aqaar-line bg-aqaar-panel px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime"
                    placeholder="Full name"
                  />
                  <input
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                    maxLength={180}
                    type="email"
                    className="h-10 w-full rounded-lg border border-aqaar-line bg-aqaar-panel px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime"
                    placeholder="Email address"
                  />
                  <input
                    value={lead.phone}
                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                    maxLength={30}
                    className="h-10 w-full rounded-lg border border-aqaar-line bg-aqaar-panel px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime"
                    placeholder="Phone / WhatsApp"
                  />
                  <select
                    value={lead.preferred_contact_method}
                    onChange={(e) =>
                      setLead({ ...lead, preferred_contact_method: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-aqaar-line bg-aqaar-panel px-3 text-sm text-white outline-none focus:border-aqaar-lime"
                  >
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                  <label className="flex gap-2 text-xs leading-5 text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lead.consent_given}
                      onChange={(e) => setLead({ ...lead, consent_given: e.target.checked })}
                      className="mt-0.5 accent-aqaar-lime"
                    />
                    I consent to Aqaar storing my contact details for this inquiry.
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-aqaar-lime py-2.5 text-sm font-bold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft"
                  >
                    Submit Details
                  </button>
                  {leadStatus && (
                    <p className="text-xs text-aqaar-lime">{leadStatus}</p>
                  )}
                </motion.form>
              )}
            </div>

            {/* Quick actions */}
            <div className="border-t border-aqaar-line px-4 pt-3 pb-2">
              <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => void sendMessage(action.prompt)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-aqaar-line bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-aqaar-lime/30 hover:bg-aqaar-lime/10 hover:text-aqaar-lime"
                  >
                    <action.icon className="h-3 w-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-aqaar-line px-4 pb-4 pt-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={2000}
                  className="min-w-0 flex-1 rounded-xl border border-aqaar-line bg-aqaar-card px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime"
                  placeholder="Ask about any property or investment..."
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aqaar-lime text-aqaar-dark transition-all hover:bg-aqaar-lime-soft disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-aqaar-lime shadow-concierge transition-all hover:bg-aqaar-lime-soft hover:shadow-lime"
        aria-label="Open AI property advisor"
        id="concierge-fab-btn"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-7 w-7 text-aqaar-dark" />
            </motion.div>
          ) : (
            <motion.div
              key="sparkles"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="h-7 w-7 text-aqaar-dark" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Ping indicator */}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aqaar-lime opacity-40" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-green-400" />
          </span>
        )}
        {/* Tooltip */}
        {!open && (
          <div className="absolute bottom-full right-0 mb-3 hidden whitespace-nowrap rounded-lg border border-aqaar-line bg-aqaar-card px-3 py-2 text-xs font-semibold text-white shadow-card group-hover:block">
            AI Property Advisor
          </div>
        )}
      </motion.button>
    </div>
  );
}
