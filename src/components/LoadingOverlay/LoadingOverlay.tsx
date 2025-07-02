import React, { useEffect, useState } from 'react';
import { Spinner, Card } from '@heroui/react';

interface LoadingOverlayProps {
  show: boolean;
  messages: string[];
}

export default function LoadingOverlay({
  show,
  messages,
}: LoadingOverlayProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 2000);
    return () => clearInterval(id);
  }, [show, messages.length]);

  if (!show) return null;

  return (
    <div
      data-testid="spinner"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      style={{ minHeight: '100vh' }}
    >
      <Card className="flex flex-col items-center gap-4 p-8 shadow-xl border border-divider bg-content1/90">
        <Spinner size="lg" color="primary" />
        <p className="text-base font-mono animate-pulse text-foreground/80 text-center min-w-[200px] min-h-[24px]">
          {messages[index]}
        </p>
      </Card>
    </div>
  );
}
