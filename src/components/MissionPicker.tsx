import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';

type MissionType = 'photo' | 'steps' | 'typing';

interface AlarmMission {
  type: MissionType;
  config: any;
}

interface MissionPickerProps {
  missions: AlarmMission[];
  onChange: (missions: AlarmMission[]) => void;
  photoMissionDraftKey: string;
}

const MISSION_CARDS: Array<{
  type: MissionType;
  label: string;
  description: string;
}> = [
  { type: 'photo', label: 'Photo Match', description: 'Take a photo matching your target' },
  { type: 'steps', label: 'Step Count', description: 'Walk a set number of steps' },
  { type: 'typing', label: 'Typing Challenge', description: 'Type out a passage accurately' },
];

const TYPING_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'short', label: 'Short' },
  { key: 'medium', label: 'Medium' },
  { key: 'long', label: 'Long' },
];

const DEFAULT_CONFIGS: Record<MissionType, any> = {
  steps: { targetSteps: 25 },
  typing: { passageLength: 'medium' },
  photo: { targetPhotoUri: '' },
};

const STEP_MIN = 5;
const STEP_MAX = 200;
const STEP_INCREMENT = 5;

type CardKey = 'no-mission' | MissionType;
interface StepInputProps {
  value: number;
  colors: any;
  onCommit: (value: number) => void;
}

function StepInput({ value, colors, onCommit }: StepInputProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onEndEditing={(e) => {
        const n = parseInt(e.nativeEvent.text, 10);
        const clamped = isNaN(n) ? STEP_MIN : Math.min(STEP_MAX, Math.max(STEP_MIN, n));
        onCommit(clamped);
      }}
      keyboardType="number-pad"
      selectTextOnFocus={true}
      maxLength={3}
      style={[stepInputStyle, { color: colors.text, borderBottomColor: colors.primary }]}
    />
  );
}

const stepInputStyle = StyleSheet.create({
  input: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
}).input;

