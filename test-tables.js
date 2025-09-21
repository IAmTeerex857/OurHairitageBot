import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkmbejthbyqujevayhhs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbWJlanRoYnlxdWpldmF5aGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzY3MDgsImV4cCI6MjA3NDAxMjcwOH0.DeMF41heLYTMP0aqdrsP4cfmQvz0L98mAwvohKj9RmE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('🔍 Testing if tables exist...');
  
  try {
    // Test chats table
    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .limit(1);
      
    if (!chatsError) {
      console.log('✅ chats table exists and is accessible');
    } else {
      console.log('❌ chats table error:', chatsError.message);
    }
    
    // Test messages table
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
      
    if (!messagesError) {
      console.log('✅ messages table exists and is accessible');
    } else {
      console.log('❌ messages table error:', messagesError.message);
    }
    
    if (!chatsError && !messagesError) {
      console.log('🎉 All tables are ready! Your OurHairitage Bot can now use Supabase!');
    }
    
  } catch (error) {
    console.error('❌ Error testing tables:', error);
  }
}

testTables();
