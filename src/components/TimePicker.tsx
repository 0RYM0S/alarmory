import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks/useTheme';

// ─── Constants ──────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 168
const PAD_ITEMS = (VISIBLE_ITEMS - 1) / 2; // 1 empty item top + bottom

// ─── Helpers ────────────────────────────────────────────────────────────────

function to12h(hour: number): { displayHour: number; isAM: boolean } {
  if (hour === 0) return { displayHour: 12, isAM: true };
  if (hour < 12) return { displayHour: hour, isAM: true };
  if (hour === 12) return { displayHour: 12, isAM: false };
  return { displayHour: hour - 12, isAM: false };
}

function to24h(displayHour: number, isAM: boolean): number {
  if (isAM) {
    return displayHour === 12 ? 0 : displayHour;
  } else {
    return displayHour === 12 ? 12 : displayHour + 12;
  }
}

// ─── ScrollColumn ────────────────────────────────────────────────────────────

interface ScrollColumnProps {
  values: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Width of the column — needed so gradients fill it correctly */
  width: number;
  formatLabel?: (value: number) => string;
}

function ScrollColumn({
  values,
  selectedIndex,
  onSelect,
  width,
  formatLabel,
}: ScrollColumnProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  // Track whether the initial scroll has fired so we don't fight user drags
  const didInitialScroll = useRef(false);

  // Re-scroll whenever the selectedIndex changes from the outside (e.g. AM/PM
  // toggle, or 24h mode switch rebuilding the values array).
  useEffect(() => {
    const y = selectedIndex * ITEM_HEIGHT;
    if (!didInitialScroll.current) {
      // First mount: use setTimeout to allow layout to complete on Android
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y, animated: false });
      }, 50);
      didInitialScroll.current = true;
    } else {
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const rawIndex = e.nativeEvent.contentOffset.y / ITEM_HEIGHT;
      const index = Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(index, values.length - 1));
      onSelect(clamped);
    },
    [values.length, onSelect],
  );

  const label = formatLabel ?? ((v: number) => String(v).padStart(2, '0'));

  return (
    <View style={[styles.columnWrapper, { width, height: PICKER_HEIGHT }]}>
      {/* Selection highlight bar */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionBar,
          {
            backgroundColor: colors.primary + '26', // ~15% opacity
            top: PAD_ITEMS * ITEM_HEIGHT,
          },
        ]}
      />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        // Snap alignment – contentInset not needed because we pad with empty items
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
      >
        {/* Top padding item */}
        <View style={styles.padItem} />

        {values.map((value, index) => {
          const isSelected = index === selectedIndex;
          return (
            <View key={value} style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  isSelected
                    ? [styles.itemTextSelected, { color: colors.primary }]
                    : [styles.itemTextUnselected, { color: colors.textTertiary }],
                ]}
              >
                {label(value)}
              </Text>
            </View>
          );
        })}

        {/* Bottom padding item */}
        <View style={styles.padItem} />
      </ScrollView>

      {/* Gradient fade — top */}
      <View pointerEvents="none" style={[styles.gradient, styles.gradientTop]}>
        <LinearGradient
          colors={[colors.surface, colors.surface + '00']}
          style={{ flex: 1 }}
        />
      </View>

      {/* Gradient fade — bottom */}
      <View pointerEvents="none" style={[styles.gradient, styles.gradientBottom]}>
        <LinearGradient
          colors={[colors.surface + '00', colors.surface]}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

// ─── TimePicker ──────────────────────────────────────────────────────────────

interface TimePickerProps {
  hour: number;   // 24h internally
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

export function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  const { colors } = useTheme();
  const [use24h, setUse24h] = useState(false);

  // ── Derive current display state ─────────────────────────────────────────

  const { displayHour, isAM } = to12h(hour);

  // Build value arrays
  const hourValues = use24h
    ? Array.from({ length: 24 }, (_, i) => i)        // 0–23
    : Array.from({ length: 12 }, (_, i) => i + 1);   // 1–12

  const minuteValues = Array.from({ length: 60 }, (_, i) => i); // 0–59

  // Resolve selected indices
  const hourIndex = use24h
    ? hourValues.indexOf(hour)
    : hourValues.indexOf(displayHour);

  const minuteIndex = minuteValues.indexOf(minute);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleHourSelect(index: number) {
    const selected = hourValues[index];
    if (use24h) {
      onChange(selected, minute);
    } else {
      onChange(to24h(selected, isAM), minute);
    }
  }

  function handleMinuteSelect(index: number) {
    onChange(hour, minuteValues[index]);
  }

  function toggleAMPM(wantAM: boolean) {
    if (wantAM === isAM) return;
    onChange(to24h(displayHour, wantAM), minute);
  }

  function toggle24h() {
    setUse24h((prev) => !prev);
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  // Fixed column widths so the layout is stable
  const HOUR_COL_W = 80;
  const MIN_COL_W = 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* ── Scroll wheels + AM/PM ── */}
      <View style={styles.wheelsRow}>
        {/* Hour column */}
        <ScrollColumn
          values={hourValues}
          selectedIndex={Math.max(0, hourIndex)}
          onSelect={handleHourSelect}
          width={HOUR_COL_W}
          formatLabel={use24h
            ? (v) => String(v).padStart(2, '0')
            : (v) => String(v)}
        />

        {/* Colon separator */}
        <View style={styles.colonContainer}>
          <Text style={[styles.colon, { color: colors.primary }]}>:</Text>
        </View>

        {/* Minute column */}
        <ScrollColumn
          values={minuteValues}
          selectedIndex={Math.max(0, minuteIndex)}
          onSelect={handleMinuteSelect}
          width={MIN_COL_W}
        />

        {/* AM/PM selector (12h mode only) */}
        {!use24h && (
          <View style={styles.ampmContainer}>
            <Pressable
              onPress={() => toggleAMPM(true)}
              style={[
                styles.ampmBtn,
                {
                  backgroundColor: isAM ? colors.primary : colors.surfaceElevated,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                },
              ]}
            >
              <Text
                style={[
                  styles.ampmText,
                  { color: isAM ? colors.surface : colors.textSecondary },
                ]}
              >
                AM
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleAMPM(false)}
              style={[
                styles.ampmBtn,
                {
                  backgroundColor: !isAM ? colors.primary : colors.surfaceElevated,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  marginTop: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.ampmText,
                  { color: !isAM ? colors.surface : colors.textSecondary },
                ]}
              >
                PM
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── 24h toggle ── */}
      <View style={styles.toggleRow}>
        <Pressable onPress={toggle24h} style={styles.toggleBtn} hitSlop={8}>
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {use24h ? '● 24h' : '○ 24h'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ── ScrollColumn ──
  columnWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  selectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    zIndex: 1,
  },
  padItem: {
    height: ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    textAlign: 'center',
  },
  itemTextSelected: {
    fontSize: 32,
    fontWeight: '700',
  },
  itemTextUnselected: {
    fontSize: 20,
    fontWeight: '400',
    opacity: 0.55,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    zIndex: 2,
  },
  gradientTop: {
    top: 0,
  },
  gradientBottom: {
    bottom: 0,
  },
  // ── Colon ──
  colonContainer: {
    width: 24,
    height: PICKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colon: {
    fontSize: 32,
    fontWeight: '700',
    // Nudge up slightly so colon visually aligns with selected digits
    marginBottom: 4,
  },
  // ── AM/PM ──
  ampmContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ampmBtn: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // ── 24h toggle ──
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  toggleBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
