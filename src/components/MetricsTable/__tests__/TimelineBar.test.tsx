import React from 'react';
import { render, screen } from '@testing-library/react';
import TimelineBar from '../TimelineBar';

essentialTests();

function essentialTests() {
  describe('TimelineBar', () => {
    it('renders proportional widths and labels for provided durations', () => {
      // 2h, 1h, 1h -> 50%, 25%, 25%
      const twoH = 2 * 60 * 60 * 1000;
      const oneH = 60 * 60 * 1000;
      const { container } = render(
        <TimelineBar draftMs={twoH} reviewMs={oneH} activeMs={oneH} />
      );

      // aria-label summarizes durations
      expect(
        screen.getByLabelText(/Draft: 2h Review: 1h Active: 1h/i)
      ).toBeInTheDocument();

      // Three bars with widths ~50%, ~25%, ~25%
      const bars = container.querySelectorAll('div.h-2');
      expect(bars.length).toBe(3);
      expect((bars[0] as HTMLElement).style.width).toBe('50%');
      expect((bars[1] as HTMLElement).style.width).toBe('25%');
      expect((bars[2] as HTMLElement).style.width).toBe('25%');
    });

    it('renders N/A labels and 0% widths when durations are null', () => {
      const { container } = render(
        <TimelineBar draftMs={null} reviewMs={null} activeMs={null} />
      );

      expect(
        screen.getByLabelText(/Draft: N\/A Review: N\/A Active: N\/A/i)
      ).toBeInTheDocument();

      const bars = container.querySelectorAll('div.h-2');
      expect(bars.length).toBe(3);
      expect((bars[0] as HTMLElement).style.width).toBe('0%');
      expect((bars[1] as HTMLElement).style.width).toBe('0%');
      expect((bars[2] as HTMLElement).style.width).toBe('0%');
    });
  });
}
