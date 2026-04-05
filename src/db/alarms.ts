import { db } from './index';

// Type definitions (copied locally as per instructions)
type MissionType = 'photo' | 'steps' | 'typing';

interface PhotoMissionConfig {
  targetPhotoUri: string;
}

interface StepsMissionConfig {
  targetSteps: number;
}

interface TypingMissionConfig {
  passageLength: 'short' | 'medium' | 'long';
}

interface AlarmMission {
  type: MissionType;
  config: PhotoMissionConfig | StepsMissionConfig | TypingMissionConfig;
}

export interface Alarm {
  id: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  repeatDays: number[];
  soundId: string;
  volume: number;
  gradualWake: boolean;
  gradualMinutes: number;
  snoozeEnabled: boolean;
  snoozeDuration: number;
  snoozeLimit: number;
  missions: AlarmMission[];
  preventDismiss: boolean;
  createdAt: number;
  updatedAt: number;
  nextFireTime: number;
}

// Helper function to convert database row to Alarm object
function rowToAlarm(row: any): Alarm {
  return {
    id: row.id,
    label: row.label,
    hour: row.hour,
    minute: row.minute,
    enabled: row.enabled === 1,
    repeatDays: JSON.parse(row.repeat_days),
    soundId: row.sound_id,
    volume: row.volume,
    gradualWake: row.gradual_wake === 1,
    gradualMinutes: row.gradual_minutes,
    snoozeEnabled: row.snooze_enabled === 1,
    snoozeDuration: row.snooze_duration,
    snoozeLimit: row.snooze_limit,
    missions: JSON.parse(row.missions),
    preventDismiss: row.prevent_dismiss === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    nextFireTime: row.next_fire_time,
  };
}

export function createAlarm(alarm: Alarm): void {
  db.runSync(
    `INSERT OR REPLACE INTO alarms (
      id, label, hour, minute, enabled, repeat_days, sound_id, volume,
      gradual_wake, gradual_minutes, snooze_enabled, snooze_duration,
      snooze_limit, missions, prevent_dismiss, created_at, updated_at,
      next_fire_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      alarm.id,
      alarm.label,
      alarm.hour,
      alarm.minute,
      alarm.enabled ? 1 : 0,
      JSON.stringify(alarm.repeatDays),
      alarm.soundId,
      alarm.volume,
      alarm.gradualWake ? 1 : 0,
      alarm.gradualMinutes,
      alarm.snoozeEnabled ? 1 : 0,
      alarm.snoozeDuration,
      alarm.snoozeLimit,
      JSON.stringify(alarm.missions),
      alarm.preventDismiss ? 1 : 0,
      alarm.createdAt,
      alarm.updatedAt,
      alarm.nextFireTime,
    ]
  );
}

export function updateAlarm(alarm: Alarm): void {
  const updatedAt = Date.now();
  db.runSync(
    `UPDATE alarms SET
      label = ?, hour = ?, minute = ?, enabled = ?, repeat_days = ?,
      sound_id = ?, volume = ?, gradual_wake = ?, gradual_minutes = ?,
      snooze_enabled = ?, snooze_duration = ?, snooze_limit = ?,
      missions = ?, prevent_dismiss = ?, updated_at = ?, next_fire_time = ?
    WHERE id = ?`,
    [
      alarm.label,
      alarm.hour,
      alarm.minute,
      alarm.enabled ? 1 : 0,
      JSON.stringify(alarm.repeatDays),
      alarm.soundId,
      alarm.volume,
      alarm.gradualWake ? 1 : 0,
      alarm.gradualMinutes,
      alarm.snoozeEnabled ? 1 : 0,
      alarm.snoozeDuration,
      alarm.snoozeLimit,
      JSON.stringify(alarm.missions),
      alarm.preventDismiss ? 1 : 0,
      updatedAt,
      alarm.nextFireTime,
      alarm.id,
    ]
  );
}

export function deleteAlarm(id: string): void {
  db.runSync('DELETE FROM alarms WHERE id = ?', [id]);
}

export function getAllAlarms(): Alarm[] {
  const rows = db.getAllSync(
    `SELECT * FROM alarms ORDER BY next_fire_time ASC, enabled DESC`
  );
  return rows.map((row: any) => rowToAlarm(row));
}

export function getAlarmById(id: string): Alarm | null {
  const row = db.getFirstSync('SELECT * FROM alarms WHERE id = ?', [id]);
  return row ? rowToAlarm(row) : null;
}

export function toggleAlarm(id: string, enabled: boolean): void {
  const updatedAt = Date.now();
  db.runSync(
    'UPDATE alarms SET enabled = ?, updated_at = ? WHERE id = ?',
    [enabled ? 1 : 0, updatedAt, id]
  );
}
