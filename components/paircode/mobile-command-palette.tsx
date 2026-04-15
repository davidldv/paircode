import { PanelBottomOpen, X } from "lucide-react";

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
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center border border-[var(--panel-border)] bg-[var(--accent)] text-[var(--background)] shadow-sm transition-transform hover:-translate-y-1  lg:hidden rounded-xl"
        aria-label="Open command palette"
      >
        <PanelBottomOpen className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-[var(--panel)] opacity-80" onClick={onClose} aria-label="Close command palette" />
          <div className="absolute bottom-0 left-0 right-0 border-t-4 border-[var(--panel-border)] bg-[var(--surface)] p-6 shadow-[0_-10px_0px_0px_var(--accent)] rounded-xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Command Palette</p>
              <Button type="button" size="icon" variant="ghost" className="border border-transparent hover:border-[var(--panel-border)] rounded-xl" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                className="border border-[var(--panel-border)] bg-[var(--surface-strong)] text-[var(--foreground)] shadow-sm hover:shadow-sm hover:-translate-y-0.5  rounded-xl font-bold uppercase tracking-wider text-[10px]"
                onClick={() => {
                  onFocusMessage();
                  onClose();
                }}
              >
                Focus Message
              </Button>
              <Button
                type="button"
                className="border border-[var(--panel-border)] bg-[var(--surface-strong)] text-[var(--foreground)] shadow-sm hover:shadow-sm hover:-translate-y-0.5  rounded-xl font-bold uppercase tracking-wider text-[10px]"
                onClick={() => {
                  onJoin();
                  onClose();
                }}
              >
                Join Room
              </Button>
              <Button
                type="button"
                disabled={!canLeave}
                className="border border-[var(--panel-border)] bg-[var(--surface-strong)] text-[var(--foreground)] shadow-sm hover:shadow-sm hover:-translate-y-0.5  rounded-xl font-bold uppercase tracking-wider text-[10px]"
                onClick={() => {
                  onLeave();
                  onClose();
                }}
              >
                Leave Room
              </Button>
              <Button
                type="button"
                className="border border-[var(--panel-border)] bg-[var(--surface-strong)] text-[var(--foreground)] shadow-sm hover:shadow-sm hover:-translate-y-0.5  rounded-xl font-bold uppercase tracking-wider text-[10px]"
                onClick={() => {
                  onRunAgent();
                  onClose();
                }}
              >
                Run Agent
              </Button>
              <Button
                type="button"
                className="col-span-2 border border-[var(--panel-border)] bg-[var(--accent)] text-[var(--background)] shadow-sm hover:shadow-sm hover:-translate-y-0.5  rounded-xl font-bold uppercase tracking-wider text-[10px]"
                onClick={() => {
                  onToggleTheme();
                  onClose();
                }}
              >
                {theme === "light" ? "Dark Theme" : "Light Theme"}
              </Button>
            </div>

            <div className="mt-6 border border-[var(--panel-border)] bg-[var(--surface-strong)] p-4 text-xs text-[var(--muted)] font-mono shadow-sm">
              <p className="mb-2 font-bold text-[var(--foreground)] uppercase tracking-wider">Keyboard Shortcuts</p>
              <ul className="space-y-1">
                <li><span className="font-bold bg-[var(--foreground)] text-[var(--background)] px-1 mr-1">SHIFT+M</span> Focus message</li>
                <li><span className="font-bold bg-[var(--foreground)] text-[var(--background)] px-1 mr-1">SHIFT+J</span> Join room</li>
                <li><span className="font-bold bg-[var(--foreground)] text-[var(--background)] px-1 mr-1">CMD+ENTER</span> Send or run</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}