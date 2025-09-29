import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit3,
  Download,
  Settings,
  Search,
} from "lucide-react";
import { Chat } from "../types/chat";
import { SearchDialog } from "./SearchDialog";
import { SettingsDialog, UserSettings } from "./SettingsDialog";

interface LayoutProps {
  children: React.ReactNode;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onExportChat: (chatId: string) => void;
  onClearAllChats: () => void;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

export function Layout({
  children,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onExportChat,
  onClearAllChats,
  settings,
  onSettingsChange,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showChatMenu, setShowChatMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleStartEdit = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setShowChatMenu(null);
  };

  const handleSaveEdit = () => {
    if (editingChatId && editingTitle.trim()) {
      onRenameChat(editingChatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleDeleteChat = (chatId: string) => {
    onDeleteChat(chatId);
    setShowChatMenu(null);
  };

  const handleExportChat = (chatId: string) => {
    onExportChat(chatId);
    setShowChatMenu(null);
  };

  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // if click is NOT inside any chat menu region, close it
      if (target && !target.closest("[data-chat-menu]")) {
        setShowChatMenu(null);
      }
    };

    document.addEventListener("mousedown", handleGlobalMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleGlobalMouseDown);
    };
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex h-screen bg-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed md:relative inset-y-0 left-0 z-50 w-80 md:w-64 bg-gray-900 
        border-r border-gray-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="OUR HAIRITAGE"
                className="h-8 w-auto object-contain"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3 border-b border-gray-700">
            <button
              onClick={onNewChat}
              className="w-full flex items-center space-x-3 px-3 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors text-left"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">New chat</span>
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`
                    group relative w-full text-left px-3 py-3 rounded-lg transition-colors cursor-pointer
                    ${
                      currentChatId === chat.id
                        ? "bg-gray-800"
                        : "hover:bg-gray-800"
                    }
                  `}
                  onClick={() => {
                    if (editingChatId !== chat.id) {
                      onSelectChat(chat.id);
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingChatId === chat.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          onBlur={handleSaveEdit}
                          className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-600"
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-white truncate text-sm font-normal">
                          {chat.title}
                        </h3>
                      )}
                    </div>

                    {/* Chat Menu Button */}
                    {editingChatId !== chat.id && (
                      <div className="relative flex-shrink-0" data-chat-menu>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowChatMenu(
                              showChatMenu === chat.id ? null : chat.id
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all duration-200"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Chat Menu Dropdown */}
                        {showChatMenu === chat.id && (
                          <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-[160px]">
                            <button
                              onClick={() => handleStartEdit(chat)}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2 rounded-t-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => handleExportChat(chat.id)}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Download className="w-4 h-4" />
                              <span>Export</span>
                            </button>
                            <button
                              onClick={() => handleDeleteChat(chat.id)}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2 rounded-b-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Button */}
          <div className="p-3 border-t border-gray-700">
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center space-x-3 px-3 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors text-left"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center space-x-3 px-3 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors text-left mt-1"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search chats</span>
              <span className="ml-auto text-xs text-gray-400">⌘K</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-300" />
          </button>
          <div className="flex-1" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>

      {/* Search Dialog */}
      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        chats={chats}
        onSelectChat={(chatId) => {
          onSelectChat(chatId);
          setSidebarOpen(false);
        }}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onClearAllChats={onClearAllChats}
      />
    </div>
  );
}
