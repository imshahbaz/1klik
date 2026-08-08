import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { size, space } from '../../theme/tokens';

export interface TabItem {
  readonly value: string;
  readonly label: string;
  /** Trailing count, rendered dimmer than the label. */
  readonly count?: number;
}

interface TabsProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly items: readonly TabItem[];
  /** Scroll horizontally instead of dividing the width evenly. */
  readonly scrollable?: boolean;
}

/**
 * Android top tabs: full-bleed, uppercase labels, and a 2dp indicator riding a
 * hairline baseline. Replaces Paper's pill-shaped SegmentedButtons, which read
 * as a web control rather than a native tab strip.
 */
export default function Tabs({ value, onChange, items, scrollable = false }: TabsProps) {
  const { theme } = useTheme();

  const tabs = items.map((item) => {
    const active = item.value === value;
    return (
      <TouchableRipple
        key={item.value}
        onPress={() => onChange(item.value)}
        rippleColor={theme.ripple}
        style={[
          styles.tab,
          scrollable ? { paddingHorizontal: space.xl } : { flex: 1 },
          { borderBottomColor: active ? theme.primary : 'transparent' },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
      >
        <View style={styles.tabInner}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12.5,
              fontWeight: '700',
              letterSpacing: 0.7,
              textTransform: 'uppercase',
              color: active ? theme.primary : theme.textSecondary,
            }}
          >
            {item.label}
          </Text>
          {typeof item.count === 'number' ? (
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                marginLeft: space.xs,
                color: active ? theme.primary : theme.textTertiary,
              }}
            >
              {item.count}
            </Text>
          ) : null}
        </View>
      </TouchableRipple>
    );
  });

  return (
    <View style={[styles.bar, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs}
        </ScrollView>
      ) : (
        tabs
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    height: size.tab,
    justifyContent: 'center',
    // The indicator is the tab's own bottom border, so it sits exactly on the
    // baseline hairline rather than floating above it.
    borderBottomWidth: 2,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
