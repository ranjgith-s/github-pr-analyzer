import React from 'react';
import { Box, TextInput, Avatar, Text } from '@primer/react';
import { GitHubUser } from './services/auth';

interface Props {
  query: string;
  options: GitHubUser[];
  onQueryChange: (value: string) => void;
  onSelect: (user: GitHubUser) => void;
}

export default function SearchUserBox({
  query,
  options,
  onQueryChange,
  onSelect,
}: Props) {
  return (
    <Box position="relative" width="100%" maxWidth={300}>
      <TextInput
        placeholder="Search GitHub user"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        sx={{ width: '100%' }}
      />
      {options.length > 0 && (
        <Box
          position="absolute"
          width="100%"
          borderWidth={1}
          borderStyle="solid"
          borderColor="border.default"
          borderRadius={2}
          bg="canvas.overlay"
          mt={1}
          zIndex={1}
        >
          {options.map((u) => (
            <Box
              key={u.login}
              p={2}
              display="flex"
              alignItems="center"
              sx={{ cursor: 'pointer', '&:hover': { bg: 'neutral.muted' } }}
              onClick={() => onSelect(u)}
            >
              <Avatar src={u.avatar_url} size={20} mr={2} />
              <Text>{u.login}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
