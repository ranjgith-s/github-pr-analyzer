import React, { useEffect, useState } from 'react';
import { Box, Spinner, Text } from '@primer/react';

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
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      sx={{ bg: 'canvas.overlay', opacity: 0.9, zIndex: 10 }}
    >
      <Spinner size="large" />
      <Text
        mt={2}
        sx={{
          fontFamily: 'mono',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        {messages[index]}
      </Text>
    </Box>
  );
}