export function MissionPicker({ missions, onChange, photoMissionDraftKey }: MissionPickerProps) {
  const { colors } = useTheme();

  // Per-card scale shared values — one per card key, initialized once
  const noMissionScale = useSharedValue(1);
  const photoScale = useSharedValue(1);
  const stepsScale = useSharedValue(1);
  const typingScale = useSharedValue(1);

  const scalesRef = useRef<Record<CardKey, SharedValue<number>>>({
    'no-mission': noMissionScale,
    photo: photoScale,
    steps: stepsScale,
    typing: typingScale,
  });

  const noMissionAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: noMissionScale.value }] }));
  const photoAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: photoScale.value }] }));
  const stepsAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: stepsScale.value }] }));
  const typingAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: typingScale.value }] }));

  const animStyles: Record<CardKey, any> = {
    'no-mission': noMissionAnimStyle,
    photo: photoAnimStyle,
    steps: stepsAnimStyle,
    typing: typingAnimStyle,
  };

  function triggerCardSpring(key: CardKey) {
    const sv = scalesRef.current[key];
    sv.value = withTiming(1.025, { duration: 80, easing: Easing.out(Easing.quad) }, () => {
      'worklet';
      sv.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
    });
  }

  const noMissionSelected = missions.length === 0;

  function isMissionSelected(type: MissionType): boolean {
    return missions.some((m) => m.type === type);
  }

  function getMission(type: MissionType): AlarmMission | undefined {
    return missions.find((m) => m.type === type);
  }

  function toggleMission(type: MissionType) {
    triggerCardSpring(type);
    if (isMissionSelected(type)) {
      onChange(missions.filter((m) => m.type !== type));
    } else {
      onChange([...missions, { type, config: DEFAULT_CONFIGS[type] }]);
    }
  }

  function selectNoMission() {
    triggerCardSpring('no-mission');
    onChange([]);
  }

  function updateMissionConfig(type: MissionType, config: any) {
    onChange(missions.map((m) => (m.type === type ? { ...m, config } : m)));
  }

  function adjustSteps(delta: number) {
    const mission = getMission('steps');
    if (!mission) return;
    const current = mission.config?.targetSteps ?? 25;
    const next = Math.min(STEP_MAX, Math.max(STEP_MIN, current + delta));
    updateMissionConfig('steps', { ...mission.config, targetSteps: next });
  }

  function selectTypingLength(length: string) {
    updateMissionConfig('typing', { passageLength: length });
  }

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      {/* No Mission card */}
      <Animated.View
        style={[
          s.card,
          {
            borderColor: noMissionSelected ? colors.primary : colors.border,
            backgroundColor: noMissionSelected ? `${colors.primary}1A` : colors.surface,
          },
          animStyles['no-mission'],
        ]}
      >
        <Pressable onPress={selectNoMission}>
          <View style={s.cardHeader}>
            <View>
              <Text style={[s.cardTitle, { color: noMissionSelected ? colors.primary : colors.text }]}>
                No Mission
              </Text>
              <Text style={[s.cardDesc, { color: colors.textSecondary }]}>
                Dismiss alarm freely
              </Text>
            </View>
            {noMissionSelected && (
              <View style={[s.badge, { backgroundColor: colors.primary }]}>
                <Text style={s.badgeText}>✓</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>

      {/* Mission cards */}
      {MISSION_CARDS.map((opt) => {
        const selected = isMissionSelected(opt.type);
        const mission = getMission(opt.type);

        return (
          <Animated.View
            key={opt.type}
            style={[
              s.card,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? `${colors.primary}1A` : colors.surface,
              },
              animStyles[opt.type],
            ]}
          >
            <Pressable onPress={() => toggleMission(opt.type)}>
              {selected && (
                <View style={[s.badge, { backgroundColor: colors.primary }]}>
                  <Text style={s.badgeText}>✓</Text>
                </View>
              )}
              <View style={s.cardHeader}>
                <View>
                  <Text style={[s.cardTitle, { color: selected ? colors.primary : colors.text }]}>
                    {opt.label}
                  </Text>
                  <Text style={[s.cardDesc, { color: colors.textSecondary }]}>
                    {opt.description}
                  </Text>
                </View>
              </View>
            </Pressable>

            {selected && mission && (
              <>
                <View style={[s.divider, { backgroundColor: colors.border }]} />
                <View style={s.configRow}>
                  {opt.type === 'steps' && (
                    <View style={s.configContent}>
                      <Text style={[s.configLabel, { color: colors.textSecondary }]}>
                        Target steps
                      </Text>
                      <View style={s.stepControls}>
                        <Pressable
                          onPress={() => adjustSteps(-STEP_INCREMENT)}
                          style={[s.stepBtn, { borderColor: colors.primary }]}
                        >
                          <Text style={[s.stepBtnText, { color: colors.primary }]}>−</Text>
                        </Pressable>
                        <StepInput
                          value={mission.config?.targetSteps ?? 25}
                          colors={colors}
                          onCommit={(n) =>
                            updateMissionConfig('steps', { ...mission.config, targetSteps: n })
                          }
                        />
                        <Pressable
                          onPress={() => adjustSteps(STEP_INCREMENT)}
                          style={[s.stepBtn, { borderColor: colors.primary }]}
                        >
                          <Text style={[s.stepBtnText, { color: colors.primary }]}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {opt.type === 'typing' && (
                    <View style={s.configContent}>
                      <Text style={[s.configLabel, { color: colors.textSecondary }]}>
                        Passage length
                      </Text>
                      <View style={s.typingRow}>
                        {TYPING_OPTIONS.map((topt) => {
                          const active = (mission.config?.passageLength ?? 'medium') === topt.key;
                          return (
                            <Pressable
                              key={topt.key}
                              onPress={() => selectTypingLength(topt.key)}
                              style={[
                                s.typingBtn,
                                {
                                  backgroundColor: active ? colors.primary : colors.surface,
                                  borderColor: active ? colors.primary : colors.border,
                                },
                              ]}
                            >
                              <Text style={[s.typingBtnText, { color: active ? '#FFFFFF' : colors.text }]}>
                                {topt.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {opt.type === 'photo' && (
                    <View style={s.configContent}>
                      <View style={s.photoSetupRow}>
                        {mission.config?.targetPhotoUri ? (
                          <Image
                            source={{ uri: mission.config.targetPhotoUri }}
                            style={s.photoThumb}
                          />
                        ) : (
                          <View style={[s.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <Text style={[s.photoPlaceholderIcon, { color: colors.textSecondary }]}>📷</Text>
                          </View>
                        )}
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/photo-register',
                              params: {
                                draftKey: photoMissionDraftKey,
                                currentUri: mission.config?.targetPhotoUri ?? '',
                              },
                            })
                          }
                          style={[s.setupPhotoBtn, { borderColor: colors.primary }]}
                        >
                          <Text style={[s.setupPhotoBtnText, { color: colors.primary }]}>
                            Setup Photo
                          </Text>
                        </Pressable>
                      </View>
                      <Text style={[s.configNote, { color: colors.textSecondary }]}>
                        Register the target photo before the alarm rings.
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => {
                      if (opt.type === 'photo') {
                        router.push({
                          pathname: '/mission/photo',
                          params: {
                            targetPhotoUri: mission.config?.targetPhotoUri ?? '',
                          },
                        });
                        return;
                      }

                      if (opt.type === 'steps') {
                        router.push({
                          pathname: '/mission/steps',
                          params: {
                            targetSteps: String(mission.config?.targetSteps ?? 25),
                          },
                        });
                        return;
                      }

                      router.push({
                        pathname: '/mission/typing',
                        params: {
                          passageLength: mission.config?.passageLength ?? 'medium',
                        },
                      });
                    }}
                    style={[s.tryBtn, { borderColor: colors.primary }]}
                  >
                    <Text style={[s.tryBtnText, { color: colors.primary }]}>Try →</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { gap: 8 },
    card: { borderRadius: 12, borderWidth: 1, padding: 14 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardDesc: { fontSize: 12, marginTop: 2 },
    badge: {
      width: 22, height: 22, borderRadius: 11,
      alignItems: 'center', justifyContent: 'center',
      position: 'absolute', top: -8, right: -8,
    },
    badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', lineHeight: 14 },
    divider: { height: 1, marginVertical: 10 },
    configRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    configContent: { flex: 1 },
    configLabel: {
      fontSize: 11, fontWeight: '600', marginBottom: 8,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    stepControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepBtn: { width: 32, height: 32, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    stepBtnText: { fontSize: 18, fontWeight: '600', lineHeight: 20 },
    typingRow: { flexDirection: 'row', gap: 6 },
    typingBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
    typingBtnText: { fontSize: 13, fontWeight: '600' },
    configNote: { fontSize: 13, lineHeight: 18, marginTop: 6 },
    photoSetupRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    photoThumb: { width: 48, height: 48, borderRadius: 6 },
    photoPlaceholder: {
      width: 48, height: 48, borderRadius: 6, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    photoPlaceholderIcon: { fontSize: 22 },
    setupPhotoBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    setupPhotoBtnText: { fontSize: 13, fontWeight: '600' },
    tryBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-end' },
    tryBtnText: { fontSize: 13, fontWeight: '600' },
  });
}
