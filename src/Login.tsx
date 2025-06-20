import React, { useState } from 'react';
import {
  Box,
  TextInput,
  Heading,
  Text,
  FormControl,
  Link,
} from '@primer/react';
import { TriangleUpIcon } from '@primer/octicons-react';
import GlowingCard from './GlowingCard';
import MagicButton from './MagicButton';

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
      setError('Invalid token. Verify the token and try again.');
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <GlowingCard>
        <Box as="form" onSubmit={handleSubmit}>
          <Heading
            as="h1"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ gap: 2, textAlign: 'center', mb: 3, color: 'fg.default' }}
          >
            <TriangleUpIcon size={24} />
            PR-ism
          </Heading>
          <FormControl>
            <FormControl.Label>Personal access token</FormControl.Label>
            <TextInput
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="GitHub token"
              sx={{ width: '100%' }}
            />
            <FormControl.Caption>
              <Text fontSize={1}>This token is used only in the browser.</Text>
            </FormControl.Caption>
            <Box mt={2}>
              <details>
                <summary>
                  <Text fontSize={1} sx={{ cursor: 'pointer' }}>
                    How to generate a personal access token
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
          <Box mt={3} width="100%">
            <MagicButton type="submit" style={{ width: '100%' }}>
              Sign in
            </MagicButton>
          </Box>
          {error && (
            <Text color="danger.fg" mt={2} display="block" textAlign="center">
              {error}
            </Text>
          )}
        </Box>
      </GlowingCard>
    </Box>
  );
}
