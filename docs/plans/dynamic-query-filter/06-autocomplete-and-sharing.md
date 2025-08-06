# Chunk 6: Autocomplete and Sharing

## Overview

Complete the dynamic query filter feature by implementing intelligent autocomplete suggestions, query templates, and URL sharing functionality. This final chunk enhances user experience with smart suggestions and enables collaborative query sharing.

## Goals

- Implement real-time autocomplete for query syntax and values
- Create query template system for common use cases
- Add robust URL sharing with social media integration
- Implement query history and bookmarking
- Provide comprehensive help and documentation system

## Technical Changes

### 1. Advanced Autocomplete Component with HeroUI

**File**: `src/components/QueryDisplay/QueryAutocomplete.tsx`

```typescript
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Card,
  CardContent,
  Kbd,
  Divider,
  ScrollShadow
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  UserIcon,
  BuildingLibraryIcon,
  TagIcon,
  CalendarIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

export interface AutocompleteSuggestion {
  type: 'syntax' | 'user' | 'repository' | 'label' | 'template';
  value: string;
  display: string;
  description?: string;
  icon?: React.ReactNode;
  category?: string;
  insertText?: string;
}

export interface QueryAutocompleteProps {
  query: string;
  position: number;
  onSuggestionSelect: (suggestion: AutocompleteSuggestion, position: number) => void;
  onClose: () => void;
  isVisible: boolean;
  suggestions: AutocompleteSuggestion[];
}

export function QueryAutocomplete({
  query,
  position,
  onSuggestionSelect,
  onClose,
  isVisible,
  suggestions
}: QueryAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSuggestionSelect(suggestions[selectedIndex], position);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, suggestions, onSuggestionSelect, position, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, AutocompleteSuggestion[]> = {};
    
    suggestions.forEach(suggestion => {
      const category = suggestion.category || suggestion.type;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(suggestion);
    });

    return groups;
  }, [suggestions]);

  const getIcon = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.icon) return suggestion.icon;
    
    switch (suggestion.type) {
      case 'user':
        return <UserIcon className="h-4 w-4" />;
      case 'repository':
        return <BuildingLibraryIcon className="h-4 w-4" />;
      case 'label':
        return <TagIcon className="h-4 w-4" />;
      case 'template':
        return <BookmarkIcon className="h-4 w-4" />;
      default:
        return <MagnifyingGlassIcon className="h-4 w-4" />;
    }
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="absolute z-50 w-80 max-h-64 overflow-hidden shadow-lg border">
      <CardContent className="p-0">
        <ScrollShadow className="max-h-64">
          {Object.entries(groupedSuggestions).map(([category, categoryItems]) => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-semibold text-default-500 bg-default-50 border-b">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
              {categoryItems.map((suggestion, globalIndex) => {
                const currentIndex = suggestions.indexOf(suggestion);
                const isSelected = currentIndex === selectedIndex;
                
                return (
                  <div
                    key={`${suggestion.type}-${suggestion.value}`}
                    className={`px-3 py-2 cursor-pointer border-b border-default-100 last:border-b-0 transition-colors ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-default-100'
                    }`}
                    onClick={() => onSuggestionSelect(suggestion, position)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-default-400'}`}>
                        {getIcon(suggestion)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {suggestion.display}
                          </span>
                          {suggestion.type === 'syntax' && (
                            <Kbd size="sm" className="text-xs">Tab</Kbd>
                          )}
                        </div>
                        {suggestion.description && (
                          <div className={`text-xs truncate ${
                            isSelected ? 'text-primary-foreground/70' : 'text-default-500'
                          }`}>
                            {suggestion.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {category !== Object.keys(groupedSuggestions)[Object.keys(groupedSuggestions).length - 1] && (
                <Divider />
              )}
            </div>
          ))}
        </ScrollShadow>
      </CardContent>
    </Card>
  );
}
```

### 2. Suggestions Service with Octokit

**File**: `src/services/suggestionService.ts`

```typescript
import { Octokit } from '@octokit/rest';
import { AutocompleteSuggestion } from '../components/QueryDisplay/QueryAutocomplete';

export interface SuggestionContext {
  query: string;
  cursorPosition: number;
  token: string;
}

export class SuggestionService {
  private static octokitInstances = new Map<string, Octokit>();
  
