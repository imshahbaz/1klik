import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, processColor } from 'react-native';
import { CandleStickChart } from 'react-native-charts-wrapper';

interface ChartProps {
  readonly rawData: any[];
  readonly theme: any;
  readonly isDarkMode: boolean;
  readonly height?: number;
}

const months: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
};

export default function FinancialChart({ rawData, theme, isDarkMode, height = 400 }: ChartProps) {
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const { candleValues, xDates, validData } = useMemo(() => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return { candleValues: [], xDates: [], validData: [] };
    }

    const parsed = rawData.map(d => {
      if (!d?.mtimestamp) return null;
      const parts = d.mtimestamp.split('-');
      if (parts.length !== 3) return null;
      
      const [day, month, year] = parts;
      const monthNum = months[month] || '01';
      const time = `${year}-${monthNum}-${day.padStart(2, '0')}`;
      
      const open = Number.parseFloat(d.chOpeningPrice);
      const high = Number.parseFloat(d.chTradeHighPrice);
      const low = Number.parseFloat(d.chTradeLowPrice);
      const close = Number.parseFloat(d.chClosingPrice);

      if (Number.isNaN(open) || Number.isNaN(high) || Number.isNaN(low) || Number.isNaN(close) || open === 0 || high === 0 || low === 0 || close === 0) {
        return null;
      }

      return {
        date: `${day} ${month}`,
        open, high, low, close,
        _timestamp: new Date(`${time}T00:00:00Z`).getTime()
      };
    }).filter((d): d is any => d !== null)
      .sort((a, b) => a._timestamp - b._timestamp);

    const candles = parsed.map(d => ({
      shadowH: d.high,
      shadowL: d.low,
      open: d.open,
      close: d.close,
    }));
    const dates = parsed.map(d => d.date);

    return { candleValues: candles, xDates: dates, validData: parsed };
  }, [rawData]);

  useEffect(() => {
    if (validData.length > 0) {
      setSelectedEntry(validData[validData.length - 1]);
    }
  }, [validData]);

  if (candleValues.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={{ color: theme.textSecondary }}>No chart data available</Text>
      </View>
    );
  }

  const TV_COLORS = {
    up: '#26a69a',
    down: '#ef5350',
  };

  const handleSelect = (event: any) => {
    const entry = event.nativeEvent;
    if (entry?.x !== undefined) {
      const idx = Math.floor(entry.x);
      if (idx >= 0 && idx < validData.length) {
        setSelectedEntry(validData[idx]);
      }
    }
  };

  let selectedColor = theme.textPrimary;
  if (selectedEntry) {
    selectedColor = selectedEntry.close >= selectedEntry.open ? TV_COLORS.up : TV_COLORS.down;
  }

  return (
    <View style={{ height, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }}>
      {/* Top Info Bar */}
      <View style={[styles.infoBar, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>O</Text>
          <Text style={[styles.value, { color: selectedColor }]}>
            {selectedEntry?.open.toFixed(2) || '--'}
          </Text>
          
          <Text style={[styles.label, { color: theme.textSecondary, marginLeft: 8 }]}>H</Text>
          <Text style={[styles.value, { color: selectedColor }]}>
            {selectedEntry?.high.toFixed(2) || '--'}
          </Text>
          
          <Text style={[styles.label, { color: theme.textSecondary, marginLeft: 8 }]}>L</Text>
          <Text style={[styles.value, { color: selectedColor }]}>
            {selectedEntry?.low.toFixed(2) || '--'}
          </Text>
          
          <Text style={[styles.label, { color: theme.textSecondary, marginLeft: 8 }]}>C</Text>
          <Text style={[styles.value, { color: selectedColor }]}>
            {selectedEntry?.close.toFixed(2) || '--'}
          </Text>
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '700' }}>
          {selectedEntry?.date || ''}
        </Text>
      </View>

      <CandleStickChart
        style={{ flex: 1 }}
        data={{
          dataSets: [{
            values: candleValues,
            label: 'Stock Data',
            config: {
              highlightColor: processColor(theme.textSecondary),
              shadowColorSameAsCandle: true,
              shadowWidth: 1,
              increasingColor: processColor(TV_COLORS.up),
              increasingPaintStyle: 'FILL',
              decreasingColor: processColor(TV_COLORS.down),
              decreasingPaintStyle: 'FILL',
              drawValues: false,
            }
          }]
        }}
        chartDescription={{ text: '' }}
        legend={{ enabled: false }}
        xAxis={{
          drawGridLines: false,
          textColor: processColor(theme.textSecondary),
          position: 'BOTTOM',
          valueFormatter: xDates,
          granularityEnabled: true,
          granularity: 1,
        }}
        yAxis={{
          left: { enabled: false },
          right: {
            textColor: processColor(theme.textSecondary),
            gridColor: processColor(theme.border),
            gridLineWidth: 1,
            drawGridLines: true,
          }
        }}
        zoom={{
          scaleX: Math.max(1, candleValues.length / 40),
          scaleY: 1,
          xValue: candleValues.length - 1,
          yValue: 0,
          axisDependency: 'RIGHT'
        }}
        autoScaleMinMaxEnabled={true}
        onSelect={handleSelect}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
});
