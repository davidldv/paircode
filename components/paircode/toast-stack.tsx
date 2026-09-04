import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { type ToastNotice } from "@/lib/paircode";

/** Slips printed at the desk and left on the counter. */
export function ToastStack({ toasts }: { toasts: ToastNotice[] }) {
  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const mark =
          toast.variant === "success"
            ? { color: "text-(--secure)", label: "Recorded", Icon: CheckCircle2 }
            : toast.variant === "danger"
              ? { color: "text-(--cancel)", label: "Refused", Icon: AlertTriangle }
              : { color: "text-(--ink-2)", label: "Notice", Icon: Info };

        return (
          <div
            key={toast.id}
            role="status"
            className="print-in pointer-events-auto border border-(--rule-strong) bg-(--stock-face) shadow-[var(--lift-high)]"
          >
            <div className="flex items-center gap-1.5 border-b border-(--rule) bg-(--stock-rack) px-2.5 py-1">
              <mark.Icon className={`h-3 w-3 ${mark.color}`} />
              <span className={`legend ${mark.color}`}>{mark.label}</span>
            </div>
            <div className="px-2.5 py-2">
              <p className="text-[0.8125rem] font-[600] leading-snug text-(--ink)">{toast.title}</p>
              {toast.detail ? (
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-(--ink-2)">{toast.detail}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
