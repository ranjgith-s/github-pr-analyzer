import React from 'react';

interface DiffCellProps {
  additions: number;
  deletions: number;
}

export default function DiffCell({ additions, deletions }: DiffCellProps) {
  return (
    <span className="whitespace-nowrap font-mono">
      <span className="text-success">+{additions}</span>{' '}
      <span className="text-danger">-{deletions}</span>
    </span>
  );
}
