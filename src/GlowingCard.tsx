import React from 'react';
import { Box } from './primer-shim';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function GlowingCard({ children, className }: Props) {
  return (
    <Box
      className={`glow-card${className ? ` ${className}` : ''}`}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
        position: 'relative',
        borderRadius: 'var(--magic-radius)',
        overflow: 'visible',
      }}
    >
      {children}
    </Box>
  );
}
