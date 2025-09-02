import React from 'react';
import { render, screen } from '@testing-library/react';
import TimelineBar from '../TimelineBar';

essentialTests();

function essentialTests() {
  describe('TimelineBar', () => {
    it('renders proportional widths based on timestamps', () => {
      // created -> published: 2h, published -> firstReview: 1h, firstReview -> closed: 1h
      const base = new Date('2020-01-01T00:00:00Z').getTime();
      const createdAt = new Date(base).toISOString();
      const publishedAt = new Date(base + 2 * 60 * 60 * 1000).toISOString();
      const firstReviewAt = new Date(base + 3 * 60 * 60 * 1000).toISOString();
      const closedAt = new Date(base + 4 * 60 * 60 * 1000).toISOString();

      const { container } = render(
        <TimelineBar
          createdAt={createdAt}
          publishedAt={publishedAt}
          firstReviewAt={firstReviewAt}
          closedAt={closedAt}
        />
      );

      // Three bars with widths 50%, 25%, 25%
      const bars = container.querySelectorAll('div.h-1');
      expect(bars.length).toBe(3);
      expect((bars[0] as HTMLElement).style.width).toBe('50%');
      expect((bars[1] as HTMLElement).style.width).toBe('25%');
      expect((bars[2] as HTMLElement).style.width).toBe('25%');

      // Summary text shows total duration (4h)
      expect(screen.getByText(/4h/i)).toBeInTheDocument();
    });

    it('renders N/A and 0% widths when end timestamps are missing', () => {
      const createdAt = '2020-01-01T00:00:00Z';
      const { container } = render(
        <TimelineBar
          createdAt={createdAt}
          publishedAt={null}
          firstReviewAt={null}
          closedAt={null}
        />
      );

      // No end -> N/A summary
      expect(screen.getByText(/N\/A/i)).toBeInTheDocument();

      const bars = container.querySelectorAll('div.h-1');
      expect(bars.length).toBe(3);
      expect((bars[0] as HTMLElement).style.width).toBe('0%');
      expect((bars[1] as HTMLElement).style.width).toBe('0%');
      expect((bars[2] as HTMLElement).style.width).toBe('0%');
    });
  });
}
