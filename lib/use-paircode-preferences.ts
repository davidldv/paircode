"use client";

import { useCallback, useSyncExternalStore } from "react";

function getPreferredTheme(): "light" | "dark" {
  const storedTheme = window.localStorage.getItem("paircode-theme");
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerThemeSnapshot(): "light" | "dark" {
  return "light";
}

function getClientShowHintsSnapshot(): boolean {
  return window.localStorage.getItem("paircode-hints-hidden") !== "true";
}

function getServerShowHintsSnapshot(): boolean {
  return true;
}

function subscribeToPreferences(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith("paircode-")) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("paircode:preferences", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("paircode:preferences", onStoreChange);
  };
}

function notifyPreferencesChanged() {
  window.dispatchEvent(new Event("paircode:preferences"));
}

export function usePaircodePreferences() {
  const theme = useSyncExternalStore(
    subscribeToPreferences,
    getPreferredTheme,
    getServerThemeSnapshot
  );
  const showHints = useSyncExternalStore(
    subscribeToPreferences,
    getClientShowHintsSnapshot,
    getServerShowHintsSnapshot
  );

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    window.localStorage.setItem("paircode-theme", next);
    notifyPreferencesChanged();
  }, [theme]);

  const dismissHints = useCallback(() => {
    window.localStorage.setItem("paircode-hints-hidden", "true");
    notifyPreferencesChanged();
  }, []);

  return {
    theme,
    showHints,
    toggleTheme,
    dismissHints,
  };
}