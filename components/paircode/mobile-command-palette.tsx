import { LogIn, LogOut, MessageSquareText, Moon, Sparkles, Sun, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type MobileCommandPaletteProps = {
  open: boolean;
  theme: "light" | "dark";
  canLeave: boolean;
  onClose: () => void;
  onFocusMessage: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onRunAgent: () => void;
  onToggleTheme: () => void;
};

export function MobileCommandPalette({
  open,
  theme,
  canLeave,
  onClose,
  onFocusMessage,
  onJoin,
  onLeave,
  onRunAgent,
  onToggleTheme,
}: MobileCommandPaletteProps) {
  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-(--ink)/55"
            onClick={onClose}
            aria-label="Close quick actions"
          />
          <div className="print-in absolute inset-x-0 bottom-0 border-t-2 border-(--secure) bg-(--stock-face) shadow-[var(--lift-high)]">
            <div className="flex items-center justify-between border-b border-(--secure-deep) bg-(--secure) px-3 py-2">
              <span className="legend text-(--secure-ink)">Quick actions</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close quick actions"
                className="flex h-7 w-7 items-center justify-center rounded-[2px] text-(--secure-ink) transition-colors hover:bg-(--secure-ink)/12"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-px bg-(--rule)">
              <PaletteAction
                icon={<MessageSquareText className="h-4 w-4" />}
                label="Focus entry"
                onClick={() => {
                  onFocusMessage();
                  onClose();
                }}
              />
              <PaletteAction
                icon={<LogIn className="h-4 w-4" />}
                label="Join room"
                onClick={() => {
                  onJoin();
                  onClose();
                }}
              />
              <PaletteAction
                icon={<LogOut className="h-4 w-4" />}
                label="Leave room"
                disabled={!canLeave}
                onClick={() => {
                  onLeave();
                  onClose();
                }}
              />
              <PaletteAction
                icon={<Sparkles className="h-4 w-4" />}
                label="Run agent"
                onClick={() => {
                  onRunAgent();
                  onClose();
                }}
              />
            </div>

            <div className="p-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  onToggleTheme();
                  onClose();
                }}
              >
                {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                {theme === "light" ? "Dark theme" : "Light theme"}
              </Button>

              <dl className="mt-3 border border-(--rule) bg-(--stock-sunk)">
                <div className="border-b border-(--rule) px-2.5 py-1">
                  <span className="legend">Keys</span>
                </div>
                {[
                  ["Shift + M", "Focus entry"],
                  ["Shift + J", "Join room"],
                  ["⌘ / Ctrl + ↵", "Send or run"],
                ].map(([key, action]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2.5 border-b border-(--rule) px-2.5 py-1.5 last:border-b-0"
                  >
                    <dt className="value w-28 shrink-0 text-[0.6875rem] text-(--ink)">{key}</dt>
                    <dd className="note">{action}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PaletteAction({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2.5 bg-(--stock-face) px-3 py-3.5 text-left transition-colors duration-100 hover:bg-(--secure-tint) disabled:opacity-45 disabled:hover:bg-(--stock-face)"
    >
      <span className="text-(--secure)">{icon}</span>
      <span className="text-[0.8125rem] font-[600] text-(--ink)">{label}</span>
    </button>
  );
}
