import { Command, LogIn, LogOut, MessageSquareText, Moon, Sparkles, Sun, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type MobileCommandPaletteProps = {
  open: boolean;
  theme: "light" | "dark";
  canLeave: boolean;
  onOpen: () => void;
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
  onOpen,
  onClose,
  onFocusMessage,
  onJoin,
  onLeave,
  onRunAgent,
  onToggleTheme,
}: MobileCommandPaletteProps) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--accent) text-(--accent-contrast) shadow-[var(--panel-shadow-lg)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-95 lg:hidden"
        aria-label="Open command palette"
      >
        <Command className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close command palette"
          />
          <div className="toast-in absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-(--panel-border) bg-(--surface) p-5 shadow-[var(--panel-shadow-lg)]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-(--panel-border-strong)" />
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Quick actions</p>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <PaletteAction icon={<MessageSquareText className="h-4 w-4" />} label="Focus message" onClick={() => { onFocusMessage(); onClose(); }} />
              <PaletteAction icon={<LogIn className="h-4 w-4" />} label="Join room" onClick={() => { onJoin(); onClose(); }} />
              <PaletteAction icon={<LogOut className="h-4 w-4" />} label="Leave room" disabled={!canLeave} onClick={() => { onLeave(); onClose(); }} />
              <PaletteAction icon={<Sparkles className="h-4 w-4" />} label="Run agent" onClick={() => { onRunAgent(); onClose(); }} />
            </div>

            <Button type="button" className="mt-2.5 w-full" onClick={() => { onToggleTheme(); onClose(); }}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === "light" ? "Dark theme" : "Light theme"}
            </Button>

            <div className="surface-inset mt-5 p-4 text-xs text-(--muted)">
              <p className="mb-2 font-medium text-foreground">Keyboard shortcuts</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2"><Kbd>Shift + M</Kbd> Focus message</li>
                <li className="flex items-center gap-2"><Kbd>Shift + J</Kbd> Join room</li>
                <li className="flex items-center gap-2"><Kbd>⌘ + ↵</Kbd> Send or run</li>
              </ul>
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
      className="flex flex-col items-start gap-2 rounded-xl border border-(--panel-border) bg-(--surface-strong) p-3.5 text-left transition-colors hover:border-(--panel-border-strong) hover:bg-(--surface) disabled:opacity-50"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-tint) text-(--accent)">
        {icon}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-(--panel-border) bg-(--surface) px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
      {children}
    </kbd>
  );
}
