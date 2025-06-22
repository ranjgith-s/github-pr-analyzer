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

test('renders danger variant for low score', () => {
  render(
    <DeveloperMetricCard
      name="Low"
      brief="b"
      details="d"
      valueDesc="desc"
      score={2}
      value={1}
    />
  );
  expect(screen.getByText('2')).toBeInTheDocument();
});

test('renders attention variant for mid score', () => {
  render(
    <DeveloperMetricCard
      name="Mid"
      brief="b"
      details="d"
      valueDesc="desc"
      score={5}
      value={1}
    />
  );
  expect(screen.getByText('5')).toBeInTheDocument();
});

test('renders success variant for high score', () => {
  render(
    <DeveloperMetricCard
      name="High"
      brief="b"
      details="d"
      valueDesc="desc"
      score={9}
      value={1}
    />
  );
  expect(screen.getByText('9')).toBeInTheDocument();
});

test('renders default variant for null score', () => {
  render(
    <DeveloperMetricCard
      name="None"
      brief="b"
      details="d"
      valueDesc="desc"
      score={null}
      value={1}
    />
  );
  expect(screen.queryByText('null')).not.toBeInTheDocument();
});

test('renders value without format', () => {
  render(
    <DeveloperMetricCard
      name="NoFormat"
      brief="b"
      details="d"
      valueDesc="desc"
      score={1}
      value={42}
    />
  );
  expect(screen.getByText('42')).toBeInTheDocument();
});
