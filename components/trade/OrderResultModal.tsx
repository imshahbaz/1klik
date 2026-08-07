import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface OrderResultModalProps {
  readonly styles: any;
  readonly theme: any;
  readonly visible: boolean;
  readonly variant: 'success' | 'error';
  readonly title: string;
  readonly message: string;
  readonly onClose: () => void;
}

/**
 * Full-screen feedback modal shown after the MTF order create/update request
 * resolves. `success` renders a green confirmation, `error` a red failure —
 * either way only friendly text is shown, never backend status codes.
 */
export default function OrderResultModal({
  styles,
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.editModalContainer, { alignItems: 'center', paddingVertical: 28 }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: accentBackground,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={icon} size={44} color={accent} />
            </View>
          </View>

          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: theme.textPrimary,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontSize: 13,
              lineHeight: 19,
              fontWeight: '500',
              color: theme.textSecondary,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            {message}
          </Text>

          <TouchableOpacity
            style={{
              alignSelf: 'stretch',
              height: 48,
              borderRadius: 12,
              backgroundColor: isSuccess ? theme.success : theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 }}>
              {isSuccess ? 'Done' : 'Got it'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
