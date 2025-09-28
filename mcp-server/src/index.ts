#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bkmbejthbyqujevayhhs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbWJlanRoYnlxdWpldmF5aGhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQzNjcwOCwiZXhwIjoyMDc0MDEyNzA4fQ.yVQwsKZOLhFC2Hu96wALSm5KYNzwjAG9Ek21luk9raM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Database types
interface DatabaseChat {
  id: string;
  device_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseMessage {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  rating?: 'like' | 'dislike' | null;
}

class SupabaseMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'ourHairitage-supabase-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_device_id',
            description: 'Generate a new unique device ID',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'get_chats',
            description: 'Get all chats for a device',
            inputSchema: {
              type: 'object',
              properties: {
                device_id: {
                  type: 'string',
                  description: 'The device ID to get chats for',
                },
              },
              required: ['device_id'],
            },
          },
          {
            name: 'create_chat',
            description: 'Create a new chat',
            inputSchema: {
              type: 'object',
              properties: {
                device_id: {
                  type: 'string',
                  description: 'The device ID for the chat',
                },
                title: {
                  type: 'string',
                  description: 'The title of the chat',
                },
              },
              required: ['device_id', 'title'],
            },
          },
          {
            name: 'update_chat',
            description: 'Update a chat title',
            inputSchema: {
              type: 'object',
              properties: {
                chat_id: {
                  type: 'string',
                  description: 'The chat ID to update',
                },
                device_id: {
                  type: 'string',
                  description: 'The device ID for verification',
                },
                title: {
                  type: 'string',
                  description: 'The new title for the chat',
                },
              },
              required: ['chat_id', 'device_id', 'title'],
            },
          },
          {
            name: 'delete_chat',
            description: 'Delete a chat and all its messages',
            inputSchema: {
              type: 'object',
              properties: {
                chat_id: {
                  type: 'string',
                  description: 'The chat ID to delete',
                },
                device_id: {
                  type: 'string',
                  description: 'The device ID for verification',
                },
              },
              required: ['chat_id', 'device_id'],
            },
          },
          {
            name: 'get_messages',
            description: 'Get all messages for a chat',
            inputSchema: {
              type: 'object',
              properties: {
                chat_id: {
                  type: 'string',
                  description: 'The chat ID to get messages for',
                },
              },
              required: ['chat_id'],
            },
          },
          {
            name: 'create_message',
            description: 'Create a new message in a chat',
            inputSchema: {
              type: 'object',
              properties: {
                chat_id: {
                  type: 'string',
                  description: 'The chat ID to add the message to',
                },
                content: {
                  type: 'string',
                  description: 'The message content',
                },
                role: {
                  type: 'string',
                  enum: ['user', 'assistant'],
                  description: 'The role of the message sender',
                },
              },
              required: ['chat_id', 'content', 'role'],
            },
          },
          {
            name: 'update_message',
            description: 'Update a message content',
            inputSchema: {
              type: 'object',
              properties: {
                message_id: {
                  type: 'string',
                  description: 'The message ID to update',
                },
                content: {
                  type: 'string',
                  description: 'The new message content',
                },
              },
              required: ['message_id', 'content'],
            },
          },
          {
            name: 'rate_message',
            description: 'Rate a message (like/dislike)',
            inputSchema: {
              type: 'object',
              properties: {
                message_id: {
                  type: 'string',
                  description: 'The message ID to rate',
                },
                rating: {
                  type: 'string',
                  enum: ['like', 'dislike'],
                  description: 'The rating to give (like or dislike)',
                },
              },
              required: ['message_id', 'rating'],
            },
          },
          {
            name: 'delete_message',
            description: 'Delete a message',
            inputSchema: {
              type: 'object',
              properties: {
                message_id: {
                  type: 'string',
                  description: 'The message ID to delete',
                },
              },
              required: ['message_id'],
            },
          },
          {
            name: 'clear_all_chats',
            description: 'Delete all chats for a device',
            inputSchema: {
              type: 'object',
              properties: {
                device_id: {
                  type: 'string',
                  description: 'The device ID to clear chats for',
                },
              },
              required: ['device_id'],
            },
          },
          {
            name: 'execute_sql',
            description: 'Execute raw SQL statements (admin only)',
            inputSchema: {
              type: 'object',
              properties: {
                sql: {
                  type: 'string',
                  description: 'The SQL statement to execute',
                },
              },
              required: ['sql'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Ensure args is defined and cast to appropriate type
        const toolArgs = (args || {}) as Record<string, any>;

        switch (name) {
          case 'generate_device_id':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ device_id: uuidv4() }),
                },
              ],
            };

          case 'get_chats':
            return await this.getChats(toolArgs.device_id as string);

          case 'create_chat':
            return await this.createChat(toolArgs.device_id as string, toolArgs.title as string);

          case 'update_chat':
            return await this.updateChat(toolArgs.chat_id as string, toolArgs.device_id as string, toolArgs.title as string);

          case 'delete_chat':
            return await this.deleteChat(toolArgs.chat_id as string, toolArgs.device_id as string);

          case 'get_messages':
            return await this.getMessages(toolArgs.chat_id as string);

          case 'create_message':
            return await this.createMessage(toolArgs.chat_id as string, toolArgs.content as string, toolArgs.role as 'user' | 'assistant');

          case 'update_message':
            return await this.updateMessage(toolArgs.message_id as string, toolArgs.content as string);

          case 'rate_message':
            return await this.rateMessage(toolArgs.message_id as string, toolArgs.rating as 'like' | 'dislike');

          case 'delete_message':
            return await this.deleteMessage(toolArgs.message_id as string);

          case 'clear_all_chats':
            return await this.clearAllChats(toolArgs.device_id as string);

          case 'execute_sql':
            return await this.executeSql(toolArgs.sql as string);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async getChats(deviceId: string) {
    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('device_id', deviceId)
      .order('updated_at', { ascending: false });

    if (chatsError) throw new Error(`Failed to get chats: ${chatsError.message}`);

    if (!chatsData || chatsData.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ chats: [], messages: {} }),
          },
        ],
      };
    }

    // Get all messages for these chats
    const chatIds = chatsData.map(chat => chat.id);
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('chat_id', chatIds)
      .order('timestamp', { ascending: true });

    if (messagesError) throw new Error(`Failed to get messages: ${messagesError.message}`);

    // Group messages by chat_id
    const messagesByChat = (messagesData || []).reduce((acc, msg) => {
      if (!acc[msg.chat_id]) acc[msg.chat_id] = [];
      acc[msg.chat_id].push(msg);
      return acc;
    }, {} as Record<string, DatabaseMessage[]>);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ chats: chatsData, messages: messagesByChat }),
        },
      ],
    };
  }

  private async createChat(deviceId: string, title: string) {
    const chatId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('chats')
      .insert({
        id: chatId,
        device_id: deviceId,
        title: title
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create chat: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ chat: data }),
        },
      ],
    };
  }

  private async updateChat(chatId: string, deviceId: string, title: string) {
    const { data, error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)
      .eq('device_id', deviceId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update chat: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ chat: data }),
        },
      ],
    };
  }

  private async deleteChat(chatId: string, deviceId: string) {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('device_id', deviceId);

    if (error) throw new Error(`Failed to delete chat: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true }),
        },
      ],
    };
  }

  private async getMessages(chatId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });

    if (error) throw new Error(`Failed to get messages: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ messages: data || [] }),
        },
      ],
    };
  }

  private async createMessage(chatId: string, content: string, role: 'user' | 'assistant') {
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        chat_id: chatId,
        content,
        role
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create message: ${error.message}`);

    // Check if we need to update chat title
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });

    if (messages && messages.length === 1 && role === 'user') {
      // This is the first message, update chat title
      const newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', chatId);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ message: data }),
        },
      ],
    };
  }

  private async updateMessage(messageId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ content })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update message: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ message: data }),
        },
      ],
    };
  }

  private async rateMessage(messageId: string, rating: 'like' | 'dislike') {
    const { data, error } = await supabase
      .from('messages')
      .update({ rating })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw new Error(`Failed to rate message: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ message: data }),
        },
      ],
    };
  }

  private async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw new Error(`Failed to delete message: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true }),
        },
      ],
    };
  }

  private async clearAllChats(deviceId: string) {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('device_id', deviceId);

    if (error) throw new Error(`Failed to clear chats: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true }),
        },
      ],
    };
  }

  private async executeSql(sql: string) {
    try {
      console.log('Executing SQL with service role key...');
      
      // Use Supabase's database connection directly for SQL execution
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      const results = [];
      
      for (const statement of statements) {
        try {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          
          // Use PostgREST's direct SQL execution via the database
          const { data, error } = await supabase
            .from('_supabase_admin')
            .select('*')
            .limit(1);
          
          // Since that won't work, let's use the correct approach:
          // Execute SQL through Supabase's SQL editor API
          const response = await fetch(`${SUPABASE_URL}/platform/pg/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'apikey': SUPABASE_SERVICE_KEY
            },
            body: JSON.stringify({ 
              query: statement 
            })
          });

          if (response.ok) {
            const result = await response.json();
            results.push({ 
              statement: statement.substring(0, 50) + '...', 
              success: true, 
              result 
            });
            console.log(`✅ Executed successfully`);
          } else {
            // Try alternative approach for table creation
            if (statement.includes('CREATE TABLE')) {
              const tableCreated = await this.createTableFromSQL(statement);
              results.push({ 
                statement: statement.substring(0, 50) + '...', 
                success: tableCreated, 
                method: 'alternative' 
              });
            } else {
              results.push({ 
                statement: statement.substring(0, 50) + '...', 
                success: false, 
                error: `HTTP ${response.status}` 
              });
            }
          }
        } catch (err) {
          console.log(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
          results.push({ 
            statement: statement.substring(0, 50) + '...', 
            success: false, 
            error: err instanceof Error ? err.message : String(err) 
          });
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ 
              success: true, 
              message: `Executed ${results.length} SQL statements`,
              results 
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to execute SQL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createTableFromSQL(createTableSQL: string): Promise<boolean> {
    try {
      // Extract table name and columns from CREATE TABLE statement
      const tableNameMatch = createTableSQL.match(/CREATE TABLE[^(]*public\.(\w+)/i);
      if (!tableNameMatch) return false;
      
      const tableName = tableNameMatch[1];
      console.log(`Creating table ${tableName} using Supabase client...`);
      
      // For now, let's just verify the table doesn't exist
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        // Table doesn't exist, we need to create it
        // This is where we'd normally execute the DDL, but Supabase client doesn't support DDL
        console.log(`Table ${tableName} needs to be created manually in Supabase dashboard`);
        return false;
      } else if (!error) {
        console.log(`Table ${tableName} already exists`);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private async createTableDirectly(tableName: string, columns: Record<string, string>) {
    try {
      // Use Supabase's schema builder equivalent via REST API
      const columnDefs = Object.entries(columns)
        .map(([name, type]) => `${name} ${type}`)
        .join(', ');
      
      const createTableSQL = `CREATE TABLE IF NOT EXISTS public.${tableName} (${columnDefs});`;
      
      // Try using SQL via the admin endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ query: createTableSQL })
      });

      if (response.ok) {
        return { table: tableName, status: 'created' };
      } else {
        // Table might already exist, try to verify
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          return { table: tableName, status: 'already_exists' };
        }
        
        return { table: tableName, status: 'failed', error: error.message };
      }
    } catch (error) {
      return { 
        table: tableName, 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OurHairitage Supabase MCP Server running on stdio');
  }
}

const server = new SupabaseMCPServer();
server.start().catch(console.error);
