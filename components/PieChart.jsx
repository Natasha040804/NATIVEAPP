import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

// Simple pie chart component using react-native-svg
// Props:
// - data: Array<{ label: string; value: number; color: string }>
// - size?: number (diameter in px)
// - title?: string
// - selectedLabel?: string | null (highlight this slice)
// - onSlicePress?: (slice: { label: string; value: number; color: string }, index: number) => void
export default function PieChart({ data = [], size = 220, title, selectedLabel = null, onSlicePress }) {
  const radius = size / 2;

  const { arcs, total } = useMemo(() => {
    const sum = data.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    let accAngle = 0; // in degrees
    const arcsCalc = data.map((d) => {
      const portion = sum > 0 ? (Number(d.value) || 0) / sum : 0;
      const start = accAngle;
      const end = start + portion * 360;
      accAngle = end;
      return { ...d, start, end };
    });
    return { arcs: arcsCalc, total: sum };
  }, [data]);

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  const arcPath = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z',
    ].join(' ');
  };

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.noData}><Text style={styles.noDataText}>No data</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Svg width={size} height={size}>
        <G>
          {arcs.map((a, idx) => {
            const mid = (a.start + a.end) / 2;
            const isSelected = selectedLabel != null && a.label === selectedLabel;
            const offset = isSelected ? 10 : 0;
            const midPt = polarToCartesian(radius, radius, offset, mid);
            return (
              <G key={idx} transform={`translate(${midPt.x - radius}, ${midPt.y - radius})`}>
                <Path
                  d={arcPath(radius, radius, radius, a.start, a.end)}
                  fill={a.color}
                  opacity={isSelected ? 1 : 0.9}
                  stroke={isSelected ? '#222' : 'transparent'}
                  strokeWidth={isSelected ? 2 : 0}
                  onPress={onSlicePress ? () => onSlicePress(a, idx) : undefined}
                />
              </G>
            );
          })}
          {/* Center label */}
          <SvgText
            x={radius}
            y={radius - 4}
            fontSize={18}
            fontWeight="700"
            fill="#000"
            textAnchor="middle"
          >
            {total}
          </SvgText>
          <SvgText
            x={radius}
            y={radius + 16}
            fontSize={12}
            fill="#333"
            textAnchor="middle"
          >
            Total
          </SvgText>
        </G>
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((d, i) => (
          <View key={`${d.label}-${i}`} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: d.color, opacity: selectedLabel && selectedLabel !== d.label ? 0.6 : 1 }]} />
            <Text style={[styles.legendText, selectedLabel && selectedLabel !== d.label ? { opacity: 0.6 } : null]}>
              {d.label} ({d.value})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  title: { color: '#fff', fontWeight: '700', marginBottom: 8 },
  noData: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: { color: '#fff' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    gap: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  swatch: { width: 12, height: 12, borderRadius: 2, marginRight: 6 },
  legendText: { color: '#fff' },
});
