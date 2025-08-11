import React from 'react';
import { Card, Badge } from '../ui-bridge';

interface Props {
  name: string;
  brief: string;
  details: string;
  valueDesc: string;
  score: number | null;
  value: number;
  format?: (n: number) => string;
}

export default function DeveloperMetricCard({
  name,
  brief,
  details,
  valueDesc,
  score,
  value,
  format,
}: Props) {
  const color =
    score === null
      ? 'default'
      : score < 3
        ? 'destructive'
        : score <= 8
          ? 'warning'
          : 'success';
  // Map to badge variant
  const badgeVariant = color === 'default' ? 'secondary' : color;
  return (
    <Card className="p-4 rounded-lg border border-divider space-y-2">
      <h3 className="flex justify-between items-center text-lg">
        {name}
        {typeof score === 'number' && (
          <Badge variant={badgeVariant as any} className="ml-2">
            {score}
          </Badge>
        )}
      </h3>
      <span className="text-base block">{brief}</span>
      <p className="text-foreground/60 text-xs">{details}</p>
      <div className="text-xs flex items-center gap-1">
        <Badge variant={badgeVariant as any}>
          {format ? format(value) : value}
        </Badge>
        <span>{valueDesc}</span>
      </div>
    </Card>
  );
}
