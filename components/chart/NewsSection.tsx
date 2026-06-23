import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NewsSectionProps {
  styles: any;
  theme: any;
  newsLoading: boolean;
  news: any[];
}

export default function NewsSection({
  styles,
  theme,
  newsLoading,
  news
}: NewsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="newspaper" size={20} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>MARKET HEADLINES</Text>
      </View>

      <View style={styles.newsList}>
        {(() => {
          if (newsLoading) {
            return <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 32 }} />;
          }
          if (news.length > 0) {
            return news.map((item, index) => (
              <TouchableOpacity
                key={item.id || item.title || index}
                activeOpacity={0.7}
                style={[styles.newsItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.newsDot, { backgroundColor: theme.primary }]} />
                <View style={styles.newsContent}>
                  <Text style={[styles.newsTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                  {item.published && (
                    <View style={styles.newsMeta}>
                      <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                      <Text style={[styles.newsDate, { color: theme.textSecondary }]}>
                        {new Date(item.published * 1000).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ));
          }
          return (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>NO NEWS AVAILABLE FOR THIS SYMBOL</Text>
            </View>
          );
        })()}
      </View>
    </View>
  );
}