  private static getOctokit(token: string): Octokit {
    if (!this.octokitInstances.has(token)) {
      this.octokitInstances.set(token, new Octokit({ 
        auth: token,
        userAgent: 'github-pr-analyzer/1.0.0'
      }));
    }
    return this.octokitInstances.get(token)!;
  }

export class SuggestionService {
  private static syntaxSuggestions: AutocompleteSuggestion[] = [
    {
      type: 'syntax',
      value: 'author:',
      display: 'author:username',
      description: 'Filter by pull request author',
      insertText: 'author:',
      category: 'Filters'
    },
    {
      type: 'syntax',
      value: 'reviewed-by:',
      display: 'reviewed-by:username',
      description: 'Filter by reviewer',
      insertText: 'reviewed-by:',
      category: 'Filters'
    },
    {
      type: 'syntax',
      value: 'repo:',
      display: 'repo:owner/name',
      description: 'Filter by repository',
      insertText: 'repo:',
      category: 'Filters'
    },
    {
      type: 'syntax',
      value: 'label:',
      display: 'label:"name"',
      description: 'Filter by label',
      insertText: 'label:"',
      category: 'Filters'
    },
    {
      type: 'syntax',
      value: 'is:open',
      display: 'is:open',
      description: 'Show only open pull requests',
      insertText: 'is:open',
      category: 'Status'
    },
    {
      type: 'syntax',
      value: 'is:closed',
      display: 'is:closed',
      description: 'Show only closed pull requests',
      insertText: 'is:closed',
      category: 'Status'
    },
    {
      type: 'syntax',
      value: 'is:merged',
      display: 'is:merged',
      description: 'Show only merged pull requests',
      insertText: 'is:merged',
      category: 'Status'
    },
    {
      type: 'syntax',
      value: 'is:draft',
      display: 'is:draft',
      description: 'Show only draft pull requests',
      insertText: 'is:draft',
      category: 'Status'
    },
    {
      type: 'syntax',
      value: 'created:',
      display: 'created:>YYYY-MM-DD',
      description: 'Filter by creation date',
      insertText: 'created:>',
      category: 'Dates'
    },
    {
      type: 'syntax',
      value: 'updated:',
      display: 'updated:<YYYY-MM-DD',
      description: 'Filter by last update date',
      insertText: 'updated:<',
      category: 'Dates'
    }
  ];

  private static templates: AutocompleteSuggestion[] = [
    {
      type: 'template',
      value: 'my-prs',
      display: 'My Pull Requests',
      description: 'Pull requests I authored or reviewed',
      insertText: 'is:pr author:@me OR reviewed-by:@me',
      category: 'Templates'
    },
    {
      type: 'template',
      value: 'team-review',
      display: 'Pending Team Reviews',
      description: 'Open PRs waiting for review',
      insertText: 'is:pr is:open review:required',
      category: 'Templates'
    },
    {
      type: 'template',
      value: 'recent-activity',
      display: 'Recent Activity',
      description: 'PRs updated in last 7 days',
      insertText: 'is:pr updated:>2024-01-01 involves:@me',
      category: 'Templates'
    },
    {
      type: 'template',
      value: 'bugs',
      display: 'Bug Fixes',
      description: 'PRs labeled as bug fixes',
      insertText: 'is:pr label:"bug" is:open',
      category: 'Templates'
    }
  ];

  static async getSuggestions(context: SuggestionContext): Promise<AutocompleteSuggestion[]> {
    const { query, cursorPosition } = context;
    const suggestions: AutocompleteSuggestion[] = [];

    // Get the current word being typed
    const beforeCursor = query.substring(0, cursorPosition);
    const afterCursor = query.substring(cursorPosition);
    const currentWord = this.getCurrentWord(beforeCursor);

    // Add syntax suggestions if typing a new term
    if (this.shouldShowSyntaxSuggestions(beforeCursor, currentWord)) {
      suggestions.push(...this.filterSuggestions(this.syntaxSuggestions, currentWord));
    }

    // Add value suggestions based on current filter
    const valueContext = this.getValueContext(beforeCursor);
    if (valueContext) {
      const valueSuggestions = await this.getValueSuggestions(valueContext, context.token);
      suggestions.push(...this.filterSuggestions(valueSuggestions, currentWord));
    }

    // Add template suggestions if query is empty or minimal
    if (query.trim().length === 0 || query.trim() === 'is:pr') {
      suggestions.push(...this.templates);
    }

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  }

  private static getCurrentWord(text: string): string {
    const match = text.match(/(\S+)$/);
    return match ? match[1] : '';
  }

