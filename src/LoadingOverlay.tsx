import React, { useEffect, useState } from 'react';

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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: 'rgba(248, 250, 252, 0.9)',
        opacity: 0.9,
        zIndex: 10,
      }}
    >
      <span style={{ fontSize: 32, marginBottom: 16 }}>⏳</span>
      <p
        style={{
          fontFamily: 'monospace',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        {messages[index]}
      </p>
    </div>
  );
}
