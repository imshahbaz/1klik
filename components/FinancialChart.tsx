import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { WebView } from 'react-native-webview';
import { numeric } from '../theme/tokens';

interface ChartProps {
  readonly rawData: any[];
  readonly theme: any;
  readonly height?: number;
}

interface Candle {
  time: string; // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTH_TO_NUM: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** Candle colours come from the app palette so the chart matches P&L elsewhere. */
const candleColors = (theme: any) => ({ up: theme.up || '#0ECB81', down: theme.down || '#F6465D' });

/** Pinned to v4 for the stable `addCandlestickSeries` API. */
const LWC_CDN = 'https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js';

/** "YYYY-MM-DD" → "5 Jan" for the OHLC info bar. */
const formatDisplayDate = (time?: string): string => {
  if (!time) return '';
  const parts = time.split('-');
  if (parts.length !== 3) return time;
  const monthIdx = Number(parts[1]) - 1;
  return `${Number(parts[2])} ${MONTHS_SHORT[monthIdx] || ''}`;
};

/**
 * Builds the self-contained chart document. TradingView's `lightweight-charts`
 * runs inside the WebView, so the chart is fully decoupled from the native
 * architecture (no Skia / Reanimated dependency). Theme colors are baked in;
 * candle data is pushed in later via `window.__setData`, and crosshair moves are
 * posted back to update the React-Native OHLC bar.
 */
const buildHtml = (theme: any): string => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>html,body,#chart{margin:0;padding:0;height:100%;width:100%;background:${theme.surface};overflow:hidden;}</style>
<script src="${LWC_CDN}"></script>
</head>
<body>
<div id="chart"></div>
<script>
  (function () {
    var post = function (obj) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(obj));
      }
    };
    if (typeof LightweightCharts === 'undefined') { post({ type: 'error' }); return; }

    var chart = LightweightCharts.createChart(document.getElementById('chart'), {
      autoSize: true,
      layout: { background: { type: 'solid', color: '${theme.surface}' }, textColor: '${theme.textTertiary}' },
      grid: { vertLines: { visible: false }, horzLines: { color: '${theme.divider}' } },
      rightPriceScale: { borderColor: '${theme.divider}' },
      timeScale: { borderColor: '${theme.divider}', fixLeftEdge: true, fixRightEdge: true },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
      handleScale: { axisPressedMouseMove: true },
    });

    var series = chart.addCandlestickSeries({
      upColor: '${candleColors(theme).up}', downColor: '${candleColors(theme).down}',
      borderUpColor: '${candleColors(theme).up}', borderDownColor: '${candleColors(theme).down}',
      wickUpColor: '${candleColors(theme).up}', wickDownColor: '${candleColors(theme).down}',
    });

    window.__setData = function (data) {
      series.setData(data);
      chart.timeScale().fitContent();
    };

    chart.subscribeCrosshairMove(function (param) {
      if (!param || !param.time || !param.seriesData) { return; }
      var d = param.seriesData.get(series);
      if (!d) { return; }
      var t = param.time;
      var timeStr = t;
      if (t && typeof t === 'object') {
        timeStr = t.year + '-' + String(t.month).padStart(2, '0') + '-' + String(t.day).padStart(2, '0');
      }
      post({ type: 'cross', time: timeStr, open: d.open, high: d.high, low: d.low, close: d.close });
    });

    post({ type: 'ready' });
  })();
</script>
</body>
</html>`;

export default function FinancialChart({ rawData, theme, height = 400 }: ChartProps) {
  const webViewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Candle | null>(null);

  // Parse + sort the raw API rows into candlestick data. Memoized so it only
  // runs when the underlying data changes.
  const candles = useMemo<Candle[]>(() => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return [];

    // Keyed by date so duplicate timestamps collapse (last wins) — lightweight-
    // charts rejects data with duplicate or unordered times.
    const byTime = new Map<string, Candle>();

    for (const d of rawData) {
      if (!d?.mtimestamp) continue;
      const parts = d.mtimestamp.split('-');
      if (parts.length !== 3) continue;

      const [day, month, year] = parts;
      const monthNum = MONTH_TO_NUM[month] || '01';
      const open = Number.parseFloat(d.chOpeningPrice);
      const high = Number.parseFloat(d.chTradeHighPrice);
      const low = Number.parseFloat(d.chTradeLowPrice);
      const close = Number.parseFloat(d.chClosingPrice);

      if (
        Number.isNaN(open) || Number.isNaN(high) || Number.isNaN(low) || Number.isNaN(close) ||
        open === 0 || high === 0 || low === 0 || close === 0
      ) {
        continue;
      }

      const time = `${year}-${monthNum}-${day.padStart(2, '0')}`;
      byTime.set(time, { time, open, high, low, close });
    }

    return Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time));
  }, [rawData]);

  // Default the OHLC bar to the latest candle.
  useEffect(() => {
    if (candles.length > 0) {
      setSelectedEntry(candles[candles.length - 1]);
    }
  }, [candles]);

  // Rebuild the document only when the theme changes (otherwise the WebView is
  // stable). Reset readiness so the reloaded page re-triggers a data push.
  const html = useMemo(() => buildHtml(theme), [theme]);
  useEffect(() => {
    setReady(false);
  }, [html]);

  // Push candle data once the chart page signals it's ready, and whenever the
  // data changes thereafter.
  useEffect(() => {
    if (ready && candles.length > 0) {
      webViewRef.current?.injectJavaScript(`window.__setData(${JSON.stringify(candles)}); true;`);
    }
  }, [ready, candles]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        setReady(true);
      } else if (msg.type === 'cross') {
        setSelectedEntry({ time: msg.time, open: msg.open, high: msg.high, low: msg.low, close: msg.close });
      }
    } catch {
      // Ignore malformed messages.
    }
  };

  if (candles.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={{ color: theme.textSecondary }}>No chart data available</Text>
      </View>
    );
  }

  let selectedColor = theme.textPrimary;
  if (selectedEntry) {
    const colors = candleColors(theme);
    selectedColor = selectedEntry.close >= selectedEntry.open ? colors.up : colors.down;
  }

  return (
    <View style={{ height, overflow: 'hidden', backgroundColor: theme.surface }}>
      {/* Crosshair OHLC readout, as on a desktop terminal */}
      <View style={[styles.infoBar, { borderBottomColor: theme.divider, backgroundColor: theme.surface }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>O</Text>
          <Text style={[styles.value, { color: selectedColor }]}>{selectedEntry?.open.toFixed(2) ?? '--'}</Text>

          <Text style={[styles.label, { color: theme.textSecondary, marginLeft: 8 }]}>H</Text>
          <Text style={[styles.value, { color: selectedColor }]}>{selectedEntry?.high.toFixed(2) ?? '--'}</Text>

          <Text style={[styles.label, { color: theme.textSecondary, marginLeft: 8 }]}>L</Text>
          <Text style={[styles.value, { color: selectedColor }]}>{selectedEntry?.low.toFixed(2) ?? '--'}</Text>

          <Text style={[styles.label, { color: theme.textSecondary, marginLeft: 8 }]}>C</Text>
          <Text style={[styles.value, { color: selectedColor }]}>{selectedEntry?.close.toFixed(2) ?? '--'}</Text>
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: moderateScale(10), fontWeight: '700' }}>
          {formatDisplayDate(selectedEntry?.time)}
        </Text>
      </View>

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: theme.surface }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  value: {
    ...numeric,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
});
