import React from 'react';
import { Card } from '@heroui/react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function GlowingCard({ children, className }: Props) {
  return (
    <Card
      className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl p-8 min-w-[320px] max-w-[400px] mx-auto ${className || ''}`}
    >
      {children}
    </Card>
  );
}
