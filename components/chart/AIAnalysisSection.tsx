import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Panel, SectionHeader } from '../ui/Panel';
import { EmptyState, Tag } from '../ui/Feedback';
import { Stat } from '../ui/Price';
import { space } from '../../theme/tokens';

interface AIAnalysisSectionProps {
  readonly styles?: any;
  readonly theme: any;
  readonly aiLoading: boolean;
  readonly aiAnalysis: any;
}

/** Model verdict on the symbol: call, conviction, expected range, rationale. */
export default function AIAnalysisSection({ theme, aiLoading, aiAnalysis }: AIAnalysisSectionProps) {
  let body: React.ReactNode;

  if (aiLoading) {
    body = (
      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  } else if (aiAnalysis) {
    const action = aiAnalysis.action?.toUpperCase();
    let actionTint = theme.warningText;
    if (action === 'BUY') actionTint = theme.up;
    else if (action === 'SELL') actionTint = theme.down;

    const trend = aiAnalysis.trend?.toUpperCase();
    let trendIcon: 'trending-up' | 'trending-down' | 'remove' = 'remove';
    if (trend === 'BULLISH') trendIcon = 'trending-up';
    else if (trend === 'BEARISH') trendIcon = 'trending-down';

    body = (
      <View>
        <View style={styles.verdict}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: theme.textTertiary }}>
              RECOMMENDATION
            </Text>
            <Text style={{ fontSize: 30, fontWeight: '700', color: actionTint, marginTop: 2 }}>
              {aiAnalysis.action}
            </Text>
          </View>
          {aiAnalysis.confidence ? (
            <Tag label={`${aiAnalysis.confidence}% CONFIDENCE`} tone="accent" />
          ) : null}
        </View>

        <View style={[styles.strip, { borderTopColor: theme.divider, borderBottomColor: theme.divider }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.7, color: theme.textTertiary }}>
              TREND
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Ionicons name={trendIcon} size={15} color={actionTint} />
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.textPrimary, textTransform: 'capitalize' }}>
                {aiAnalysis.trend}
              </Text>
            </View>
          </View>

          {aiAnalysis.tomorrow_high ? (
            <Stat label="EXP. HIGH" value={`₹${aiAnalysis.tomorrow_high}`} align="center" tint={theme.up} />
          ) : null}
          {aiAnalysis.tomorrow_low ? (
            <Stat label="EXP. LOW" value={`₹${aiAnalysis.tomorrow_low}`} align="flex-end" tint={theme.down} />
          ) : null}
        </View>

        <View style={{ padding: space.lg }}>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: theme.textTertiary }}>
            REASONING
          </Text>
          <Text style={{ fontSize: 13.5, color: theme.textSecondary, lineHeight: 21, marginTop: space.sm }}>
            {aiAnalysis.reasoning}
          </Text>
        </View>
      </View>
    );
  } else {
    body = (
      <EmptyState
        icon="sparkles-outline"
        title="No analysis"
        message="This symbol doesn't have a model verdict yet."
      />
    );
  }

  return (
    <View>
      <SectionHeader title="AI analysis" />
      <Panel padded={false}>{body}</Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.lg,
  },
  strip: {
    flexDirection: 'row',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
