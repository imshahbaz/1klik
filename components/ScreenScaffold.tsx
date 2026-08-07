import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';

interface ScreenScaffoldProps {
  readonly styles: any;
  readonly layout: any;
  readonly insets: any;
  readonly children: React.ReactNode;
  readonly contentInsetAdjustmentBehavior?: 'automatic' | 'scrollableAxes' | 'never' | 'always';
  readonly extraKeyboardSpace?: number;
}

/**
 * Standard tab-screen shell: a safe-area container with a keyboard-aware,
 * vertically scrollable body. Shared by the brokers and trade screens so the
 * screen scaffold stays identical across tabs.
 */
export function ScreenScaffold({
  styles,
  layout,
  insets,
  children,
  contentInsetAdjustmentBehavior,
  extraKeyboardSpace,
}: ScreenScaffoldProps) {
  return (
    <View style={[styles.safeArea, layout.screenPadding]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardFrame}
        keyboardVerticalOffset={insets.top + 60}
      >
        <KeyboardAwareScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContentContainer,
            layout.centeredContent,
            { paddingHorizontal: layout.horizontalPadding, paddingBottom: layout.tabBarHeight + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
          extraKeyboardSpace={extraKeyboardSpace}
        >
          {children}
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
