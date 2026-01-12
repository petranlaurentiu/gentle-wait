/**
 * Theme Provider - Liquid Glass Design System
 * Dark-first design for immersive glass effects
 */
import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";
import { colors } from "./theme";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  isDark: boolean;
  colors: typeof colors.light | typeof colors.dark;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  // Default to dark mode for Liquid Glass design
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  // For Liquid Glass, we always use dark mode to maintain the glass aesthetic
  const isDark = true;

  const themeColors = colors.dark;

  const value: ThemeContextType = {
    isDark,
    colors: themeColors,
    themeMode,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
