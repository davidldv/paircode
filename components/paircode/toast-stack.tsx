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
              ? "toast-in pointer-events-auto rounded-xl border border-[#96c8a8] bg-[#e9f8ee] p-3 text-[#225b40]"
              : toast.variant === "danger"
                ? "toast-in pointer-events-auto rounded-xl border border-[#e7a49b] bg-[#fdeceb] p-3 text-[#8d2d2a]"
                : "toast-in pointer-events-auto rounded-xl border border-(--line) bg-(--surface-strong) p-3 text-foreground"
          }
        >
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.detail ? <p className="mt-1 text-xs opacity-80">{toast.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}