import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import ColorModeToggle from './ColorModeToggle';

beforeEach(() => {
  localStorage.clear();
});

test('toggles theme with accessible switch', async () => {
  const user = userEvent.setup();
  render(
    <ThemeModeProvider>
      <ColorModeToggle />
    </ThemeModeProvider>
  );
  const toggle = screen.getByRole('switch', { name: /switch to dark mode/i });
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  await user.click(toggle);
  expect(toggle).toHaveAttribute('aria-checked', 'true');
});
