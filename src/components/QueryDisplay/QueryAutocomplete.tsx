import React, { useState, useMemo, useEffect, useRef } from 'react';
// Replaced direct HeroUI imports with bridge components
import { Card, CardContent } from '../ui';
import { ScrollShadow, Kbd, ShadSeparator } from '../ui';
import {
  MagnifyingGlassIcon,
  UserIcon,
  BuildingLibraryIcon,
  TagIcon,
  BookmarkIcon,
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
  onSuggestionSelect: (
    suggestion: AutocompleteSuggestion,
    position: number
  ) => void;
  onClose: () => void;
  isVisible: boolean;
  suggestions: AutocompleteSuggestion[];
}

export function QueryAutocomplete({
  position,
  onSuggestionSelect,
  onClose,
  isVisible,
  suggestions,
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
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
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
  }, [
    isVisible,
    selectedIndex,
    suggestions,
    onSuggestionSelect,
    position,
    onClose,
  ]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, AutocompleteSuggestion[]> = {};

    suggestions.forEach((suggestion) => {
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

  let flatIndex = 0;

  return (
    <Card className="absolute z-50 w-80 max-h-64 overflow-hidden shadow-lg border">
      <CardContent className="p-0">
        <ScrollShadow className="max-h-64">
          <div ref={listRef}>
            {Object.entries(groupedSuggestions).map(
              ([category, categoryItems], groupIndex) => (
                <div key={category}>
                  {groupIndex > 0 && <ShadSeparator />}
                  <div className="px-2 py-1 text-xs font-semibold text-default-500 bg-default-50">
                    {category}
                  </div>
                  {categoryItems.map((suggestion) => {
                    const currentIndex = flatIndex++;
                    return (
                      <div
                        key={`${suggestion.type}-${suggestion.value}`}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                          selectedIndex === currentIndex
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => onSuggestionSelect(suggestion, position)}
                        role="option"
                        aria-selected={selectedIndex === currentIndex}
                      >
                        <span className="text-muted-foreground flex-shrink-0">
                          {getIcon(suggestion)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {suggestion.display}
                          </div>
                          {suggestion.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.description}
                            </div>
                          )}
                        </div>
                        {selectedIndex === currentIndex && (
                          <div className="flex-shrink-0">
                            <Kbd className="text-xs">Enter</Kbd>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </ScrollShadow>
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Kbd>↑↓</Kbd>
            <span>Navigate</span>
            <Kbd>Enter</Kbd>
            <span>Select</span>
            <Kbd>Esc</Kbd>
            <span>Close</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
