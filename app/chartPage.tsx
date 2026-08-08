import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text as PaperText, ActivityIndicator, Chip, IconButton } from 'react-native-paper';
import { ScaledSheet } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FinancialChart from '../components/FinancialChart';
import { useTheme } from '../context/ThemeContext';
import { newsApi, strategyAPI } from '../services/api';
import { getSafeBottomPadding } from '../theme/safeArea';
import AIAnalysisSection from '../components/chart/AIAnalysisSection';
import NewsSection from '../components/chart/NewsSection';

export default function ChartScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;

    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const response = await newsApi.getTvNews(symbol);
        const payload = response.data.data;
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
        const payload = response.data.data;
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
        const payload = response.data.data;
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

  const safeBottomInset = getSafeBottomPadding(insets.bottom);
  const scrollBottomPadding = safeBottomInset + 60;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: safeBottomInset }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Technical Chart Section */}
        <View style={styles.section}>
          <Card
            style={{ backgroundColor: theme.card, borderRadius: 24, elevation: 3 }}
            onPress={() => setIsChartExpanded(!isChartExpanded)}
          >
            <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <IconButton
                  icon={({ size }) => <Ionicons name="stats-chart" size={size || 18} color={theme.primary} />}
                  containerColor={theme.primaryBackground}
                  size={20}
                />
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <PaperText variant="titleMedium" style={{ fontWeight: '900', color: theme.textPrimary }}>
                      Technical Chart
                    </PaperText>
                    {!isChartExpanded && (
                      <Chip compact style={{ backgroundColor: theme.primaryBackground }} textStyle={{ color: theme.primary, fontSize: 9, fontWeight: '900' }}>
                        EXPAND
                      </Chip>
                    )}
                  </View>
                  <PaperText variant="labelSmall" style={{ color: theme.textSecondary, letterSpacing: 1, marginTop: 2 }}>
                    REAL-TIME MARKET MOVEMENT
                  </PaperText>
                </View>
              </View>
              <IconButton
                icon={({ size }) => <Ionicons name={isChartExpanded ? "chevron-up" : "chevron-down"} size={size || 18} color={isChartExpanded ? "#ffffff" : theme.textPrimary} />}
                containerColor={isChartExpanded ? theme.primary : theme.borderLight}
                size={20}
              />
            </Card.Content>
          </Card>

          {isChartExpanded && (
            <Card style={{ backgroundColor: theme.card, borderRadius: 24, overflow: 'hidden', height: 400, marginTop: 12 }}>
              {chartLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : (
                <FinancialChart rawData={chartData} theme={theme} height={400} />
              )}
            </Card>
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
    gap: '24@ms',
  },
  section: {
    gap: '16@ms',
  },
});
