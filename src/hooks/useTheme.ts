import { useThemeContext } from '../context/ThemeContext';

export function useTheme() {
  const { colors, isDark, scheme } = useThemeContext();
  return { colors, isDark, scheme };
}
