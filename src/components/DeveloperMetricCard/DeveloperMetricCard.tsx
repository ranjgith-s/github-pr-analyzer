import React from 'react';
import { Card, Badge } from '@heroui/react';

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
        ? 'danger'
        : score <= 8
          ? 'warning'
          : 'success';
  return (
    <Card className="p-4 rounded-lg border border-divider">
      <h3 className="flex justify-between items-center text-lg mb-2">
        {name}
        {typeof score === 'number' && (
          <Badge color={color} variant="flat" className="ml-2">
            {score}
          </Badge>
        )}
      </h3>
      <span className="text-base">{brief}</span>
      <p className="mt-2 text-foreground/60 text-xs">{details}</p>
      <p className="mt-2 text-xs">
        <Badge color={color} variant="flat" className="mr-1">
          {format ? format(value) : value}
        </Badge>
        {valueDesc}
      </p>
    </Card>
  );
}
