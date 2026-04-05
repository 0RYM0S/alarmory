import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { Gradients } from '@/constants/Colors';

// Always-dark color tokens for this fullscreen overlay
const D = {
  background: '#0E0E0E',
  surface: '#1A1919',
  surfaceContainer: '#1A1919',
  surfaceContainerHighest: '#262626',
  primary: '#A8A4FF',
  primaryDim: '#675DF9',
  onPrimaryFixed: '#000000',
  text: '#FFFFFF',
  textSecondary: '#ADAAAA',
  border: '#484847',
  outlineVariant: '#484847',
} as const;

type MissionType = 'photo' | 'steps' | 'typing' | '';

interface MissionMeta {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
}

function getMissionMeta(type: MissionType): MissionMeta | null {
  switch (type) {
    case 'photo':
      return { icon: 'photo-camera', label: 'Photo Match' };
    case 'steps':
      return { icon: 'directions-walk', label: 'Step Count' };
    case 'typing':
      return { icon: 'keyboard', label: 'Typing Challenge' };
    default:
      return null;
  }
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Corner bracket component
function CornerBracket({
  position,
}: {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}) {
  const size = 20;
  const thickness = 1.5;
  const color = `${D.primary}28`; // ~16% opacity

  const isTop = position === 'topLeft' || position === 'topRight';
  const isLeft = position === 'topLeft' || position === 'bottomLeft';

  return (
    <View
      style={[
        styles.cornerBracket,
        isTop ? { top: 16 } : { bottom: 16 },
        isLeft ? { left: 16 } : { right: 16 },
        {
          width: size,
          height: size,
          borderTopWidth: isTop ? thickness : 0,
          borderBottomWidth: !isTop ? thickness : 0,
          borderLeftWidth: isLeft ? thickness : 0,
          borderRightWidth: !isLeft ? thickness : 0,
          borderColor: color,
        },
      ]}
    />
  );
}

export default function RingingScreen() {
  // useTheme for consistency even though we force dark tokens
  useTheme();

  const router = useRouter();
  const { alarmId, alarmLabel, snoozeDurationMins, missionType } =
    useLocalSearchParams<{
      alarmId: string;
      alarmLabel: string;
      snoozeDurationMins: string;
      missionType: string;
    }>();

  const [currentTime, setCurrentTime] = useState(formatTime(new Date()));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const resolvedLabel = alarmLabel || 'Alarm';
  const resolvedSnooze = snoozeDurationMins || '5';
  const resolvedMission = (missionType || '') as MissionType;
  const missionMeta = getMissionMeta(resolvedMission);

  function onStartMission() {
    // TODO: stop alarm sound, start mission
    switch (resolvedMission) {
      case 'photo':
        router.push({ pathname: '/mission/photo' });
        break;
      case 'steps':
        router.push({ pathname: '/mission/steps' });
        break;
      case 'typing':
        router.push({ pathname: '/mission/typing' });
        break;
      default:
        router.back();
        break;
    }
  }

  function onSnooze() {
    // TODO: reschedule alarm for now + snoozeDurationMins
    router.back();
  }

  const gradientColors = Gradients.dark.primary.colors as [string, string];

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Ambient glow background */}
      <View style={styles.ambientGlow} />

      {/* Vertical edge lines */}
      <LinearGradient
        colors={['transparent', `${D.primary}1A`, 'transparent']}
        style={styles.edgeLineLeft}
      />
      <LinearGradient
        colors={['transparent', `${D.primary}1A`, 'transparent']}
        style={styles.edgeLineRight}
      />

      {/* Corner brackets */}
      <CornerBracket position="topLeft" />
      <CornerBracket position="topRight" />
      <CornerBracket position="bottomLeft" />
      <CornerBracket position="bottomRight" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>

          {/* Top header */}
          <View style={styles.header}>
            <Text style={styles.systemLabel}>ALARMORY SYSTEM</Text>
            <View style={styles.headerDivider} />
          </View>

          {/* Hero time */}
          <Text style={styles.timeText}>{currentTime}</Text>

          {/* Alarm info */}
          <View style={styles.alarmInfo}>
            <Text style={styles.activeAlarmLabel}>ACTIVE ALARM</Text>
            <Text style={styles.alarmName} numberOfLines={2}>
              {resolvedLabel.toUpperCase()}
            </Text>
          </View>

          {/* Mission card */}
          {missionMeta !== null && (
            <View style={styles.missionCard}>
              <View style={styles.missionIconChip}>
                <MaterialIcons
                  name={missionMeta.icon}
                  size={20}
                  color={D.primary}
                />
              </View>
              <View style={styles.missionTextBlock}>
                <Text style={styles.missionCardHeading}>REQUIRED MISSION</Text>
                <Text style={styles.missionCardLabel}>{missionMeta.label}</Text>
              </View>
            </View>
          )}

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Footer buttons */}
          <View style={styles.footer}>
            {/* START MISSION button */}
            <Pressable
              onPress={onStartMission}
              style={({ pressed }) => [
                styles.startButtonOuter,
                pressed && styles.pressedOpacity,
              ]}
            >
              <LinearGradient
                colors={gradientColors}
                start={Gradients.dark.primary.start}
                end={Gradients.dark.primary.end}
                style={styles.startButtonGradient}
              >
                <MaterialIcons name="lock" size={22} color={D.onPrimaryFixed} />
                <Text style={styles.startButtonText}>START MISSION</Text>
              </LinearGradient>
            </Pressable>

            {/* SNOOZE button */}
            <Pressable
              onPress={onSnooze}
              style={({ pressed }) => [
                styles.snoozeButton,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.snoozeButtonText}>
                SNOOZE ({resolvedSnooze}M)
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: D.background,
  },
  ambientGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${D.primary}0D`, // ~5% opacity
    top: '20%',
    alignSelf: 'center',
    opacity: 0.6,
  },
  edgeLineLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
  },
  edgeLineRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1,
  },
  cornerBracket: {
    position: 'absolute',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  systemLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    color: D.primary,
    textTransform: 'uppercase',
  },
  headerDivider: {
    width: 32,
    height: 2,
    backgroundColor: D.primaryDim,
    borderRadius: 1,
  },

  // Time
  timeText: {
    fontSize: 84,
    fontWeight: '800',
    color: D.text,
    letterSpacing: -2,
    lineHeight: 90,
    textShadowColor: `${D.primary}4D`, // ~30% opacity
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },

  // Alarm info
  alarmInfo: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
    gap: 6,
  },
  activeAlarmLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2,
    color: D.textSecondary,
    textTransform: 'uppercase',
  },
  alarmName: {
    fontSize: 26,
    fontWeight: '800',
    color: D.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Mission card
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.surfaceContainer,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    alignSelf: 'stretch',
  },
  missionIconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${D.primary}1A`, // ~10% opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTextBlock: {
    flex: 1,
    gap: 2,
  },
  missionCardHeading: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: D.textSecondary,
    textTransform: 'uppercase',
  },
  missionCardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: D.text,
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Footer
  footer: {
    alignSelf: 'stretch',
    gap: 12,
  },

  // START MISSION button
  startButtonOuter: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  startButtonGradient: {
    height: 72,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: D.onPrimaryFixed,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // SNOOZE button
  snoozeButton: {
    height: 60,
    borderRadius: 32,
    backgroundColor: `${D.surfaceContainerHighest}80`, // ~50% opacity
    borderWidth: 1,
    borderColor: `${D.outlineVariant}4D`, // ~30% opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: D.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Shared pressed state
  pressedOpacity: {
    opacity: 0.8,
  },
});
