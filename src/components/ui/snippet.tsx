import * as React from 'react';
import { cn } from '../../lib/utils';

export type SnippetProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onCopy'
> & {
  variant?: 'bordered' | 'flat';
  copyValue?: string;
  onCopied?: (value: string) => void;
  hideCopyButton?: boolean;
};

export const Snippet: React.FC<SnippetProps> = ({
  className,
  children,
  variant = 'bordered',
  copyValue,
  onCopied,
  hideCopyButton,
  ...rest
}) => {
  const [copied, setCopied] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  async function handleCopy() {
    try {
      const value = copyValue || contentRef.current?.textContent || '';
      if (!value) return;
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.(value);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.error('Snippet copy failed', e);
      }
    }
  }

  return (
    <div
      className={cn(
        'relative font-mono text-xs rounded-md px-2 py-1 break-all select-text group',
        variant === 'bordered' ? 'border bg-muted/20' : 'bg-muted/40',
        className
      )}
      {...rest}
    >
      <div ref={contentRef}>{children}</div>
      {!hideCopyButton && (
        <button
          type="button"
          aria-label={copied ? 'Copied' : 'Copy'}
          onClick={handleCopy}
          className={cn(
            'absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-medium',
            'bg-background/80 backdrop-blur-sm hover:bg-background transition-opacity',
            'opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none'
          )}
        >
          {copied ? '✓' : '⧉'}
        </button>
      )}
    </div>
  );
};
Snippet.displayName = 'Snippet';
