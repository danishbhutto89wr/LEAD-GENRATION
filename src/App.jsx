import React, { useState } from 'react';
import UploadTab from './components/UploadTab.jsx';
import BatchesTab from './components/BatchesTab.jsx';
import DashboardTab from './components/DashboardTab.jsx';

const TABS = [
  { id: 'upload', label: 'Data Upload' },
  { id: 'batches', label: 'Batches & Send' },
  { id: 'dashboard', label: 'Tracking Dashboard' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">LG</span>
          <div>
            <h1>Lead Automation</h1>
            <p>Audit, write, and send — five leads at a time.</p>
          </div>
        </div>
      </header>

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'upload' && <UploadTab onDone={() => setActiveTab('batches')} />}
        {activeTab === 'batches' && <BatchesTab />}
        {activeTab === 'dashboard' && <DashboardTab />}
      </main>
    </div>
  );
}
