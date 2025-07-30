import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import ColorPalette from "./components/ColorPalette";
import TitleBar from "./components/TitleBar";
import Button from "./components/Button";
import Input from "./components/Input";
import Table from "./components/Table";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  // Sample data for the table
  const tableData = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "User", status: "Inactive" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "Moderator", status: "Active" },
  ];

  const tableColumns = [
    { key: 'id', header: 'ID', width: '60px' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Active' 
            ? 'bg-notion-green-light text-notion-green' 
            : 'bg-notion-red-light text-notion-red'
        }`}>
          {value}
        </span>
      )
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-notion-gray-100 dark:bg-notion-gray-100 font-notion">
      <TitleBar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-16 text-center">
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

          <p className="text-notion-gray-600 dark:text-notion-gray-600 mb-12">
            Component showcase with Notion design system
          </p>

          {/* Component Showcase */}
          <div className="max-w-4xl mx-auto space-y-16">
            
            {/* Greeting Section */}
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-notion-gray-900 dark:text-notion-gray-900 mb-4">
                Try the Greeting
              </h3>
              <form
                className="flex gap-3 mb-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  greet();
                }}
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name..."
                  className="flex-1"
                />
                <Button type="submit" variant="primary">
                  Greet
                </Button>
              </form>

              {greetMsg && (
                <div className="p-4 bg-notion-blue-light dark:bg-notion-blue-light border border-notion-blue/20 dark:border-notion-blue/30 rounded-lg text-notion-gray-800 dark:text-notion-gray-800">
                  {greetMsg}
                </div>
              )}
            </div>

            {/* Button Examples */}
            <div>
              <h3 className="text-lg font-semibold text-notion-gray-900 dark:text-notion-gray-900 mb-6">
                Button Components
              </h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>

            {/* Input Examples */}
            <div>
              <h3 className="text-lg font-semibold text-notion-gray-900 dark:text-notion-gray-900 mb-6">
                Input Components
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  helperText="We'll never share your email with anyone else."
                />
                <Input
                  label="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  error="Password must be at least 8 characters"
                />
                <Input
                  label="Disabled Input"
                  placeholder="This is disabled"
                  disabled
                />
              </div>
            </div>

            {/* Table Example */}
            <div>
              <h3 className="text-lg font-semibold text-notion-gray-900 dark:text-notion-gray-900 mb-6">
                Table Component
              </h3>
              <Table 
                columns={tableColumns} 
                data={tableData} 
                striped 
                hoverable 
              />
            </div>

            <ColorPalette />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
