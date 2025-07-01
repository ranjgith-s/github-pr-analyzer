import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MagicButton from '../MagicButton';

describe('MagicButton', () => {
  it('renders children', () => {
    render(<MagicButton>Click Me</MagicButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<MagicButton className="my-class">Test</MagicButton>);
    const button = screen.getByText('Test');
    expect(button).toHaveClass('my-class');
  });

  it('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<MagicButton onClick={handleClick}>Press</MagicButton>);
    fireEvent.click(screen.getByText('Press'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('matches snapshot', () => {
    const { container } = render(<MagicButton>Snapshot</MagicButton>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
