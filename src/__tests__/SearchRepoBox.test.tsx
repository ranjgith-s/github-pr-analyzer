import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchRepoBox from '../SearchRepoBox';

describe('SearchRepoBox', () => {
  const options = [
    { owner: 'octocat', repo: 'Hello-World', fullName: 'octocat/Hello-World' },
    { owner: 'test', repo: 'Repo', fullName: 'test/Repo' },
  ];

  it('renders input with placeholder', () => {
    render(
      <SearchRepoBox query="" options={[]} onQueryChange={jest.fn()} onSelect={jest.fn()} />
    );
    expect(screen.getByPlaceholderText(/Search GitHub repositories/i)).toBeInTheDocument();
  });

  it('calls onQueryChange when typing', () => {
    const onQueryChange = jest.fn();
    render(
      <SearchRepoBox query="" options={[]} onQueryChange={onQueryChange} onSelect={jest.fn()} />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'octocat' } });
    expect(onQueryChange).toHaveBeenCalledWith('octocat');
  });

  it('renders options and calls onSelect', () => {
    const onSelect = jest.fn();
    render(
      <SearchRepoBox query="" options={options} onQueryChange={jest.fn()} onSelect={onSelect} />
    );
    expect(screen.getByText('octocat/Hello-World')).toBeInTheDocument();
    fireEvent.click(screen.getByText('octocat/Hello-World'));
    expect(onSelect).toHaveBeenCalledWith(options[0]);
  });

  it('matches snapshot', () => {
    const { container } = render(
      <SearchRepoBox query="" options={options} onQueryChange={jest.fn()} onSelect={jest.fn()} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
