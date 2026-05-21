import { Platform } from 'react-native';

export const getSafeBottomPadding = (bottomInset: number): number => {
  if (Platform.OS === 'android') {
    // If the system reports 0, it means the content is already naturally padded 
    // by the OS layout. Only add a small visual spacing gap (e.g., 16dp).
    if (bottomInset === 0) {
      return 16;
    }
    return bottomInset + 8;
  }

  // iOS fallback
  return Math.max(bottomInset, 16) + 12;
};