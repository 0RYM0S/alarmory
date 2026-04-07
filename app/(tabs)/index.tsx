import React, { useState, useCallback, useRef } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import ReAnimated from "react-native-reanimated";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  PanResponder,
  Animated,
  StatusBar,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useTheme } from "@/src/hooks/useTheme";
import { useTabNavigation } from "./_layout";
import { Gradients, Shadows } from "@/constants/Colors";
import { getAllAlarms, toggleAlarm, deleteAlarm } from "@/src/db/alarms";
import type { Alarm } from "@/src/db/alarms";
import {
  formatCountdown,
  formatAlarmTime,
  formatRepeatDays,
} from "@/src/utils/time";

type MissionType = "photo" | "steps" | "typing";

const MISSION_ICONS: Record<MissionType, keyof typeof MaterialIcons.glyphMap> =
  {
    photo: "photo-camera",
    steps: "directions-walk",
    typing: "keyboard",
  };

const SWIPE_THRESHOLD = 80;
const SWIPE_REVEAL = SWIPE_THRESHOLD + 16;

// ─── Swipe-to-delete card ────────────────────────────────────────────────────

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
}

function AlarmCard({ alarm, onToggle, onDelete }: AlarmCardProps) {
  const { colors, isDark } = useTheme();
  const { setTabScrollEnabled } = useTabNavigation();
  const swipeX = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);
  const deleteRevealed = useRef(false);
  const touchActive = useRef(false);

  const deleteOpacity = swipeX.interpolate({
    inputRange: [-SWIPE_REVEAL, -8, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const timeStr = formatAlarmTime(alarm.hour, alarm.minute);

  const repeatStr = formatRepeatDays(alarm.repeatDays);
  const missions = alarm.missions as Array<{ type: MissionType }>;

  const cardShadow = isDark ? Shadows.dark.card : Shadows.light.card;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: () => {
        setTabScrollEnabled(false);
      },
      onPanResponderMove: (_, gs) => {
        const clamped = Math.min(0, Math.max(-SWIPE_REVEAL, gs.dx));
        swipeX.setValue(clamped);
        currentX.current = clamped;
      },
      onPanResponderRelease: () => {
        setTabScrollEnabled(true);
        touchActive.current = false;
        if (currentX.current < -SWIPE_THRESHOLD) {
          // Snap to reveal delete button
          Animated.spring(swipeX, {
            toValue: -SWIPE_REVEAL,
            useNativeDriver: true,
          }).start();
          deleteRevealed.current = true;
        } else {
          // Snap back
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          deleteRevealed.current = false;
        }
        currentX.current = 0;
      },
      onPanResponderTerminate: () => {
        setTabScrollEnabled(true);
        touchActive.current = false;
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
        deleteRevealed.current = false;
        currentX.current = 0;
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const handleCardPress = () => {
    if (deleteRevealed.current) {
      Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
      deleteRevealed.current = false;
      return;
    }
    router.push({
      pathname: "/alarm/[id]/edit",
      params: { id: alarm.id },
    });
  };

  const isDisabled = !alarm.enabled;

  return (
    <View style={styles.cardWrapper}>
      {/* Delete action revealed behind card */}
      <Animated.View
        style={[
          styles.deleteAction,
          { backgroundColor: colors.danger, opacity: deleteOpacity },
        ]}
      >
        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(alarm.id)}
          hitSlop={8}
        >
          <MaterialIcons name="delete" size={22} color="#fff" />
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      </Animated.View>

      {/* Swipeable card */}
      <Animated.View
        style={[{ transform: [{ translateX: swipeX }] }]}
        onTouchStart={() => {
          touchActive.current = true;
          setTabScrollEnabled(false);
        }}
        onTouchEnd={() => {
          if (!touchActive.current) return;
          touchActive.current = false;
          setTabScrollEnabled(true);
        }}
        onTouchCancel={() => {
          touchActive.current = false;
          setTabScrollEnabled(true);
        }}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={handleCardPress}
          style={({ pressed }) => [
            styles.alarmCard,
            {
              backgroundColor: isDisabled
                ? (colors.surfaceContainerLow ?? colors.surfaceContainer)
                : colors.surfaceContainer,
              opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
              borderRadius: 24,
              ...cardShadow,
            },
          ]}
        >
          {/* Time row */}
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.timeText,
                {
                  color: isDisabled
                    ? colors.onSurfaceVariant
                    : colors.onSurface,
                },
              ]}
            >
              {timeStr}
            </Text>
            <Switch
              value={alarm.enabled}
              onValueChange={() => onToggle(alarm)}
              trackColor={{
                false: colors.outlineVariant,
                true: colors.primary,
              }}
              thumbColor={
                alarm.enabled ? colors.onPrimary : colors.onSurfaceVariant
              }
            />
          </View>

          {/* Label */}
          {alarm.label ? (
            <Text
              style={[styles.alarmLabel, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {alarm.label}
            </Text>
          ) : null}

          {/* Repeat days */}
          <Text style={[styles.repeatText, { color: colors.onSurfaceVariant }]}>
            {repeatStr}
          </Text>

          {/* Mission chips */}
          {missions.length > 0 && (
            <View style={styles.missionRow}>
              {missions.map((m, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.missionChip,
                    { backgroundColor: colors.surfaceContainerHighest },
                  ]}
                >
                  <MaterialIcons
                    name={MISSION_ICONS[m.type] ?? "alarm"}
                    size={14}
                    color={
                      isDisabled ? colors.onSurfaceVariant : colors.primary
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Home screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  function handleNewAlarm() {
    fabScale.value = withTiming(
      0.88,
      { duration: 100, easing: Easing.out(Easing.quad) },
      () => {
        "worklet";
        runOnJS(router.push)("/alarm/create");
        fabScale.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      },
    );
  }

  const gradient = isDark ? Gradients.dark.primary : Gradients.light.primary;

  // Reload from DB every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      setAlarms(getAllAlarms());
      fabScale.value = 0.7;
      fabScale.value = withSpring(1, { damping: 14, stiffness: 260 });
    }, []),
  );

  const reload = () => setAlarms(getAllAlarms());

  // Smart-sort: active first (by nextFireTime ASC), then disabled
  const activeAlarms = alarms
    .filter((a) => a.enabled)
    .sort((a, b) => a.nextFireTime - b.nextFireTime);
  const disabledAlarms = alarms.filter((a) => !a.enabled);

  const nextAlarm = activeAlarms[0] ?? null;

  const handleToggle = (alarm: Alarm) => {
    toggleAlarm(alarm.id, !alarm.enabled);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteAlarm(id);
    reload();
  };

  const fabShadow = isDark
    ? { ...Shadows.dark.ambient, shadowColor: colors.primaryDim }
    : { ...Shadows.light.ambient, shadowColor: colors.primaryDim };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* ── Top app bar ── */}
      <View style={[styles.appBar, { backgroundColor: colors.background }]}>
        <Text style={[styles.brandTitle, { color: colors.primary }]}>
          ALARMORY
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Next alarm banner ── */}
        {nextAlarm && (
          <View
            style={[
              styles.bannerWrapper,
              isDark ? Shadows.dark.card : Shadows.light.card,
            ]}
          >
            <LinearGradient
              colors={[`${colors.primaryDim}28`, `${colors.primaryDim}08`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.banner,
                {
                  borderColor: `${colors.primary}22`,
                  borderWidth: 1,
                  borderRadius: 20,
                },
              ]}
            >
              <Text
                style={[styles.bannerLabel, { color: colors.onSurfaceVariant }]}
              >
                NEXT ALARM IN
              </Text>
              <Text
                style={[styles.bannerCountdown, { color: colors.onSurface }]}
              >
                {formatCountdown(nextAlarm.nextFireTime)}
              </Text>
              <View
                style={[
                  styles.timePill,
                  { backgroundColor: `${colors.primary}22` },
                ]}
              >
                <MaterialIcons
                  name="alarm"
                  size={12}
                  color={colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.timePillText, { color: colors.primary }]}>
                  {formatAlarmTime(nextAlarm.hour, nextAlarm.minute)}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── Active alarms section ── */}
        {activeAlarms.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                ACTIVE ALARMS
              </Text>
              <Text style={[styles.sectionCount, { color: colors.primary }]}>
                {activeAlarms.length} active
              </Text>
            </View>
            <View style={styles.cardList}>
              {activeAlarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Disabled section separator ── */}
        {disabledAlarms.length > 0 && (
          <>
            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.outlineVariant },
                ]}
              />
              <Text style={[styles.dividerLabel, { color: colors.outline }]}>
                STANDBY MODE
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.outlineVariant },
                ]}
              />
            </View>

            <View style={styles.cardList}>
              {disabledAlarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Empty state ── */}
        {alarms.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="alarm-off"
              size={56}
              color={colors.outlineVariant}
            />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              No alarms set
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}
            >
              Tap + New Alarm to get started
            </Text>
          </View>
        )}

        {/* Bottom padding so FAB doesn't overlap last card */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <ReAnimated.View style={[styles.fabContainer, fabShadow, fabAnimStyle]}>
        <Pressable onPress={handleNewAlarm}>
          <LinearGradient
            colors={gradient.colors as [string, string]}
            start={gradient.start}
            end={gradient.end}
            style={styles.fab}
          >
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={styles.fabLabel}>New Alarm</Text>
          </LinearGradient>
        </Pressable>
      </ReAnimated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // App bar
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 3,
    textAlign: "center",
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Banner
  bannerWrapper: {
    borderRadius: 20,
    marginBottom: 28,
  },
  banner: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
    gap: 6,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  bannerCountdown: {
    fontSize: 48,
    fontWeight: "300",
    letterSpacing: -1,
    lineHeight: 56,
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginTop: 2,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Section
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Card list
  cardList: {
    gap: 16,
  },

  // Alarm card wrapper (for swipe reveal)
  cardWrapper: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
  },

  // Delete action
  deleteAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_REVEAL,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
  },
  deleteButton: {
    alignItems: "center",
    gap: 4,
  },
  deleteLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Alarm card
  alarmCard: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 40,
    fontWeight: "700",
    lineHeight: 46,
    letterSpacing: -1,
    minWidth: 108,
  },
  alarmLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  repeatText: {
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  missionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  missionChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "400",
  },

  // FAB
  fabContainer: {
    position: "absolute",
    bottom: 48,
    right: 24,
    borderRadius: 100,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 100,
  },
  fabLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
