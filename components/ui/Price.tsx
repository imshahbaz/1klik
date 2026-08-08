import React from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { numeric, radius, space } from '../../theme/tokens';

const inr = (value: number, digits = 2) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Formats a number in the Indian grouping used throughout the app. */
export const formatAmount = inr;

interface MoneyProps {
  readonly value: number;
  readonly size?: number;
  readonly weight?: TextStyle['fontWeight'];
  readonly color?: string;
  readonly digits?: number;
  /** Prefix with ₹. Off by default — index levels are quoted bare. */
  readonly currency?: boolean;
  readonly style?: StyleProp<TextStyle>;
}

/** Price text in tabular figures so digits don't shift as quotes tick. */
export function Money({
  value,
  size = 16,
  weight = '700',
  color,
  digits = 2,
  currency = false,
  style,
}: MoneyProps) {
  const { theme } = useTheme();
  return (
    <Text style={[numeric, { fontSize: size, fontWeight: weight, color: color || theme.textPrimary }, style]}>
      {currency ? '₹' : ''}
      {inr(value, digits)}
    </Text>
  );
}

interface DeltaProps {
  readonly change: number;
  readonly percent?: number;
  readonly size?: number;
  /** Draw as a tinted pill rather than bare text. */
  readonly pill?: boolean;
}

/** Signed change with a direction caret, coloured green up / red down. */
export function Delta({ change, percent, size = 13, pill = false }: DeltaProps) {
  const { theme } = useTheme();
  const isUp = change >= 0;
  const tint = isUp ? theme.up : theme.down;
  const sign = isUp ? '+' : '−';
  const body = `${isUp ? '▲' : '▼'} ${sign}${inr(Math.abs(change))}${
    percent === undefined ? '' : ` (${sign}${Math.abs(percent).toFixed(2)}%)`
  }`;

  const text = (
    <Text style={[numeric, { fontSize: size, fontWeight: '700', color: tint }]}>{body}</Text>
  );

  if (!pill) return text;

  return (
    <View
      style={{
        backgroundColor: isUp ? theme.upBackground : theme.downBackground,
        paddingHorizontal: space.sm,
        paddingVertical: 3,
        borderRadius: radius.xs,
        alignSelf: 'flex-start',
      }}
    >
      {text}
    </View>
  );
}

interface StatProps {
  readonly label: string;
  readonly value: string;
  readonly align?: 'flex-start' | 'center' | 'flex-end';
  readonly tint?: string;
}

/** Caption-over-value cell used in OHLC strips and summary rows. */
export function Stat({ label, value, align = 'flex-start', tint }: StatProps) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: align, minWidth: 0 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.7, color: theme.textTertiary }}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={[numeric, { fontSize: 13.5, fontWeight: '600', color: tint || theme.textPrimary, marginTop: 3 }]}
      >
        {value}
      </Text>
    </View>
  );
}
