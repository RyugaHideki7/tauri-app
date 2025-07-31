import React from 'react';
import { useTheme, themeClasses, cn } from '../components/ThemeProvider';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const ThemeShowcasePage: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-notion-gray-900">
            Theme Showcase
          </h1>
          <p className="text-lg mb-6 text-notion-gray-600">
            Demonstrating the improved theming system with consistent colors and components
          </p>
          <Button onClick={toggleTheme} variant="primary">
            Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
          </Button>
        </div>

        {/* Color Palette */}
        <Card>
          <h2 className="text-2xl font-semibold mb-6 text-notion-gray-900">
            Color System
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Text Colors */}
            <div>
              <h3 className="font-medium mb-3 text-notion-gray-900">Text Colors</h3>
              <div className="space-y-2">
                <div className="text-notion-gray-900">Primary Text (900)</div>
                <div className="text-notion-gray-700">Secondary Text (700)</div>
                <div className="text-notion-gray-600">Tertiary Text (600)</div>
                <div className="text-notion-gray-500">Quaternary Text (500)</div>
                <div className="text-notion-gray-400">Muted Text (400)</div>
              </div>
            </div>

            {/* Notion Colors */}
            <div>
              <h3 className="font-medium mb-3 text-notion-gray-900">Notion Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-notion-blue rounded"></div>
                  <span className="text-notion-gray-700">Blue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-notion-green rounded"></div>
                  <span className="text-notion-gray-700">Green</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-notion-purple rounded"></div>
                  <span className="text-notion-gray-700">Purple</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-notion-red rounded"></div>
                  <span className="text-notion-gray-700">Red</span>
                </div>
              </div>
            </div>

            {/* Surface Colors */}
            <div>
              <h3 className="font-medium mb-3 text-notion-gray-900">Surfaces</h3>
              <div className="space-y-2">
                <div className="bg-surface p-2 rounded border border-border">
                  <span className="text-notion-gray-700">Surface</span>
                </div>
                <div className="bg-surface-elevated p-2 rounded border border-border">
                  <span className="text-notion-gray-700">Elevated</span>
                </div>
                <div className="bg-surface-hover p-2 rounded border border-border">
                  <span className="text-notion-gray-700">Hover</span>
                </div>
              </div>
            </div>

            {/* Interactive States */}
            <div>
              <h3 className="font-medium mb-3 text-notion-gray-900">Interactive</h3>
              <div className="space-y-2">
                <button className="w-full p-2 rounded text-left hover:bg-surface-hover transition-colors text-notion-gray-700">
                  Hover Effect
                </button>
                <button className="w-full p-2 rounded text-left border border-border focus:outline-none focus:ring-2 focus:ring-notion-blue/50 focus:border-notion-blue text-notion-gray-700">
                  Focus Ring
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Component Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buttons */}
          <Card>
            <h3 className="text-xl font-semibold mb-4 text-notion-gray-900">
              Button Variants
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="primary" isLoading>Loading</Button>
              </div>
            </div>
          </Card>

          {/* Inputs */}
          <Card>
            <h3 className="text-xl font-semibold mb-4 text-notion-gray-900">
              Input Components
            </h3>
            <div className="space-y-4">
              <Input
                label="Standard Input"
                placeholder="Enter text here..."
              />
              <Input
                label="With Icon"
                placeholder="Search..."
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <Input
                label="With Error"
                placeholder="Invalid input"
                error="This field is required"
              />
              <Input
                label="Disabled"
                placeholder="Cannot edit"
                disabled
              />
            </div>
          </Card>
        </div>

        {/* Cards with Different Shadows */}
        <div>
          <h3 className="text-2xl font-semibold mb-6 text-notion-gray-900">
            Card Variations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card shadow="sm">
              <h4 className="font-medium mb-2 text-notion-gray-900">Small Shadow</h4>
              <p className="text-notion-gray-700">
                This card has a subtle shadow for minimal elevation.
              </p>
            </Card>
            <Card shadow="md">
              <h4 className="font-medium mb-2 text-notion-gray-900">Medium Shadow</h4>
              <p className="text-notion-gray-700">
                This card has a medium shadow for moderate elevation.
              </p>
            </Card>
            <Card shadow="lg" hover>
              <h4 className="font-medium mb-2 text-notion-gray-900">Large Shadow + Hover</h4>
              <p className="text-notion-gray-700">
                This card has a large shadow and hover effect.
              </p>
            </Card>
          </div>
        </div>

        {/* Status Indicators */}
        <Card>
          <h3 className="text-xl font-semibold mb-4 text-notion-gray-900">
            Status Indicators
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-notion-green rounded-full"></div>
              <span className="text-notion-gray-700">Success</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-notion-yellow rounded-full"></div>
              <span className="text-notion-gray-700">Warning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-notion-red rounded-full"></div>
              <span className="text-notion-gray-700">Error</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-notion-blue rounded-full"></div>
              <span className="text-notion-gray-700">Info</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ThemeShowcasePage;