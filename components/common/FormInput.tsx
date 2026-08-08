import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInputProps, View } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';

interface FormInputProps {
  readonly styles?: any;
  readonly theme: any;
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly placeholder?: string;
  readonly secureTextEntry?: boolean;
  readonly autoCapitalize?: TextInputProps['autoCapitalize'];
  readonly autoCorrect?: boolean;
  readonly keyboardType?: TextInputProps['keyboardType'];
  readonly editable?: boolean;
}

/**
 * React Native Paper powered Form Input component matching app aesthetics.
 */
export default function FormInput({
  styles,
  theme,
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  autoCorrect = false,
  keyboardType,
  editable,
}: FormInputProps) {
  return (
    <View style={styles?.inputGroup || { marginBottom: 16 }}>
      <PaperTextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        editable={editable}
        textColor={theme.textPrimary}
        placeholderTextColor={theme.placeholder}
        outlineColor={theme.border}
        activeOutlineColor={theme.primary}
        left={
          icon ? (
            <PaperTextInput.Icon
              icon={({ size, color }) => (
                <Ionicons name={icon} size={size || 18} color={color || theme.textSecondary} />
              )}
            />
          ) : undefined
        }
        style={{
          backgroundColor: theme.card,
          fontSize: 14,
        }}
      />
    </View>
  );
}
