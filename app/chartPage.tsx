import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FinancialChart from '../components/FinancialChart';
import { useTheme } from '../context/ThemeContext';
import { newsApi, strategyAPI } from '../services/api';
import AIAnalysisSection from '../components/chart/AIAnalysisSection';
import NewsSection from '../components/chart/NewsSection';

export default function ChartScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const insets = useSafeAreaInsets();
  const { isDarkMode, theme } = useTheme();

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  useEffect(() => {
    if (!symbol) return;

    // Guards against a stale-symbol response overwriting newer data and against
    // setting state after the screen unmounts mid-request.
    let cancelled = false;

    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const response = await newsApi.getTvNews(symbol);
        const payload = response.data?.data || response.data || [];
        if (!cancelled) setNews(payload);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    };

    const fetchAiAnalysis = async () => {
      try {
        setAiLoading(true);
        const response = await newsApi.getGenAiAnalysis(symbol);
        const payload = response.data?.data || response.data;
        if (!cancelled) setAiAnalysis(payload);
      } catch (error) {
        console.error('Error fetching AI analysis:', error);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };

    const fetchChartHistory = async () => {
      try {
        setChartLoading(true);
        const response = await strategyAPI.fetchChartData(symbol);
        const payload = response.data?.data || response.data || [];
        if (!cancelled) setChartData(payload);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    fetchChartHistory();
    fetchNews();
    fetchAiAnalysis();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>


      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Chart Section */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsChartExpanded(!isChartExpanded)}
            style={[styles.expandBtn, { backgroundColor: theme.card, borderColor: isChartExpanded ? theme.primary : theme.border }]}
          >
            <View style={styles.expandLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="stats-chart" size={18} color={theme.primary} />
              </View>
              <View>
                <View style={styles.expandTitleRow}>
                  <Text style={[styles.expandTitle, { color: theme.textPrimary }]}>Technical Chart</Text>
                  {!isChartExpanded && (
                    <View style={[styles.expandBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                      <Text style={[styles.expandBadgeText, { color: theme.primary }]}>EXPAND</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.expandSubtitle, { color: theme.textSecondary }]}>REAL-TIME MARKET MOVEMENT</Text>
              </View>
            </View>
            <View style={[styles.chevronCircle, { backgroundColor: isChartExpanded ? theme.primary : theme.card }]}>
              <Ionicons name={isChartExpanded ? "chevron-up" : "chevron-down"} size={16} color={isChartExpanded ? '#ffffff' : theme.textPrimary} />
            </View>
          </TouchableOpacity>

          {isChartExpanded && (
            <View style={[styles.chartContainer, { borderColor: theme.border, backgroundColor: theme.card }]}>
              {chartLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : (
                <FinancialChart rawData={chartData} theme={theme} isDarkMode={isDarkMode} height={400} />
              )}
            </View>
          )}
        </View>

        {/* AI Analysis Section */}
        <AIAnalysisSection
          styles={styles}
          theme={theme}
          aiLoading={aiLoading}
          aiAnalysis={aiAnalysis}
        />

        {/* News Section */}
        <NewsSection
          styles={styles}
          theme={theme}
          newsLoading={newsLoading}
          news={news}
        />
      </ScrollView>
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: '16@ms',
    paddingBottom: '40@ms',
    gap: '24@ms',
  },
  section: {
    gap: '16@ms',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16@ms',
    borderRadius: '24@ms',
    borderWidth: 1,
  },
  expandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12@ms',
    flex: 1,
  },
  iconCircle: {
    height: '40@ms',
    width: '40@ms',
    borderRadius: '12@ms',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@ms',
  },
  expandTitle: {
    fontSize: '16@ms',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  expandBadge: {
    paddingHorizontal: '6@ms',
    paddingVertical: '2@ms',
    borderRadius: '12@ms',
  },
  expandBadgeText: {
    fontSize: '9@ms',
    fontWeight: '900',
  },
  expandSubtitle: {
    fontSize: '10@ms',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: '2@ms',
  },
  chevronCircle: {
    height: '32@ms',
    width: '32@ms',
    borderRadius: '16@ms',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    height: 400,
    borderRadius: '24@ms',
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@ms',
  },
  sectionTitle: {
    fontSize: '18@ms',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  aiCard: {
    borderRadius: '24@ms',
    borderWidth: 1,
    padding: '24@ms',
  },
  aiGrid: {
    flexDirection: 'column',
    gap: '24@ms',
  },
  aiLeft: {
    gap: '16@ms',
  },
  aiItem: {
    gap: '4@ms',
  },
  aiLabel: {
    fontSize: '10@ms',
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiAction: {
    fontSize: '32@ms',
    fontWeight: '900',
    letterSpacing: -1,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16@ms',
  },
  dividerVertical: {
    width: 1,
    height: '32@ms',
  },
  aiValue: {
    fontSize: '18@ms',
    fontWeight: '700',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  neutralDot: {
    height: '6@ms',
    width: '16@ms',
    backgroundColor: '#eab308',
    borderRadius: '3@ms',
  },
  targetRow: {
    flexDirection: 'row',
    gap: '24@ms',
    borderTopWidth: 1,
    paddingTop: '16@ms',
  },
  aiRight: {
    flex: 1,
  },
  aiReasoning: {
    fontSize: '14@ms',
    lineHeight: '22@ms',
    fontWeight: '500',
  },
  emptyCard: {
    padding: '32@ms',
    borderRadius: '24@ms',
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: '12@ms',
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  newsList: {
    gap: '12@ms',
  },
  newsItem: {
    flexDirection: 'row',
    padding: '16@ms',
    borderRadius: '16@ms',
    borderWidth: 1,
    gap: '12@ms',
  },
  newsDot: {
    height: '6@ms',
    width: '6@ms',
    borderRadius: '3@ms',
    marginTop: '6@ms',
  },
  newsContent: {
    flex: 1,
    gap: '6@ms',
  },
  newsTitle: {
    fontSize: '14@ms',
    fontWeight: '700',
    lineHeight: '20@ms',
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@ms',
  },
  newsDate: {
    fontSize: '10@ms',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
