import React from 'react';
import { Card } from '../ui';

interface Props {
  children: React.ReactNode;
  className?: string;
  [key: string]: any; // allow data-testid and other props
}

export default function GlowingCard({ children, className, ...rest }: Props) {
  return (
    <Card
      className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl p-8 min-w-[320px] max-w-[400px] mx-auto ${className || ''}`}
      {...rest}
    >
      {children}
    </Card>
  );
}
