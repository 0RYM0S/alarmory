import { Alarm } from '../missions/types';

// Format hour/minute to "HH:MM", e.g. "07:30"
export function formatAlarmTime(hour: number, minute: number): string {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Compute next fire time in ms from now given hour, minute, repeatDays
// If repeatDays is empty, fire on the next occurrence of that time (today if not yet passed, else tomorrow)
// If repeatDays has values, find the next matching day
export function computeNextFireTime(hour: number, minute: number, repeatDays: number[]): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (repeatDays.length === 0) {
    // One-time: if time already passed today, schedule tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }

  // Find next matching weekday
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    candidate.setHours(hour, minute, 0, 0);
    const day = candidate.getDay(); // 0=Sun
    if (repeatDays.includes(day) && candidate > now) {
      return candidate.getTime();
    }
  }
  // Fallback: same time tomorrow
  target.setDate(target.getDate() + 1);
  return target.getTime();
}

// Format a countdown from now to a future timestamp
// Returns e.g. "in 6h 30m" or "in 45m"
export function formatCountdown(nextFireTime: number): string {
  const diff = nextFireTime - Date.now();
  if (diff <= 0) return 'Now';
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

// Format repeat days as short string, e.g. "Mon, Wed, Fri" or "Weekdays" or "Every day" or "Once"
export function formatRepeatDays(days: number[]): string {
  if (days.length === 0) return 'Once';
  if (days.length === 7) return 'Every day';
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  if (weekdays.every(d => days.includes(d)) && days.length === 5) return 'Weekdays';
  if (weekend.every(d => days.includes(d)) && days.length === 2) return 'Weekends';
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.sort((a, b) => a - b).map(d => names[d]).join(', ');
}
