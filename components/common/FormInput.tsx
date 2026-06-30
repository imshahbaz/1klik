import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface FormInputProps {
  readonly styles: any;
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
 * Labelled text field matching the app's `inputGroup`/`inputWrapper` styling.
 * Replaces the label + (optional) leading icon + TextInput block that was
 * duplicated across the broker config cards.
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
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        {icon && (
          <Ionicons name={icon} size={18} color={theme.textSecondary} style={styles.inputIcon} />
        )}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          editable={editable}
        />
      </View>
    </View>
  );
}
