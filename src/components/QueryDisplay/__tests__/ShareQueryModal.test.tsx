import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareQueryModal } from '../ShareQueryModal';

// Helper to mock window.open
const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

// Helper to provide clipboard mock
function mockClipboard() {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: { writeText },
  });
  return writeText;
}

describe('ShareQueryModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders query, result count and allows title/description input', async () => {
    render(
      <ShareQueryModal
        isOpen={true}
        onClose={jest.fn()}
        query="is:pr author:alice"
        resultCount={3}
      />
    );

    expect(screen.getByText('Query:')).toBeInTheDocument();
    expect(screen.getByText('is:pr author:alice')).toBeInTheDocument();
    expect(screen.getByText(/3\s+results?/i)).toBeInTheDocument();

    // Using placeholder queries because the mocked Input/Textarea do not render labels
    const titleInput = screen.getByPlaceholderText('My awesome PR search');
    const descInput = screen.getByPlaceholderText(
      'Additional context about this search...'
    );

    await userEvent.type(titleInput, 'My Title');
    await userEvent.type(descInput, 'Some description');

    expect(titleInput).toHaveValue('My Title');
    expect(descInput).toHaveValue('Some description');
  });

  it('copies URL to clipboard and toggles icon state', async () => {
    const writeText = mockClipboard();
    render(
      <ShareQueryModal
        isOpen={true}
        onClose={jest.fn()}
        query="is:pr author:alice"
      />
    );

    // First (icon only) button after snippet
    const copyBtn = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('svg')) as HTMLButtonElement;
    fireEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalled();
    await waitFor(() => {
      expect(copyBtn).toHaveAttribute('data-color', 'success');
    });
  });

  it('handles clipboard copy failure gracefully', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('fail'));
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ShareQueryModal
        isOpen={true}
        onClose={jest.fn()}
        query="is:pr author:alice"
      />
    );

    const copyBtn = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('svg')) as HTMLButtonElement;
    fireEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalled();
    expect(screen.getByText('Share via')).toBeInTheDocument();
  });

  it('opens twitter, slack and email share links', async () => {
    render(
      <ShareQueryModal
        isOpen={true}
        onClose={jest.fn()}
        query="is:pr author:alice"
        resultCount={2}
      />
    );

    const titleInput = screen.getByPlaceholderText('My awesome PR search');
    await userEvent.type(titleInput, 'Sample');

    const twitterBtn = screen.getByRole('button', { name: /twitter/i });
    const slackBtn = screen.getByRole('button', { name: /slack/i });
    const emailBtn = screen.getByRole('button', { name: /email/i });

    fireEvent.click(twitterBtn);
    fireEvent.click(slackBtn);
    fireEvent.click(emailBtn);

    expect(openSpy).toHaveBeenCalledTimes(3);
    const urls = openSpy.mock.calls.map((c) => c[0] as unknown as string);
    expect(
      urls.some((u) => (u || '').includes('twitter.com/intent/tweet'))
    ).toBe(true);
    expect(urls.some((u) => (u || '').startsWith('slack://channel'))).toBe(
      true
    );
    expect(urls.some((u) => (u || '').startsWith('mailto:'))).toBe(true);
  });

  it('invokes onClose when Close button pressed', () => {
    const onClose = jest.fn();
    render(
      <ShareQueryModal
        isOpen={true}
        onClose={onClose}
        query="is:pr author:alice"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
