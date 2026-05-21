import { Platform } from 'react-native';

/**
 * Calculates a safe bottom padding to prevent system navigation bar overlapping on Android/iOS.
 * On Android, when edge-to-edge is enabled, the bottom inset can incorrectly report as 0.
 * A default fallback of 48 is used on Android to cover the navigation bar if it is reported as 0.
 */
export const getSafeBottomPadding = (bottomInset: number): number => {
  if (Platform.OS === 'android') {
    // Enforce a minimum of 48dp for the navigation bar, plus a 12dp separator gap to keep content floating.
    return Math.max(bottomInset, 48) + 12;
  }
  // Enforce a minimum of 16dp, plus a 12dp separator gap for iOS notchless/notched devices.
  return Math.max(bottomInset, 16) + 12;
};
