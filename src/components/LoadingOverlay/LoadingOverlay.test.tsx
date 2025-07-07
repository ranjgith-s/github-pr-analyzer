import React from 'react';
import { render, screen, act } from '@testing-library/react';
import LoadingOverlay from './LoadingOverlay';

jest.useFakeTimers();

describe('LoadingOverlay', () => {
  const messages = ['Loading...', 'Almost there!', 'Just a moment'];

  it('renders spinner and first message when show is true', () => {
    render(<LoadingOverlay show={true} messages={messages} />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    const messageEls = screen.getAllByText(messages[0]);
    expect(messageEls.some((el) => el.tagName === 'P')).toBe(true);
  });

  it('renders nothing when show is false', () => {
    const { container } = render(
      <LoadingOverlay show={false} messages={messages} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('cycles through messages', async () => {
    render(<LoadingOverlay show={true} messages={messages} />);
    let messageEls = screen.getAllByText(messages[0]);
    expect(messageEls.some((el) => el.tagName === 'P')).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    messageEls = await screen.findAllByText(messages[1]);
    expect(messageEls.some((el) => el.tagName === 'P')).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    messageEls = await screen.findAllByText(messages[2]);
    expect(messageEls.some((el) => el.tagName === 'P')).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    messageEls = await screen.findAllByText(messages[0]);
    expect(messageEls.some((el) => el.tagName === 'P')).toBe(true);
  });

  it('matches snapshot', () => {
    const { container } = render(
      <LoadingOverlay show={true} messages={messages} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
