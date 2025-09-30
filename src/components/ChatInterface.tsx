import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  Sparkles,
  Copy,
  Edit3,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Chat, Message } from "../types/chat";
import { generateHairCareResponse, isOpenAIConfigured } from "../lib/openai";
import clsx from "clsx";

interface ChatInterfaceProps {
  chat: Chat;
  onSendMessage: (content: string, role?: "user" | "assistant") => void;
  onEditMessage: (
    chatId: string,
    messageId: string,
    newContent: string
  ) => void;
  onSetMessageEditing: (
    chatId: string,
    messageId: string,
    isEditing: boolean
  ) => void;
  onRateMessage: (
    chatId: string,
    messageId: string,
    rating: "like" | "dislike" | null
  ) => void;
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
  onDeleteMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingContent, setEditingContent] = useState("");
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMessageMenu) {
        setShowMessageMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMessageMenu]);

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setError(
        "No internet connection. Please check your network and try again."
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cleanup retry timeout
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      window.setTimeout(() => setCopiedMessageId(null), 2000);
      setShowMessageMenu(null);
    } catch (err) {
      console.error("Failed to copy text:", err);
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
      setEditingContent("");
    }
  };

  const handleCancelEdit = (messageId: string) => {
    onSetMessageEditing(chat.id, messageId, false);
    setEditingContent("");
  };

  const handleRegenerateResponse = (messageId: string) => {
    // Find the last user message before this assistant message to regenerate
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex > 0) {
      // Remove the current assistant message and regenerate
      onDeleteMessage(chat.id, messageId);

      // Trigger regeneration after a short delay
      window.setTimeout(async () => {
        try {
          // Get the last user message to regenerate response for
          const lastUserMessage = [...chat.messages]
            .reverse()
            .find((msg) => msg.role === "user");
          if (lastUserMessage) {
            const response = await generateHairCareResponse(
              lastUserMessage.content,
              chat.messages.filter((msg) => msg.id !== messageId) // Exclude the deleted message
            );
            onSendMessage(response, "assistant");
          }
        } catch (error) {
          console.error("Error regenerating response:", error);
          // Fallback response
          onSendMessage(
            "I'd be happy to give you a fresh perspective on that! Could you help me understand your specific hair concerns so I can provide more personalized advice?",
            "assistant"
          );
        }
      }, 1000);
    }
    setShowMessageMenu(null);
  };

  const handleRating = (messageId: string, rating: "like" | "dislike") => {
    const currentMessage = chat.messages.find((msg) => msg.id === messageId);
    const newRating = currentMessage?.rating === rating ? null : rating;
    onRateMessage(chat.id, messageId, newRating);
    setShowMessageMenu(null);
  };

  const generateAIResponse = async (
    message: string,
    attempt: number = 1
  ): Promise<void> => {
    try {
      // Check network connectivity
      if (!isOnline) {
        throw new Error("No internet connection");
      }

      // Check if OpenAI is configured
      if (!isOpenAIConfigured()) {
        throw new Error("OpenAI API key not configured");
      }

      // Generate response using OpenAI with conversation context
      const response = await generateHairCareResponse(message, chat.messages);

      onSendMessage(response, "assistant");
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error("Error generating AI response:", error);

      const maxRetries = 3;
      if (attempt < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        setError(
          `Connection failed. Retrying in ${Math.ceil(
            retryDelay / 1000
          )} seconds... (${attempt}/${maxRetries})`
        );
        setRetryCount(attempt);

        retryTimeoutRef.current = window.setTimeout(() => {
          generateAIResponse(message, attempt + 1);
        }, retryDelay);
      } else {
        setIsLoading(false);
        setError(
          "Failed to get response after multiple attempts. Please try again."
        );
        setRetryCount(0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check network connectivity before sending
    if (!isOnline) {
      setError(
        "No internet connection. Please check your network and try again."
      );
      return;
    }

    const message = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    onSendMessage(message, "user");

    // Generate AI response with error handling
    await generateAIResponse(message);
  };

  const handleRetry = () => {
    if (!chat.messages.length) return;

    const lastUserMessage = [...chat.messages]
      .reverse()
      .find((msg) => msg.role === "user");
    if (lastUserMessage) {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      generateAIResponse(lastUserMessage.content);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-6 "
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
      >
        {chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Start Your Hair Journey
            </h3>
            <p className="text-gray-400 max-w-md">
              Ask me anything about hair care, styling tips, product
              recommendations, or hair health. I'm here to help you achieve your
              best hair!
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto">
            {chat.messages.map((message) => (
              <div
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } mb-6`}
              >
                <div
                  className={`flex max-w-4xl w-full ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-blue-600 ml-4"
                        : "mr-4"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <img src="/favicon.svg" className="w-8 h-8" />
                    )}
                  </div>

                  {/* Message */}
                  <div className="flex-1">
                    {/* <div
                      className={`flex items-center mb-2 ${
                        message.role === "user" ? "justify-end" : ""
                      }`}
                    >
                      <span className="font-semibold">
                        {message.role === "user" ? "You" : "AI"}
                      </span>
                    </div> */}

                    <div
                      className={`${
                        message.role === "user" ? "flex justify-end" : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl  text-white ${
                          message.role === "user"
                            ? "bg-slate-700 max-w-lg py-2 px-4"
                            : "w-full"
                        }`}
                      >
                        {message.isEditing ? (
                          <div>
                            <textarea
                              value={editingContent}
                              onChange={(e) =>
                                setEditingContent(e.target.value)
                              }
                              className="w-full bg-gray-700 px-3 py-2 rounded"
                              rows={3}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveEdit(message.id)}
                                className="px-3 py-1 bg-green-600 rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => handleCancelEdit(message.id)}
                                className="px-3 py-1 bg-gray-600 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {message.role === "assistant" ? (
                              <div className="asistant-content">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p>{message.content}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!message.isEditing && (
                      <div
                        className={`flex gap-1 mt-2  ${
                          message.role === "user"
                            ? "justify-end opacity-0 hover:opacity-100"
                            : ""
                        }`}
                      >
                        <button
                          onClick={() =>
                            copyToClipboard(message.content, message.id)
                          }
                          className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {message.role === "user" && (
                          <button
                            onClick={() => handleStartEdit(message)}
                            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {message.role === "assistant" && (
                          <>
                            <button
                              onClick={() =>
                                handleRegenerateResponse(message.id)
                              }
                              className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRating(message.id, "like")}
                              className={clsx(
                                "p-2 hover:bg-gray-700 rounded",
                                message.rating === "like"
                                  ? "text-green-400"
                                  : "text-gray-400 hover:text-white"
                              )}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleRating(message.id, "dislike")
                              }
                              className={clsx(
                                "p-2 hover:bg-gray-700 rounded",
                                message.rating === "dislike"
                                  ? "text-red-400"
                                  : "text-gray-400 hover:text-white"
                              )}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onDeleteMessage(chat.id, message.id)}
                          className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
                      <span className="text-sm font-semibold text-gray-300">
                        OUR HAIRITAGE
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {retryCount > 0
                          ? `retrying... (${retryCount}/3)`
                          : "typing..."}
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded-2xl px-6 py-4 border border-gray-700 inline-block">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
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
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 md:p-3">
        <form onSubmit={handleSubmit} className="flex items-end md:space-x-4">
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex items-end border border-slate-700 rounded-xl shadow-sm focus:shadow p-2 gap-4">
              <textarea
                rows={input.length < 80 ? 1 : undefined}
                className="resize-none w-full bg-transparent placeholder:text-slate-400 text-slate-400 text-base  p-2 transition duration-300 ease focus:outline-none"
                placeholder="Ask about hair care, styling, treatments..."
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  } else if (e.key === "Enter" && e.shiftKey) {
                    // Allow newlines with Shift+Enter
                  }
                }}
              />

              <button
                disabled={!input.trim() || isLoading}
                className="flex items-center rounded-full bg-white py-2.5 px-2.5 border border-transparent text-center text-sm text-black transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-300 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                type="submit"
              >
                <Send className="w-6 h-6 md:w-5 md:h-5 mx-auto" />
              </button>
            </div>
          </div>
        </form>

        {/* Helpful shortcuts */}
        <div className="mt-3 text-center text-xs text-gray-500">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
