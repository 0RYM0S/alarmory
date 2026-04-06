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
    textSecondary: '#464555',
    textTertiary: '#777587',
    primary: '#4D41DF',
    primaryLight: '#C4C0FF',
    danger: '#914800',
    success: '#2ED573',
    warning: '#FFA502',
    border: '#C7C4D8',
    tabBar: '#FFFFFF',
    tabIconDefault: '#464555',
    tabIconSelected: '#4D41DF',
    tint: '#4D41DF',

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
    onSurfaceVariant: '#464555',

    // MD3 primary tokens
    primaryDim: '#675DF9',
    primaryFixed: '#C4C0FF',
    primaryFixedDim: '#C4C0FF',
    onPrimary: '#FFFFFF',
    onPrimaryFixed: '#100069',

    // MD3 outline tokens
    outline: '#777587',
    outlineVariant: '#C7C4D8',

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
    primary: { colors: ['#4D41DF', '#675DF9'] as string[], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
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
