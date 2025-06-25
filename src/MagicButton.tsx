import { Button, ButtonProps } from '@heroui/react';
import React from 'react';

interface Props extends ButtonProps {
  className?: string;
}

export default function MagicButton({ children, className, ...props }: Props) {
  return (
    <Button
      {...props}
      className={className}
    >
      {children}
    </Button>
  );
}
