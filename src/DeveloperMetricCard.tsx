import React from 'react';

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
  const variant =
    score === null
      ? 'default'
      : score < 3
        ? 'danger'
        : score <= 8
          ? 'attention'
          : 'success';
  const badgeStyle = {
    padding: '2px 8px',
    borderRadius: '8px',
    fontSize: '0.8em',
    marginLeft: 8,
    background:
      variant === 'danger'
        ? '#ffdddd'
        : variant === 'attention'
          ? '#fff3cd'
          : variant === 'success'
            ? '#d1e7dd'
            : '#eee',
    color:
      variant === 'danger'
        ? '#842029'
        : variant === 'attention'
          ? '#664d03'
          : variant === 'success'
            ? '#0f5132'
            : '#333',
  };
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h3
        style={{
          fontSize: 18,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {name}
        {typeof score === 'number' && <span style={badgeStyle}>{score}</span>}
      </h3>
      <span style={{ fontSize: 14 }}>{brief}</span>
      <p style={{ marginTop: 8, color: '#888', fontSize: 12 }}>{details}</p>
      <p style={{ marginTop: 8, fontSize: 12 }}>
        <span style={badgeStyle}>{format ? format(value) : value}</span>{' '}
        {valueDesc}
      </p>
    </div>
  );
}
