"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ThemeRole = "admin" | "student";
type ThemeContextValue = { dark: boolean; role: ThemeRole | null; activateRole: (role: ThemeRole) => void; clearRole: () => void; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = (role: ThemeRole) => `udaan-theme-${role}`;

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [role, setRole] = useState<ThemeRole | null>(null);

  useEffect(() => {
    applyTheme(false);
  }, []);

  const activateRole = useCallback((nextRole: ThemeRole) => {
    let storedDark = false;
    try { storedDark = localStorage.getItem(storageKey(nextRole)) === "dark"; } catch { /* Storage may be unavailable. */ }
    setRole(nextRole);
    setDark(storedDark);
    applyTheme(storedDark);
  }, []);

  const clearRole = useCallback(() => {
    setRole(null);
    setDark(false);
    applyTheme(false);
  }, []);

  const toggleTheme = useCallback(() => {
    if (!role) return;
    setDark((current) => {
      const next = !current;
      try { localStorage.setItem(storageKey(role), next ? "dark" : "light"); } catch { /* Keep the current session preference in memory. */ }
      applyTheme(next);
      return next;
    });
  }, [role]);

  const value = useMemo(() => ({ dark, role, activateRole, clearRole, toggleTheme }), [dark, role, activateRole, clearRole, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
