import { router } from 'expo-router';
import { AlarmFormScreen } from '@/src/components/AlarmFormScreen';
import { createAlarm } from '@/src/db/alarms';
import type { Alarm } from '@/src/missions/types';

export default function CreateAlarmScreen() {
  function handleSubmit(alarm: Alarm) {
    const now = Date.now();

    createAlarm({
      ...alarm,
      id: `alarm_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    });

    router.back();
  }

  return (
    <AlarmFormScreen
      title="NEW ALARM"
      ctaLabel="SET ALARM"
      submitLabel="Save"
      photoMissionDraftKey="alarm:create"
      onCancel={() => router.back()}
      onSubmit={handleSubmit}
    />
  );
}
