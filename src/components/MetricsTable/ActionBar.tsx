import React from 'react';
import { Button } from '../ui';

interface ActionBarProps {
  disabled: boolean;
  onView: () => void;
}

export default function ActionBar({ disabled, onView }: ActionBarProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Button
        variant="solid"
        isDisabled={disabled}
        aria-label="View pull request"
        onClick={onView}
      >
        View pull request
      </Button>
    </div>
  );
}
