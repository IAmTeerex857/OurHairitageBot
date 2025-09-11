import { useState, useEffect } from 'react';
import { X, Settings, Moon, Sun, Type, Palette, Download, Trash2, HelpCircle } from 'lucide-react';

export interface UserSettings {
  theme: 'dark' | 'light' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  messageStyle: 'bubbles' | 'minimal';
  showTimestamps: boolean;
  soundEnabled: boolean;
  exportFormat: 'json' | 'txt' | 'markdown';
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onClearAllChats: () => void;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  fontSize: 'medium',
  messageStyle: 'bubbles',
  showTimestamps: true,
  soundEnabled: false,
  exportFormat: 'json'
};

export function SettingsDialog({ 
  isOpen, 
  onClose, 
  settings = defaultSettings, 
  onSettingsChange,
  onClearAllChats 
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleClearAllChats = () => {
    onClearAllChats();
    setShowClearConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-start md:items-center justify-center p-4 pt-8 md:pt-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 md:p-2 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] md:min-w-auto md:min-h-auto flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Appearance Section */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </h3>
            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Theme</label>
                  <p className="text-sm text-gray-400">Choose your preferred color scheme</p>
                </div>
                <div className="flex space-x-2">
                  {[
                    { value: 'dark', icon: Moon, label: 'Dark' },
                    { value: 'light', icon: Sun, label: 'Light' },
                    { value: 'auto', icon: Settings, label: 'Auto' }
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => handleSettingChange('theme', value as any)}
                      className={`p-3 rounded-lg border transition-all ${
                        localSettings.theme === value
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                      title={label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Font Size</label>
                  <p className="text-sm text-gray-400">Adjust text size for better readability</p>
                </div>
                <select
                  value={localSettings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Message Style */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Message Style</label>
                  <p className="text-sm text-gray-400">Choose how messages are displayed</p>
                </div>
                <select
                  value={localSettings.messageStyle}
                  onChange={(e) => handleSettingChange('messageStyle', e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bubbles">Speech Bubbles</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>
          </section>

          {/* Chat Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Type className="w-5 h-5 mr-2" />
              Chat Preferences
            </h3>
            <div className="space-y-4">
              {/* Show Timestamps */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Show Timestamps</label>
                  <p className="text-sm text-gray-400">Display message timestamps</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.showTimestamps}
                    onChange={(e) => handleSettingChange('showTimestamps', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Sound Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Sound Notifications</label>
                  <p className="text-sm text-gray-400">Play sound for new messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.soundEnabled}
                    onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Export Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Export
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Export Format</label>
                  <p className="text-sm text-gray-400">Default format for exporting chats</p>
                </div>
                <select
                  value={localSettings.exportFormat}
                  onChange={(e) => handleSettingChange('exportFormat', e.target.value as any)}
                  className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON</option>
                  <option value="txt">Plain Text</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Trash2 className="w-5 h-5 mr-2" />
              Data Management
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium">Clear All Conversations</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Permanently delete all chat history. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex-shrink-0"
                  >
                    Clear All
                  </button>
                </div>

                {showClearConfirm && (
                  <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg">
                    <p className="text-red-200 text-sm mb-3">
                      Are you sure you want to delete all conversations? This cannot be undone.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleClearAllChats}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Yes, Delete All
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Help Section */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              Keyboard Shortcuts
            </h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">New conversation</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">⌘N</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Search</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">⌘K</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Send message</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">New line</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">⇧Enter</kbd>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Settings are automatically saved
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
