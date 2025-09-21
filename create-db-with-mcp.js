import { spawn } from 'child_process';
import { readFileSync } from 'fs';

async function createDatabaseViaMCP() {
  console.log('🚀 Creating database schema using MCP server...');
  
  // Read the SQL schema
  const schema = readFileSync('./database-schema.sql', 'utf8');
  
  // Start MCP server process
  const mcpServer = spawn('node', ['./mcp-server/dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  
  mcpServer.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  mcpServer.stderr.on('data', (data) => {
    console.log('MCP Server:', data.toString());
  });

  // Send initialize request
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "database-setup",
        version: "1.0.0"
      }
    }
  };

  mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait a bit for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  // List available tools
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list"
  };

  mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Wait and then execute SQL
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Execute the database schema
  console.log('⚙️  Executing database schema...');
  
  const executeRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "execute_sql",
      arguments: {
        sql: schema
      }
    }
  };

  mcpServer.stdin.write(JSON.stringify(executeRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('📋 MCP Response:', responseData);

  // Close the server
  mcpServer.kill();
  
  console.log('✅ Database setup completed via MCP!');
}

createDatabaseViaMCP().catch(console.error);
