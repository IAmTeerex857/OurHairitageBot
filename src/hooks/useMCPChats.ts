import { useState, useCallback, useEffect } from 'react';
import { Chat, Message } from '../types/chat';
import { mcpClient } from '../lib/mcpClient';

const DEVICE_ID_KEY = 'ourHairitage_deviceId';

export function useMCPChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string>('');

  // Get or generate device ID
  const initializeDeviceId = useCallback(async () => {
    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      
      if (!id) {
        const result = await mcpClient.generateDeviceId();
        id = result.device_id;
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      
      setDeviceId(id);
      return id;
    } catch (error) {
      console.error('Failed to initialize device ID:', error);
      return null;
    }
  }, []);

  // Convert database format to frontend format
  const convertToFrontendFormat = useCallback((dbChats: any[], messagesByChat: Record<string, any[]>): Chat[] => {
    return dbChats.map(dbChat => ({
      id: dbChat.id,
      title: dbChat.title,
      messages: (messagesByChat[dbChat.id] || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp),
        rating: msg.rating || null
      })),
      createdAt: new Date(dbChat.created_at),
      updatedAt: new Date(dbChat.updated_at)
    }));
  }, []);

  // Load chats from MCP
  const loadChats = useCallback(async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      const result = await mcpClient.getChats(deviceId);
      const convertedChats = convertToFrontendFormat(result.chats, result.messages);
      setChats(convertedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, convertToFrontendFormat]);

  // Initialize device ID and load chats
  useEffect(() => {
    const init = async () => {
      const id = await initializeDeviceId();
      if (id) {
        setDeviceId(id);
      }
    };
    init();
  }, [initializeDeviceId]);

  useEffect(() => {
    if (deviceId) {
      loadChats();
    }
  }, [deviceId, loadChats]);

  // Load current chat from localStorage
  useEffect(() => {
    const savedCurrentChat = localStorage.getItem('ourHairitage_currentChat');
    if (savedCurrentChat) {
      setCurrentChatId(savedCurrentChat);
    }
  }, []);

  // Save current chat ID to localStorage
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('ourHairitage_currentChat', currentChatId);
    } else {
      localStorage.removeItem('ourHairitage_currentChat');
    }
  }, [currentChatId]);

  const createNewChat = useCallback(async () => {
    if (!deviceId) return null;

    try {
      const result = await mcpClient.createChat(deviceId, 'New Conversation');
      setCurrentChatId(result.chat.id);
      await loadChats(); // Reload to get updated list
      return result.chat.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, [deviceId, loadChats]);

  const addMessage = useCallback(async (chatId: string, content: string, role: 'user' | 'assistant') => {
    try {
      await mcpClient.createMessage(chatId, content, role);
      await loadChats(); // Reload to get updated messages
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }, [loadChats]);

  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!deviceId) return;

    try {
      await mcpClient.deleteChat(chatId, deviceId);
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
      
      await loadChats(); // Reload to get updated list
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [deviceId, currentChatId, loadChats]);

  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    if (!deviceId) return;

    try {
      await mcpClient.updateChat(chatId, deviceId, newTitle);
      await loadChats(); // Reload to get updated list
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  }, [deviceId, loadChats]);

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

  const clearAllChats = useCallback(async () => {
    if (!deviceId) return;

    try {
      await mcpClient.clearAllChats(deviceId);
      setCurrentChatId(null);
      await loadChats(); // Reload to get updated list
    } catch (error) {
      console.error('Error clearing chats:', error);
    }
  }, [deviceId, loadChats]);

  const editMessage = useCallback(async (chatId: string, messageId: string, newContent: string) => {
    try {
      await mcpClient.updateMessage(messageId, newContent);
      await loadChats(); // Reload to get updated messages
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }, [loadChats]);

  const rateMessage = useCallback(async (chatId: string, messageId: string, rating: 'like' | 'dislike' | null) => {
    if (!rating) return; // Handle null case differently if needed

    try {
      await mcpClient.rateMessage(messageId, rating);
      await loadChats(); // Reload to get updated messages
    } catch (error) {
      console.error('Error rating message:', error);
    }
  }, [loadChats]);

  const deleteMessage = useCallback(async (chatId: string, messageId: string) => {
    try {
      await mcpClient.deleteMessage(messageId);
      await loadChats(); // Reload to get updated messages
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, [loadChats]);

  // Temporary functions for compatibility
  const setMessageEditing = useCallback((_chatId: string, _messageId: string, _isEditing: boolean) => {
    // This will need to be handled in the UI component state
    console.log('Message editing state should be handled in UI component');
  }, []);

  const regenerateResponse = useCallback((_chatId: string, _messageId: string) => {
    // This will be handled in the ChatInterface component
    console.log('Regenerate response should be handled in ChatInterface');
  }, []);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  return {
    chats,
    currentChat,
    currentChatId,
    loading,
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
