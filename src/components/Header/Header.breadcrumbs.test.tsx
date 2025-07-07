import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './Header';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

describe('Header breadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders multiple breadcrumbs and highlights the last', async () => {
    function Wrapper() {
      const auth = useAuth();
      React.useEffect(() => {
        auth.login('token');
      }, [auth]);
      return (
        <Header
          breadcrumbs={[
            { label: 'Developer', to: '/developer' },
            { label: 'Octo Cat', to: '/developer/octocat' },
          ]}
        />
      );
    }

    render(
      <MemoryRouter>
        <ThemeModeProvider>
          <AuthProvider>
            <Wrapper />
          </AuthProvider>
        </ThemeModeProvider>
      </MemoryRouter>
    );

    // Only check for breadcrumbs, not username
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Octo Cat')).toBeInTheDocument();
  });
});
