import React from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, ActivityIndicator, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface NewsSectionProps {
  readonly styles: any;
  readonly theme: any;
  readonly newsLoading: boolean;
  readonly news: any[];
}

export default function NewsSection({
  styles,
  theme,
  newsLoading,
  news
}: NewsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="newspaper" size={20} color={theme.primary} />
        <PaperText variant="titleMedium" style={{ marginLeft: 8, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.5 }}>
          MARKET HEADLINES
        </PaperText>
      </View>

      <View style={{ gap: 12 }}>
        {(() => {
          if (newsLoading) {
            return <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 32 }} />;
          }
          if (news.length > 0) {
            return news.map((item, index) => (
              <Card
                key={item.id || item.title || index}
                style={{ backgroundColor: theme.card, borderRadius: 16, elevation: 1 }}
              >
                <Card.Content>
                  <List.Item
                    title={item.title}
                    titleNumberOfLines={3}
                    titleStyle={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14, lineHeight: 20 }}
                    description={
                      item.published
                        ? `${new Date(item.published * 1000).toLocaleString()}`
                        : undefined
                    }
                    descriptionStyle={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}
                    left={(props) => (
                      <List.Icon {...props} icon="newspaper-variant-outline" color={theme.primary} />
                    )}
                  />
                </Card.Content>
              </Card>
            ));
          }
          return (
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, borderStyle: 'dashed' }}>
              <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
                <PaperText variant="labelMedium" style={{ color: theme.textSecondary, fontWeight: '800' }}>
                  NO NEWS AVAILABLE FOR THIS SYMBOL
                </PaperText>
              </Card.Content>
            </Card>
          );
        })()}
      </View>
    </View>
  );
}
