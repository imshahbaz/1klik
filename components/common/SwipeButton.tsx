import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/tokens';

interface SwipeButtonProps {
  readonly styles?: any;
  readonly theme?: any;
  readonly label: string;
  readonly onSwipeSuccess: () => void;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly color?: string;
  readonly icon?: keyof typeof Ionicons.glyphMap;
}

const TRACK = 56;
const PAD = 5;
const THUMB = TRACK - PAD * 2;

/**
 * Swipe-to-confirm order action, the deliberate-commit control Indian brokers
 * use so a stray tap can't place a trade. Built on Animated + PanResponder so
 * it needs no gesture-handler root.
 */
export default function SwipeButton({
  theme: themeProp,
  label,
  onSwipeSuccess,
  loading = false,
  loadingLabel = 'Placing order…',
  color,
  icon = 'flash',
}: SwipeButtonProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeProp || contextTheme;
  const fill = color || theme.primary;

  const [trackW, setTrackW] = useState(0);
  const maxX = Math.max(0, trackW - THUMB - PAD * 2);

  const translateX = useRef(new Animated.Value(0)).current;

  // Refs keep the (created-once) PanResponder reading the latest values.
  const maxRef = useRef(0);
  maxRef.current = maxX;
  const cbRef = useRef(onSwipeSuccess);
  cbRef.current = onSwipeSuccess;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const springBack = () =>
    Animated.spring(translateX, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !loadingRef.current,
      onMoveShouldSetPanResponder: (_, g) => !loadingRef.current && Math.abs(g.dx) > 2,
      onPanResponderMove: (_, g) => {
        const x = Math.min(Math.max(0, g.dx), maxRef.current);
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        const x = Math.min(Math.max(0, g.dx), maxRef.current);
        if (maxRef.current > 0 && x >= maxRef.current * 0.9) {
          // Snap to the end, fire, then reset so the control is ready to reuse.
          Animated.timing(translateX, { toValue: maxRef.current, duration: 90, useNativeDriver: false }).start(() => {
            cbRef.current?.();
            translateX.setValue(0);
          });
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: springBack,
    })
  ).current;

  // If the parent enters a loading state, make sure the thumb is home.
  useEffect(() => {
    if (loading) translateX.setValue(0);
  }, [loading, translateX]);

  const onTrackLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  const labelOpacity = translateX.interpolate({
    inputRange: [0, Math.max(1, maxX)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const fillWidth = Animated.add(translateX, new Animated.Value(THUMB + PAD * 2));

  return (
    <View
      style={[styles.track, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}
      onLayout={onTrackLayout}
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={fill} />
          <Text style={{ color: fill, fontSize: 14, fontWeight: '700', marginLeft: 10 }}>
            {loadingLabel}
          </Text>
        </View>
      ) : (
        <>
          <Animated.View
            style={[styles.fill, { backgroundColor: fill, width: fillWidth }]}
            pointerEvents="none"
          />
          <Animated.Text
            style={[
              styles.label,
              { color: theme.textSecondary, opacity: labelOpacity },
            ]}
          >
            {label}
          </Animated.Text>
          <Animated.View
            style={[styles.thumb, { backgroundColor: fill, transform: [{ translateX }] }]}
            accessibilityRole="adjustable"
            accessibilityLabel={label}
            {...panResponder.panHandlers}
          >
            <Ionicons name={icon} size={20} color={theme.buttonPrimaryText} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.16,
  },
  label: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  thumb: {
    position: 'absolute',
    left: PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
