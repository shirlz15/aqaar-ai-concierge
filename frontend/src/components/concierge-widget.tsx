"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Home,
  Send,
  X,
  Sparkles,
  TrendingUp,
  MapPin,
  ChevronRight,
  Award,
  CheckCircle,
} from "lucide-react";
import { showToast } from "@/components/toast-provider";
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
    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-aqaar-line bg-aqaar-card px-4 py-3">
      <div className="flex gap-1.5 items-center">
        <div className="typing-dot h-2 w-2 rounded-full bg-aqaar-lime" />
        <div className="typing-dot h-2 w-2 rounded-full bg-aqaar-lime" />
        <div className="typing-dot h-2 w-2 rounded-full bg-aqaar-lime" />
      </div>
      <span className="text-xs text-white/40 italic">Advisor is thinking...</span>
    </div>
  );
}

function RecommendationCard({ item }: { item: Recommendation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="rounded-xl border border-aqaar-lime/20 bg-aqaar-lime/5 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{item.project_name}</p>
          <p className="mt-0.5 text-xs text-aqaar-lime">{item.investment_potential}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
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

function MessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isAssistant = message.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 30, delay: 0.03 * Math.min(index, 3) }}
      className={`flex gap-2 ${isAssistant ? "flex-row" : "flex-row-reverse"}`}
    >
      {isAssistant && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aqaar-lime mt-1">
          <Sparkles className="h-3 w-3 text-aqaar-dark" />
        </div>
      )}
      <div
        className={`max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${
          isAssistant
            ? "rounded-tl-sm border border-aqaar-line bg-aqaar-card text-white/90"
            : "rounded-tr-sm bg-aqaar-lime text-aqaar-dark font-medium"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

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
  const [leadStatus, setLeadStatus] = useState<"" | "success" | "error">("");
  const [leadStatusMsg, setLeadStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, recommendations]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "";
    }
    return () => {
      if (typeof window !== "undefined") document.body.style.overflow = "";
    };
  }, [open]);

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
      setLeadStatus("error");
      setLeadStatusMsg("Please complete all fields and provide consent.");
      return;
    }
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (response.ok) {
      setLeadStatus("success");
      setLeadStatusMsg("Thank you. A private advisor will contact you shortly.");
      showToast("Lead Captured!", "An advisor will contact you shortly.", "success");
    } else {
      setLeadStatus("error");
      setLeadStatusMsg("Your details could not be submitted right now. Please try again.");
      showToast("Submission Failed", "Please try again.", "error");
    }
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
            className="concierge-widget-panel mb-4 flex flex-col overflow-hidden rounded-2xl border border-aqaar-line bg-aqaar-panel shadow-concierge"
            style={{
              height: "min(700px, calc(100vh - 6rem))",
              width: "min(440px, calc(100vw - 3rem))",
            }}
          >
            {/* Header */}
            <div className="relative overflow-hidden border-b border-aqaar-line bg-gradient-to-r from-aqaar-card to-aqaar-panel px-5 py-4 shrink-0">
              {/* Lime accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-aqaar-lime via-aqaar-lime/50 to-transparent" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-aqaar-lime">
                    <Sparkles className="h-5 w-5 text-aqaar-dark" />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-aqaar-panel bg-green-400" />
                    {/* Ping ring */}
                    <span className="absolute -inset-1 rounded-full border border-aqaar-lime/30 animate-ping-lime" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Aqaar AI Advisor</p>
                    <p className="text-xs text-aqaar-lime flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                      Online — Luxury Real Estate
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Close concierge"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <MessageBubble key={`${message.role}-${index}`} message={message} index={index} />
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
              {recommendations.length > 0 && leadStatus !== "success" && (
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
                    className="h-10 w-full rounded-lg border border-aqaar-line bg-aqaar-panel px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime transition-colors"
                    placeholder="Full name"
                  />
                  <input
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                    maxLength={180}
                    type="email"
                    className="h-10 w-full rounded-lg border border-aqaar-line bg-aqaar-panel px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime transition-colors"
                    placeholder="Email address"
                  />
                  <input
                    value={lead.phone}
                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                    maxLength={30}
                    className="h-10 w-full rounded-lg border border-aqaar-line bg-aqaar-panel px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime transition-colors"
                    placeholder="Phone / WhatsApp"
                  />
                  <select
                    value={lead.preferred_contact_method}
                    onChange={(e) =>
                      setLead({ ...lead, preferred_contact_method: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-aqaar-line bg-aqaar-panel px-3 text-sm text-white outline-none focus:border-aqaar-lime transition-colors"
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
                    className="group relative w-full overflow-hidden rounded-lg bg-aqaar-lime py-2.5 text-sm font-bold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft hover:shadow-lime-sm"
                  >
                    Submit Details
                    <span className="absolute inset-0 -skew-x-12 translate-x-[-100%] bg-white/20 group-hover:translate-x-[200%] transition-transform duration-700" />
                  </button>
                  {leadStatus === "error" && (
                    <p className="text-xs text-red-400">{leadStatusMsg}</p>
                  )}
                </motion.form>
              )}

              {/* Success state */}
              {leadStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center"
                >
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto animate-success-pop" />
                  <p className="mt-2 text-sm font-semibold text-white">Consultation Requested</p>
                  <p className="mt-1 text-xs text-white/50">{leadStatusMsg}</p>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            <div className="border-t border-aqaar-line px-4 pt-3 pb-2 shrink-0">
              <div className="hide-scrollbar fade-edges flex gap-2 overflow-x-auto pb-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => void sendMessage(action.prompt)}
                    disabled={loading}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-aqaar-line bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-aqaar-lime/30 hover:bg-aqaar-lime/10 hover:text-aqaar-lime disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <action.icon className="h-3 w-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-aqaar-line px-4 pb-4 pt-3 shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={2000}
                  className="min-w-0 flex-1 rounded-xl border border-aqaar-line bg-aqaar-card px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime transition-colors"
                  placeholder="Ask about any property or investment..."
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aqaar-lime text-aqaar-dark transition-all hover:bg-aqaar-lime-soft hover:shadow-lime-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <div className="flex items-end gap-2">
        {/* Desktop label */}
        {!open && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="mb-1 hidden sm:block"
          >
            <div className="glass rounded-full border border-aqaar-line px-3 py-2">
              <p className="text-xs font-semibold text-white whitespace-nowrap">AI Property Advisor</p>
              <p className="text-[10px] text-aqaar-lime">Available 24/7</p>
            </div>
          </motion.div>
        )}
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
        </motion.button>
      </div>
    </div>
  );
}
