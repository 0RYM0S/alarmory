export type MissionType = "photo" | "steps" | "typing";

export interface PhotoMissionConfig {
  targetPhotoUri: string;
}

export interface StepsMissionConfig {
  targetSteps: number;
}

export interface TypingMissionConfig {
  passageLength: "short" | "medium" | "long";
}

export type MissionConfig = PhotoMissionConfig | StepsMissionConfig | TypingMissionConfig;

export interface AlarmMission {
  type: MissionType;
  config: MissionConfig;
}

export interface Alarm {
  id: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  repeatDays: number[];      // 0=Sun, 1=Mon, ... 6=Sat; empty = one-time
  soundId: string;
  volume: number;            // 0.0 - 1.0
  gradualWake: boolean;
  gradualMinutes: number;
  snoozeEnabled: boolean;
  snoozeDuration: number;    // minutes
  snoozeLimit: number;       // 0 = unlimited
  missions: AlarmMission[];
  preventDismiss: boolean;
  createdAt: number;
  updatedAt: number;
  nextFireTime: number;      // unix ms, computed
}

export interface AppSettings {
  theme: "dark" | "light" | "system";
  defaultSnoozeMins: number;
  bedtimeEnabled: boolean;
  bedtimeOffsetHours: number;
  blockVolumeKeys: boolean;
  persistAfterKill: boolean;
  restoreAfterReboot: boolean;
}

export const MISSION_LABELS: Record<MissionType, string> = {
  photo: "Photo Match",
  steps: "Step Count",
  typing: "Typing Challenge",
};

export const BUILT_IN_SOUNDS = [
  { id: "default", label: "Default" },
  { id: "gentle", label: "Gentle Rise" },
  { id: "digital", label: "Digital" },
  { id: "beep", label: "Beep" },
  { id: "alarm", label: "Classic Alarm" },
] as const;

export type SoundId = typeof BUILT_IN_SOUNDS[number]["id"];
