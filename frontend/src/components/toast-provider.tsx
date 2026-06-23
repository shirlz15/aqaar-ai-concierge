"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  kind: ToastKind;
};

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function showToast(title: string, description?: string, kind: ToastKind = "info") {
  window.dispatchEvent(new CustomEvent("aqaar:toast", { detail: { title, description, kind } }));
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<Omit<Toast, "id">>).detail;
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, ...detail }].slice(-4));
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4200);
    }
    window.addEventListener("aqaar:toast", handleToast);
    return () => window.removeEventListener("aqaar:toast", handleToast);
  }, []);

  return (
    <>
      {children}
      <div className="fixed right-5 top-5 z-[80] flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = iconMap[toast.kind];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.98 }}
                className="rounded-2xl border border-aqaar-line bg-aqaar-card/95 p-4 shadow-concierge backdrop-blur"
              >
                <div className="flex gap-3">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${toast.kind === "error" ? "text-red-300" : "text-aqaar-lime"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{toast.title}</p>
                    {toast.description && <p className="mt-1 text-xs leading-5 text-white/55">{toast.description}</p>}
                  </div>
                  <button
                    aria-label="Dismiss notification"
                    onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                    className="rounded-md p-1 text-white/35 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
