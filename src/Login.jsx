import React, { useState } from 'react';
import {
  Box,
  Button,
  TextInput,
  Heading,
  Text,
  FormControl
} from '@primer/react';
import {SignInIcon} from '@primer/octicons-react';

export default function Login({ onToken }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value) {
      onToken(value.trim());
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100%"
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
          bg: 'canvas.default'
        }}
      >
        <Box as="form" onSubmit={handleSubmit}>
          <Heading as="h1" sx={{ textAlign: 'center', mb: 3 }}>
            GitHub PR Analyzer
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
          </FormControl>
          <Button
            type="submit"
            leadingIcon={SignInIcon}
            sx={{ width: '100%', mt: 3 }}
          >
            Sign in
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
