import { type ToastNotice } from "@/lib/paircode";

type ToastStackProps = {
  toasts: ToastNotice[];
};

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={
            toast.variant === "success"
              ? "toast-in pointer-events-auto border border-[var(--panel-border)] bg-[var(--success)] p-3 text-[var(--background)] shadow-sm rounded-xl"
              : toast.variant === "danger"
                ? "toast-in pointer-events-auto border border-[var(--panel-border)] bg-[#ff0000] p-3 text-white shadow-sm rounded-xl"
                : "toast-in pointer-events-auto border border-[var(--panel-border)] bg-[var(--surface-strong)] p-3 text-[var(--foreground)] shadow-sm rounded-xl"
          }
        >
          <p className="text-sm font-black uppercase tracking-wider">{toast.title}</p>
          {toast.detail ? <p className="mt-1 text-xs font-mono">{toast.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}