  private static shouldShowSyntaxSuggestions(beforeCursor: string, currentWord: string): boolean {
    // Show syntax suggestions if:
    // 1. Starting a new word after space
    // 2. Beginning of query
    // 3. After logical operators
    const endsWithSpace = beforeCursor.endsWith(' ');
    const isEmpty = beforeCursor.trim().length === 0;
    const afterOperator = /(^|\s)(AND|OR|NOT)\s*$/i.test(beforeCursor);
    
    return endsWithSpace || isEmpty || afterOperator;
  }

  private static getValueContext(beforeCursor: string): { type: string; partial: string } | null {
    // Check if we're typing a value for a filter
    const authorMatch = beforeCursor.match(/author:(\S*)$/);
    if (authorMatch) return { type: 'user', partial: authorMatch[1] };

    const reviewerMatch = beforeCursor.match(/reviewed-by:(\S*)$/);
    if (reviewerMatch) return { type: 'user', partial: reviewerMatch[1] };

    const repoMatch = beforeCursor.match(/repo:(\S*)$/);
    if (repoMatch) return { type: 'repository', partial: repoMatch[1] };

    const labelMatch = beforeCursor.match(/label:"([^"]*)$/);
    if (labelMatch) return { type: 'label', partial: labelMatch[1] };

    return null;
  }

  private static async getValueSuggestions(
    context: { type: string; partial: string },
    token: string
  ): Promise<AutocompleteSuggestion[]> {
    try {
      switch (context.type) {
        case 'user':
          return await this.getUserSuggestions(context.partial, token);
        case 'repository':
          return await this.getRepositorySuggestions(context.partial, token);
        case 'label':
          return await this.getLabelSuggestions(context.partial, token);
        default:
          return [];
      }
    } catch (error) {
      console.warn('Failed to fetch suggestions:', error);
      return [];
    }
  }

  private static async getUserSuggestions(
    partial: string,
    token: string
  ): Promise<AutocompleteSuggestion[]> {
    try {
      const octokit = this.getOctokit(token);
      
      // Search for users using Octokit
      const { data } = await octokit.rest.search.users({
        q: `${partial} in:login`,
        per_page: 10
      });
      
      const suggestions: AutocompleteSuggestion[] = [
        {
          type: 'user' as const,
          value: '@me',
          display: '@me',
          description: 'Current authenticated user',
          category: 'Users',
          insertText: '@me'
        }
      ];
      
      // Add search results
      suggestions.push(...data.items.map(user => ({
        type: 'user' as const,
        value: user.login,
        display: user.login,
        description: user.name || undefined,
        category: 'Users',
        insertText: user.login
      })));
      
      return suggestions;
    } catch (error) {
      console.warn('Failed to fetch user suggestions:', error);
      return [
        {
          type: 'user' as const,
          value: '@me',
          display: '@me',
          description: 'Current user',
          category: 'Users',
          insertText: '@me'
        }
      ];
    }
  }

  private static async getRepositorySuggestions(
    partial: string,
    token: string
  ): Promise<AutocompleteSuggestion[]> {
    try {
      const octokit = this.getOctokit(token);
      
      // Get user's repositories
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 20,
        sort: 'updated',
        direction: 'desc'
      });

      return data
        .filter(repo => repo.full_name.toLowerCase().includes(partial.toLowerCase()))
        .map(repo => ({
          type: 'repository' as const,
          value: repo.full_name,
          display: repo.full_name,
          description: repo.description || undefined,
          category: 'Repositories',
          insertText: repo.full_name
        }));
    } catch (error) {
      console.warn('Failed to fetch repository suggestions:', error);
      return [];
    }
  }

  private static async getLabelSuggestions(
    partial: string,
    token: string
  ): Promise<AutocompleteSuggestion[]> {
    const commonLabels = [
      'bug', 'enhancement', 'documentation', 'good first issue',
      'help wanted', 'question', 'wontfix', 'duplicate'
    ];

    return commonLabels
      .filter(label => label.includes(partial.toLowerCase()))
      .map(label => ({
        type: 'label' as const,
        value: label,
        display: label,
        category: 'Labels',
        insertText: `${label}"`
      }));
  }

  private static filterSuggestions(
    suggestions: AutocompleteSuggestion[],
    filter: string
  ): AutocompleteSuggestion[] {
    if (!filter) return suggestions;
    
    const lowerFilter = filter.toLowerCase();
    return suggestions.filter(suggestion =>
      suggestion.value.toLowerCase().includes(lowerFilter) ||
      suggestion.display.toLowerCase().includes(lowerFilter)
    );
  }
}
```

### 3. URL Sharing Component with HeroUI

**File**: `src/components/QueryDisplay/ShareQueryModal.tsx`

```typescript
import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
  Snippet,
  Divider,
  ButtonGroup
} from '@heroui/react';
import {
  ShareIcon,
  ClipboardIcon,
  CheckIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

export interface ShareQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  resultCount?: number;
}

