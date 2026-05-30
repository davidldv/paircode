import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { type ToastNotice } from "@/lib/paircode";

type ToastStackProps = {
  toasts: ToastNotice[];
};

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2.5">
      {toasts.map((toast) => {
        const accent =
          toast.variant === "success"
            ? "text-(--success)"
            : toast.variant === "danger"
              ? "text-(--danger)"
              : "text-(--accent)";

        return (
          <div
            key={toast.id}
            role="status"
            className="toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-(--panel-border) bg-(--surface)/95 p-3.5 shadow-[var(--panel-shadow-lg)] backdrop-blur"
          >
            <span className={`mt-0.5 shrink-0 ${accent}`}>
              {toast.variant === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : toast.variant === "danger" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.detail ? <p className="mt-0.5 text-xs leading-relaxed text-(--muted)">{toast.detail}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
