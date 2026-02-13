import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ExpeditionView from './components/ExpeditionView';
import VideoPlayer from './components/VideoPlayer';
import Settings from './components/Settings';
import MemoryCheckpoints from './components/MemoryCheckpoints';
import KnowledgeGraph from './components/KnowledgeGraph';
import ApiKeyModal from './components/ApiKeyModal';
import './index.css';

function App() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkApiKey();
  }, []);

  async function checkApiKey() {
    try {
      if (window.atlased) {
        const apiKey = await window.atlased.settings.get('gemini_api_key');
        // Show modal only if no API key exists or it's an empty string
        if (!apiKey || apiKey.trim() === '') {
          setShowApiKeyModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleApiKeySaved() {
    setShowApiKeyModal(false);
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="flex items-center justify-center" style={{ height: '100vh' }}>
          <div className="text-gold">Loading Atlased...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expedition/:id" element={<ExpeditionView />} />
        <Route path="/watch/:expeditionId/:waypointId" element={<VideoPlayer />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/memory-checkpoints" element={<MemoryCheckpoints />} />
        <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
      </Routes>

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onSaved={handleApiKeySaved}
          isRequired={true}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
