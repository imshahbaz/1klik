import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { getSafeBottomPadding } from './safeArea';

const COMPACT_WIDTH = 360;
const TABLET_WIDTH = 768;
const MAX_CONTENT_WIDTH = 720;

export function useAdaptiveLayout(insets?: EdgeInsets) {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isCompact = width < COMPACT_WIDTH;
    const isTablet = width >= TABLET_WIDTH;
    let horizontalPadding = 20;
    if (isCompact) horizontalPadding = 14;
    else if (isTablet) horizontalPadding = 32;

    return {
      width,
      height,
      isCompact,
      isTablet,
      horizontalPadding,
      contentMaxWidth: MAX_CONTENT_WIDTH,
      tabBarHeight: 70 + getSafeBottomPadding(insets?.bottom ?? 0),
      centeredContent: {
        width: '100%' as const,
        maxWidth: MAX_CONTENT_WIDTH,
        alignSelf: 'center' as const,
      },
      screenPadding: {
        paddingTop: insets?.top ?? 0,
        paddingBottom: 0, // Removed so content goes all the way down behind tab bar
      },
    };
  }, [height, insets?.bottom, insets?.top, width]);
}
