import React from 'react';

const ColorPalette: React.FC = () => {
  const colors = [
    { name: 'Brown', bg: 'bg-notion-brown', light: 'bg-notion-brown-light' },
    { name: 'Orange', bg: 'bg-notion-orange', light: 'bg-notion-orange-light' },
    { name: 'Yellow', bg: 'bg-notion-yellow', light: 'bg-notion-yellow-light' },
    { name: 'Green', bg: 'bg-notion-green', light: 'bg-notion-green-light' },
    { name: 'Blue', bg: 'bg-notion-blue', light: 'bg-notion-blue-light' },
    { name: 'Purple', bg: 'bg-notion-purple', light: 'bg-notion-purple-light' },
    { name: 'Pink', bg: 'bg-notion-pink', light: 'bg-notion-pink-light' },
    { name: 'Red', bg: 'bg-notion-red', light: 'bg-notion-red-light' },
  ];

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold text-notion-gray-900 mb-6">
        Notion Color Palette
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {colors.map((color) => (
          <div key={color.name} className="text-center">
            <div className="space-y-2">
              <div className={`${color.bg} h-16 w-full rounded-lg shadow-sm`} />
              <div className={`${color.light} h-16 w-full rounded-lg shadow-sm`} />
            </div>
            <p className="mt-2 text-sm font-medium text-notion-gray-700">
              {color.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;