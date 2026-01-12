/**
 * Background Wrapper - Liquid Glass animated background
 */
import { ReactNode } from "react";
import { LiquidGlassBackground } from "./LiquidGlassBackground";

interface BackgroundWrapperProps {
  children: ReactNode;
}

export function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  return <LiquidGlassBackground>{children}</LiquidGlassBackground>;
}
