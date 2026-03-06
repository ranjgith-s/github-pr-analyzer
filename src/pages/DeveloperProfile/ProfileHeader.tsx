import React from 'react';
import { Card } from '../../components/ui';
import { DeveloperMetrics } from 'src/types';

interface ProfileHeaderProps {
  data: DeveloperMetrics;
}

export default function ProfileHeader({ data }: ProfileHeaderProps) {
  return (
    <Card className="p-6 animate-fadeInUp">
      <div className="flex items-center gap-4">
        <img
          src={data.avatar_url}
          alt="avatar"
          width={64}
          height={64}
          className="rounded-full"
        />
        <div>
          <h2 className="text-2xl m-0">{data.name || data.login}</h2>
          <span className="text-foreground/60">{data.login}</span>
        </div>
      </div>
      {data.bio && <p className="mt-4 max-w-[300px]">{data.bio}</p>}
      <div className="mt-4 grid gap-1">
        {data.company && <span>🏢 {data.company}</span>}
        {data.location && <span>📍 {data.location}</span>}
        <span>Repos: {data.public_repos}</span>
        <span>Followers: {data.followers}</span>
        <span>Following: {data.following}</span>
        <a
          href={data.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          View on GitHub
        </a>
      </div>
    </Card>
  );
}
