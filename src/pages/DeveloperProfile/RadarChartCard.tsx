import React from 'react';
import { RadarChart, Radar, PolarAngleAxis } from 'recharts';
import { Card } from '../../components/ui';
import { DeveloperMetrics } from 'src/types';

interface RadarChartCardProps {
  data: DeveloperMetrics;
}

export default function RadarChartCard({ data }: RadarChartCardProps) {
  const chartData = [
    { metric: 'Merge Success', value: data.mergeSuccess },
    { metric: 'Cycle Efficiency', value: data.cycleEfficiency },
    { metric: 'Size Efficiency', value: data.sizeEfficiency },
    { metric: 'Lead Time', value: data.leadTimeScore },
    { metric: 'Review Activity', value: data.reviewActivity },
    { metric: 'Feedback Score', value: data.feedbackScore },
    { metric: 'Issue Resolution', value: data.issueResolution },
  ];

  return (
    <Card className="p-6 animate-fadeInUp flex items-center justify-center">
      <RadarChart
        width={500}
        height={400}
        data={chartData}
        data-testid="radar-chart"
      >
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontFamily: 'monospace', fontSize: 10 }}
        />
        <Radar
          dataKey="value"
          stroke="#2da44e"
          fill="#2da44e"
          fillOpacity={0.6}
        />
      </RadarChart>
    </Card>
  );
}
