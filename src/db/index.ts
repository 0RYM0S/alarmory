import { openDatabaseSync } from 'expo-sqlite';
import { CREATE_ALARMS_TABLE, CREATE_SETTINGS_TABLE } from './schema';

export const db = openDatabaseSync('alarmory.db');

export function initDatabase(): void {
  db.execSync(CREATE_ALARMS_TABLE);
  db.execSync(CREATE_SETTINGS_TABLE);
}
