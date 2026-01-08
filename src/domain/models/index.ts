/**
 * Domain models for GentleWait
 */

export interface SelectedApp {
  packageName: string;
  label: string;
  iconUri?: string;
}

export interface UserSettings {
  id: string; // singleton
  userName?: string;
  pauseDurationSec: number; // 10-30
  promptFrequency: 'off' | 'sometimes' | 'always';
  selectedApps: SelectedApp[];
  theme: 'system' | 'light' | 'dark';
  premium: boolean;
  createdAt: number;
  updatedAt: number;
}

export type InterceptionAction =
  | 'opened_anyway'
  | 'closed'
  | 'alternative_breathe'
  | 'alternative_reflect'
  | 'alternative_grounding';

export type ReflectionReason =
  | 'relax'
  | 'connect'
  | 'distraction'
  | 'info'
  | 'habit'
  | 'unsure';

export interface InterceptionEvent {
  id: string;
  ts: number; // epoch ms
  appPackage: string;
  appLabel: string;
  action: InterceptionAction;
  reason?: ReflectionReason;
  durationMs?: number;
  sessionId?: string;
}

// Weekly statistics
export interface WeeklyStats {
  pausesTotal: number;
  openedAnyway: number;
  closedCount: number;
  alternativeBreathed: number;
  alternativeReflected: number;
  alternativeGrounded: number;
  totalMindfulMinutes: number;
}
