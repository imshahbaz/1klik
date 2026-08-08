import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import FinancialChart from '../components/FinancialChart';
import { useTheme } from '../context/ThemeContext';
import { newsApi, strategyAPI } from '../services/api';
import AIAnalysisSection from '../components/chart/AIAnalysisSection';
import NewsSection from '../components/chart/NewsSection';
import Screen from '../components/ui/Screen';
import TopBar from '../components/ui/TopBar';
import { Panel, SectionHeader } from '../components/ui/Panel';

export default function ChartScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(true);

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

  return (
    <Screen
      inTabs={false}
      header={
        <TopBar
          title={symbol || 'Chart'}
          subtitle="NSE · daily"
          onBack={() => router.back()}
          actions={[
            {
              icon: isChartExpanded ? 'contract-outline' : 'expand-outline',
              onPress: () => setIsChartExpanded((prev) => !prev),
              accessibilityLabel: isChartExpanded ? 'Collapse chart' : 'Expand chart',
            },
          ]}
        />
      }
    >
      {isChartExpanded ? (
        <>
          <SectionHeader title="Price history" />
          <Panel padded={false} style={styles.chart}>
            {chartLoading ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : (
              <FinancialChart rawData={chartData} theme={theme} height={340} />
            )}
          </Panel>
        </>
      ) : null}

      <AIAnalysisSection theme={theme} aiLoading={aiLoading} aiAnalysis={aiAnalysis} />

      <NewsSection theme={theme} newsLoading={newsLoading} news={news} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: 340,
  },
  chartLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
