import React from 'react';

interface DiffCellProps {
  additions: number;
  deletions: number;
}

export default function DiffCell({ additions, deletions }: DiffCellProps) {
  return (
    <div className="flex gap-2 items-center justify-center flex-col">
      <span className="whitespace-nowrap font-mono text-xs">
        <span className="text-green-400">+{additions}</span>{' '}
        <span className="text-red-400">-{deletions}</span>
      </span>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 ${i < (additions / (additions + deletions)) * 5 ? 'bg-green-500' : 'bg-red-500'}`}
          />
        ))}
      </div>
    </div>
  );
}
