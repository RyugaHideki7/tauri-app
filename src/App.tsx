import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Layout } from "./components/layout";
import { Button, Input } from "./components/ui";
import { useAppContext } from "./contexts";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const { state } = useAppContext();

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  // Minimal color palette for testing
  const colors = [
    { name: "Blue", class: "bg-blue-500", hex: "#3b82f6" },
    { name: "Green", class: "bg-green-500", hex: "#10b981" },
    { name: "Red", class: "bg-red-500", hex: "#ef4444" },
    { name: "Purple", class: "bg-purple-500", hex: "#8b5cf6" },
    { name: "Yellow", class: "bg-yellow-500", hex: "#eab308" },
    { name: "Gray", class: "bg-gray-500", hex: "#6b7280" },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-7xl font-bold text-gray-900 mb-4">
            Tailwind CSS v4 Test
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Testing if Tailwind is working properly
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg shadow-md">
            <span className="text-sm font-medium">✅ Tailwind CSS Active</span>
          </div>
        </div>

        {/* Color Palette Test */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Color Palette Test
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {colors.map((color) => (
              <div key={color.name} className="text-center">
                <div className={`${color.class} h-16 w-full rounded-lg shadow-md mb-2`}></div>
                <p className="text-sm font-medium text-gray-700">{color.name}</p>
                <p className="text-xs text-gray-500">{color.hex}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Components Test */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-primary">
            Components Test
          </h2>
          
          <div className="max-w-md mx-auto space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                greet();
              }}
              className="space-y-4"
            >
              <Input
                id="greet-input"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Enter your name..."
                label="Test Input"
              />
              
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Primary
                </Button>
                <Button variant="secondary" type="button" className="flex-1">
                  Secondary
                </Button>
              </div>
              
              <Button variant="outline" type="button" className="w-full">
                Outline
              </Button>
            </form>
            
            {greetMsg && (
              <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-green-800 font-medium text-center">{greetMsg}</p>
              </div>
            )}
          </div>
        </div>

        {/* Utility Classes Test */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Utility Classes Test
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Rounded</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">Shadow</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm">Colors</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-xl text-sm">Working!</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-600">Responsive grid</p>
              </div>
              <div className="p-4 border-2 bg-primary border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-600">Layout working</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center p-4 bg-back text-white rounded-lg">
          <p className="text-sm">
            Theme: <span className="font-semibold text-yellow-400">{state.theme}</span> | 
            Loading: <span className="font-semibold text-yellow-400">{state.loading ? 'Yes' : 'No'}</span>
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default App;
