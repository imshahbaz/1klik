import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const fetchNews = async () => {
      if (!symbol) return;
      try {
        setNewsLoading(true);
        const response = await newsApi.getTvNews(symbol);
        const payload = response.data?.data || response.data || [];
        setNews(payload);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setNewsLoading(false);
      }
    };

    const fetchAiAnalysis = async () => {
      if (!symbol) return;
      try {
        setAiLoading(true);
        const response = await newsApi.getGenAiAnalysis(symbol);
        const payload = response.data?.data || response.data;
        setAiAnalysis(payload);
      } catch (error) {
        console.error('Error fetching AI analysis:', error);
      } finally {
        setAiLoading(false);
      }
    };

    const fetchChartHistory = async () => {
      if (!symbol) return;
      try {
        setChartLoading(true);
        const response = await strategyAPI.fetchChartData(symbol);
        const payload = response.data?.data || response.data || [];
        setChartData(payload);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartHistory();
    fetchNews();
    fetchAiAnalysis();
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    height: 40,
    width: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  liveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  expandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  expandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  expandBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  expandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  chevronCircle: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    height: 400,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  aiGrid: {
    flexDirection: 'column',
    gap: 24,
  },
  aiLeft: {
    gap: 16,
  },
  aiItem: {
    gap: 4,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiAction: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerVertical: {
    width: 1,
    height: 32,
  },
  aiValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  neutralDot: {
    height: 6,
    width: 16,
    backgroundColor: '#eab308',
    borderRadius: 3,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 24,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  aiRight: {
    flex: 1,
  },
  aiReasoning: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  newsList: {
    gap: 12,
  },
  newsItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  newsDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  newsContent: {
    flex: 1,
    gap: 6,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newsDate: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
