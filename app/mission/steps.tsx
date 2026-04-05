import { useEffect, useRef, useState } from 'react';
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

// ── Color tokens (always dark) ────────────────────────────────────────────────
const C = {
  background: '#0E0E0E',
  surfaceContainer: '#1A1919',
  surfaceContainerHighest: '#262626',
  primary: '#A8A4FF',
  primaryDim: '#675DF9',
  onSurface: '#FFF',
  onSurfaceVariant: '#ADAAAA',
  tertiary: '#FF7075',
  success: '#2ED573',
  text: '#FFF',
  textSecondary: '#ADAAAA',
} as const;

// ── Progress Ring (pure RN donut) ─────────────────────────────────────────────
const RING_SIZE = 288;
const RING_THICKNESS = 18;
const INNER_SIZE = RING_SIZE - RING_THICKNESS * 2;

interface ProgressRingProps {
  progress: number; // 0–1
}

function ProgressRing({ progress }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  // We render the donut using two half-circle masks (left + right arcs),
  // revealing a gradient ring beneath a background circle overlay.
  //
  // Architecture:
  //   Outer ring (surfaceContainerHighest track, full circle)
  //     └─ LinearGradient fill (primary→primaryDim), clipped by progress mask
  //     └─ Inner cutout (background color, centered)
  //
  // Progress mask: split into right half and left half.
  //   • 0–50%: only right half rotates; left half stays hidden
  //   • 50–100%: right half fully shown; left half rotates to reveal remainder
  const rightDeg = clamped <= 0.5 ? clamped * 2 * 180 : 180;
  const leftDeg = clamped > 0.5 ? (clamped - 0.5) * 2 * 180 : 0;

  return (
    <View style={ringStyles.root}>
      {/* Track circle */}
      <View style={ringStyles.track} />

      {/* Progress arc — right half */}
      <View style={[ringStyles.halfWrapper, ringStyles.rightWrapper]}>
        <View
          style={[
            ringStyles.halfMask,
            ringStyles.rightHalf,
            { transform: [{ rotate: `${rightDeg}deg` }] },
          ]}
        >
          <LinearGradient
            colors={[C.primaryDim, C.primary]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={ringStyles.gradientFill}
          />
        </View>
      </View>

      {/* Progress arc — left half (only visible past 50%) */}
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
              colors={[C.primaryDim, C.primary]}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={ringStyles.gradientFill}
            />
          </View>
        </View>
      )}

      {/* Inner cutout */}
      <View style={ringStyles.innerCutout} />
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
    backgroundColor: C.surfaceContainerHighest,
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
    backgroundColor: C.background,
  },
});

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  accentLeft?: boolean;
}

function StatCard({ icon, iconColor, label, value, accentLeft }: StatCardProps) {
  return (
    <View style={[cardStyles.card, accentLeft && cardStyles.accentLeft]}>
      <MaterialIcons name={icon} size={20} color={iconColor} style={cardStyles.icon} />
      <Text style={cardStyles.label}>{label}</Text>
      <Text style={cardStyles.value}>{value}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  accentLeft: {
    borderLeftWidth: 3,
    borderLeftColor: C.primaryDim,
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
  },
});

// ── Elapsed time helper ───────────────────────────────────────────────────────
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function StepMissionScreen() {
  const router = useRouter();
  const { targetSteps, alarmId: _alarmId } = useLocalSearchParams<{
    targetSteps: string;
    alarmId: string;
  }>();
  const target = parseInt(targetSteps || '25', 10);

  const [stepCount, setStepCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // TODO: subscribe to expo-sensors Pedometer here in Stage 8
  // Example:
  //   Pedometer.watchStepCount(result => setStepCount(result.steps));

  // Completion check
  useEffect(() => {
    if (stepCount >= target) {
      onMissionComplete();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepCount, target]);

  function onMissionComplete() {
    // TODO: notify alarm service mission complete
    router.back();
  }

  function onEmergencyStop() {
    // TODO: allow dismissal with penalty
    router.back();
  }

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.microLabel}>ACTIVE MISSION</Text>
          <Text style={styles.heading}>Step Counter</Text>
        </View>

        {/* Progress ring + center text */}
        <View style={styles.ringSection}>
          <ProgressRing progress={progress} />

          {/* Center content — overlaid absolutely */}
          <View style={styles.ringCenter}>
            <View style={styles.stepCountRow}>
              <Text style={styles.stepCountBig}>{stepCount}</Text>
              <Text style={styles.stepTarget}>/ {target}</Text>
            </View>
            <Text style={styles.stepsTakenLabel}>STEPS TAKEN</Text>
          </View>
        </View>

        {/* Status message */}
        <View style={styles.statusSection}>
          <Text style={styles.statusMessage}>{statusMessage}</Text>
          <Text style={styles.statusSubtitle}>{statusSubtitle}</Text>
        </View>

        {/* Stat cards */}
        <View style={styles.statRow}>
          <StatCard
            icon="directions-walk"
            iconColor={C.primary}
            label="Cadence"
            value="—"
            accentLeft
          />
          {/* TODO: compute cadence from step rate in Stage 8 */}
          <View style={styles.statGap} />
          <StatCard
            icon="timer"
            iconColor={C.tertiary}
            label="Elapsed"
            value={formatElapsed(elapsed)}
          />
        </View>

        {/* Emergency stop */}
        <View style={styles.emergencyWrapper}>
          <Pressable
            onPress={onEmergencyStop}
            style={({ pressed }) => [
              styles.emergencyButton,
              pressed && styles.emergencyButtonPressed,
            ]}
          >
            <Text style={styles.emergencyText}>Emergency Stop</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  microLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.textSecondary,
    marginBottom: 6,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
  },

  // Ring
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
    color: C.text,
    lineHeight: 72,
  },
  stepTarget: {
    fontSize: 22,
    fontWeight: '500',
    color: C.textSecondary,
    marginBottom: 8,
  },
  stepsTakenLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.primary,
    marginTop: 2,
  },

  // Status
  statusSection: {
    alignItems: 'center',
    marginBottom: 36,
    paddingHorizontal: 16,
  },
  statusMessage: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Stat cards
  statRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 'auto',
  },
  statGap: {
    width: 12,
  },

  // Emergency stop
  emergencyWrapper: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: `${C.surfaceContainerHighest}88`,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  emergencyButtonPressed: {
    opacity: 0.7,
  },
  emergencyText: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
