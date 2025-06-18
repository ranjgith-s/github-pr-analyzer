import React from 'react';
import { Box } from '@primer/react';

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
        borderRadius: 2,
        overflow: 'visible',
      }}
    >
      {children}
    </Box>
  );
}
