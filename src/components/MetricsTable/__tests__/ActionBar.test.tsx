import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionBar from '../ActionBar';

describe('ActionBar', () => {
  it('disables the button when disabled=true', () => {
    render(<ActionBar disabled={true} onView={() => {}} />);
    const btn = screen.getByRole('button', { name: /view pull request/i });
    expect(btn).toBeDisabled();
  });

  it('calls onView when clicked', async () => {
    const onView = jest.fn();
    render(<ActionBar disabled={false} onView={onView} />);
    const btn = screen.getByRole('button', { name: /view pull request/i });
    const user = userEvent.setup();
    await user.click(btn);
    expect(onView).toHaveBeenCalledTimes(1);
  });
});
