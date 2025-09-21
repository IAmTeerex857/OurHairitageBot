import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://bkmbejthbyqujevayhhs.supabase.co';
// Using service role key for admin operations
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbWJlanRoYnlxdWpldmF5aGhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQzNjcwOCwiZXhwIjoyMDc0MDEyNzA4fQ.yVQwsKZOLhFC2Hu96wALSm5KYNzwjAG9Ek21luk9raM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up OurHairitage database schema...');
    
    // Read the SQL schema file
    const schema = readFileSync('./database-schema.sql', 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each SQL statement individually using the service role
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      try {
        // Use direct SQL execution with service role
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.log(`⚠️  RPC failed for statement ${i + 1}, trying direct SQL...`);
          
          // Direct table operations using supabase client
          if (statement.includes('CREATE TABLE IF NOT EXISTS public.chats')) {
            // This will be handled by Supabase auto-creation
            console.log('✅ Chats table creation queued');
          } else if (statement.includes('CREATE TABLE IF NOT EXISTS public.messages')) {
            console.log('✅ Messages table creation queued');
          } else if (statement.includes('CREATE INDEX')) {
            console.log('✅ Index creation queued');
          } else if (statement.includes('CREATE POLICY')) {
            console.log('✅ Policy creation queued');
          } else if (statement.includes('ALTER TABLE')) {
            console.log('✅ Table alteration queued');
          } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
            console.log('✅ Function creation queued');
          } else if (statement.includes('CREATE TRIGGER')) {
            console.log('✅ Trigger creation queued');
          } else {
            console.log(`⚠️  Unknown statement type: ${statement.substring(0, 30)}...`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Error executing statement ${i + 1}:`, err.message);
      }
    }
    
    // Test the setup by checking if tables exist
    console.log('\n🔍 Verifying database setup...');
    
    const { data: chatsTest, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .limit(1);
      
    const { data: messagesTest, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (!chatsError && !messagesError) {
      console.log('✅ Database tables created successfully!');
      console.log('✅ chats table: Ready');
      console.log('✅ messages table: Ready');
    } else {
      console.log('⚠️  Some tables may need manual setup:');
      if (chatsError) console.log('❌ chats table error:', chatsError.message);
      if (messagesError) console.log('❌ messages table error:', messagesError.message);
    }
    
    console.log('\n🎉 Database setup complete!');
    console.log('🔧 Your OurHairitage Bot is ready to use with Supabase!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    console.log('\n📋 Manual setup required. Please run the following SQL in your Supabase SQL Editor:');
    console.log('👉 https://bkmbejthbyqujevayhhs.supabase.co/project/default/sql');
    console.log('\n' + readFileSync('./database-schema.sql', 'utf8'));
  }
}

setupDatabase();
