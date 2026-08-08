import { MD3LightTheme, MD3DarkTheme, MD3Theme, configureFonts } from 'react-native-paper';
import { Platform } from 'react-native';
import { lightColors, darkColors, Colors } from './colors';
import { radius } from './tokens';

/**
 * Roboto is the Android system face; naming it explicitly keeps weights
 * consistent with the platform instead of falling back to Paper's defaults.
 */
const fontConfig = Platform.select({
  android: {
    displayLarge: { fontFamily: 'sans-serif' },
    displayMedium: { fontFamily: 'sans-serif' },
    displaySmall: { fontFamily: 'sans-serif' },
    headlineLarge: { fontFamily: 'sans-serif-medium' },
    headlineMedium: { fontFamily: 'sans-serif-medium' },
    headlineSmall: { fontFamily: 'sans-serif-medium' },
    titleLarge: { fontFamily: 'sans-serif-medium' },
    titleMedium: { fontFamily: 'sans-serif-medium' },
    titleSmall: { fontFamily: 'sans-serif-medium' },
    labelLarge: { fontFamily: 'sans-serif-medium' },
    labelMedium: { fontFamily: 'sans-serif-medium' },
    labelSmall: { fontFamily: 'sans-serif-medium' },
    bodyLarge: { fontFamily: 'sans-serif' },
    bodyMedium: { fontFamily: 'sans-serif' },
    bodySmall: { fontFamily: 'sans-serif' },
  },
  default: {},
});

const buildTheme = (base: MD3Theme, c: Colors): MD3Theme => ({
  ...base,
  roundness: radius.md / 4,
  fonts: configureFonts({ config: fontConfig as any }),
  colors: {
    ...base.colors,
    primary: c.primary,
    onPrimary: c.buttonPrimaryText,
    primaryContainer: c.primaryBackground,
    onPrimaryContainer: c.primary,
    secondary: c.primary,
    onSecondary: c.buttonPrimaryText,
    secondaryContainer: c.primaryBackground,
    onSecondaryContainer: c.primary,
    tertiary: c.secondary,
    tertiaryContainer: c.infoBackground,
    onTertiaryContainer: c.infoText,
    background: c.background,
    onBackground: c.textPrimary,
    surface: c.surface,
    onSurface: c.textPrimary,
    surfaceVariant: c.surfaceAlt,
    onSurfaceVariant: c.textSecondary,
    surfaceDisabled: c.disabledButton,
    onSurfaceDisabled: c.disabledText,
    outline: c.border,
    outlineVariant: c.divider,
    error: c.danger,
    onError: '#ffffff',
    errorContainer: c.dangerBackground,
    onErrorContainer: c.danger,
    backdrop: c.overlay,
    // Flat surfaces at every tier — separation comes from tone and hairlines,
    // not from Material's tonal elevation overlays.
    elevation: {
      level0: 'transparent',
      level1: c.surface,
      level2: c.surface,
      level3: c.surfaceAlt,
      level4: c.surfaceAlt,
      level5: c.surfaceAlt,
    },
  },
});

export const paperLightTheme = buildTheme(MD3LightTheme, lightColors);
export const paperDarkTheme = buildTheme(MD3DarkTheme, darkColors);
