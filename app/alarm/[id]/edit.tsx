import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { AlarmFormScreen } from '@/src/components/AlarmFormScreen';
import { getAlarmById, updateAlarm } from '@/src/db/alarms';
import type { Alarm } from '@/src/missions/types';

export default function EditAlarmScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const alarm = id ? (getAlarmById(id) as Alarm | null) : null;

  function handleSubmit(updatedAlarm: Alarm) {
    updateAlarm({
      ...updatedAlarm,
      updatedAt: Date.now(),
    });

    router.back();
  }

  if (!alarm) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Alarm not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.button, { backgroundColor: colors.primaryDim }]}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AlarmFormScreen
      title="EDIT ALARM"
      ctaLabel="EDIT ALARM"
      submitLabel="Save"
      initialAlarm={alarm}
      onCancel={() => router.back()}
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '600' },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
