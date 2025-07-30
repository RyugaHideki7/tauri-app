import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import ColorPalette from "./components/ColorPalette";
import TitleBar from "./components/TitleBar";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="min-h-screen bg-notion-gray-100 dark:bg-notion-gray-100 font-notion">
      <TitleBar />
      <main className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-notion-gray-900 dark:text-notion-gray-900 mb-8">
          Welcome to Tauri + React
        </h1>

        <div className="flex justify-center items-center gap-8 mb-8">
          <a
            href="https://vitejs.dev"
            target="_blank"
            className="transition-transform hover:scale-110"
          >
            <img
              src="/vite.svg"
              className="h-24 w-24 hover:drop-shadow-lg"
              alt="Vite logo"
            />
          </a>
          <a
            href="https://tauri.app"
            target="_blank"
            className="transition-transform hover:scale-110"
          >
            <img
              src="/tauri.svg"
              className="h-24 w-24 hover:drop-shadow-lg"
              alt="Tauri logo"
            />
          </a>
          <a
            href="https://reactjs.org"
            target="_blank"
            className="transition-transform hover:scale-110"
          >
            <img
              src={reactLogo}
              className="h-24 w-24 hover:drop-shadow-lg animate-spin"
              alt="React logo"
            />
          </a>
        </div>

        <p className="text-notion-gray-600 dark:text-notion-gray-600 mb-8">
          Click on the Tauri, Vite, and React logos to learn more.
        </p>

        <div className="max-w-md mx-auto">
          <form
            className="flex gap-3 mb-6"
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
          >
            <input
              id="greet-input"
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Enter a name..."
              className="flex-1 px-4 py-2 border border-notion-gray-300 dark:border-notion-gray-400 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-notion-blue 
                         focus:border-transparent bg-white dark:bg-notion-gray-200 
                         text-notion-gray-900 dark:text-notion-gray-900
                         placeholder-notion-gray-500 dark:placeholder-notion-gray-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-notion-blue text-white rounded-lg 
                         hover:bg-opacity-90 focus:outline-none focus:ring-2 
                         focus:ring-notion-blue focus:ring-offset-2 
                         transition-colors font-medium"
            >
              Greet
            </button>
          </form>

          {greetMsg && (
            <div
              className="p-4 bg-notion-blue-light dark:bg-notion-blue-light 
                           border border-notion-blue/20 dark:border-notion-blue/30
                           rounded-lg text-notion-gray-800 dark:text-notion-gray-800"
            >
              {greetMsg}
            </div>
          )}
        </div>

        <ColorPalette />
      </main>
    </div>
  );
}

export default App;
