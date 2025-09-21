import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = 'https://bkmbejthbyqujevayhhs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbWJlanRoYnlxdWpldmF5aGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzY3MDgsImV4cCI6MjA3NDAxMjcwOH0.DeMF41heLYTMP0aqdrsP4cfmQvz0L98mAwvohKj9RmE'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Device ID management
const DEVICE_ID_KEY = 'ourHairitage_deviceId'

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  
  if (!deviceId) {
    deviceId = uuidv4()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  
  return deviceId
}

// Database types
export interface DatabaseChat {
  id: string
  device_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface DatabaseMessage {
  id: string
  chat_id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  rating?: 'like' | 'dislike' | null
}

// Type definitions for Supabase
export type Database = {
  public: {
    Tables: {
      chats: {
        Row: DatabaseChat
        Insert: Omit<DatabaseChat, 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseChat, 'id' | 'created_at'>>
      }
      messages: {
        Row: DatabaseMessage
        Insert: Omit<DatabaseMessage, 'timestamp'>
        Update: Partial<Omit<DatabaseMessage, 'id' | 'timestamp'>>
      }
    }
  }
}
