import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import {AuthProvider, useAuth} from '../AuthContext';

test('login submits provided token', async () => {
  let ctx: ReturnType<typeof useAuth> | undefined;
  function Wrapper() {
    ctx = useAuth();
    return <Login />;
  }
  render(
    <AuthProvider>
      <Wrapper />
    </AuthProvider>
  );
  const input = screen.getByPlaceholderText(/github token/i);
  const user = userEvent.setup();
  await user.type(input, 'token123');
  await user.click(screen.getByRole('button', {name: /sign in/i}));
  await waitFor(() => expect(ctx!.token).toBe('token123'));
});
