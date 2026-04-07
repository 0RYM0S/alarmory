import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { TimePicker } from '@/src/components/TimePicker';
import { DayPicker } from '@/src/components/DayPicker';
import { SoundPicker } from '@/src/components/SoundPicker';
import { MissionPicker } from '@/src/components/MissionPicker';
import { computeNextFireTime } from '@/src/utils/time';
import { Gradients, Shadows, ThemeColors } from '@/constants/Colors';
import type { Alarm, AlarmMission } from '@/src/missions/types';
import { getPhotoMissionDraft } from '@/src/state/photoMissionDraft';

interface AlarmFormScreenProps {
  title: string;
  ctaLabel: string;
  submitLabel?: string;
  initialAlarm?: Alarm | null;
  photoMissionDraftKey: string;
  onCancel: () => void;
  onSubmit: (alarm: Alarm) => void;
}

interface SnoozeChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}

function SnoozeChip({ label, active, onPress, colors }: SnoozeChipProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withTiming(0.93, { duration: 70, easing: Easing.out(Easing.quad) }, () => {
      'worklet';
      scale.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) });
    });
    onPress();
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.presetChip,
          {
            backgroundColor: active ? colors.primaryDim : colors.surfaceContainerHighest,
            borderColor: active ? colors.primaryDim : 'transparent',
          },
        ]}
      >
        <Text style={[styles.presetChipText, { color: active ? colors.onPrimary : colors.onSurface }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function inferSpecificDate(alarm: Alarm): Date | null {
  if (alarm.repeatDays.length > 0) return null;

  const computedNext = computeNextFireTime(alarm.hour, alarm.minute, []);
  const hasCustomDate = Math.abs(computedNext - alarm.nextFireTime) > 60000;

  return hasCustomDate ? new Date(alarm.nextFireTime) : null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const ITEM_H = 56;
const DATE_VISIBLE_ITEMS = 3;
const DATE_PICKER_HEIGHT = ITEM_H * DATE_VISIBLE_ITEMS;
const SNOOZE_PRESETS = [1, 5, 10, 20, 30, 60];

interface DatePickerModalProps {
  visible: boolean;
  initial: Date;
  animateFromStart: boolean;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  colors: any;
}

const DATE_PICKER_START = new Date(2026, 0, 1);

interface DateScrollColumnProps {
  items: (string | number)[];
  selected: number | string;
  onSelect: (v: any) => void;
  width: number;
  scrollRef: React.RefObject<ScrollView | null>;
  colors: any;
}

function DateScrollColumn({
  items,
  selected,
  onSelect,
  width,
  scrollRef,
  colors,
}: DateScrollColumnProps) {
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item === selected),
  );

  return (
    <View style={[datePickerStyles.columnWrapper, { width, height: DATE_PICKER_HEIGHT }]}>
      <View
        pointerEvents="none"
        style={[
          datePickerStyles.selectionBar,
          {
            backgroundColor: `${colors.primary}26`,
            top: ITEM_H,
          },
        ]}
      />
      <ScrollView
        ref={scrollRef}
        style={datePickerStyles.columnScroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        disableIntervalMomentum={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={datePickerStyles.columnContent}
        onMomentumScrollEnd={(e) => {
          const rawIndex = e.nativeEvent.contentOffset.y / ITEM_H;
          const nextIndex = Math.round(rawIndex);
          const clampedIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
          onSelect(items[clampedIndex]);
        }}
      >
        {items.map((item, itemIndex) => {
          const isSelected = itemIndex === selectedIndex;
          return (
            <View
              key={`${itemIndex}-${String(item)}`}
              style={datePickerStyles.item}
            >
              <Text
                style={[
                  datePickerStyles.itemText,
                  {
                    color: isSelected ? colors.primary : colors.onSurfaceVariant,
                    fontWeight: isSelected ? '700' : '400',
                    fontSize: isSelected ? 24 : 16,
                    opacity: isSelected ? 1 : 0.55,
                  },
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={datePickerStyles.gradientTop}>
        <LinearGradient colors={[colors.surfaceContainer, `${colors.surfaceContainer}00`]} style={datePickerStyles.flex} />
      </View>
      <View pointerEvents="none" style={datePickerStyles.gradientBottom}>
        <LinearGradient colors={[`${colors.surfaceContainer}00`, colors.surfaceContainer]} style={datePickerStyles.flex} />
      </View>
    </View>
  );
}

function DatePickerModal({ visible, initial, animateFromStart, onConfirm, onCancel, colors }: DatePickerModalProps) {
  const [today] = useState(() => new Date());
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState(today.getDate());
  const [selYear, setSelYear] = useState(today.getFullYear());

  const startYear = Math.min(DATE_PICKER_START.getFullYear(), initial.getFullYear(), today.getFullYear());
  const endYear = Math.max(today.getFullYear() + 2, initial.getFullYear());
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const clampedDay = Math.min(selDay, daysInMonth);
  const introIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const monthRef = useRef<ScrollView>(null);
  const dayRef = useRef<ScrollView>(null);
  const yearRef = useRef<ScrollView>(null);

  function syncColumns(date: Date, animated = false) {
    const nextMonth = date.getMonth();
    const nextDay = date.getDate();
    const nextYear = date.getFullYear();

    setSelMonth(nextMonth);
    setSelDay(nextDay);
    setSelYear(nextYear);

    scrollToIndex(monthRef, nextMonth, animated);
    scrollToIndex(dayRef, nextDay - 1, animated);
    scrollToIndex(yearRef, Math.max(0, years.indexOf(nextYear)), animated);
  }

  function scrollToIndex(
    scrollRef: React.RefObject<ScrollView | null>,
    index: number,
    animated: boolean,
  ) {
    scrollRef.current?.scrollTo({ y: index * ITEM_H, animated });
  }

  useEffect(() => {
    if (selDay <= daysInMonth) return;
    setSelDay(daysInMonth);
    scrollToIndex(dayRef, daysInMonth - 1, true);
  }, [daysInMonth, selDay]);

  useEffect(() => {
    if (!visible) return undefined;

    if (introIntervalRef.current) {
      clearInterval(introIntervalRef.current);
      introIntervalRef.current = null;
    }

    let introTimer: ReturnType<typeof setTimeout> | undefined;

    if (animateFromStart) {
      syncColumns(DATE_PICKER_START, false);
      introTimer = setTimeout(() => {
        const startMonth = DATE_PICKER_START.getMonth();
        const startDay = DATE_PICKER_START.getDate();
        const startYearValue = DATE_PICKER_START.getFullYear();
        const targetMonth = today.getMonth();
        const targetDay = today.getDate();
        const targetYearValue = today.getFullYear();
        const durationMs = 520;
        const frameMs = 16;
        let elapsedMs = 0;

        introIntervalRef.current = setInterval(() => {
          elapsedMs += frameMs;
          const linear = Math.min(elapsedMs / durationMs, 1);
          const eased = 1 - Math.pow(1 - linear, 3);

          syncColumns(
            new Date(
              Math.round(startYearValue + (targetYearValue - startYearValue) * eased),
              Math.round(startMonth + (targetMonth - startMonth) * eased),
              Math.round(startDay + (targetDay - startDay) * eased),
            ),
            false,
          );

          if (linear >= 1 && introIntervalRef.current) {
            clearInterval(introIntervalRef.current);
            introIntervalRef.current = null;
            syncColumns(today, false);
          }
        }, frameMs);
      }, 120);
    } else {
      introTimer = setTimeout(() => {
        syncColumns(initial, false);
      }, 50);
    }

    return () => {
      if (introTimer) clearTimeout(introTimer);
      if (introIntervalRef.current) {
        clearInterval(introIntervalRef.current);
        introIntervalRef.current = null;
      }
    };
  }, [visible, animateFromStart, initial, today]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={datePickerStyles.overlay}>
        <Pressable style={datePickerStyles.backdrop} onPress={onCancel} />
        <View style={[datePickerStyles.panel, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[datePickerStyles.title, { color: colors.onSurface }]}>SELECT DATE</Text>
          <View style={datePickerStyles.columns}>
            <DateScrollColumn
              items={MONTHS}
              selected={MONTHS[selMonth]}
              onSelect={(v: string) => setSelMonth(MONTHS.indexOf(v))}
              width={120}
              scrollRef={monthRef}
              colors={colors}
            />
            <DateScrollColumn
              items={days}
              selected={clampedDay}
              onSelect={(v: number) => setSelDay(v)}
              width={56}
              scrollRef={dayRef}
              colors={colors}
            />
            <DateScrollColumn
              items={years}
              selected={selYear}
              onSelect={(v: number) => setSelYear(v)}
              width={72}
              scrollRef={yearRef}
              colors={colors}
            />
          </View>
          <View style={datePickerStyles.actions}>
            <Pressable onPress={onCancel} style={[datePickerStyles.btn, { borderColor: colors.outlineVariant }]}>
              <Text style={[datePickerStyles.btnText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(new Date(selYear, selMonth, clampedDay))}
              style={[datePickerStyles.btn, { backgroundColor: colors.primaryDim, borderColor: colors.primaryDim }]}
            >
              <Text style={[datePickerStyles.btnText, { color: '#FFFFFF' }]}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SectionHeader({ label, colors }: { label: string; colors: ThemeColors }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.outlineVariant }]} />
    </View>
  );
}

export function AlarmFormScreen({
  title,
  ctaLabel,
  submitLabel = 'Save',
  initialAlarm,
  photoMissionDraftKey,
  onCancel,
  onSubmit,
}: AlarmFormScreenProps) {
  const { colors, isDark } = useTheme();

  const [hour, setHour] = useState(initialAlarm?.hour ?? 7);
  const [minute, setMinute] = useState(initialAlarm?.minute ?? 0);
  const [label, setLabel] = useState(initialAlarm?.label ?? '');
  const [labelFocused, setLabelFocused] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>(initialAlarm?.repeatDays ?? []);
  const [specificDate, setSpecificDate] = useState<Date | null>(initialAlarm ? inferSpecificDate(initialAlarm) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [soundId, setSoundId] = useState(initialAlarm?.soundId ?? 'default');
  const [gradualWake, setGradualWake] = useState(initialAlarm?.gradualWake ?? false);
  const [snoozeEnabled, setSnoozeEnabled] = useState(initialAlarm?.snoozeEnabled ?? true);
  const [snoozeDuration, setSnoozeDuration] = useState(initialAlarm?.snoozeDuration ?? 5);
  const [customSnooze, setCustomSnooze] = useState(() => {
    const value = initialAlarm?.snoozeDuration ?? 5;
    return !SNOOZE_PRESETS.includes(value);
  });
  const [customSnoozeInput, setCustomSnoozeInput] = useState(String(initialAlarm?.snoozeDuration ?? 5));
  const [missions, setMissions] = useState<AlarmMission[]>(initialAlarm?.missions ?? []);
  const [preventDismiss, setPreventDismiss] = useState(initialAlarm?.preventDismiss ?? false);

  useFocusEffect(
    React.useCallback(() => {
      const draftUri = getPhotoMissionDraft(photoMissionDraftKey);
      if (!draftUri) return;

      setMissions((currentMissions) =>
        currentMissions.map((mission) =>
          mission.type === 'photo'
            ? {
                ...mission,
                config: {
                  ...mission.config,
                  targetPhotoUri: draftUri,
                },
              }
            : mission,
        ),
      );
    }, [photoMissionDraftKey]),
  );

  function handleTimeChange(h: number, m: number) {
    setHour(h);
    setMinute(m);
  }

  function handleRepeatDaysChange(days: number[]) {
    setRepeatDays(days);
    setSpecificDate(null);
  }

  function handleSave() {
    const baseAlarm = initialAlarm ?? {
      id: '',
      label: 'Alarm',
      hour: 7,
      minute: 0,
      enabled: true,
      repeatDays: [],
      soundId: 'default',
      volume: 0.8,
      gradualWake: false,
      gradualMinutes: 2,
      snoozeEnabled: true,
      snoozeDuration: 5,
      snoozeLimit: 3,
      missions: [],
      preventDismiss: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nextFireTime: 0,
    } satisfies Alarm;

    let nextFireTime: number;
    if (specificDate) {
      const fireTime = new Date(specificDate);
      fireTime.setHours(hour, minute, 0, 0);
      nextFireTime = fireTime.getTime();
    } else {
      nextFireTime = computeNextFireTime(hour, minute, repeatDays);
    }

    onSubmit({
      ...baseAlarm,
      label: label.trim() || 'Alarm',
      hour,
      minute,
      repeatDays,
      soundId,
      gradualWake,
      snoozeEnabled,
      snoozeDuration,
      missions,
      preventDismiss,
      nextFireTime,
    });
  }

  const gradientConfig = isDark ? Gradients.dark.primary : Gradients.light.primary;
  const shadowConfig = isDark ? Shadows.dark.ambient : Shadows.light.ambient;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant + '33' }]}>
        <Pressable onPress={onCancel} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>{title}</Text>
        <Pressable onPress={handleSave} style={styles.headerBtn}>
          <Text style={[styles.headerBtnTextRight, { color: colors.primary }]}>{submitLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TimePicker hour={hour} minute={minute} onChange={handleTimeChange} />

        <SectionHeader label="LABEL" colors={colors} />
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Alarm label"
          placeholderTextColor={colors.onSurfaceVariant}
          onFocus={() => setLabelFocused(true)}
          onBlur={() => setLabelFocused(false)}
          style={[
            styles.labelInput,
            {
              backgroundColor: colors.surfaceContainer,
              color: colors.onSurface,
              borderColor: labelFocused ? colors.primaryDim : 'transparent',
              borderWidth: 1.5,
            },
          ]}
          returnKeyType="done"
          maxLength={40}
        />

        <SectionHeader label="REPEAT" colors={colors} />
        <DayPicker
          selectedDays={repeatDays}
          onChange={handleRepeatDaysChange}
          renderDateChip={() => (
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateChip,
                {
                  backgroundColor: specificDate ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.dateChipLabel, { color: specificDate ? '#FFFFFF' : colors.textSecondary }]}>
                {specificDate ? formatDate(specificDate) : 'Date'}
              </Text>
            </Pressable>
          )}
        />

        <DatePickerModal
          visible={showDatePicker}
          initial={specificDate ?? new Date()}
          animateFromStart={!specificDate}
          onConfirm={(date) => { setSpecificDate(date); setRepeatDays([]); setShowDatePicker(false); }}
          onCancel={() => setShowDatePicker(false)}
          colors={colors}
        />

        <SectionHeader label="SOUND" colors={colors} />
        <SoundPicker soundId={soundId} onChange={setSoundId} />

        <SectionHeader label="GRADUAL WAKE" colors={colors} />
        <View style={[styles.card, styles.cardRow, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.rowContent}>
            <Text style={[styles.rowTitle, { color: colors.onSurface }]}>Gradual Wake</Text>
            <Text style={[styles.rowDesc, { color: colors.onSurfaceVariant }]}>
              Volume ramps up over 2 minutes
            </Text>
          </View>
          <Switch
            value={gradualWake}
            onValueChange={setGradualWake}
            trackColor={{ true: colors.primaryDim, false: colors.border }}
            thumbColor="#FFFFFF"
          />
        </View>

        <SectionHeader label="SNOOZE" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.snoozeToggleRow}>
            <Text style={[styles.rowTitle, { color: colors.onSurface }]}>Enable snooze</Text>
            <Switch
              value={snoozeEnabled}
              onValueChange={setSnoozeEnabled}
              trackColor={{ true: colors.primaryDim, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>

          {snoozeEnabled && (
            <>
              <View style={[styles.cardDivider, { backgroundColor: colors.outlineVariant, opacity: 0.3 }]} />
              <View style={styles.presetsRow}>
                {SNOOZE_PRESETS.map((val) => {
                  const active = !customSnooze && snoozeDuration === val;
                  return (
                    <SnoozeChip
                      key={val}
                      label={`${val}m`}
                      active={active}
                      onPress={() => { setSnoozeDuration(val); setCustomSnooze(false); }}
                      colors={colors}
                    />
                  );
                })}
                <SnoozeChip
                  label="Custom"
                  active={customSnooze}
                  onPress={() => { setCustomSnooze(true); setCustomSnoozeInput(String(snoozeDuration)); }}
                  colors={colors}
                />
              </View>
              {customSnooze && (
                <View style={styles.customSnoozeRow}>
                  <TextInput
                    value={customSnoozeInput}
                    onChangeText={(t) => {
                      setCustomSnoozeInput(t);
                      const n = parseInt(t, 10);
                      if (!isNaN(n) && n > 0 && n <= 240) setSnoozeDuration(n);
                    }}
                    keyboardType="number-pad"
                    style={[
                      styles.customSnoozeInput,
                      {
                        color: colors.onSurface,
                        backgroundColor: colors.surfaceContainerHighest,
                        borderColor: 'transparent',
                      },
                    ]}
                    maxLength={3}
                  />
                  <Text style={[styles.customSnoozeUnit, { color: colors.onSurfaceVariant }]}>minutes</Text>
                </View>
              )}
            </>
          )}
        </View>

        <SectionHeader label="MISSION" colors={colors} />
        <MissionPicker
          missions={missions}
          onChange={setMissions}
          photoMissionDraftKey={photoMissionDraftKey}
        />

        <SectionHeader label="DISMISS" colors={colors} />
        <View style={[styles.card, styles.cardRow, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.rowContent}>
            <Text style={[styles.rowTitle, { color: colors.onSurface }]}>Require mission to dismiss</Text>
            <Text style={[styles.rowDesc, { color: colors.onSurfaceVariant }]}>
              Mission must be completed before alarm stops
            </Text>
          </View>
          <Switch
            value={preventDismiss}
            onValueChange={setPreventDismiss}
            trackColor={{ true: colors.primaryDim, false: colors.border }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>

      <View style={[styles.ctaContainer, { backgroundColor: colors.background }]}>
        <Pressable onPress={handleSave} style={styles.ctaPressable}>
          <LinearGradient
            colors={gradientConfig.colors as [string, string]}
            start={gradientConfig.start}
            end={gradientConfig.end}
            style={[styles.ctaGradient, shadowConfig]}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </LinearGradient>
        </Pressable>
        <SafeAreaView />
      </View>
    </KeyboardAvoidingView>
  );
}

const datePickerStyles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: { borderRadius: 20, padding: 24, width: 320, alignItems: 'center' },
  title: { fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 20 },
  columns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  columnWrapper: { overflow: 'hidden', position: 'relative' },
  columnScroll: { flex: 1 },
  columnContent: { paddingVertical: ITEM_H },
  selectionBar: { position: 'absolute', left: 0, right: 0, height: ITEM_H, borderRadius: 8, zIndex: 1 },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { textAlign: 'center' },
  gradientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, zIndex: 2 },
  gradientBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, zIndex: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '600' },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  headerBtn: { minWidth: 60 },
  headerBtnText: { fontSize: 16, fontWeight: '500' },
  headerBtnTextRight: { fontSize: 16, fontWeight: '500', textAlign: 'right' },
  scrollContent: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 10, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1, opacity: 0.3 },
  labelInput: { height: 52, borderRadius: 16, paddingHorizontal: 16, fontSize: 16 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateChipLabel: { fontSize: 12, fontWeight: '500' },
  card: { borderRadius: 16, padding: 20 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDivider: { height: 1, marginVertical: 16 },
  rowContent: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '500', letterSpacing: 0.4 },
  rowDesc: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  snoozeToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  presetChipText: { fontSize: 14, fontWeight: '600' },
  customSnoozeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
  customSnoozeInput: { width: 72, height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  customSnoozeUnit: { fontSize: 15 },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  ctaPressable: { borderRadius: 20, overflow: 'hidden' },
  ctaGradient: { height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
});
