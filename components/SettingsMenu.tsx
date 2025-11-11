'use client';

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';
export type FontSize = 'small' | 'medium' | 'large';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

export default function SettingsMenu({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
}: SettingsMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 88px)' }}>
          {/* Theme Setting */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Appearance</h3>
            <div className="space-y-2">
              <button
                onClick={() => onThemeChange('light')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-[#004978] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  theme === 'light' ? 'bg-[#004978]' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <svg className={`w-5 h-5 ${theme === 'light' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Light Mode</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Bright and clear</div>
                </div>
                {theme === 'light' && (
                  <svg className="w-5 h-5 text-[#004978]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => onThemeChange('dark')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-[#004978] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  theme === 'dark' ? 'bg-[#004978]' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Dark Mode</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</div>
                </div>
                {theme === 'dark' && (
                  <svg className="w-5 h-5 text-[#004978]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Font Size Setting */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Text Size</h3>
            <div className="space-y-2">
              <button
                onClick={() => onFontSizeChange('small')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  fontSize === 'small'
                    ? 'border-[#004978] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">Small</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Compact view</div>
                </div>
                {fontSize === 'small' && (
                  <svg className="w-5 h-5 text-[#004978]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => onFontSizeChange('medium')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  fontSize === 'medium'
                    ? 'border-[#004978] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium text-base text-gray-900 dark:text-white">Medium</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Default size</div>
                </div>
                {fontSize === 'medium' && (
                  <svg className="w-5 h-5 text-[#004978]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => onFontSizeChange('large')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  fontSize === 'large'
                    ? 'border-[#004978] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium text-lg text-gray-900 dark:text-white">Large</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Easier to read</div>
                </div>
                {fontSize === 'large' && (
                  <svg className="w-5 h-5 text-[#004978]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Your settings are saved locally and will persist across sessions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