export function ShareQueryModal({
  isOpen,
  onClose,
  query,
  resultCount
}: ShareQueryModalProps) {
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(query)}`;
  
  const shareText = `${title || 'Check out this GitHub PR search'}: ${query}${
    resultCount !== undefined ? ` (${resultCount} results)` : ''
  }`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShareViaTwitter = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareViaSlack = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`slack://channel?team=&id=&message=${text}`, '_blank');
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(title || 'GitHub PR Search Query');
    const body = encodeURIComponent(`${description || shareText}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <ShareIcon className="h-5 w-5" />
          Share Query
        </ModalHeader>
        
        <ModalBody className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Query Details</h4>
            <Card>
              <CardBody className="space-y-3">
                <div>
                  <span className="text-xs text-default-500">Search Query:</span>
                  <code className="block text-sm bg-default-100 p-2 rounded mt-1 break-all">
                    {query}
                  </code>
                </div>
                {resultCount !== undefined && (
                  <div>
                    <span className="text-xs text-default-500">Results:</span>
                    <div className="text-sm font-medium">
                      {resultCount} pull request{resultCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Share URL</h4>
            <Snippet
              variant="bordered"
              color="default"
              className="w-full"
              copyIcon={copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
              onCopy={handleCopyUrl}
            >
              <span className="text-xs">{shareUrl}</span>
            </Snippet>
          </div>

          <Divider />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Customize Share Message</h4>
            
            <Input
              label="Title (optional)"
              placeholder="e.g., Team PR Review Dashboard"
              variant="bordered"
              value={title}
              onValueChange={setTitle}
            />
            
            <Textarea
              label="Description (optional)"
              placeholder="Add context about this search query..."
              variant="bordered"
              value={description}
              onValueChange={setDescription}
              minRows={2}
              maxRows={4}
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Share Via</h4>
            <ButtonGroup className="w-full" variant="bordered">
              <Button
                startContent={<span className="text-blue-500">𝕏</span>}
                onPress={handleShareViaTwitter}
                className="flex-1"
              >
                Twitter/X
              </Button>
              
              <Button
                startContent={<span className="text-purple-500">#</span>}
                onPress={handleShareViaSlack}
                className="flex-1"
              >
                Slack
              </Button>
              
              <Button
                startContent={<span className="text-blue-600">✉</span>}
                onPress={handleShareViaEmail}
                className="flex-1"
              >
                Email
              </Button>
            </ButtonGroup>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            color="default" 
            variant="light" 
            onPress={onClose}
          >
            Close
          </Button>
          <Button 
            color="primary" 
            startContent={<LinkIcon className="h-4 w-4" />} 
            onPress={handleCopyUrl}
            variant={copied ? 'solid' : 'solid'}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

### 4. Query History Hook

**File**: `src/hooks/useQueryHistory.ts`

```typescript
import { useState, useEffect } from 'react';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount?: number;
  title?: string;
}

export interface UseQueryHistoryReturn {
  history: QueryHistoryItem[];
  bookmarks: QueryHistoryItem[];
  addToHistory: (query: string, resultCount?: number) => void;
  addBookmark: (query: string, title?: string) => void;
  removeBookmark: (id: string) => void;
  clearHistory: () => void;
}

const STORAGE_KEYS = {
  HISTORY: 'github-pr-analyzer-query-history',
  BOOKMARKS: 'github-pr-analyzer-query-bookmarks'
};

