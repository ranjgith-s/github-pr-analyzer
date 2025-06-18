import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export default function MagicButton({ children, className, ...props }: Props) {
  return (
    <button
      {...props}
      className={`magic-button${className ? ` ${className}` : ''}`}
      type={props.type || 'button'}
    >
      {children}
    </button>
  );
}
