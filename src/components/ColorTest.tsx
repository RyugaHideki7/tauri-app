import React from 'react';
import { useTheme } from './ThemeProvider';

const ColorTest: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-notion-gray-900">
            Color Test - {isDarkMode ? 'Dark' : 'Light'} Mode
          </h1>
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 bg-notion-blue text-white rounded-lg hover:bg-notion-blue/90 transition-colors"
          >
            Toggle to {isDarkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {/* Text Color Tests */}
        <div className="bg-surface p-6 rounded-lg border border-border mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-notion-gray-900">Text Colors</h2>
          <div className="space-y-2">
            <div className="text-notion-gray-900">notion-gray-900 (Primary text)</div>
            <div className="text-notion-gray-800">notion-gray-800</div>
            <div className="text-notion-gray-700">notion-gray-700 (Secondary text)</div>
            <div className="text-notion-gray-600">notion-gray-600 (Tertiary text)</div>
            <div className="text-notion-gray-500">notion-gray-500</div>
            <div className="text-notion-gray-400">notion-gray-400 (Muted text)</div>
            <div className="text-notion-gray-300">notion-gray-300</div>
            <div className="text-notion-gray-200">notion-gray-200</div>
            <div className="text-notion-gray-100">notion-gray-100</div>
          </div>
        </div>

        {/* Background Tests */}
        <div className="bg-surface p-6 rounded-lg border border-border mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-notion-gray-900">Background Colors</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-background p-4 rounded border border-border">
              <span className="text-notion-gray-900">Background</span>
            </div>
            <div className="bg-surface p-4 rounded border border-border">
              <span className="text-notion-gray-900">Surface</span>
            </div>
            <div className="bg-surface-elevated p-4 rounded border border-border">
              <span className="text-notion-gray-900">Surface Elevated</span>
            </div>
            <div className="bg-surface-hover p-4 rounded border border-border">
              <span className="text-notion-gray-900">Surface Hover</span>
            </div>
            <div className="bg-notion-gray-100 p-4 rounded border border-border">
              <span className="text-notion-gray-900">Gray 100</span>
            </div>
            <div className="bg-notion-gray-200 p-4 rounded border border-border">
              <span className="text-notion-gray-900">Gray 200</span>
            </div>
          </div>
        </div>

        {/* Notion Colors */}
        <div className="bg-surface p-6 rounded-lg border border-border mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-notion-gray-900">Notion Colors</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-notion-blue rounded-lg mx-auto mb-2"></div>
              <span className="text-notion-gray-700">Blue</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notion-green rounded-lg mx-auto mb-2"></div>
              <span className="text-notion-gray-700">Green</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notion-purple rounded-lg mx-auto mb-2"></div>
              <span className="text-notion-gray-700">Purple</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notion-red rounded-lg mx-auto mb-2"></div>
              <span className="text-notion-gray-700">Red</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notion-orange rounded-lg mx-auto mb-2"></div>
              <span className="text-notion-gray-700">Orange</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notion-yellow rounded-lg mx-auto mb-2"></div>
              <span className="text-notion-gray-700">Yellow</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notion-pink rounded-lg mx-auto mb-2"></div>
              <span className="text-notion-gray-700">Pink</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-notion-brown rounded-lg mx-auto mb-2"></div>
              <span className="text-notion-gray-700">Brown</span>
            </div>
          </div>
        </div>

        {/* CSS Variable Values */}
        <div className="bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-2xl font-semibold mb-4 text-notion-gray-900">CSS Variable Values</h2>
          <div className="text-sm font-mono space-y-1 text-notion-gray-700">
            <div>--color-notion-gray-900: {getComputedStyle(document.documentElement).getPropertyValue('--color-notion-gray-900')}</div>
            <div>--color-notion-gray-700: {getComputedStyle(document.documentElement).getPropertyValue('--color-notion-gray-700')}</div>
            <div>--color-notion-gray-600: {getComputedStyle(document.documentElement).getPropertyValue('--color-notion-gray-600')}</div>
            <div>--color-background: {getComputedStyle(document.documentElement).getPropertyValue('--color-background')}</div>
            <div>--color-surface: {getComputedStyle(document.documentElement).getPropertyValue('--color-surface')}</div>
            <div>--color-border: {getComputedStyle(document.documentElement).getPropertyValue('--color-border')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorTest;