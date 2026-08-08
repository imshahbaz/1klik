import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { KeyboardTypeOptions, StyleSheet, TextInput, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { numeric, overline, radius, size, space } from '../../theme/tokens';

interface FieldLabelProps {
  readonly children: string;
  readonly hint?: string;
}

export function FieldLabel({ children, hint }: FieldLabelProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.labelRow}>
      <Text style={[overline, { color: theme.textTertiary }]}>{children}</Text>
      {hint ? <Text style={{ fontSize: 11, color: theme.textTertiary }}>{hint}</Text> : null}
    </View>
  );
}

interface FieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  readonly secureTextEntry?: boolean;
  readonly editable?: boolean;
  readonly maxLength?: number;
  readonly hint?: string;
  readonly error?: string | null;
  /** Fixed text pinned inside the field, e.g. ₹ or %. */
  readonly prefix?: string;
  readonly suffix?: string;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly onClear?: () => void;
  /** Renders the value in tabular figures — use for prices and quantities. */
  readonly numericFace?: boolean;
}

/**
 * Filled text field. Material's filled variant reads more solidly on a dark
 * data-dense screen than the outlined one, and the label lives above the box so
 * scanning a stack of fields stays fast.
 */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  secureTextEntry,
  editable = true,
  maxLength,
  hint,
  error,
  prefix,
  suffix,
  icon,
  onClear,
  numericFace = false,
}: FieldProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = React.useState(false);

  let borderColor = theme.border;
  if (error) borderColor = theme.danger;
  else if (focused) borderColor = theme.primary;

  return (
    <View>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <View
        style={[
          styles.field,
          {
            backgroundColor: editable ? theme.surfaceAlt : theme.surfaceSunken,
            borderColor,
            borderWidth: focused || error ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={theme.textTertiary} style={{ marginRight: space.sm }} />
        ) : null}
        {prefix ? (
          <Text style={{ fontSize: 15, color: theme.textSecondary, marginRight: space.xs }}>{prefix}</Text>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          editable={editable}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={theme.primary}
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            numericFace && numeric,
            { color: editable ? theme.textPrimary : theme.textSecondary },
          ]}
        />

        {suffix ? (
          <Text style={{ fontSize: 15, color: theme.textSecondary, marginLeft: space.xs }}>{suffix}</Text>
        ) : null}
        {onClear && value.length > 0 ? (
          <TouchableRipple onPress={onClear} borderless rippleColor={theme.ripple} style={styles.clear}>
            <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
          </TouchableRipple>
        ) : null}
      </View>

      {error ? (
        <Text style={{ fontSize: 12, color: theme.danger, marginTop: space.xs }}>{error}</Text>
      ) : null}
    </View>
  );
}

interface SelectFieldProps {
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly onPress: () => void;
  readonly icon?: keyof typeof Ionicons.glyphMap;
}

/** Read-only field that opens a picker — visually identical to `Field`. */
export function SelectField({ label, value, placeholder, onPress, icon }: SelectFieldProps) {
  const { theme } = useTheme();
  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <TouchableRipple onPress={onPress} rippleColor={theme.ripple} style={{ borderRadius: radius.sm }}>
        <View
          style={[
            styles.field,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth },
          ]}
        >
          {icon ? (
            <Ionicons name={icon} size={18} color={theme.primary} style={{ marginRight: space.sm }} />
          ) : null}
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize: 15, fontWeight: '600', color: value ? theme.textPrimary : theme.placeholder }}
          >
            {value || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.textTertiary} />
        </View>
      </TouchableRipple>
    </View>
  );
}

interface ToggleGroupProps {
  readonly label?: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}

/**
 * Compact inline switcher for binary-ish choices (broker, side). Sits inside a
 * sunken track with the active segment lifted — the Android toggle-button idiom.
 */
export function ToggleGroup({ label, value, options, onChange }: ToggleGroupProps) {
  const { theme } = useTheme();
  return (
    <View>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View style={[styles.track, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
        {options.map((option) => {
          const active = option.value === value;
          // Selected fill on a plain View, ripple nested — see the note in Panel.
          return (
            <View
              key={option.value}
              style={[styles.segment, active && { backgroundColor: theme.primary }]}
            >
              <TouchableRipple
                onPress={() => onChange(option.value)}
                rippleColor={theme.ripple}
                style={styles.segmentFill}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    letterSpacing: 0.6,
                    textAlign: 'center',
                    color: active ? theme.buttonPrimaryText : theme.textSecondary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableRipple>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  field: {
    minHeight: size.field,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: space.md,
    // Android's TextInput reserves extra internal padding that misaligns the
    // baseline against the prefix/suffix text.
    padding: 0,
  },
  clear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: space.xs,
  },
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  segmentFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
