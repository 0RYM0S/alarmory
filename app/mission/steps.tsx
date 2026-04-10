import { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/src/hooks/useTheme';
import type { ThemeColors } from '@/constants/Colors';

const RING_SIZE = 288;
const RING_THICKNESS = 18;
const INNER_SIZE = RING_SIZE - RING_THICKNESS * 2;

interface ProgressRingProps {
  progress: number;
  palette: ThemeColors;
}

function ProgressRing({ progress, palette }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const rightDeg = clamped <= 0.5 ? clamped * 2 * 180 : 180;
  const leftDeg = clamped > 0.5 ? (clamped - 0.5) * 2 * 180 : 0;

  return (
    <View style={ringStyles.root}>
      <View style={[ringStyles.track, { backgroundColor: palette.surfaceContainerHighest }]} />

      <View style={[ringStyles.halfWrapper, ringStyles.rightWrapper]}>
        <View
          style={[
            ringStyles.halfMask,
            ringStyles.rightHalf,
            { transform: [{ rotate: `${rightDeg}deg` }] },
          ]}
        >
          <LinearGradient
            colors={[palette.primaryDim, palette.primary]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={ringStyles.gradientFill}
          />
        </View>
      </View>

      {clamped > 0.5 && (
        <View style={[ringStyles.halfWrapper, ringStyles.leftWrapper]}>
          <View
            style={[
              ringStyles.halfMask,
              ringStyles.leftHalf,
              { transform: [{ rotate: `${leftDeg}deg` }] },
            ]}
          >
            <LinearGradient
              colors={[palette.primaryDim, palette.primary]}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={ringStyles.gradientFill}
            />
          </View>
        </View>
      )}

      <View style={[ringStyles.innerCutout, { backgroundColor: palette.background }]} />
    </View>
  );
}

const ringStyles = StyleSheet.create({
  root: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
  },
  halfWrapper: {
    position: 'absolute',
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  rightWrapper: {
    right: 0,
  },
  leftWrapper: {
    left: 0,
  },
  halfMask: {
    position: 'absolute',
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  rightHalf: {
    right: 0,
    transformOrigin: 'left center',
  },
  leftHalf: {
    left: 0,
    transformOrigin: 'right center',
  },
  gradientFill: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
  },
  innerCutout: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
  },
});

interface StatCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  accentLeft?: boolean;
  palette: ThemeColors;
}

function StatCard({ icon, iconColor, label, value, accentLeft, palette }: StatCardProps) {
  return (
    <View
      style={[
        cardStyles.card,
        { backgroundColor: palette.surfaceContainer },
        accentLeft && { borderLeftWidth: 3, borderLeftColor: palette.primaryDim },
      ]}
    >
      <MaterialIcons name={icon} size={20} color={iconColor} style={cardStyles.icon} />
      <Text style={[cardStyles.label, { color: palette.onSurfaceVariant }]}>{label}</Text>
      <Text style={[cardStyles.value, { color: palette.onSurface }]}>{value}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
});

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function StepMissionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { targetSteps, alarmId: _alarmId } = useLocalSearchParams<{
    targetSteps: string;
    alarmId: string;
  }>();
  const target = parseInt(targetSteps || '25', 10);

  const [stepCount, setStepCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (stepCount >= target) {
      router.back();
    }
  }, [router, stepCount, target]);

  const progress = Math.min(1, stepCount / target);
  const remaining = Math.max(0, target - stepCount);
  const isComplete = stepCount >= target;

  const statusMessage = isComplete
    ? 'Mission complete!'
    : stepCount === 0
      ? 'Start walking...'
      : 'Keep walking...';

  const statusSubtitle = isComplete
    ? 'Great job! Alarm dismissed.'
    : `${remaining} more step${remaining !== 1 ? 's' : ''} to deactivate the alarm.`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.microLabel, { color: colors.onSurfaceVariant }]}>ACTIVE MISSION</Text>
          <Text style={[styles.heading, { color: colors.onSurface }]}>Step Counter</Text>
        </View>

        <View style={styles.ringSection}>
          <ProgressRing progress={progress} palette={colors} />
          <View style={styles.ringCenter}>
            <View style={styles.stepCountRow}>
              <Text style={[styles.stepCountBig, { color: colors.onSurface }]}>{stepCount}</Text>
              <Text style={[styles.stepTarget, { color: colors.onSurfaceVariant }]}>/ {target}</Text>
            </View>
            <Text style={[styles.stepsTakenLabel, { color: colors.primary }]}>STEPS TAKEN</Text>
          </View>
        </View>

        <View style={styles.statusSection}>
          <Text style={[styles.statusMessage, { color: colors.onSurface }]}>{statusMessage}</Text>
          <Text style={[styles.statusSubtitle, { color: colors.onSurfaceVariant }]}>{statusSubtitle}</Text>
        </View>

        <View style={styles.statRow}>
          <StatCard
            icon="directions-walk"
            iconColor={colors.primary}
            label="Cadence"
            value="-"
            accentLeft
            palette={colors}
          />
          <View style={styles.statGap} />
          <StatCard
            icon="timer"
            iconColor={colors.tertiary}
            label="Elapsed"
            value={formatElapsed(elapsed)}
            palette={colors}
          />
        </View>

        <View style={styles.emergencyWrapper}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.emergencyButton,
              { backgroundColor: `${colors.surfaceContainerHighest}88` },
              pressed && styles.emergencyButtonPressed,
            ]}
          >
            <Text style={[styles.emergencyText, { color: colors.onSurfaceVariant }]}>Emergency Stop</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  microLabel: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 6,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
  },
  ringSection: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  stepCountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  stepCountBig: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 72,
  },
  stepTarget: {
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 8,
  },
  stepsTakenLabel: {
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 2,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 36,
    paddingHorizontal: 16,
  },
  statusMessage: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 'auto',
  },
  statGap: {
    width: 12,
  },
  emergencyWrapper: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
  },
  emergencyButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  emergencyButtonPressed: {
    opacity: 0.7,
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
