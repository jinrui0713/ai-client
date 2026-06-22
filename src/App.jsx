import { useState } from 'react'
import PdfAnswerView from './views/PdfAnswerView.jsx'
import NoteTakingView from './views/NoteTakingView.jsx'
import SettingsView from './views/SettingsView.jsx'

const TABS = [
  { key: 'pdf', label: 'PDF即答', component: PdfAnswerView },
  { key: 'notes', label: '音声+写真ノート', component: NoteTakingView },
  { key: 'settings', label: '設定', component: SettingsView }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('pdf')
  const ActiveComponent = TABS.find((tab) => tab.key === activeTab).component

  return (
    <>
      <nav className="app-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="app-content">
        <ActiveComponent />
      </main>
    </>
  )
}
