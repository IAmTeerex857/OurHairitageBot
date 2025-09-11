import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MessageSquare, User, Sparkles } from 'lucide-react';
import { Chat, Message } from '../types/chat';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  type: 'chat' | 'message';
  chat: Chat;
  message?: Message;
  snippet?: string;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
}

export function SearchDialog({ isOpen, onClose, chats, onSelectChat }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchTerm = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    chats.forEach(chat => {
      // Search in chat title
      if (chat.title.toLowerCase().includes(searchTerm)) {
        searchResults.push({
          type: 'chat',
          chat,
          snippet: chat.title
        });
      }

      // Search in messages
      chat.messages.forEach(message => {
        if (message.content.toLowerCase().includes(searchTerm)) {
          // Create snippet with highlighted search term
          const index = message.content.toLowerCase().indexOf(searchTerm);
          const start = Math.max(0, index - 40);
          const end = Math.min(message.content.length, index + searchTerm.length + 40);
          
          let snippet = message.content.slice(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < message.content.length) snippet = snippet + '...';

          searchResults.push({
            type: 'message',
            chat,
            message,
            snippet
          });
        }
      });
    });

    // Sort results by relevance and recency
    searchResults.sort((a, b) => {
      // Prioritize exact matches in titles
      const aExactTitle = a.type === 'chat' && a.chat.title.toLowerCase() === searchTerm;
      const bExactTitle = b.type === 'chat' && b.chat.title.toLowerCase() === searchTerm;
      
      if (aExactTitle && !bExactTitle) return -1;
      if (!aExactTitle && bExactTitle) return 1;
      
      // Then by chat updated time (more recent first)
      return b.chat.updatedAt.getTime() - a.chat.updatedAt.getTime();
    });

    setResults(searchResults.slice(0, 10)); // Limit to top 10 results
    setSelectedIndex(0);
  }, [query, chats]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectChat(result.chat.id);
    onClose();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 text-black px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-start justify-center pt-8 md:pt-20 px-4 md:px-0">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] md:max-h-96 flex flex-col">
        {/* Search Header */}
        <div className="flex items-center p-6 md:p-4 border-b border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search conversations and messages..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base md:text-lg"
          />
          <button
            onClick={onClose}
            className="p-3 md:p-2 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {!query.trim() ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search through your conversations...</p>
              <div className="text-sm mt-2 space-y-1">
                <p>• Search by conversation title</p>
                <p>• Search within message content</p>
                <p>• Use ↑/↓ to navigate, Enter to select</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.chat.id}-${result.message?.id || 'chat'}-${index}`}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full text-left p-4 hover:bg-gray-800 transition-colors border-l-4 ${
                    selectedIndex === index 
                      ? 'bg-gray-800 border-blue-500' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {result.type === 'chat' ? (
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                      ) : result.message?.role === 'user' ? (
                        <User className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-amber-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-white truncate">
                          {highlightMatch(result.chat.title, query)}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDistanceToNow(result.chat.updatedAt, { addSuffix: true })}
                        </span>
                      </div>

                      {result.type === 'message' && result.message && (
                        <div className="text-sm text-gray-400 mb-1">
                          <span className="text-gray-500">
                            {result.message.role === 'user' ? 'You' : 'OUR HAIRITAGE'}:
                          </span>
                        </div>
                      )}

                      <p className="text-sm text-gray-300 line-clamp-2">
                        {highlightMatch(result.snippet || '', query)}
                      </p>

                      <div className="text-xs text-gray-500 mt-1">
                        {result.type === 'chat' 
                          ? `${result.chat.messages.length} messages`
                          : `in conversation • ${result.message?.timestamp.toLocaleDateString()}`
                        }
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {query.trim() && results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500 bg-gray-950">
            {results.length} result{results.length !== 1 ? 's' : ''} found
            <span className="float-right">
              ↑/↓ navigate • Enter select • Esc close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
