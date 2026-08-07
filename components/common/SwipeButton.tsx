import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Text, View, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SwipeButtonProps {
  readonly styles: any;
  readonly theme: any;
  readonly label: string;
  readonly onSwipeSuccess: () => void;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly color?: string;
  readonly icon?: keyof typeof Ionicons.glyphMap;
}

const THUMB = 44;
const PAD = 4;

/**
 * Zerodha-style "swipe to confirm" action. The thumb is dragged to the right
 * end of the track to fire `onSwipeSuccess`; a partial drag springs back.
 * Uses core Animated + PanResponder so no GestureHandlerRootView is required.
 */
export default function SwipeButton({
  styles,
  theme,
  label,
  onSwipeSuccess,
  loading = false,
  loadingLabel = 'Placing order…',
  color,
  icon = 'flash',
}: SwipeButtonProps) {
  const fill = color || theme.buttonPrimary || theme.primary;

  const [trackW, setTrackW] = useState(0);
  const maxX = Math.max(0, trackW - THUMB - PAD * 2);

  const translateX = useRef(new Animated.Value(0)).current;

  // Refs keep the (recreated-once) PanResponder reading the latest values.
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
    <View style={styles.swipeTrack} onLayout={onTrackLayout}>
      {loading ? (
        <View style={styles.swipeLoadingOverlay}>
          <ActivityIndicator size="small" color={fill} />
          <Text style={[styles.swipeLabel, { color: fill }]}>{loadingLabel}</Text>
        </View>
      ) : (
        <>
          <Animated.View
            style={[styles.swipeFill, { backgroundColor: fill, width: fillWidth }]}
            pointerEvents="none"
          />
          <Animated.Text style={[styles.swipeLabel, { color: fill, opacity: labelOpacity }]}>
            {label}
          </Animated.Text>
          <Animated.View
            style={[styles.swipeThumb, { backgroundColor: fill, transform: [{ translateX }] }]}
            {...panResponder.panHandlers}
          >
            <Ionicons name={icon} size={20} color="#ffffff" />
          </Animated.View>
        </>
      )}
    </View>
  );
}
