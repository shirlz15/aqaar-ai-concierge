"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, Mail, Phone, Home } from "lucide-react";
import { showToast } from "@/components/toast-provider";
import { useJourney } from "@/lib/client/journey-context";

export function ConsultationModal() {
  const { isConsultationOpen, setConsultationOpen } = useJourney();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      profile: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        intent: formData.get("intent") as string,
        budget: formData.get("budget") as string,
      },
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to submit");

      showToast("Consultation Requested!", "Our advisors will contact you shortly.", "success");
      setConsultationOpen(false);
      
      // Auto-trigger widget open to continue conversation
      const fab = document.getElementById("concierge-fab-btn");
      if (fab && !document.getElementById("concierge-chat-window")) {
        fab.click();
      }
    } catch (err) {
      showToast("Submission Failed", "Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!isConsultationOpen) return null;

  return (
    <AnimatePresence>
      {isConsultationOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConsultationOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-aqaar-line bg-aqaar-card shadow-2xl"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-aqaar-lime via-aqaar-lime/50 to-transparent" />
            
            <div className="flex items-center justify-between border-b border-aqaar-line bg-aqaar-panel px-6 py-4">
              <h2 className="text-xl font-bold text-white">Book Private Consultation</h2>
              <button
                onClick={() => setConsultationOpen(false)}
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                    <input required name="name" type="text" className="w-full rounded-xl border border-aqaar-line bg-aqaar-panel pl-10 pr-4 py-3 text-sm text-white focus:border-aqaar-lime focus:outline-none focus:ring-1 focus:ring-aqaar-lime transition-all" placeholder="John Doe" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <input required name="email" type="email" className="w-full rounded-xl border border-aqaar-line bg-aqaar-panel pl-10 pr-4 py-3 text-sm text-white focus:border-aqaar-lime focus:outline-none transition-all" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                      <input required name="phone" type="tel" className="w-full rounded-xl border border-aqaar-line bg-aqaar-panel pl-10 pr-4 py-3 text-sm text-white focus:border-aqaar-lime focus:outline-none transition-all" placeholder="+971 50 123 4567" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">Purpose</label>
                    <select name="intent" className="w-full rounded-xl border border-aqaar-line bg-aqaar-panel px-4 py-3 text-sm text-white focus:border-aqaar-lime focus:outline-none transition-all appearance-none">
                      <option value="invest">Investment</option>
                      <option value="buy">Buying a Home</option>
                      <option value="rent">Renting</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">Budget (AED)</label>
                    <select name="budget" className="w-full rounded-xl border border-aqaar-line bg-aqaar-panel px-4 py-3 text-sm text-white focus:border-aqaar-lime focus:outline-none transition-all appearance-none">
                      <option value="500k-1M">500k - 1M</option>
                      <option value="1M-2M">1M - 2M</option>
                      <option value="2M+">2M+</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-aqaar-lime px-4 py-4 text-sm font-bold text-aqaar-dark hover:bg-aqaar-lime-soft transition-all shadow-lime disabled:opacity-70"
                >
                  {loading ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-aqaar-dark border-t-transparent" />
                  ) : (
                    <>Submit Request <Send className="h-4 w-4" /></>
                  )}
                </button>
                <p className="mt-4 text-center text-xs text-white/40">
                  By submitting, you agree to Aqaar&apos;s privacy policy. Your data is securely handled.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
