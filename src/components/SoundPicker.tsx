import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';

interface SoundPickerProps {
  soundId: string;
  onChange: (soundId: string) => void;
}

const BUILT_IN_SOUNDS = [
  { id: 'default', label: 'Default' },
  { id: 'gentle', label: 'Gentle Rise' },
  { id: 'digital', label: 'Digital' },
  { id: 'beep', label: 'Beep' },
  { id: 'alarm', label: 'Classic Alarm' },
];

interface Colors {
  surface: string;
  border: string;
  primary: string;
  text: string;
}

interface SoundItem {
  id: string;
  label: string;
}

interface SoundRowProps {
  sound: SoundItem;
  selected: boolean;
  isLast: boolean;
  onPress: (id: string) => void;
  colors: Colors;
}

function SoundRow({ sound, selected, isLast, onPress, colors }: SoundRowProps) {
  const rowScale = useSharedValue(1);
  const rowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }],
  }));

  const checkScale = useSharedValue(selected ? 1 : 0);
  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  useEffect(() => {
    checkScale.value = withTiming(selected ? 1 : 0, { duration: 120, easing: Easing.out(Easing.quad) });
  }, [selected]);

  function handlePress() {
    rowScale.value = withTiming(0.96, { duration: 70, easing: Easing.out(Easing.quad) }, () => {
      'worklet';
      rowScale.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) });
    });
    onPress(sound.id);
  }

  return (
    <Animated.View style={rowAnimStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.row,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.soundLabel, { color: selected ? colors.primary : colors.text }]}>
          {sound.label}
        </Text>
        <Animated.Text style={[styles.check, { color: colors.primary }, checkAnimStyle]}>
          ✓
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

export function SoundPicker({ soundId, onChange }: SoundPickerProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {BUILT_IN_SOUNDS.map((sound, index) => (
        <SoundRow
          key={sound.id}
          sound={sound}
          selected={soundId === sound.id}
          isLast={index === BUILT_IN_SOUNDS.length - 1}
          onPress={onChange}
          colors={colors}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
  },
  soundLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  check: {
    fontSize: 17,
    fontWeight: '700',
  },
});
