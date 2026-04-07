// --- Colors ---

export const Colors = {
  dark: {
    // Legacy tokens (preserved)
    background: '#0E0E0E',
    surface: '#1A1919',
    surfaceElevated: '#262626',
    text: '#FFFFFF',
    textSecondary: '#ADAAAA',
    textTertiary: '#767575',
    primary: '#A8A4FF',
    primaryLight: '#8A85FF',
    danger: '#FF7075',
    success: '#2ED573',
    warning: '#FFA502',
    border: '#484847',
    tabBar: '#0E0E0E',
    tabIconDefault: '#ADAAAA',
    tabIconSelected: '#A8A4FF',
    tint: '#A8A4FF',

    // MD3 surface tokens
    surfaceContainerLowest: '#000000',
    surfaceContainerLow: '#131313',
    surfaceContainer: '#1A1919',
    surfaceContainerHigh: '#201F1F',
    surfaceContainerHighest: '#262626',
    surfaceDim: '#0E0E0E',
    surfaceBright: '#2C2C2C',

    // MD3 on-color tokens
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#ADAAAA',

    // MD3 primary tokens
    primaryDim: '#675DF9',
    primaryFixed: '#9995FF',
    primaryFixedDim: '#8A85FF',
    onPrimary: '#1E009F',
    onPrimaryFixed: '#000000',

    // MD3 outline tokens
    outline: '#767575',
    outlineVariant: '#484847',

    // MD3 semantic tokens
    tertiary: '#FF7075',
    error: '#FF6E84',
    errorDim: '#D73357',
  },
  light: {
    // Legacy tokens (preserved)
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#191C1D',
    textSecondary: '#5E5142',
    textTertiary: '#8E7D69',
    primary: '#D97A1E',
    primaryLight: '#F6D39A',
    danger: '#914800',
    success: '#2ED573',
    warning: '#FFA502',
    border: '#D9CCBB',
    tabBar: '#FFFFFF',
    tabIconDefault: '#5E5142',
    tabIconSelected: '#D97A1E',
    tint: '#D97A1E',

    // MD3 surface tokens
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F3F4F5',
    surfaceContainer: '#EDEEEF',
    surfaceContainerHigh: '#E7E8E9',
    surfaceContainerHighest: '#E1E3E4',
    surfaceDim: '#D9DADB',
    surfaceBright: '#F8F9FA',

    // MD3 on-color tokens
    onBackground: '#191C1D',
    onSurface: '#191C1D',
    onSurfaceVariant: '#5E5142',

    // MD3 primary tokens
    primaryDim: '#F0A43A',
    primaryFixed: '#F6D39A',
    primaryFixedDim: '#EAB65B',
    onPrimary: '#FFFFFF',
    onPrimaryFixed: '#5B3200',

    // MD3 outline tokens
    outline: '#8E7D69',
    outlineVariant: '#D9CCBB',

    // MD3 semantic tokens
    tertiary: '#914800',
    error: '#BA1A1A',
    errorDim: '#BA1A1A',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.dark;

// --- Gradients ---

export const Gradients = {
  dark: {
    primary: { colors: ['#A8A4FF', '#675DF9'] as string[], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  },
  light: {
    primary: { colors: ['#F0A43A', '#D97A1E'] as string[], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  },
};

// --- Shadows ---

export const Shadows = {
  dark: {
    ambient: { shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 12 },
    card: { shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 6 },
  },
  light: {
    ambient: { shadowColor: '#191C1D', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.06, shadowRadius: 40, elevation: 8 },
    card: { shadowColor: '#191C1D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 24, elevation: 4 },
  },
};
