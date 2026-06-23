import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AIAnalysisSectionProps {
  styles: any;
  theme: any;
  aiLoading: boolean;
  aiAnalysis: any;
}

export default function AIAnalysisSection({
  styles,
  theme,
  aiLoading,
  aiAnalysis
}: AIAnalysisSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="sparkles" size={20} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>AI ANALYSIS</Text>
      </View>

      {(() => {
        if (aiLoading) {
          return (
            <View style={[styles.aiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 32 }} />
            </View>
          );
        }
        if (aiAnalysis) {
          return (
            <View style={[styles.aiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.aiGrid}>
                {/* Left Column: Action, Confidence, Trend */}
                <View style={styles.aiLeft}>
                  <View style={styles.aiItem}>
                    <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>RECOMMENDATION</Text>
                    {(() => {
                      let actionColor = '#eab308';
                      if (aiAnalysis.action?.toUpperCase() === 'BUY') actionColor = '#22c55e';
                      else if (aiAnalysis.action?.toUpperCase() === 'SELL') actionColor = '#ef4444';
                      return (
                        <Text style={[styles.aiAction, { color: actionColor }]}>
                          {aiAnalysis.action}
                        </Text>
                      );
                    })()}
                  </View>
                  <View style={styles.aiRow}>
                    <View style={styles.aiItem}>
                      <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>CONFIDENCE</Text>
                      <Text style={[styles.aiValue, { color: theme.textPrimary }]}>{aiAnalysis.confidence}%</Text>
                    </View>
                    <View style={[styles.dividerVertical, { backgroundColor: theme.border }]} />
                    <View style={styles.aiItem}>
                      <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>TREND</Text>
                      <View style={styles.trendRow}>
                        {(() => {
                          if (aiAnalysis.trend?.toUpperCase() === 'BULLISH') return <Ionicons name="trending-up" size={16} color="#22c55e" />;
                          if (aiAnalysis.trend?.toUpperCase() === 'BEARISH') return <Ionicons name="trending-down" size={16} color="#ef4444" />;
                          return <View style={styles.neutralDot} />;
                        })()}
                        <Text style={[styles.aiValue, { color: theme.textPrimary, textTransform: 'capitalize', marginLeft: 4 }]}>{aiAnalysis.trend}</Text>
                      </View>
                    </View>
                  </View>

                  {(aiAnalysis.tomorrow_high || aiAnalysis.tomorrow_low) && (
                    <View style={[styles.targetRow, { borderTopColor: theme.border }]}>
                      {aiAnalysis.tomorrow_high && (
                        <View style={styles.aiItem}>
                          <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>EXPECTED HIGH</Text>
                          <Text style={[styles.aiValue, { color: '#22c55e' }]}>₹{aiAnalysis.tomorrow_high}</Text>
                        </View>
                      )}
                      {aiAnalysis.tomorrow_low && (
                        <View style={styles.aiItem}>
                          <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>EXPECTED LOW</Text>
                          <Text style={[styles.aiValue, { color: '#ef4444' }]}>₹{aiAnalysis.tomorrow_low}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Right Column: Reasoning */}
                <View style={styles.aiRight}>
                  <Text style={[styles.aiLabel, { color: theme.textSecondary, marginBottom: 8 }]}>ANALYSIS & REASONING</Text>
                  <Text style={[styles.aiReasoning, { color: theme.textSecondary }]}>
                    {aiAnalysis.reasoning}
                  </Text>
                </View>
              </View>
            </View>
          );
        }
        return (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>NO AI ANALYSIS AVAILABLE FOR THIS SYMBOL</Text>
          </View>
        );
      })()}
    </View>
  );
}
