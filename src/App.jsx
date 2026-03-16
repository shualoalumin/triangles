import { useState } from 'react';
import Layout from './components/Layout';
import WorldMap from './views/WorldMap';
import GameView from './views/GameView';

function App() {
  const [currentView, setCurrentView] = useState('map');
  const [selectedWorld, setSelectedWorld] = useState(null);

  const handleSelectWorld = (worldId) => {
    setSelectedWorld(worldId);
    setCurrentView('game');
  };

  const handleBackToMap = () => {
    setCurrentView('map');
    setSelectedWorld(null);
  };

  return (
    <Layout>
      {currentView === 'map' ? (
        <WorldMap onSelectWorld={handleSelectWorld} />
      ) : (
        <GameView onBack={handleBackToMap} worldId={selectedWorld} />
      )}
    </Layout>
  );
}

export default App;
