import React from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './components/HomePage';
import { ChatInterface } from './components/ChatInterface';
import { useChats } from './hooks/useChats';
import { useSettings } from './hooks/useSettings';

function App() {
  const { 
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
    deleteMessage
  } = useChats();

  const { settings, updateSettings } = useSettings();

  const handleSuggestedQuestion = (question: string) => {
    let chatId = currentChatId;
    
    if (!chatId) {
      chatId = createNewChat();
    }

    addMessage(chatId, question, 'user');
  };

  const handleSendMessage = (content: string, role: 'user' | 'assistant' = 'user') => {
    if (!currentChatId) return;
    addMessage(currentChatId, content, role);
  };

  const handleNewChat = () => {
    createNewChat();
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
  };

  return (
    <Layout
      chats={chats}
      currentChatId={currentChatId}
      onSelectChat={handleSelectChat}
      onNewChat={handleNewChat}
      onDeleteChat={deleteChat}
      onRenameChat={renameChat}
      onExportChat={exportChat}
      onClearAllChats={clearAllChats}
      settings={settings}
      onSettingsChange={updateSettings}
    >
      {currentChat ? (
        <ChatInterface
          chat={currentChat}
          onSendMessage={handleSendMessage}
          onEditMessage={editMessage}
          onSetMessageEditing={setMessageEditing}
          onRateMessage={rateMessage}
          onRegenerateResponse={regenerateResponse}
          onDeleteMessage={deleteMessage}
        />
      ) : (
        <HomePage onSuggestedQuestion={handleSuggestedQuestion} />
      )}
    </Layout>
  );
}

export default App;