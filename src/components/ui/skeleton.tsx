import React from 'react';

export function Skeleton({
  width = 'w-16',
  className = '',
}: {
  width?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-default-200/60 rounded h-4 animate-pulse ${width} ${className}`}
    />
  );
}
