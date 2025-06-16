import React, {useEffect, useState} from 'react';
import {Box, Avatar, Text, Button} from '@primer/react';
import {Octokit} from '@octokit/rest';
import {GraphIcon} from '@primer/octicons-react';

export default function Header({token, onLogout}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const octokit = new Octokit({auth: token});
      try {
        const {data} = await octokit.rest.users.getAuthenticated();
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, [token]);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      p={3}
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderColor="border.default"
      sx={{bg: 'canvas.subtle'}}
    >
      <Box display="flex" alignItems="center" sx={{gap: 2}}>
        <GraphIcon size={24} />
        <Text fontWeight="bold">GitHub PR Analyzer</Text>
      </Box>
      {user && (
        <Box display="flex" alignItems="center" sx={{gap: 2}}>
          <Avatar src={user.avatar_url} size={24} />
          <Text>{user.login}</Text>
          <Button onClick={onLogout}>Logout</Button>
        </Box>
      )}
    </Box>
  );
}
