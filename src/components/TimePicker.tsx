import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks/useTheme';

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PAD_ITEMS = (VISIBLE_ITEMS - 1) / 2;

interface ScrollColumnProps {
  values: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
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
  const didInitialScroll = useRef(false);

  useEffect(() => {
    const y = selectedIndex * ITEM_HEIGHT;
    if (!didInitialScroll.current) {
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

  const label = formatLabel ?? ((value: number) => String(value).padStart(2, '0'));

  return (
    <View style={[styles.columnWrapper, { width, height: PICKER_HEIGHT }]}>
      <View
        pointerEvents="none"
        style={[
          styles.selectionBar,
          {
            backgroundColor: `${colors.primary}26`,
            top: PAD_ITEMS * ITEM_HEIGHT,
          },
        ]}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.columnScroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
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

        <View style={styles.padItem} />
      </ScrollView>

      <View pointerEvents="none" style={[styles.gradient, styles.gradientTop]}>
        <LinearGradient colors={[colors.surface, `${colors.surface}00`]} style={styles.flex} />
      </View>

      <View pointerEvents="none" style={[styles.gradient, styles.gradientBottom]}>
        <LinearGradient colors={[`${colors.surface}00`, colors.surface]} style={styles.flex} />
      </View>
    </View>
  );
}

interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

export function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  const { colors } = useTheme();

  const hourValues = Array.from({ length: 24 }, (_, index) => index);
  const minuteValues = Array.from({ length: 60 }, (_, index) => index);

  const hourIndex = Math.max(0, hourValues.indexOf(hour));
  const minuteIndex = Math.max(0, minuteValues.indexOf(minute));

  function handleHourSelect(index: number) {
    onChange(hourValues[index], minute);
  }

  function handleMinuteSelect(index: number) {
    onChange(hour, minuteValues[index]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.wheelsRow}>
        <ScrollColumn
          values={hourValues}
          selectedIndex={hourIndex}
          onSelect={handleHourSelect}
          width={88}
        />

        <View style={styles.colonContainer}>
          <Text style={[styles.colon, { color: colors.primary }]}>:</Text>
        </View>

        <ScrollColumn
          values={minuteValues}
          selectedIndex={minuteIndex}
          onSelect={handleMinuteSelect}
          width={88}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  columnScroll: {
    flex: 1,
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
  colonContainer: {
    width: 28,
    height: PICKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colon: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
});
