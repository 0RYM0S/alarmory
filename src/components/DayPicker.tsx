import React, { useRef, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, PanResponder, GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';

interface DayPickerProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  renderDateChip?: () => React.ReactNode;
}

interface DayCircleProps {
  label: string;
  selected: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

function DayCircle({ label, selected, colors }: DayCircleProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    scale.value = withTiming(1.1, { duration: 70, easing: Easing.out(Easing.quad) }, () => {
      'worklet';
      scale.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) });
    });
  }, [selected]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animStyle,
        styles.circle,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? '#FFFFFF' : colors.textSecondary }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const WORK_WEEK = [0, 1, 2, 3, 4];

export function DayPicker({ selectedDays, onChange, renderDateChip }: DayPickerProps) {
  const { colors } = useTheme();

  const panStartRef = useRef<'add' | 'remove' | null>(null);
  const containerRef = useRef<View>(null);
  const selectionRef = useRef<number[]>(selectedDays);
  const containerWidthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const dragStartXRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => { selectionRef.current = selectedDays; }, [selectedDays]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const getDayIndex = (locationX: number): number => {
    const width = containerWidthRef.current;
    if (width === 0) return 0;
    const idx = Math.floor(locationX / (width / 7));
    return Math.max(0, Math.min(6, idx));
  };

  const toggleDay = (dayIdx: number, adding: boolean) => {
    const current = [...selectionRef.current];
    const includes = current.includes(dayIdx);
    if (adding && !includes) {
      current.push(dayIdx);
      current.sort((a, b) => a - b);
      selectionRef.current = current;
      onChangeRef.current(current);
    } else if (!adding && includes) {
      selectionRef.current = current.filter((d) => d !== dayIdx);
      onChangeRef.current(selectionRef.current);
    }
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt: GestureResponderEvent) => {
      dragStartXRef.current = evt.nativeEvent.locationX;
      isDraggingRef.current = false;
      const idx = getDayIndex(evt.nativeEvent.locationX);
      const adding = !selectionRef.current.includes(idx);
      panStartRef.current = adding ? 'add' : 'remove';
      toggleDay(idx, adding);
    },
    onPanResponderMove: (evt: GestureResponderEvent) => {
      if (panStartRef.current === null) return;
      const dx = Math.abs(evt.nativeEvent.locationX - dragStartXRef.current);
      if (dx > 8) isDraggingRef.current = true;
      if (!isDraggingRef.current) return;
      const idx = getDayIndex(evt.nativeEvent.locationX);
      toggleDay(idx, panStartRef.current === 'add');
    },
    onPanResponderRelease: () => {
      panStartRef.current = null;
      isDraggingRef.current = false;
    },
  })).current;

  const selectEveryDay = () => { onChange(isEveryDayActive ? [] : EVERY_DAY); };
  const selectWorkWeek = () => { onChange(isWorkWeekActive ? [] : WORK_WEEK); };

  const isEveryDayActive = selectedDays.length === 7 && EVERY_DAY.every((d) => selectedDays.includes(d));
  const isWorkWeekActive = selectedDays.length === 5 && WORK_WEEK.every((d) => selectedDays.includes(d));

  return (
    <View>
      <View style={styles.buttonsContainer}>
        <Pressable
          onPress={selectEveryDay}
          style={[styles.chipButton, { backgroundColor: isEveryDayActive ? colors.primary : colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.chipLabel, { color: isEveryDayActive ? '#FFFFFF' : colors.textSecondary }]}>Every day</Text>
        </Pressable>
        <Pressable
          onPress={selectWorkWeek}
          style={[styles.chipButton, { backgroundColor: isWorkWeekActive ? colors.primary : colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.chipLabel, { color: isWorkWeekActive ? '#FFFFFF' : colors.textSecondary }]}>Work week</Text>
        </Pressable>
        {renderDateChip && renderDateChip()}
      </View>
      <View
        ref={containerRef}
        style={styles.row}
        onLayout={(e) => { containerWidthRef.current = e.nativeEvent.layout.width; }}
        {...panResponder.panHandlers}
      >
        {DAY_LABELS.map((label, index) => (
          <DayCircle
            key={index}
            label={label}
            selected={selectedDays.includes(index)}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chipButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 12, fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  circle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600' },
});
