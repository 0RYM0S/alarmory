import { db } from './index';

// Type definitions (copied locally as per instructions)
export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  defaultSnoozeMins: number;
  bedtimeEnabled: boolean;
  bedtimeOffsetHours: number;
  blockVolumeKeys: boolean;
  persistAfterKill: boolean;
  restoreAfterReboot: boolean;
}

const DEFAULTS: AppSettings = {
  theme: 'dark',
  defaultSnoozeMins: 5,
  bedtimeEnabled: false,
  bedtimeOffsetHours: 8,
  blockVolumeKeys: true,
  persistAfterKill: true,
  restoreAfterReboot: true,
};

export function getSetting<K extends keyof AppSettings>(
  key: K
): AppSettings[K] {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    key,
  ]);

  if (!row) {
    return DEFAULTS[key];
  }

  try {
    return JSON.parse(row.value);
  } catch {
    return DEFAULTS[key];
  }
}

export function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    key,
    JSON.stringify(value),
  ]);
}

export function getAppSettings(): AppSettings {
  return {
    theme: getSetting('theme'),
    defaultSnoozeMins: getSetting('defaultSnoozeMins'),
    bedtimeEnabled: getSetting('bedtimeEnabled'),
    bedtimeOffsetHours: getSetting('bedtimeOffsetHours'),
    blockVolumeKeys: getSetting('blockVolumeKeys'),
    persistAfterKill: getSetting('persistAfterKill'),
    restoreAfterReboot: getSetting('restoreAfterReboot'),
  };
}
