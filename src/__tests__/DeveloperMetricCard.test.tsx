import React from 'react';
import { render, screen } from '@testing-library/react';
import DeveloperMetricCard from '../DeveloperMetricCard';

test('renders metric info and value', () => {
  render(
    <DeveloperMetricCard
      name="Merge Success"
      brief="brief"
      details="details"
      valueDesc="merged"
      score={5}
      value={0.5}
      format={(n) => `${n * 100}%`}
    />
  );
  expect(screen.getByText('Merge Success')).toBeInTheDocument();
  expect(screen.getByText('brief')).toBeInTheDocument();
  expect(screen.getByText('details')).toBeInTheDocument();
  expect(screen.getByText('50%')).toBeInTheDocument();
});
