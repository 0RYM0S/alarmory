import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { getSetting } from '@/src/db/settings';

export type ThemeScheme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  scheme: ThemeScheme;
  setScheme: (s: ThemeScheme) => void;
  colors: typeof Colors.dark;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'dark',
  setScheme: () => {},
  colors: Colors.dark,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [scheme, setScheme] = useState<ThemeScheme>(() => {
    try {
      return (getSetting('theme') as ThemeScheme) ?? 'dark';
    } catch {
      return 'dark';
    }
  });

  const resolved: 'dark' | 'light' =
    scheme === 'system'
      ? systemColorScheme === 'light' ? 'light' : 'dark'
      : scheme;

  const value: ThemeContextValue = {
    scheme,
    setScheme,
    colors: Colors[resolved],
    isDark: resolved === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
