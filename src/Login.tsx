import React, { useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Heading,
  Text,
  FormControl,
  Link,
} from '@primer/react';
import { SignInIcon, TriangleUpIcon } from '@primer/octicons-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { validateToken } from './services/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value) return;

    try {
      await validateToken(value.trim());
      login(value.trim());
      navigate('/');
    } catch {
      setError('Invalid token. Please check and try again.');
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Box
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'border.default',
          borderRadius: 2,
          boxShadow: 'shadow.medium',
          bg: 'canvas.default',
        }}
      >
        <Box as="form" onSubmit={handleSubmit}>
          <Heading
            as="h1"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ gap: 2, textAlign: 'center', mb: 3, color: 'accent.fg' }}
          >
            <TriangleUpIcon size={24} />
            PR-ism
          </Heading>
          <FormControl>
            <FormControl.Label>Personal Access Token</FormControl.Label>
            <TextInput
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="GitHub token"
              sx={{ width: '100%' }}
            />
            <FormControl.Caption>
              <Text fontSize={1}>Your token is used only in the browser</Text>
            </FormControl.Caption>
            <Box mt={2}>
              <details>
                <summary>
                  <Text fontSize={1} sx={{ cursor: 'pointer' }}>
                    Additional info for generating a personal access token
                  </Text>
                </summary>
                <Box as="ol" pl={3} mt={2}>
                  <li>
                    <Text as="span" fontSize={1}>
                      Visit{' '}
                      <Link
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub settings
                      </Link>
                      .
                    </Text>
                  </li>
                  <li>
                    <Text as="span" fontSize={1}>
                      Generate a new fine‑grained token with read‑only
                      repository access.
                    </Text>
                  </li>
                  <li>
                    <Text as="span" fontSize={1}>
                      Enable SSO for your organization when prompted.
                    </Text>
                  </li>
                  <li>
                    <Text as="span" fontSize={1}>
                      Copy the token and paste it here.
                    </Text>
                  </li>
                </Box>
              </details>
            </Box>
          </FormControl>
          <Button
            type="submit"
            variant="primary"
            trailingIcon={SignInIcon}
            sx={{ width: '100%', mt: 3 }}
          >
            Sign in
          </Button>
          {error && (
            <Text color="danger.fg" mt={2} display="block" textAlign="center">
              {error}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
