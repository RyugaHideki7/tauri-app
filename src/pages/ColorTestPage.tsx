import React from 'react';

const ColorTestPage: React.FC = () => {
  const colorTests = [
    { name: 'Background', class: 'bg-background text-foreground', description: 'Main background' },
    { name: 'Card', class: 'bg-card text-card-foreground', description: 'Card background' },
    { name: 'Primary', class: 'bg-primary text-primary-foreground', description: 'Primary actions' },
    { name: 'Secondary', class: 'bg-secondary text-secondary-foreground', description: 'Secondary elements' },
    { name: 'Muted', class: 'bg-muted text-muted-foreground', description: 'Muted/subtle elements' },
    { name: 'Accent', class: 'bg-accent text-accent-foreground', description: 'Accent highlights' },
    { name: 'Destructive', class: 'bg-destructive text-destructive-foreground', description: 'Dangerous actions' },
    { name: 'Navy', class: 'bg-navy text-white', description: 'Navy blue' },
    { name: 'Cyan', class: 'bg-cyan text-white', description: 'Cyan blue' },
    { name: 'Light Blue', class: 'bg-light-blue text-navy', description: 'Light blue' },
    { name: 'Green', class: 'bg-green text-white', description: 'Green accent' },
    { name: 'Ice Blue', class: 'bg-ice-blue text-navy', description: 'Ice blue' },
  ];

  const borderTests = [
    { name: 'Border', class: 'border-2 border-border', description: 'Standard border' },
    { name: 'Input', class: 'border-2 border-input', description: 'Input border' },
    { name: 'Ring', class: 'ring-2 ring-ring', description: 'Focus ring' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Color Palette Test</h1>
        
        {/* Background Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Background Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorTests.map((test) => (
              <div key={test.name} className="border border-border rounded-lg overflow-hidden">
                <div className={`${test.class} p-6 min-h-[120px] flex items-center justify-center`}>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{test.name}</div>
                    <div className="text-sm opacity-80 mt-1">{test.description}</div>
                  </div>
                </div>
                <div className="bg-card p-3 border-t border-border">
                  <code className="text-xs text-muted-foreground">{test.class}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Border Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Border & Ring Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {borderTests.map((test) => (
              <div key={test.name} className="bg-card rounded-lg p-6">
                <div className={`${test.class} bg-muted p-4 rounded text-center`}>
                  <div className="font-semibold">{test.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{test.description}</div>
                </div>
                <div className="mt-3">
                  <code className="text-xs text-muted-foreground">{test.class}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Text Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Text Colors</h2>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="space-y-4">
              <p className="text-foreground">Primary text (foreground)</p>
              <p className="text-muted-foreground">Secondary text (muted-foreground)</p>
              <p className="text-primary">Primary colored text</p>
              <p className="text-accent">Accent colored text</p>
              <p className="text-destructive">Destructive colored text</p>
              <p className="text-navy">Navy colored text</p>
              <p className="text-cyan">Cyan colored text</p>
              <p className="text-green">Green colored text</p>
            </div>
          </div>
        </section>

        {/* Interactive Elements */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Interactive Elements</h2>
          <div className="bg-card p-6 rounded-lg border border-border space-y-4">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 transition-opacity">
              Primary Button
            </button>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:opacity-90 transition-opacity ml-4">
              Secondary Button
            </button>
            <button className="bg-accent text-accent-foreground px-4 py-2 rounded hover:opacity-90 transition-opacity ml-4">
              Accent Button
            </button>
            <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:opacity-90 transition-opacity ml-4">
              Destructive Button
            </button>
            
            <div className="mt-6">
              <input 
                type="text" 
                placeholder="Test input field" 
                className="bg-background border border-input px-3 py-2 rounded focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* CSS Variables Debug */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">CSS Variables Debug</h2>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <div>--color-background: <span style={{color: 'hsl(var(--color-background))'}}>■</span></div>
                <div>--color-foreground: <span style={{color: 'hsl(var(--color-foreground))'}}>■</span></div>
                <div>--color-primary: <span style={{color: 'hsl(var(--color-primary))'}}>■</span></div>
                <div>--color-secondary: <span style={{color: 'hsl(var(--color-secondary))'}}>■</span></div>
                <div>--color-muted: <span style={{color: 'hsl(var(--color-muted))'}}>■</span></div>
                <div>--color-accent: <span style={{color: 'hsl(var(--color-accent))'}}>■</span></div>
              </div>
              <div>
                <div>--color-destructive: <span style={{color: 'hsl(var(--color-destructive))'}}>■</span></div>
                <div>--color-navy: <span style={{color: 'hsl(var(--color-navy))'}}>■</span></div>
                <div>--color-cyan: <span style={{color: 'hsl(var(--color-cyan))'}}>■</span></div>
                <div>--color-green: <span style={{color: 'hsl(var(--color-green))'}}>■</span></div>
                <div>--color-border: <span style={{color: 'hsl(var(--color-border))'}}>■</span></div>
                <div>--color-ice-blue: <span style={{color: 'hsl(var(--color-ice-blue))'}}>■</span></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ColorTestPage;