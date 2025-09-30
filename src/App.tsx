import { Layout } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { ChatInterface } from "./components/ChatInterface";
import { useSupabaseChats } from "./hooks/useSupabaseChats";
import { useSettings } from "./hooks/useSettings";

function App() {
  const {
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
    onClickLogo,
  } = useSupabaseChats();

  const { settings, updateSettings } = useSettings();

  const handleSuggestedQuestion = async (question: string) => {
    let chatId = currentChatId;

    if (!chatId) {
      chatId = await createNewChat();
      if (!chatId) return; // Handle creation failure
    }

    await addMessage(chatId, question, "user");
  };

  const handleSendMessage = async (
    content: string,
    role: "user" | "assistant" = "user"
  ) => {
    if (!currentChatId) return;
    await addMessage(currentChatId, content, role);
  };

  const handleNewChat = async () => {
    await createNewChat();
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            OUR HAIRITAGE
          </h2>
          <p className="text-gray-400">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  const isResolvingNewChat = !!currentChatId && !currentChat;

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
      onClickLogo={onClickLogo}
    >
      {isResolvingNewChat ? (
        <div className="flex items-center justify-center h-full bg-slate-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      ) : currentChat ? (
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
