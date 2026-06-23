"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, MapPin, TrendingUp, CheckCircle, ChevronRight, Home } from "lucide-react";
import { useJourney } from "@/lib/client/journey-context";

export function PropertyEnquiryPanel() {
  const { enquiryProperty, setEnquiryProperty, setConsultationOpen } = useJourney();

  // Prevent background scroll when open
  useEffect(() => {
    if (enquiryProperty) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [enquiryProperty]);

  if (!enquiryProperty) return null;

  return (
    <AnimatePresence>
      {enquiryProperty && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnquiryProperty(null)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[101] w-full max-w-md border-l border-aqaar-line bg-aqaar-card shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-aqaar-line px-6 py-4 bg-aqaar-panel relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-aqaar-lime via-aqaar-lime/50 to-transparent" />
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-aqaar-lime">
                  Premium Property
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  {enquiryProperty.project_name}
                </h2>
              </div>
              <button
                onClick={() => setEnquiryProperty(null)}
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              
              <div className="flex items-start gap-3 mb-6">
                <MapPin className="h-5 w-5 text-aqaar-lime shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Location</p>
                  <p className="text-sm text-white/60">{enquiryProperty.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 mb-6">
                <Building2 className="h-5 w-5 text-aqaar-lime shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Property Type</p>
                  <p className="text-sm text-white/60">{enquiryProperty.project_type}</p>
                </div>
              </div>

              {enquiryProperty.investment_angle && (
                <div className="flex items-start gap-3 mb-6">
                  <TrendingUp className="h-5 w-5 text-aqaar-lime shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">Investment Potential</p>
                    <p className="text-sm text-white/60">{enquiryProperty.investment_angle}</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-aqaar-lime/20 bg-aqaar-lime/5 p-5 mb-8">
                <h3 className="flex items-center gap-2 font-semibold text-aqaar-lime mb-3">
                  <CheckCircle className="h-4 w-4" /> Why AI Recommends This
                </h3>
                <p className="text-sm leading-6 text-white/80">
                  {enquiryProperty.sales_pitch || enquiryProperty.description}
                </p>
              </div>

            </div>

            {/* Footer CTA */}
            <div className="border-t border-aqaar-line bg-aqaar-panel p-6">
              <button
                onClick={() => {
                  setEnquiryProperty(null);
                  setTimeout(() => setConsultationOpen(true), 300);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-aqaar-lime px-4 py-4 text-sm font-bold text-aqaar-dark hover:bg-aqaar-lime-soft transition-all shadow-lime"
              >
                Book Expert Consultation <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
