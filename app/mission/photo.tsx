import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTheme } from "@/src/hooks/useTheme";

// ---------------------------------------------------------------------------
// Corner bracket component
// ---------------------------------------------------------------------------

const BRACKET_SIZE = 40;
const BRACKET_THICK = 3;
function alpha(hex: string, amount: string) {
  return `${hex}${amount}`;
}

function CornerBracket({
  position,
  color,
}: {
  position: "tl" | "tr" | "bl" | "br";
  color: string;
}) {
  const top = position.startsWith("t");
  const left = position.endsWith("l");

  const base: object = {
    position: "absolute",
    backgroundColor: color,
  };

  const horizontal: object = {
    ...base,
    width: BRACKET_SIZE,
    height: BRACKET_THICK,
    top: top ? 0 : undefined,
    bottom: top ? undefined : 0,
    left: left ? 0 : undefined,
    right: left ? undefined : 0,
  };

  const vertical: object = {
    ...base,
    width: BRACKET_THICK,
    height: BRACKET_SIZE,
    top: top ? 0 : undefined,
    bottom: top ? undefined : 0,
    left: left ? 0 : undefined,
    right: left ? undefined : 0,
  };

  const containerStyle: object = {
    position: "absolute",
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    top: top ? 0 : undefined,
    bottom: top ? undefined : 0,
    left: left ? 0 : undefined,
    right: left ? undefined : 0,
  };

  return (
    <View style={containerStyle}>
      <View style={horizontal} />
      <View style={vertical} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function PhotoMissionScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { targetPhotoUri, alarmId } = useLocalSearchParams<{
    targetPhotoUri: string;
    alarmId: string;
  }>();

  // Camera permission state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  // TODO: request camera permission with expo-camera in Stage 7

  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Pulse animation for capture button
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  function onCapture() {
    if (isCapturing) return;
    setIsCapturing(true);
    // TODO: take photo with camera ref and compare with targetPhotoUri using photo-matcher
    setTimeout(() => {
      setIsCapturing(false);
      setShowSuccess(true);
    }, 1500);
  }

  function onDismiss() {
    router.back();
  }

  // ---------------------------------------------------------------------------
  // Success overlay
  // ---------------------------------------------------------------------------
  if (showSuccess) {
    return (
      <View
        style={[
          styles.successContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar
          hidden
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <View style={styles.successContent}>
          <View
            style={[styles.successIcon, { backgroundColor: colors.success }]}
          >
            <MaterialIcons name="check" size={56} color="#fff" />
          </View>
          <Text style={[styles.successLabel, { color: colors.onSurface }]}>
            MISSION SUCCESS
          </Text>
          <Text style={[styles.successSub, { color: colors.onSurfaceVariant }]}>
            Photo matched
          </Text>
          <Pressable
            style={[
              styles.successButton,
              { backgroundColor: colors.primaryDim },
            ]}
            onPress={onDismiss}
          >
            <Text style={styles.successButtonText}>Good Morning</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Main camera UI
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* ── Viewfinder placeholder ── */}
      <View
        style={[
          styles.viewfinder,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        {/* Corner brackets */}
        <View style={styles.bracketsContainer}>
          <CornerBracket
            position="tl"
            color={alpha(colors.primary, isDark ? "66" : "55")}
          />
          <CornerBracket
            position="tr"
            color={alpha(colors.primary, isDark ? "66" : "55")}
          />
          <CornerBracket
            position="bl"
            color={alpha(colors.primary, isDark ? "66" : "55")}
          />
          <CornerBracket
            position="br"
            color={alpha(colors.primary, isDark ? "66" : "55")}
          />
        </View>

        {/* Center reticle */}
        <View
          style={[
            styles.reticle,
            { borderColor: alpha(colors.primary, isDark ? "33" : "2E") },
          ]}
        >
          <View
            style={[
              styles.reticleDot,
              { backgroundColor: alpha(colors.primary, isDark ? "80" : "99") },
            ]}
          />
        </View>
      </View>

      {/* ── Top bar ── */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: alpha(colors.background, isDark ? "99" : "D9") },
        ]}
      >
        <Pressable style={styles.iconButton} onPress={onDismiss} hitSlop={8}>
          <MaterialIcons name="close" size={24} color={colors.onSurface} />
        </Pressable>

        <Text style={[styles.topTitle, { color: colors.onSurface }]}>
          PHOTO MISSION
        </Text>

        <Pressable style={styles.iconButton} hitSlop={8}>
          <MaterialIcons
            name="help-outline"
            size={24}
            color={colors.onSurface}
          />
        </Pressable>
      </View>

      {/* ── Scanning label + heading ── */}
      <View style={styles.scanningArea} pointerEvents="none">
        <Text style={[styles.scanningLabel, { color: colors.primary }]}>
          SCANNING...
        </Text>
        <Text style={[styles.scanningHeading, { color: colors.onSurface }]}>
          Capture the target
        </Text>
      </View>

      {/* ── Target thumbnail ── */}
      <View
        style={[
          styles.targetCard,
          {
            backgroundColor: alpha(
              colors.surfaceContainerHigh,
              isDark ? "E6" : "F2",
            ),
            borderColor: alpha(colors.outlineVariant, isDark ? "80" : "99"),
          },
        ]}
      >
        <View style={styles.targetImageWrap}>
          {targetPhotoUri ? (
            <Image
              source={{ uri: targetPhotoUri }}
              style={styles.targetImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.targetPlaceholder,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <MaterialIcons
                name="photo-library"
                size={28}
                color={alpha(colors.primary, isDark ? "99" : "AA")}
              />
            </View>
          )}
        </View>
        <View
          style={[
            styles.targetBadge,
            { backgroundColor: alpha(colors.primary, isDark ? "40" : "2B") },
          ]}
        >
          <Text style={[styles.targetBadgeText, { color: colors.primary }]}>
            TARGET
          </Text>
        </View>
        <Text
          style={[styles.targetName, { color: colors.onSurface }]}
          numberOfLines={1}
        >
          MATCH: OBJECT
        </Text>
        <Text
          style={[styles.targetSub, { color: colors.onSurfaceVariant }]}
          numberOfLines={1}
        >
          Bathroom faucet
        </Text>
      </View>

      {/* ── Camera telemetry ── */}
      <View style={styles.telemetry} pointerEvents="none">
        <Text style={styles.telemetryText}>AI_ISO 400</Text>
        <Text style={styles.telemetryText}>F/2.8 · 1/125s</Text>
      </View>

      {/* ── Bottom controls ── */}
      <SafeAreaView
        edges={["bottom"]}
        style={[
          styles.bottomSafe,
          { backgroundColor: alpha(colors.background, isDark ? "BF" : "E8") },
        ]}
      >
        <View style={styles.bottomControls}>
          {/* Flash button */}
          <Pressable
            style={styles.sideButton}
            onPress={() => setFlashOn((v) => !v)}
            hitSlop={8}
          >
            <MaterialIcons
              name={flashOn ? "flash-on" : "flash-off"}
              size={28}
              color={
                flashOn
                  ? colors.primary
                  : alpha(colors.onSurface, isDark ? "99" : "80")
              }
            />
          </Pressable>

          {/* Capture button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[
                styles.captureRing,
                { borderColor: alpha(colors.onSurface, isDark ? "66" : "4D") },
                isCapturing && {
                  borderColor: alpha(colors.primary, isDark ? "99" : "88"),
                },
              ]}
              onPress={onCapture}
            >
              <View
                style={[
                  styles.captureButton,
                  { backgroundColor: colors.onSurface },
                  isCapturing && { backgroundColor: colors.primary },
                ]}
              />
            </Pressable>
          </Animated.View>

          {/* Flip button */}
          <Pressable style={styles.sideButton} hitSlop={8}>
            <MaterialIcons
              name="flip-camera-ios"
              size={28}
              color={alpha(colors.onSurface, isDark ? "99" : "80")}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0E0E0E",
  },

  // Viewfinder
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A1919",
    alignItems: "center",
    justifyContent: "center",
  },
  bracketsContainer: {
    width: 200,
    height: 200,
    position: "relative",
  },
  reticle: {
    position: "absolute",
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "rgba(168, 164, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  reticleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(168, 164, 255, 0.5)",
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(14, 14, 14, 0.6)",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // Scanning
  scanningArea: {
    position: "absolute",
    top: 128,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanningLabel: {
    color: "#A8A4FF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 6,
  },
  scanningHeading: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  // Target thumbnail card
  targetCard: {
    position: "absolute",
    top: 128,
    right: 16,
    width: 100,
    backgroundColor: "rgba(32, 31, 31, 0.9)",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(72, 72, 71, 0.5)",
  },
  targetImageWrap: {
    width: "100%",
    height: 80,
  },
  targetImage: {
    width: "100%",
    height: "100%",
  },
  targetPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  targetBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(168, 164, 255, 0.25)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  targetBadgeText: {
    color: "#A8A4FF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  targetName: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  targetSub: {
    color: "#ADAAAA",
    fontSize: 9,
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 2,
  },

  // Telemetry
  telemetry: {
    position: "absolute",
    bottom: 160,
    left: 20,
  },
  telemetryText: {
    color: "rgba(173, 170, 170, 0.7)",
    fontSize: 10,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    lineHeight: 16,
  },

  // Bottom controls
  bottomSafe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(14, 14, 14, 0.75)",
    paddingTop: 20,
    paddingBottom: 24,
  },
  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  sideButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  // Capture button
  captureRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureRingActive: {
    borderColor: "rgba(168, 164, 255, 0.6)",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fffFFF",
  },
  captureButtonActive: {
    backgroundColor: "#A8A4FF",
  },

  // Success overlay
  successContainer: {
    flex: 1,
    backgroundColor: "#0E0E0E",
    alignItems: "center",
    justifyContent: "center",
  },
  successContent: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successLabel: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 2,
  },
  successSub: {
    color: "#ADAAAA",
    fontSize: 14,
  },
  successButton: {
    marginTop: 16,
    backgroundColor: "#A8A4FF",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 28,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
