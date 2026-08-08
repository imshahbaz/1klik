import { Platform, TextStyle } from 'react-native';

/**
 * Structural design tokens for the Android trading UI.
 *
 * The look is deliberately dense and flat: small corner radii, hairline
 * dividers instead of drop shadows, and 4dp-grid spacing — the conventions
 * native Android apps follow, as opposed to the large floating cards a web
 * dashboard would use.
 */

/** 4dp grid. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Small radii keep surfaces feeling like panels, not floating web cards. */
export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/** Material 3 component heights, in dp. */
export const size = {
  appBar: 56,
  navBar: 64,
  tab: 48,
  row: 56,
  field: 52,
  action: 52,
  touch: 48,
} as const;

/**
 * Tabular figures so price columns stay optically aligned as digits change.
 * Android exposes them through the Roboto variant; iOS through the system font.
 */
export const numeric: TextStyle = Platform.select({
  android: { fontVariant: ['tabular-nums'], fontFamily: 'sans-serif-medium' },
  default: { fontVariant: ['tabular-nums'] },
}) as TextStyle;

/** Uppercase micro-label used for section headers and column captions. */
export const overline: TextStyle = {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.8,
  textTransform: 'uppercase',
};

/** Android draws its own ripple; elevation is reserved for genuinely floating UI. */
export const flat = {
  elevation: 0,
  shadowColor: 'transparent',
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
} as const;
