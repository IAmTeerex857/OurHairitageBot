// Browser-compatible MCP client using HTTP API
import { v4 as uuidv4 } from 'uuid';

export class MCPSupabaseClient {
  private baseUrl = '/api/mcp'; // We'll set up an API route
  
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MCP API call failed:', error);
      throw error;
    }
  }

  // Device operations
  async generateDeviceId(): Promise<{ device_id: string }> {
    // Generate client-side for now
    return { device_id: uuidv4() };
  }

  // Chat operations
  async getChats(deviceId: string): Promise<{ chats: any[], messages: Record<string, any[]> }> {
    return await this.callTool('get_chats', { device_id: deviceId });
  }

  async createChat(deviceId: string, title: string): Promise<{ chat: any }> {
    return await this.callTool('create_chat', { device_id: deviceId, title });
  }

  async updateChat(chatId: string, deviceId: string, title: string): Promise<{ chat: any }> {
    return await this.callTool('update_chat', { chat_id: chatId, device_id: deviceId, title });
  }

  async deleteChat(chatId: string, deviceId: string): Promise<{ success: boolean }> {
    return await this.callTool('delete_chat', { chat_id: chatId, device_id: deviceId });
  }

  async clearAllChats(deviceId: string): Promise<{ success: boolean }> {
    return await this.callTool('clear_all_chats', { device_id: deviceId });
  }

  // Message operations
  async getMessages(chatId: string): Promise<{ messages: any[] }> {
    return await this.callTool('get_messages', { chat_id: chatId });
  }

  async createMessage(chatId: string, content: string, role: 'user' | 'assistant'): Promise<{ message: any }> {
    return await this.callTool('create_message', { chat_id: chatId, content, role });
  }

  async updateMessage(messageId: string, content: string): Promise<{ message: any }> {
    return await this.callTool('update_message', { message_id: messageId, content });
  }

  async rateMessage(messageId: string, rating: 'like' | 'dislike'): Promise<{ message: any }> {
    return await this.callTool('rate_message', { message_id: messageId, rating });
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return await this.callTool('delete_message', { message_id: messageId });
  }
}

// Singleton instance
export const mcpClient = new MCPSupabaseClient();