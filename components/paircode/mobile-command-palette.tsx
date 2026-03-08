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
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-(--line) bg-(--surface-strong) text-foreground shadow-[0_10px_30px_-18px_rgba(0,0,0,0.65)] lg:hidden"
        aria-label="Open command palette"
      >
        <PanelBottomOpen className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/35" onClick={onClose} aria-label="Close command palette" />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-b-0 border-(--line) bg-(--surface) p-4 shadow-[0_-20px_35px_-25px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="mono-label text-xs text-(--muted)">Command Palette</p>
              <Button type="button" size="icon" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onFocusMessage();
                  onClose();
                }}
              >
                Focus Message
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onJoin();
                  onClose();
                }}
              >
                Join Room
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!canLeave}
                onClick={() => {
                  onLeave();
                  onClose();
                }}
              >
                Leave Room
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onRunAgent();
                  onClose();
                }}
              >
                Run Agent
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onToggleTheme();
                  onClose();
                }}
              >
                {theme === "light" ? "Dark Theme" : "Light Theme"}
              </Button>
            </div>

            <div className="mt-3 rounded-lg border border-(--line) bg-(--surface-strong) p-2.5 text-xs text-(--muted)">
              <p className="mb-1 font-medium">Keyboard</p>
              <p>Shift+M: Focus message</p>
              <p>Shift+J: Join room</p>
              <p>Ctrl/Cmd+Enter: Send or run</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}