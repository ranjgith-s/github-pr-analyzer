import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorModeToggle from '../ColorModeToggle';
import { ThemeModeProvider } from '../ThemeModeContext';

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
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-pressed', 'false');
  await user.click(button);
  expect(button).toHaveAttribute('aria-pressed', 'true');
});
