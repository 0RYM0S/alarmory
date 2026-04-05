import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as NavigationBar from 'expo-navigation-bar';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { useTheme } from '@/src/hooks/useTheme';
import { initDatabase } from '@/src/db/index';

export { ErrorBoundary } from 'expo-router';
export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();
initDatabase();

export default function RootLayout() {
  const [loaded, error] = useFonts({ ...FontAwesome.font });
  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, [loaded]);
  if (!loaded) return null;
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { colors, isDark, scheme } = useTheme();
  const mountedRef = useRef(false);
  const fadeAnim = useSharedValue(1);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    // Theme changed — flash to 0 then fade in
    fadeAnim.value = 0;
    fadeAnim.value = withTiming(1, { duration: 250 });
  }, [scheme]);

  const fadeAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: colors.tint,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.tabBar,
      notification: colors.tint,
    },
  };

  return (
    <NavThemeProvider value={theme}>
      <Reanimated.View style={[{ flex: 1 }, fadeAnimStyle]}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="alarm/create" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="alarm/[id]/edit" options={{ presentation: 'modal', title: 'Edit Alarm' }} />
          <Stack.Screen name="ringing" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="mission/photo" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="mission/steps" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="mission/typing" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="photo-register" options={{ presentation: 'modal', title: 'Register Photo' }} />
        </Stack>
      </Reanimated.View>
    </NavThemeProvider>
  );
}
