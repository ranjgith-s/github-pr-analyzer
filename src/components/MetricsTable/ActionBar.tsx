import React from 'react';
import { Button } from '../ui';

interface ActionBarProps {
  disabled: boolean;
  onView: () => void;
}

export default function ActionBar({ disabled, onView }: ActionBarProps) {
  if (disabled) return <div />;

  return (
    <div>
      <Button variant="solid" aria-label="View pull request" onClick={onView}>
        View pull request
      </Button>
    </div>
  );
}
