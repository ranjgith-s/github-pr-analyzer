import React from 'react';
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
    <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
      <input
        placeholder="Search GitHub users"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 4,
          border: '1px solid #ccc',
        }}
      />
      {options.length > 0 && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            border: '1px solid #eee',
            borderRadius: 8,
            background: '#fff',
            marginTop: 4,
            zIndex: 1,
          }}
        >
          {options.map((u) => (
            <div
              key={u.login}
              style={{
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: 8,
                borderBottom: '1px solid #f0f0f0',
              }}
              onClick={() => onSelect(u)}
            >
              <img
                src={u.avatar_url}
                alt="avatar"
                width={20}
                height={20}
                style={{ borderRadius: '50%' }}
              />
              <span>{u.login}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
