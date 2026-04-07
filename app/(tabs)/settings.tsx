import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/src/hooks/useTheme';
import { useThemeContext } from '@/src/context/ThemeContext';
import type { ThemeScheme } from '@/src/context/ThemeContext';
import { getAppSettings, setSetting } from '@/src/db/settings';
import type { AppSettings } from '@/src/db/settings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ThemeOption = ThemeScheme;

// ---------------------------------------------------------------------------
// Theme card mini-preview colours (hardcoded — represent the theme being
// previewed, not the current app theme)
// ---------------------------------------------------------------------------
const THEME_PREVIEW: Record<ThemeOption, { bg: string; surface: string; accent: string }> = {
  dark:   { bg: '#0E0E0E', surface: '#1A1919', accent: '#A8A4FF' },
  light:  { bg: '#F8F9FA', surface: '#FFFFFF', accent: '#D97A1E' },
  system: { bg: '#262626', surface: '#3A3A3A', accent: '#675DF9' },
};

const THEME_LABELS: Record<ThemeOption, string> = {
  dark:   'DARK',
  light:  'LIGHT',
  system: 'SYSTEM',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { scheme: activeScheme, setScheme } = useThemeContext();
  const [settings, setSettings] = useState<AppSettings>(getAppSettings);

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSetting(key, value);
  }

  function handleThemeSelect(theme: ThemeOption) {
    updateSetting('theme', theme);
    setScheme(theme);
  }

  const s = makeStyles(colors, isDark);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ─────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={[s.microLabel, { color: colors.onSurfaceVariant }]}>
            SYSTEM CONFIGURATION
          </Text>
          <Text style={[s.headline, { color: colors.text }]}>Settings</Text>
        </View>

        {/* ── Appearance ──────────────────────────────────────── */}
        <Section label="Appearance" colors={colors}>
          <View style={s.themeRow}>
            {(['dark', 'light', 'system'] as ThemeOption[]).map((opt) => {
              const selected = activeScheme === opt;
              const preview = THEME_PREVIEW[opt];
              return (
                <Pressable
                  key={opt}
                  style={[
                    s.themeCard,
                    { backgroundColor: colors.surfaceContainerHighest },
                    selected && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => handleThemeSelect(opt)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${THEME_LABELS[opt]} theme`}
                >
                  <View style={[s.themePreview, { backgroundColor: preview.bg }]}>
                    <View style={[s.themePreviewSurface, { backgroundColor: preview.surface }]} />
                    <View style={[s.themePreviewAccent, { backgroundColor: preview.accent }]} />
                  </View>

                  {selected && (
                    <View style={[s.themeBadge, { backgroundColor: colors.primary }]}>
                      <MaterialIcons name="check" size={10} color={colors.onPrimary} />
                    </View>
                  )}

                  <Text
                    style={[
                      s.themeLabel,
                      { color: selected ? colors.primary : colors.onSurfaceVariant },
                    ]}
                  >
                    {THEME_LABELS[opt]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Anti-Cheat Protocols ────────────────────────────── */}
        <Section label="Anti-Cheat Protocols" colors={colors}>
          <AntiCheatRow
            title="Block volume keys"
            description="Prevent silencing alarms using hardware volume buttons during a mission."
            value={settings.blockVolumeKeys}
            onToggle={(v) => updateSetting('blockVolumeKeys', v)}
            colors={colors}
          />
          <AntiCheatRow
            title="Persist after app kill"
            description="Keep the alarm running even if the application is force-closed."
            value={settings.persistAfterKill}
            onToggle={(v) => updateSetting('persistAfterKill', v)}
            colors={colors}
          />
          <AntiCheatRow
            title="Restore after reboot"
            description="Re-schedule all alarms automatically when the device restarts."
            value={settings.restoreAfterReboot}
            onToggle={(v) => updateSetting('restoreAfterReboot', v)}
            colors={colors}
          />
        </Section>

        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
type ColorsShape = ReturnType<typeof useTheme>['colors'];

function Section({
  label,
  colors,
  children,
}: {
  label: string;
  colors: ColorsShape;
  children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={[sectionStyles.label, { color: colors.onSurfaceVariant }]}>
        {label.toUpperCase()}
      </Text>
      <View style={[sectionStyles.card, { backgroundColor: colors.surfaceContainer }]}>
        {children}
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  label: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4,
  },
  card: { borderRadius: 16, padding: 20 },
});

function AntiCheatRow({
  title,
  description,
  value,
  onToggle,
  colors,
}: {
  title: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  colors: ColorsShape;
}) {
  return (
    <View style={antiStyles.row}>
      <View style={antiStyles.text}>
        <Text style={[antiStyles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[antiStyles.desc, { color: colors.onSurfaceVariant }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: colors.primaryDim, false: colors.border }}
        thumbColor="#FFFFFF"
        accessibilityLabel={title}
      />
    </View>
  );
}

const antiStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  text: { flex: 1, paddingRight: 16 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  desc: { fontSize: 13, lineHeight: 18 },
});

// ---------------------------------------------------------------------------
// Main styles factory
// ---------------------------------------------------------------------------
function makeStyles(colors: ColorsShape, _isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 56 },

    header: { marginBottom: 32 },
    microLabel: {
      fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
      textTransform: 'uppercase', marginBottom: 6,
    },
    headline: { fontSize: 36, fontWeight: '700', lineHeight: 42 },

    themeRow: { flexDirection: 'row', gap: 12 },
    themeCard: {
      flex: 1, borderRadius: 12, padding: 10, alignItems: 'center',
      borderWidth: 2, borderColor: 'transparent', position: 'relative',
    },
    themePreview: {
      width: '100%', aspectRatio: 0.75, borderRadius: 6, overflow: 'hidden',
      marginBottom: 8, padding: 6, justifyContent: 'flex-end',
    },
    themePreviewSurface: { height: '30%', borderRadius: 4, marginBottom: 4 },
    themePreviewAccent: { height: '15%', width: '60%', borderRadius: 4 },
    themeBadge: {
      position: 'absolute', top: 6, right: 6,
      width: 18, height: 18, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center',
    },
    themeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },

    bottomSpacer: { height: 40 },
  });
}
