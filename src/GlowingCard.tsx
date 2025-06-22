import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function GlowingCard({ children, className }: Props) {
  return (
    <div
      className={`glow-card${className ? ` ${className}` : ''}`}
      style={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
        borderRadius: 16,
        boxShadow: '0 4px 24px 0 rgba(80, 120, 255, 0.15)',
        padding: 32,
        minWidth: 320,
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  );
}