export function useQueryHistory(): UseQueryHistoryReturn {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<QueryHistoryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }

      const storedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (storedBookmarks) {
        const parsed = JSON.parse(storedBookmarks);
        setBookmarks(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    } catch (error) {
      console.warn('Failed to load query history:', error);
    }
  }, []);

  // Save to localStorage when history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 50))); // Keep last 50
    } catch (error) {
      console.warn('Failed to save query history:', error);
    }
  }, [history]);

  // Save to localStorage when bookmarks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (error) {
      console.warn('Failed to save query bookmarks:', error);
    }
  }, [bookmarks]);

  const addToHistory = (query: string, resultCount?: number) => {
    const newItem: QueryHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: new Date(),
      resultCount
    };

    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => item.query !== query);
      return [newItem, ...filtered].slice(0, 50); // Keep last 50
    });
  };

  const addBookmark = (query: string, title?: string) => {
    const newBookmark: QueryHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: new Date(),
      title
    };

    setBookmarks(prev => {
      // Check if already bookmarked
      if (prev.some(item => item.query === query)) {
        return prev;
      }
      return [newBookmark, ...prev];
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    bookmarks,
    addToHistory,
    addBookmark,
    removeBookmark,
    clearHistory
  };
}
```

### 5. Enhanced QueryDisplay Integration

**File**: `src/components/QueryDisplay/QueryDisplay.tsx` (final integration)

```typescript
// Add to existing QueryDisplay component
import { QueryAutocomplete } from './QueryAutocomplete';
import { ShareQueryModal } from './ShareQueryModal';
import { SuggestionService } from '../../services/suggestionService';
import { useQueryHistory } from '../../hooks/useQueryHistory';

// Add new state and functionality
const [showAutocomplete, setShowAutocomplete] = useState(false);
const [autocompletePosition, setAutocompletePosition] = useState(0);
const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
const [showShareModal, setShowShareModal] = useState(false);
const { addToHistory, addBookmark } = useQueryHistory();

// Add autocomplete functionality to textarea
const handleTextareaKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  const textarea = e.currentTarget;
  const cursorPosition = textarea.selectionStart;

  // Get suggestions based on current context
  const newSuggestions = await SuggestionService.getSuggestions({
    query: editValue,
    cursorPosition,
    token
  });

  setSuggestions(newSuggestions);
  setAutocompletePosition(cursorPosition);
  setShowAutocomplete(newSuggestions.length > 0);

  // Handle existing keyboard shortcuts
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    handleEditSave();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (showAutocomplete) {
      setShowAutocomplete(false);
    } else {
      handleEditCancel();
    }
  }
};

// Enhanced save function
const handleEditSave = () => {
  if (validationResult.isValid) {
    const sanitizedQuery = validationResult.sanitized;
    
    // Add to history
    addToHistory(sanitizedQuery, resultCount);
    
    // Update URL and notify parent
    // ... existing save logic
  }
};

// Add share functionality to the header buttons
{editable && !isLoading && (
  <div className="flex items-center gap-2">
    {!isEditing && (
      <>
        <Button
          size="sm"
          color="default"
          variant="flat"
          startContent={<ShareIcon className="h-4 w-4" />}
          onPress={() => setShowShareModal(true)}
        >
          Share
        </Button>
        <Button
          size="sm"
          color="default"
          variant="flat"
          startContent={<BookmarkIcon className="h-4 w-4" />}
          onPress={() => addBookmark(query)}
        >
          Bookmark
        </Button>
      </>
    )}
    
    {/* Existing edit/save/cancel buttons */}
  </div>
)}

// Add autocomplete and share modal to the component
{showAutocomplete && (
  <QueryAutocomplete
    query={editValue}
    position={autocompletePosition}
    suggestions={suggestions}
    isVisible={showAutocomplete}
    onSuggestionSelect={handleSuggestionSelect}
    onClose={() => setShowAutocomplete(false)}
  />
)}

<ShareQueryModal
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
  query={query}
  resultCount={resultCount}
/>
```

## Testing Requirements

### 1. Component Tests

**File**: `src/components/QueryDisplay/__tests__/QueryAutocomplete.test.tsx`

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryAutocomplete } from '../QueryAutocomplete';

describe('QueryAutocomplete', () => {
  const mockSuggestions = [
    {
      type: 'syntax' as const,
      value: 'author:',
      display: 'author:username',
      description: 'Filter by author',
      category: 'Filters'
    },
    {
      type: 'user' as const,
      value: 'john',
      display: 'john',
      category: 'Users'
    }
  ];

  const defaultProps = {
    query: 'is:pr auth',
    position: 10,
    onSuggestionSelect: jest.fn(),
    onClose: jest.fn(),
    isVisible: true,
    suggestions: mockSuggestions
  };

  it('should render suggestions grouped by category', () => {
    render(<QueryAutocomplete {...defaultProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('author:username')).toBeInTheDocument();
    expect(screen.getByText('john')).toBeInTheDocument();
  });

  it('should handle suggestion selection', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = jest.fn();
    
    render(
      <QueryAutocomplete 
        {...defaultProps} 
        onSuggestionSelect={onSuggestionSelect}
      />
    );
    
    await user.click(screen.getByText('author:username'));
    
    expect(onSuggestionSelect).toHaveBeenCalledWith(
      mockSuggestions[0],
      10
    );
  });

  it('should handle keyboard navigation', () => {
    render(<QueryAutocomplete {...defaultProps} />);
    
    // Test arrow down
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    
    // Test enter to select
    fireEvent.keyDown(document, { key: 'Enter' });
    
    expect(defaultProps.onSuggestionSelect).toHaveBeenCalled();
  });
});
```

