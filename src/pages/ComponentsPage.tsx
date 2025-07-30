import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import ColorPalette from '../components/ColorPalette';

const ComponentsPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');

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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-notion-gray-900 dark:text-notion-gray-900 mb-2">
          Component Library
        </h1>
        <p className="text-notion-gray-600 dark:text-notion-gray-600">
          Explore our Notion-inspired component collection
        </p>
      </div>

      <div className="max-w-4xl space-y-16">
        
        {/* Button Examples */}
        <div>
          <h2 className="text-xl font-semibold text-notion-gray-900 dark:text-notion-gray-900 mb-6">
            Button Components
          </h2>
          <div className="bg-white dark:bg-notion-gray-200 p-6 rounded-lg border border-notion-gray-300 dark:border-notion-gray-400">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>
        </div>

        {/* Input Examples */}
        <div>
          <h2 className="text-xl font-semibold text-notion-gray-900 dark:text-notion-gray-900 mb-6">
            Input Components
          </h2>
          <div className="bg-white dark:bg-notion-gray-200 p-6 rounded-lg border border-notion-gray-300 dark:border-notion-gray-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Table Example */}
        <div>
          <h2 className="text-xl font-semibold text-notion-gray-900 dark:text-notion-gray-900 mb-6">
            Table Component
          </h2>
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
  );
};

export default ComponentsPage;