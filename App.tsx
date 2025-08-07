


import React, { useState, useEffect, Suspense, lazy } from 'react';
import { XMarkIcon, ChatBubbleLeftRightIcon, PencilIcon, HomeIcon } from './components/common/Icons';
import { getAttackIcon, getDiceIcon, getCompassIcon, getCharacterIcon, getDataIcon, getHomeIcon } from './components/common/GameIcons';
import { useGameState } from './context/GameStateContext';
import { GameMode } from './types';
import InlineConfirmation from './components/common/InlineConfirmation';

// Lazy load heavy components
const PlayerView = lazy(() => import('./components/PlayerView'));
const GMControlPanel = lazy(() => import('./components/GMControlPanel'));
const HavenDashboard = lazy(() => import('./components/HavenDashboard'));
const NPCDashboard = lazy(() => import('./components/NPCDashboard'));
const ChatLog = lazy(() => import('./components/ChatLog'));
const CombatDashboard = lazy(() => import('./components/CombatDashboard'));
const GameSetup = lazy(() => import('./components/GameSetup'));
const SoloDashboard = lazy(() => import('./components/SoloDashboard'));
const DataManagementDashboard = lazy(() => import('./components/DataManagementDashboard'));

type View = 'PLAYER' | 'GM' | 'HAVEN' | 'NPC' | 'COMBAT' | 'SOLO' | 'DATA';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
    <span className="ml-2 text-gray-400">Loading...</span>
  </div>
);

function App() {
  const [activeView, setActiveView] = useState<View>('PLAYER');
  const [isChatVisible, setIsChatVisible] = useState(true);
  const { gameState, isEditMode, toggleEditMode, resetGame } = useGameState();
  const { gameMode } = gameState;

  // No automatic tab switching - let users choose their tabs freely

  const renderView = () => {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {(() => {
          switch (activeView) {
            case 'PLAYER':
              return <PlayerView />;
            case 'GM':
              return <GMControlPanel />;
            case 'SOLO':
              return <SoloDashboard />;
            case 'HAVEN':
              return <HavenDashboard />;
            case 'NPC':
              return <NPCDashboard />;
            case 'COMBAT':
              return <CombatDashboard />;
            case 'DATA':
              return <DataManagementDashboard />;
            default:
              return <PlayerView />;
          }
        })()}
      </Suspense>
    );
  };

  const NavButton = ({ view, icon, label }: { view: View; icon: React.ReactNode; label: string }) => {
    const isActive = activeView === view;
    const isCombatActive = gameState.combat.isActive && view === 'COMBAT';
    
    return (
      <button
        onClick={() => setActiveView(view)}
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
          isActive
            ? 'bg-red-800 text-white'
            : isCombatActive
            ? 'bg-yellow-700 text-white animate-pulse'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        title={label}
      >
        <span className="text-lg">{icon}</span>
        <span className="hidden sm:inline">{label}</span>
        {isCombatActive && !isActive && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>
    );
  };

  if (gameMode === 'Unset') {
    return <GameSetup />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 font-sans flex h-screen">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-6 flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  src="/TWD Helper Logo.png" 
                  alt="TWD Helper Logo" 
                  className="h-12 md:h-16 w-auto mr-4"
                />
                <div>
                  <p className="text-gray-400 mt-1">{gameMode}: {gameState.scenarioName || 'A desperate struggle for survival.'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <InlineConfirmation question="Return to menu?" onConfirm={resetGame}>
                     {start => (
                         <button
                            onClick={start}
                            className={`p-2 rounded-full text-white transition-colors bg-gray-700 hover:bg-gray-600`}
                            aria-label={'Return to Main Menu'}
                         >
                            <HomeIcon />
                         </button>
                     )}
                 </InlineConfirmation>
                 <button
                    onClick={toggleEditMode}
                    className={`p-2 rounded-full text-white transition-colors ${isEditMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    aria-label={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                 >
                    <PencilIcon />
                 </button>
                <button 
                  onClick={() => setIsChatVisible(true)}
                  className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white lg:hidden"
                  aria-label="Show chat"
                >
                    <ChatBubbleLeftRightIcon />
                </button>
              </div>
            </header>

            <nav className="flex space-x-2 mb-6 border-b border-gray-700 pb-4">
              <NavButton view="PLAYER" icon={getCharacterIcon("", 18)} label="Player View" />
              <NavButton view="COMBAT" icon={getAttackIcon("", 18)} label="Combat" />
              {gameMode === 'Campaign' && <NavButton view="GM" icon={getDiceIcon("", 18)} label="Gamemaster Panel" />}
              {gameMode === 'Solo' && <NavButton view="SOLO" icon={getCompassIcon("", 18)} label="Solo Dashboard" />}
              {(gameMode === 'Campaign' || gameMode === 'Solo') && <NavButton view="HAVEN" icon={getHomeIcon("", 18)} label="Haven Status" />}
              {(gameMode === 'Campaign' || gameMode === 'Solo') && <NavButton view="NPC" icon={getCharacterIcon("", 18)} label="NPCs & Animals" />}
              {(gameMode === 'Campaign' || gameMode === 'Solo') && <NavButton view="DATA" icon={getDataIcon("", 18)} label="Data Mgmt" />}
            </nav>

            <main>{renderView()}</main>
          </div>
        </div>
      </div>
      
      {/* Chat Sidebar */}
      <aside className={`
        w-full sm:w-96 bg-gray-800/80 backdrop-blur-sm border-l border-gray-700 
        transform transition-transform duration-300 ease-in-out
        fixed top-0 right-0 h-full z-50
        lg:static lg:transform-none lg:w-[500px]
        flex flex-col
        ${isChatVisible ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700 lg:hidden">
          <h2 className="text-lg font-bold text-white">Session Log</h2>
          <button 
            onClick={() => setIsChatVisible(false)}
            className="p-1 rounded-full hover:bg-gray-600"
            aria-label="Close chat"
          >
            <XMarkIcon />
          </button>
        </div>
        <div className="flex-grow p-4 overflow-hidden">
          <Suspense fallback={<LoadingSpinner />}>
            <ChatLog />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}

export default App;