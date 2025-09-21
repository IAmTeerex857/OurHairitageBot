import { useState, useCallback, useEffect } from 'react';
import { Chat, Message } from '../types/chat';
import { supabase, getDeviceId, DatabaseChat, DatabaseMessage } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useSupabaseChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  const deviceId = getDeviceId();

  // Convert database chat to frontend chat
  const convertToChat = (dbChat: DatabaseChat, messages: DatabaseMessage[]): Chat => ({
    id: dbChat.id,
    title: dbChat.title,
    messages: messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      timestamp: new Date(msg.timestamp),
      rating: msg.rating || null
    })),
    createdAt: new Date(dbChat.created_at),
    updatedAt: new Date(dbChat.updated_at)
  });

  // Load chats from Supabase
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get chats for this device
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('device_id', deviceId)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      if (!chatsData || chatsData.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      // Get all messages for these chats
      const chatIds = chatsData.map(chat => chat.id);
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;

      // Group messages by chat_id
      const messagesByChat = (messagesData || []).reduce((acc, msg) => {
        if (!acc[msg.chat_id]) acc[msg.chat_id] = [];
        acc[msg.chat_id].push(msg);
        return acc;
      }, {} as Record<string, DatabaseMessage[]>);

      // Convert to frontend format
      const convertedChats = chatsData.map(chat => 
        convertToChat(chat, messagesByChat[chat.id] || [])
      );

      setChats(convertedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Set up real-time subscriptions
  useEffect(() => {
    loadChats();

    // Set up real-time subscription for chats
    const channel = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `device_id=eq.${deviceId}`
        },
        () => {
          loadChats(); // Reload when chats change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadChats(); // Reload when messages change
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadChats, deviceId]);

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
    try {
      const newChatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('chats')
        .insert({
          id: newChatId,
          device_id: deviceId,
          title: 'New Conversation'
        });

      if (error) throw error;

      setCurrentChatId(newChatId);
      return newChatId;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, [deviceId]);

  const addMessage = useCallback(async (chatId: string, content: string, role: 'user' | 'assistant') => {
    try {
      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          id: messageId,
          chat_id: chatId,
          content,
          role
        });

      if (error) throw error;

      // Update chat title if it's the first user message
      const chat = chats.find(c => c.id === chatId);
      if (chat && chat.messages.length === 0 && role === 'user') {
        const newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await supabase
          .from('chats')
          .update({ title: newTitle })
          .eq('id', chatId);
      }

      // The real-time subscription will handle updating the UI
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }, [chats]);

  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('device_id', deviceId);

      if (error) throw error;

      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [currentChatId, deviceId]);

  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', chatId)
        .eq('device_id', deviceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  }, [deviceId]);

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
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('device_id', deviceId);

      if (error) throw error;

      setCurrentChatId(null);
    } catch (error) {
      console.error('Error clearing chats:', error);
    }
  }, [deviceId]);

  const editMessage = useCallback(async (chatId: string, messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId)
        .eq('chat_id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }, []);

  const rateMessage = useCallback(async (chatId: string, messageId: string, rating: 'like' | 'dislike' | null) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ rating })
        .eq('id', messageId)
        .eq('chat_id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rating message:', error);
    }
  }, []);

  const deleteMessage = useCallback(async (chatId: string, messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('chat_id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

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
