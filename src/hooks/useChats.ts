import { useState, useCallback, useEffect } from 'react';
import { Chat, Message } from '../types/chat';

const STORAGE_KEY = 'ourHairitage_chats';
const CURRENT_CHAT_KEY = 'ourHairitage_currentChat';

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem(STORAGE_KEY);
      const savedCurrentChat = localStorage.getItem(CURRENT_CHAT_KEY);
      
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(parsedChats);
      }
      
      if (savedCurrentChat) {
        setCurrentChatId(savedCurrentChat);
      }
    } catch (error) {
      console.error('Failed to load chats from localStorage:', error);
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Failed to save chats to localStorage:', error);
    }
  }, [chats]);

  // Save current chat ID whenever it changes
  useEffect(() => {
    try {
      if (currentChatId) {
        localStorage.setItem(CURRENT_CHAT_KEY, currentChatId);
      } else {
        localStorage.removeItem(CURRENT_CHAT_KEY);
      }
    } catch (error) {
      console.error('Failed to save current chat to localStorage:', error);
    }
  }, [currentChatId]);

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  }, []);

  const addMessage = useCallback((chatId: string, content: string, role: 'user' | 'assistant') => {
    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      content,
      role,
      timestamp: new Date(),
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedChat = {
          ...chat,
          messages: [...chat.messages, message],
          updatedAt: new Date(),
        };

        // Update title based on first user message
        if (chat.messages.length === 0 && role === 'user') {
          updatedChat.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        }

        return updatedChat;
      }
      return chat;
    }));
  }, []);

  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  }, [currentChatId]);

  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle, updatedAt: new Date() }
        : chat
    ));
  }, []);

  const exportChat = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const exportData = {
      title: chat.title,
      messages: chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      })),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chats]);

  const clearAllChats = useCallback(() => {
    setChats([]);
    setCurrentChatId(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_CHAT_KEY);
  }, []);

  const editMessage = useCallback((chatId: string, messageId: string, newContent: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: newContent, isEditing: false }
              : msg
          ),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const setMessageEditing = useCallback((chatId: string, messageId: string, isEditing: boolean) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, isEditing }
              : { ...msg, isEditing: false } // Close other editing states
          )
        };
      }
      return chat;
    }));
  }, []);

  const rateMessage = useCallback((chatId: string, messageId: string, rating: 'like' | 'dislike' | null) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, rating }
              : msg
          ),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const regenerateResponse = useCallback((chatId: string, _messageId: string) => {
    // This will be handled in the ChatInterface component with the existing mock response logic
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const deleteMessage = useCallback((chatId: string, messageId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.filter(msg => msg.id !== messageId),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  }, []);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  return {
    chats,
    currentChat,
    currentChatId,
    createNewChat,
    addMessage,
    selectChat,
    deleteChat,
    renameChat,
    exportChat,
    clearAllChats,
    editMessage,
    setMessageEditing,
    rateMessage,
    regenerateResponse,
    deleteMessage,
  };
}