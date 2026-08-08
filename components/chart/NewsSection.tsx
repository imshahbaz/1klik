import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Panel, SectionHeader } from '../ui/Panel';
import { EmptyState } from '../ui/Feedback';
import { space } from '../../theme/tokens';

interface NewsSectionProps {
  readonly styles?: any;
  readonly theme: any;
  readonly newsLoading: boolean;
  readonly news: any[];
}

/** Headline feed for the symbol, as a hairline-separated list. */
export default function NewsSection({ theme, newsLoading, news }: NewsSectionProps) {
  let body: React.ReactNode;

  if (newsLoading) {
    body = (
      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  } else if (news.length > 0) {
    body = news.map((item, index) => (
      <View
        key={item.id || item.title || index}
        style={[
          styles.item,
          { borderBottomColor: theme.divider, borderBottomWidth: index === news.length - 1 ? 0 : StyleSheet.hairlineWidth },
        ]}
      >
        <Text numberOfLines={3} style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, lineHeight: 20 }}>
          {item.title}
        </Text>
        {item.published ? (
          <Text style={{ fontSize: 11.5, color: theme.textTertiary, marginTop: 5 }}>
            {new Date(item.published * 1000).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : null}
      </View>
    ));
  } else {
    body = <EmptyState icon="newspaper-outline" title="No headlines" message="Nothing published for this symbol." />;
  }

  return (
    <View>
      <SectionHeader title="Headlines" />
      <Panel padded={false}>{body}</Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