### 2. Service Tests

**File**: `src/services/__tests__/suggestionService.test.ts`

```typescript
import { SuggestionService } from '../suggestionService';

describe('SuggestionService', () => {
  const mockContext = {
    query: 'is:pr author:',
    cursorPosition: 13,
    token: 'test-token'
  };

  it('should return syntax suggestions for empty query', async () => {
    const suggestions = await SuggestionService.getSuggestions({
      ...mockContext,
      query: '',
      cursorPosition: 0
    });

    expect(suggestions).toContainEqual(
      expect.objectContaining({
        type: 'syntax',
        value: 'author:'
      })
    );
  });

  it('should return user suggestions after author:', async () => {
    const suggestions = await SuggestionService.getSuggestions(mockContext);

    expect(suggestions).toContainEqual(
      expect.objectContaining({
        type: 'user',
        value: '@me'
      })
    );
  });

  it('should return template suggestions for minimal query', async () => {
    const suggestions = await SuggestionService.getSuggestions({
      ...mockContext,
      query: 'is:pr',
      cursorPosition: 5
    });

    expect(suggestions).toContainEqual(
      expect.objectContaining({
        type: 'template',
        value: 'my-prs'
      })
    );
  });
});
```

### 3. Integration Tests

**File**: `src/components/QueryDisplay/__tests__/QueryDisplay.integration.test.tsx`

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryDisplay } from '../QueryDisplay';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('QueryDisplay Integration', () => {
  it('should show autocomplete when typing', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(
      <QueryDisplay query="is:pr" editable={true} />
    );
    
    // Start editing
    await user.click(screen.getByRole('button', { name: /edit query/i }));
    
    // Type to trigger autocomplete
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, ' auth');
    
    await waitFor(() => {
      expect(screen.getByText(/author:/)).toBeInTheDocument();
    });
  });

  it('should open share modal when share button clicked', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" editable={true} />
    );
    
    await user.click(screen.getByRole('button', { name: /share/i }));
    
    expect(screen.getByText('Share Query')).toBeInTheDocument();
  });
});
```

## Implementation Steps

1. **Day 1**: Implement QueryAutocomplete component with HeroUI components and basic suggestions
2. **Day 2**: Create SuggestionService with Octokit integration for GitHub API calls
3. **Day 3**: Build ShareQueryModal with HeroUI components and social sharing features
4. **Day 4**: Implement query history and bookmarking functionality
5. **Day 5**: Integration testing, performance optimization, and Octokit error handling

## Dependencies

### Additional Package Requirements

```bash
# Octokit already installed from Chunk 2
# Additional HeroUI components (if not already available)
npm install @heroui/react
```

### Octokit Integration Notes

- Reuse Octokit instance configuration from Chunk 2
- Implement proper error handling for API rate limits
- Cache suggestion results to minimize API calls
- Use appropriate GitHub API endpoints for user/repo searches

## Acceptance Criteria

- [ ] Real-time autocomplete works for query syntax and values
- [ ] Keyboard navigation works in autocomplete dropdown
- [ ] URL sharing generates correct shareable links
- [ ] Social media sharing integrations work properly
- [ ] Query history is persisted and accessible
- [ ] Bookmarking system allows saving favorite queries
- [ ] All new features maintain accessibility standards
- [ ] Performance remains smooth with autocomplete enabled

## Risk Mitigation

- **API Rate Limits**: Cache suggestions and debounce requests
- **Performance**: Virtualize large suggestion lists if needed
- **Browser Compatibility**: Fallback for clipboard API
- **Privacy**: Only store query history locally
- **User Experience**: Progressive enhancement for all features

## Future Enhancements

This completes the dynamic query filter with foundation for:

- Advanced query performance analytics
- Team collaboration features
- Query recommendation engine
- Integration with GitHub notifications
- Custom query syntax extensions
