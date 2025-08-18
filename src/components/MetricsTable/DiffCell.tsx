import React from 'react';

interface DiffCellProps {
  additions: number;
  deletions: number;
}

export default function DiffCell({ additions, deletions }: DiffCellProps) {
  return (
    <span className="whitespace-nowrap font-mono">
      <span className="text-green-600">+{additions}</span>{' '}
      <span className="text-red-600">-{deletions}</span>
    </span>
  );
}
