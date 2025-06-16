import React, { useState } from 'react';
import {Box, Button, TextInput, Heading, Text} from '@primer/react';

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
      as="form"
      onSubmit={handleSubmit}
      sx={{ mt: 4, textAlign: 'center' }}
    >
      <Heading as="h1">GitHub PR Analyzer</Heading>
      <Text display="block" mt={2}>Enter a personal access token to continue:</Text>
      <TextInput
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="GitHub token"
      />
      <Button type="submit" sx={{ ml: 2 }}>
        Sign in
      </Button>
    </Box>
  );
}
