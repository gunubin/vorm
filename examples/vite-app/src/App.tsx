import { useState } from 'react';
import { BasicLogin } from './examples/BasicLogin';
import { FieldComparison } from './examples/FieldComparison';
import { ZodIntegration } from './examples/ZodIntegration';
import { ValidationModes } from './examples/ValidationModes';
import './App.css';

const tabs = [
  { id: 'basic', label: 'Basic Login', component: BasicLogin },
  { id: 'comparison', label: 'Field Comparison', component: FieldComparison },
  { id: 'zod', label: 'Zod Integration', component: ZodIntegration },
  { id: 'modes', label: 'Validation Modes', component: ValidationModes },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id);
  const ActiveComponent = tabs.find((t) => t.id === activeTab)!.component;

  return (
    <div className="app">
      <header>
        <h1>vorm examples</h1>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <ActiveComponent />
      </main>
    </div>
  );
}
