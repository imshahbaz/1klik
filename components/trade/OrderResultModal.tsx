import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Portal, Modal as PaperModal, Surface, Text as PaperText, Button as PaperButton } from 'react-native-paper';

interface OrderResultModalProps {
  readonly styles: any;
  readonly theme: any;
  readonly visible: boolean;
  readonly variant: 'success' | 'error';
  readonly title: string;
  readonly message: string;
  readonly onClose: () => void;
}

export default function OrderResultModal({
  theme,
  visible,
  variant,
  title,
  message,
  onClose,
}: OrderResultModalProps) {
  const isSuccess = variant === 'success';
  const accent = isSuccess ? theme.success : theme.danger;
  const accentBackground = isSuccess ? theme.successBackground : theme.dangerBackground;
  const icon = isSuccess ? 'checkmark-circle' : 'close-circle';

  return (
    <Portal>
      <PaperModal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Surface
          style={{
            backgroundColor: theme.card,
            borderRadius: 24,
            width: '100%',
            maxWidth: 340,
            padding: 24,
            alignItems: 'center',
            elevation: 5,
          }}
          elevation={4}
        >
          <Surface
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: accentBackground,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
            elevation={0}
          >
            <Ionicons name={icon} size={36} color={accent} />
          </Surface>

          <PaperText variant="titleMedium" style={{ fontWeight: '800', color: theme.textPrimary, textAlign: 'center', marginBottom: 8 }}>
            {title}
          </PaperText>

          <PaperText variant="bodyMedium" style={{ color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
            {message}
          </PaperText>

          <PaperButton
            mode="contained"
            onPress={onClose}
            buttonColor={isSuccess ? theme.success : theme.primary}
            textColor="#ffffff"
            style={{ width: '100%', borderRadius: 12 }}
            contentStyle={{ height: 48 }}
            labelStyle={{ fontSize: 15, fontWeight: '700' }}
          >
            {isSuccess ? 'Done' : 'Got it'}
          </PaperButton>
        </Surface>
      </PaperModal>
    </Portal>
  );
}
