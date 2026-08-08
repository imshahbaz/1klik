import React from 'react';
import { View } from 'react-native';
import { Card, Text as PaperText, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface AIAnalysisSectionProps {
  readonly styles: any;
  readonly theme: any;
  readonly aiLoading: boolean;
  readonly aiAnalysis: any;
}

export default function AIAnalysisSection({
  styles,
  theme,
  aiLoading,
  aiAnalysis
}: AIAnalysisSectionProps) {
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="sparkles" size={20} color={theme.primary} />
        <PaperText variant="titleMedium" style={{ marginLeft: 8, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.5 }}>
          AI ANALYSIS
        </PaperText>
      </View>

      {(() => {
        if (aiLoading) {
          return (
            <Card style={{ backgroundColor: theme.card, borderRadius: 24 }}>
              <Card.Content style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="large" color={theme.primary} />
              </Card.Content>
            </Card>
          );
        }
        if (aiAnalysis) {
          let actionColor = '#eab308';
          if (aiAnalysis.action?.toUpperCase() === 'BUY') actionColor = '#22c55e';
          else if (aiAnalysis.action?.toUpperCase() === 'SELL') actionColor = '#ef4444';

          return (
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, elevation: 3 }}>
              <Card.Content style={{ gap: 16 }}>
                {/* Recommendation Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '800' }}>
                      RECOMMENDATION
                    </PaperText>
                    <PaperText variant="headlineMedium" style={{ color: actionColor, fontWeight: '900' }}>
                      {aiAnalysis.action}
                    </PaperText>
                  </View>

                  <Chip
                    compact
                    style={{ backgroundColor: theme.primaryBackground }}
                    textStyle={{ color: theme.primary, fontWeight: '800' }}
                  >
                    {aiAnalysis.confidence}% CONFIDENCE
                  </Chip>
                </View>

                <Divider style={{ backgroundColor: theme.border }} />

                {/* Trend & Expected targets */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '700' }}>TREND</PaperText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      {aiAnalysis.trend?.toUpperCase() === 'BULLISH' && <Ionicons name="trending-up" size={18} color="#22c55e" />}
                      {aiAnalysis.trend?.toUpperCase() === 'BEARISH' && <Ionicons name="trending-down" size={18} color="#ef4444" />}
                      <PaperText variant="titleMedium" style={{ color: theme.textPrimary, fontWeight: '700', marginLeft: 4, textTransform: 'capitalize' }}>
                        {aiAnalysis.trend}
                      </PaperText>
                    </View>
                  </View>

                  {aiAnalysis.tomorrow_high && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '700' }}>EXP. HIGH</PaperText>
                      <PaperText variant="titleMedium" style={{ color: '#22c55e', fontWeight: '800', marginTop: 4 }}>
                        ₹{aiAnalysis.tomorrow_high}
                      </PaperText>
                    </View>
                  )}

                  {aiAnalysis.tomorrow_low && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '700' }}>EXP. LOW</PaperText>
                      <PaperText variant="titleMedium" style={{ color: '#ef4444', fontWeight: '800', marginTop: 4 }}>
                        ₹{aiAnalysis.tomorrow_low}
                      </PaperText>
                    </View>
                  )}
                </View>

                <Divider style={{ backgroundColor: theme.border }} />

                {/* Reasoning */}
                <View>
                  <PaperText variant="labelSmall" style={{ color: theme.textSecondary, fontWeight: '800', marginBottom: 6 }}>
                    ANALYSIS & REASONING
                  </PaperText>
                  <PaperText variant="bodyMedium" style={{ color: theme.textSecondary, lineHeight: 22 }}>
                    {aiAnalysis.reasoning}
                  </PaperText>
                </View>
              </Card.Content>
            </Card>
          );
        }
        return (
          <Card style={{ backgroundColor: theme.card, borderRadius: 24, borderStyle: 'dashed' }}>
            <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
              <PaperText variant="labelMedium" style={{ color: theme.textSecondary, fontWeight: '800' }}>
                NO AI ANALYSIS AVAILABLE FOR THIS SYMBOL
              </PaperText>
            </Card.Content>
          </Card>
        );
      })()}
    </View>
  );
}
