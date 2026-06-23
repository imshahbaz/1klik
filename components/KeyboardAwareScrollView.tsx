import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  ScrollViewProps,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleProp,
  ViewStyle,
  findNodeHandle,
  UIManager,
} from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  readonly extraKeyboardSpace?: number;
}

export function KeyboardAwareScrollView({
  children,
  extraKeyboardSpace = 48,
  keyboardShouldPersistTaps = 'handled',
  onScroll,
  scrollEventThrottle = 16,
  contentContainerStyle,
  ...props
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const keyboardTopRef = useRef<number | null>(null);
  const retryTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  const clearRetryTimeouts = useCallback(() => {
    retryTimeoutsRef.current.forEach(clearTimeout);
    retryTimeoutsRef.current = [];
  }, []);

  const scrollFocusedInputIntoView = useCallback(() => {
    const keyboardTop = keyboardTopRef.current;
    if (!keyboardTop) return;

    const textInputState = (TextInput as any).State;
    const focusedInput = textInputState?.currentlyFocusedInput
      ? textInputState.currentlyFocusedInput()
      : textInputState?.currentlyFocusedField?.();

    const inputNode = typeof focusedInput === 'number'
      ? focusedInput
      : findNodeHandle(focusedInput);

    if (inputNode == null && !focusedInput?.measureInWindow) return;

    const measure = focusedInput?.measureInWindow
      ? focusedInput.measureInWindow.bind(focusedInput)
      : (callback: (x: number, y: number, width: number, height: number) => void) => {
        if (inputNode == null) return;
        UIManager.measure(inputNode, (_x, _y, width, height, pageX, pageY) => {
          callback(pageX, pageY, width, height);
        });
      };

    measure((_x: number, y: number, _width: number, height: number) => {
      const inputBottom = y + height;
      const overlap = inputBottom + extraKeyboardSpace - keyboardTop;

      if (overlap > 0) {
        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollYRef.current + overlap),
          animated: true,
        });
      }
    });
  }, [extraKeyboardSpace]);

  const scheduleFocusedInputCheck = useCallback(() => {
    clearRetryTimeouts();
    const delays = Platform.OS === 'ios' ? [40, 120, 240] : [80, 180, 320, 520];
    retryTimeoutsRef.current = delays.map((delay) =>
      setTimeout(scrollFocusedInputIntoView, delay)
    );
  }, [clearRetryTimeouts, scrollFocusedInputIntoView]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      keyboardTopRef.current = event.endCoordinates.screenY;
      const keyboardHeight = Math.max(0, event.endCoordinates.height || 0);
      setKeyboardPadding(keyboardHeight + extraKeyboardSpace);
      setKeyboardVisible(true);
      requestAnimationFrame(() => {
        scheduleFocusedInputCheck();
      });
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      keyboardTopRef.current = null;
      clearRetryTimeouts();
      setKeyboardPadding(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      clearRetryTimeouts();
    };
  }, [clearRetryTimeouts, extraKeyboardSpace, scheduleFocusedInputCheck]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  const handleInteractionEnd = () => {
    if (keyboardVisible) {
      scheduleFocusedInputCheck();
    }
  };

  const mergedContentContainerStyle: StyleProp<ViewStyle> = [
    contentContainerStyle as StyleProp<ViewStyle>,
    keyboardVisible ? { paddingBottom: keyboardPadding } : null,
  ];

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={handleScroll}
      onResponderRelease={handleInteractionEnd}
      onTouchEnd={handleInteractionEnd}
      contentContainerStyle={mergedContentContainerStyle}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
