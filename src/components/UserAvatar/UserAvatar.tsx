import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../ui/tooltip';
import { getFromCache, setCache } from '../../services/cache';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const sizeToClasses: Record<Size, string> = {
  xs: 'h-5 w-5',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

interface CachedUserMeta {
  avatar_url: string;
  html_url: string;
}

interface UserAvatarProps {
  username: string;
  size?: Size;
  className?: string;
  fullName?: string; // Optional: user's display name (First Last)
}

function computeMeta(username: string): CachedUserMeta {
  const login = username.trim();
  // Use avatars.githubusercontent.com to avoid redirects; browser will cache images
  return {
    avatar_url: `https://avatars.githubusercontent.com/${encodeURIComponent(login)}?s=80`,
    html_url: `https://github.com/${encodeURIComponent(login)}`,
  };
}

export default function UserAvatar({
  username,
  size = 'sm',
  className,
  fullName,
}: UserAvatarProps) {
  const cacheKey = useMemo(
    () => `avatar:${username.toLowerCase()}`,
    [username]
  );
  const [meta, setMeta] = useState<CachedUserMeta | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const cached = await getFromCache<CachedUserMeta>(cacheKey);
      if (cached && mounted) {
        setMeta(cached);
        return;
      }
      const computed = computeMeta(username);
      if (!mounted) return;
      setMeta(computed);
      // Cache for 24 hours
      await setCache(cacheKey, computed, 60 * 60 * 24);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [cacheKey, username]);

  const initial = (username[0] || '?').toUpperCase();

  if (!meta) {
    return (
      <div
        className={`inline-flex ${sizeToClasses[size]} rounded-full bg-muted`}
        aria-hidden
      />
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={meta.html_url}
            target="_blank"
            rel="noopener noreferrer"
            title={username}
            aria-label={username}
            className="inline-flex"
          >
            <Avatar
              className={`${sizeToClasses[size]} ${className || ''}`.trim()}
            >
              <AvatarImage
                src={meta.avatar_url}
                alt={username}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </a>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          <div className="flex gap-2">
            <Avatar
              className={`${sizeToClasses[size]} ${className || ''}`.trim()}
            >
              <AvatarImage
                src={meta.avatar_url}
                alt={username}
                referrerPolicy="no-referrer"
              />
            </Avatar>

            <div className="flex flex-col">
              <span className="font-medium leading-none">
                {fullName?.trim() || username}
              </span>
              <span className="text-xs text-muted-foreground">@{username}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
