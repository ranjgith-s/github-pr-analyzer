import React from 'react';

interface DiffCellProps {
  additions: number;
  deletions: number;
}

export default function DiffCell({ additions, deletions }: DiffCellProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap font-mono">
        <span className="text-green-400">+{additions}</span>{' '}
        <span className="text-red-400">-{deletions}</span>
      </span>
    </div>
  );
}
