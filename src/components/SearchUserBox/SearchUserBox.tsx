import React from 'react';
import { GitHubUser } from '../../utils/services/auth';
import { Input, Card } from '../ui';
import UserAvatar from '../UserAvatar/UserAvatar';

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
    <div className="relative w-full max-w-xs">
      <Input
        placeholder="Search gitHub users by username"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full"
        aria-label="Search GitHub users"
      />
      {options.length > 0 && (
        <Card className="absolute w-full mt-1 z-10 p-0">
          {options.map((u) => (
            <div
              key={u.login}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 border-b last:border-b-0 border-border"
              onClick={() => onSelect(u)}
            >
              <UserAvatar username={u.login} size="sm" />
              <span className="font-mono text-sm text-foreground">
                {u.login}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
