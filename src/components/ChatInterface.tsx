import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Copy, Edit3, RefreshCw, ThumbsUp, ThumbsDown, MoreHorizontal, Trash2, Check, X, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Chat, Message } from '../types/chat';
import { generateHairCareResponse, isOpenAIConfigured } from '../lib/openai';

interface ChatInterfaceProps {
  chat: Chat;
  onSendMessage: (content: string, role?: 'user' | 'assistant') => void;
  onEditMessage: (chatId: string, messageId: string, newContent: string) => void;
  onSetMessageEditing: (chatId: string, messageId: string, isEditing: boolean) => void;
  onRateMessage: (chatId: string, messageId: string, rating: 'like' | 'dislike' | null) => void;
  onRegenerateResponse: (chatId: string, messageId: string) => void;
  onDeleteMessage: (chatId: string, messageId: string) => void;
}

export function ChatInterface({ 
  chat, 
  onSendMessage, 
  onEditMessage, 
  onSetMessageEditing, 
  onRateMessage, 
  onRegenerateResponse: _, 
  onDeleteMessage 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMessageMenu) {
        setShowMessageMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu]);

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setError('No internet connection. Please check your network and try again.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup retry timeout
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      setShowMessageMenu(null);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleStartEdit = (message: Message) => {
    setEditingContent(message.content);
    onSetMessageEditing(chat.id, message.id, true);
    setShowMessageMenu(null);
  };

  const handleSaveEdit = (messageId: string) => {
    if (editingContent.trim()) {
      onEditMessage(chat.id, messageId, editingContent.trim());
      setEditingContent('');
    }
  };

  const handleCancelEdit = (messageId: string) => {
    onSetMessageEditing(chat.id, messageId, false);
    setEditingContent('');
  };

  const handleRegenerateResponse = (messageId: string) => {
    // Find the last user message before this assistant message to regenerate
    const messageIndex = chat.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      // Remove the current assistant message and regenerate
      onDeleteMessage(chat.id, messageId);
      
      // Trigger regeneration after a short delay
      setTimeout(async () => {
        try {
          // Get the last user message to regenerate response for
          const lastUserMessage = [...chat.messages].reverse().find(msg => msg.role === 'user');
          if (lastUserMessage) {
            const response = await generateHairCareResponse(
              lastUserMessage.content, 
              chat.messages.filter(msg => msg.id !== messageId) // Exclude the deleted message
            );
            onSendMessage(response, 'assistant');
          }
        } catch (error) {
          console.error('Error regenerating response:', error);
          // Fallback response
          onSendMessage("I'd be happy to give you a fresh perspective on that! Could you help me understand your specific hair concerns so I can provide more personalized advice?", 'assistant');
        }
      }, 1000);
    }
    setShowMessageMenu(null);
  };

  const handleRating = (messageId: string, rating: 'like' | 'dislike') => {
    const currentMessage = chat.messages.find(msg => msg.id === messageId);
    const newRating = currentMessage?.rating === rating ? null : rating;
    onRateMessage(chat.id, messageId, newRating);
    setShowMessageMenu(null);
  };

  const generateAIResponse = async (message: string, attempt: number = 1): Promise<void> => {
    try {
      // Check network connectivity
      if (!isOnline) {
        throw new Error('No internet connection');
      }

      // Check if OpenAI is configured
      if (!isOpenAIConfigured()) {
        throw new Error('OpenAI API key not configured');
      }

      // Generate response using OpenAI with conversation context
      const response = await generateHairCareResponse(message, chat.messages);
      
      onSendMessage(response, 'assistant');
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const maxRetries = 3;
      if (attempt < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        setError(`Connection failed. Retrying in ${Math.ceil(retryDelay / 1000)} seconds... (${attempt}/${maxRetries})`);
        setRetryCount(attempt);
        
        retryTimeoutRef.current = setTimeout(() => {
          generateAIResponse(message, attempt + 1);
        }, retryDelay);
      } else {
        setIsLoading(false);
        setError('Failed to get response after multiple attempts. Please try again.');
        setRetryCount(0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check network connectivity before sending
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    const message = input.trim();
    setInput('');
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    onSendMessage(message, 'user');

    // Generate AI response with error handling
    await generateAIResponse(message);
  };

  const handleRetry = () => {
    if (!chat.messages.length) return;
    
    const lastUserMessage = [...chat.messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      generateAIResponse(lastUserMessage.content);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-6"
        role="log" 
        aria-label="Chat conversation"
        aria-live="polite"
      >
        {chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Your Hair Journey</h3>
            <p className="text-gray-400 max-w-md">
              Ask me anything about hair care, styling tips, product recommendations, or hair health. 
              I'm here to help you achieve your best hair!
            </p>
          </div>
        ) : (
          <>
            {chat.messages.map((message) => (
              <div
                key={message.id}
                className={`group flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 md:mb-6 px-2 md:px-0`}
              >
                <div className={`flex max-w-4xl w-full ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2 md:ml-4' : 'mr-2 md:mr-4'}`}>
                    <div className={`w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    {/* Message Header */}
                    <div className={`flex items-center mb-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-sm font-semibold text-gray-300">
                        {message.role === 'user' ? 'You' : 'OUR HAIRITAGE'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                  </div>

                  {/* Message Bubble */}
                    <div className={`relative ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 md:px-6 md:py-4 relative ${
                    message.role === 'user'
                          ? 'bg-blue-600 text-white max-w-sm md:max-w-lg'
                          : 'bg-gray-900 text-white border border-gray-700 w-full'
                      }`}>
                        {message.isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveEdit(message.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center space-x-1"
                              >
                                <Check className="w-4 h-4" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => handleCancelEdit(message.id)}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center space-x-1"
                              >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-invert max-w-none">
                            {message.role === 'assistant' ? (
                              <ReactMarkdown
                                components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                      <SyntaxHighlighter
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-lg"
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    ) : (
                                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              <p className="whitespace-pre-wrap leading-relaxed m-0">
                      {message.content}
                    </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      {!message.isEditing && (
                        <div className={`mt-2 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                          <div className="flex items-center space-x-1 bg-gray-800 md:bg-transparent rounded-lg md:rounded-none p-1 md:p-0 shadow-lg md:shadow-none">
                            {/* Quick Actions */}
                            <button
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="p-3 md:p-2 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center"
                              title="Copy message content"
                              aria-label="Copy message content"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>

                            {message.role === 'user' && (
                              <button
                                onClick={() => handleStartEdit(message)}
                                className="p-3 md:p-2 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center"
                                title="Edit message"
                                aria-label="Edit this message"
                              >
                                <Edit3 className="w-4 h-4 text-gray-400" />
                              </button>
                            )}

                            {message.role === 'assistant' && (
                              <>
                                <button
                                  onClick={() => handleRegenerateResponse(message.id)}
                                  className="p-3 md:p-2 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center"
                                  title="Regenerate response"
                                  aria-label="Regenerate AI response"
                                >
                                  <RefreshCw className="w-4 h-4 text-gray-400" />
                                </button>

                                <button
                                  onClick={() => handleRating(message.id, 'like')}
                                  className={`p-3 md:p-2 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center ${
                                    message.rating === 'like' ? 'text-green-400' : 'text-gray-400'
                                  }`}
                                  title={message.rating === 'like' ? 'Remove like' : 'Like this response'}
                                  aria-label={message.rating === 'like' ? 'Remove like from response' : 'Like this response'}
                                  aria-pressed={message.rating === 'like'}
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleRating(message.id, 'dislike')}
                                  className={`p-3 md:p-2 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center ${
                                    message.rating === 'dislike' ? 'text-red-400' : 'text-gray-400'
                                  }`}
                                  title={message.rating === 'dislike' ? 'Remove dislike' : 'Dislike this response'}
                                  aria-label={message.rating === 'dislike' ? 'Remove dislike from response' : 'Dislike this response'}
                                  aria-pressed={message.rating === 'dislike'}
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* More Menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMessageMenu(showMessageMenu === message.id ? null : message.id);
                                }}
                                className="p-3 md:p-2 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center"
                                title="More options"
                                aria-label="More message options"
                                aria-expanded={showMessageMenu === message.id}
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </button>

                              {showMessageMenu === message.id && (
                                <div className="absolute right-0 top-10 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[120px]">
                                  <button
                                    onClick={() => onDeleteMessage(chat.id, message.id)}
                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="flex max-w-4xl w-full">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-semibold text-gray-300">OUR HAIRITAGE</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {retryCount > 0 ? `retrying... (${retryCount}/3)` : 'typing...'}
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded-2xl px-6 py-4 border border-gray-700 inline-block">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center mb-6">
                <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-2xl px-6 py-4 max-w-2xl">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-200 mb-2">{error}</p>
                      {!isLoading && (
                        <button
                          onClick={handleRetry}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-700 p-4 md:p-6 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3 md:space-x-4">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                } else if (e.key === 'Enter' && e.shiftKey) {
                  // Allow newlines with Shift+Enter
                }
              }}
              placeholder="Ask about hair care, styling, treatments..."
              className="w-full px-4 py-3 md:px-4 md:py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none overflow-hidden text-base md:text-sm"
              rows={1}
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 p-3 md:p-3 bg-white text-black rounded-2xl hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation"
            style={{ minHeight: '56px', width: '56px' }}
          >
            <Send className="w-6 h-6 md:w-5 md:h-5 mx-auto" />
          </button>
        </form>
        
        {/* Helpful shortcuts */}
        <div className="mt-2 text-center text-xs text-gray-500">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}