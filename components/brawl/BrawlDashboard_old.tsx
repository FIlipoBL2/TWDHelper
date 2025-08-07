// BrawlDashboard - Enhanced TWD RPG Brawl Combat Management System
import React from 'react';
import { EnhancedBrawlDashboard } from './EnhancedBrawlDashboard';

// This component replaces the old complex BrawlDashboard with our enhanced system
export const BrawlDashboard: React.FC = () => {
  return <EnhancedBrawlDashboard />;
};

export default BrawlDashboard;
  const { gameState, isEditMode, addChatMessage, updateCharacter, setCombatantAction } = useGameState();
  const { characters, npcs } = gameState;

  // Local state for UI
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill>(Skill.CloseCombat);
  const [rollResult, setRollResult] = useState<DiceRollResult | null>(null);
  const [showPhaseDetails, setShowPhaseDetails] = useState(false);
  const [showRulesReference, setShowRulesReference] = useState(false);

  // Custom hooks for state and actions
  const {
    brawlState,
    setBrawlState,
    selectedParticipants,
    participantHelpDice,
    availableCharacters,
    startBrawl,
    endBrawl,
    nextPhase,
    previousPhase,
    toggleParticipantSelection,
    setParticipantHelp,
    getParticipantHelpDice,
    markParticipantActed,
    setParticipantCoverStatus,
    toggleParticipantCover
  } = useBrawlState({ characters, npcs });

  const actions = useBrawlActions({
    participants: brawlState.participants,
    characters,
    npcs,
    addChatMessage,
    setCombatantAction,
    setRollResult,
    getParticipantHelpDice
  });

  // Memoized derived state
  const selectedParticipant = brawlState.participants.find(p => p.id === selectedParticipantId) || null;
  const currentPhase = BRAWL_PHASES.find(phase => phase.id === brawlState.currentPhase);

  // Battlemap handlers
  const handleParticipantMove = useCallback((participantId: string, newPosition: { x: number; y: number }) => {
    setBrawlState(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === participantId ? { ...p, position: newPosition } : p
      )
    }));
  }, [setBrawlState]);

  const handleObjectMove = useCallback((objectId: string, newPosition: { x: number; y: number }) => {
    setBrawlState(prev => ({
      ...prev,
      battlemap: {
        ...prev.battlemap,
        objects: prev.battlemap.objects.some(obj => obj.id === objectId)
          ? prev.battlemap.objects.map(obj => 
              obj.id === objectId ? { ...obj, position: newPosition } : obj
            )
          : [
              ...prev.battlemap.objects,
              {
                id: objectId,
                name: 'New Object',
                position: newPosition,
                size: { width: 60, height: 60 },
                type: 'obstacle',
                isPassable: false
              }
            ]
      }
    }));
  }, [setBrawlState]);

  const handleBackgroundGenerate = useCallback((prompt: any) => {
    console.log('Generating background with prompt:', prompt);
    setBrawlState(prev => ({
      ...prev,
      battlemap: {
        ...prev.battlemap,
        background: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 700'%3E%3Crect width='1000' height='700' fill='%23374151'/%3E%3Ctext x='500' y='350' font-family='Arial' font-size='24' fill='%23D1D5DB' text-anchor='middle'%3EAI Generated: ${prompt.prompt}%3C/text%3E%3C/svg%3E`
      }
    }));
  }, [setBrawlState]);

  // Dice rolling handlers
  const handleCustomSkillRoll = useCallback(() => {
    if (!selectedParticipant) return;
    
    const actionMap = {
      [Skill.Mobility]: actions.move,
      [Skill.CloseCombat]: actions.closeCombat,
      [Skill.RangedCombat]: actions.rangedCombat,
      [Skill.Medicine]: actions.firstAid,
      [Skill.Leadership]: actions.leadership
    };

    const action = actionMap[selectedSkill];
    if (action) {
      action(selectedParticipant);
    }
  }, [selectedParticipant, selectedSkill, actions]);

  const handlePushRoll = useCallback(() => {
    if (!rollResult || rollResult.pushed || !selectedParticipantId) return;

    const participant = brawlState.participants.find(p => p.id === selectedParticipantId);
    if (!participant || participant.type !== 'PC') return;

    const character = characters.find(c => c.id === participant.id);
    if (!character) return;

    try {
      const pushedResult = pushRoll(rollResult);
      setRollResult(pushedResult);

      const stressDamage = pushedResult.stressDice.filter(d => d === 1).length;
      if (stressDamage > 0) {
        updateCharacter(selectedParticipantId, { 
          health: Math.max(0, character.health - stressDamage) 
        });
      }

      addChatMessage({
        characterId: participant.id,
        characterName: participant.name,
        content: `🔥 Pushed ${selectedSkill} roll`,
        type: 'ROLL',
        rollResult: pushedResult,
        canBePushed: false
      });
    } catch (error) {
      console.error('Error pushing roll:', error);
    }
  }, [rollResult, selectedParticipantId, brawlState.participants, characters, selectedSkill, updateCharacter, addChatMessage]);

  return (
    <div className="space-y-4">
      {/* Header and Phase Controls */}
      <Card title="TWD RPG Brawl Combat">
        {!brawlState.isActive ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Setup Brawl</h3>
            <ParticipantsPanel
              participants={selectedParticipants.map(id => 
                brawlState.participants.find(p => p.id === id)!
              ).filter(Boolean)}
              participantHelpDice={participantHelpDice}
              onHelpDiceChange={setParticipantHelp}
              onMarkActed={markParticipantActed}
              onToggleCover={toggleParticipantCover}
              characters={characters}
              npcs={npcs}
            />
            <button
              onClick={startBrawl}
              disabled={selectedParticipants.length === 0}
              className={cn(twdStyles.btnPrimary, "disabled:bg-gray-400 disabled:cursor-not-allowed")}
            >
              Start Brawl
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Phase Information */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Round {brawlState.currentRound}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">Phase {brawlState.currentPhase}: {currentPhase?.name}</span>
                  <button
                    onClick={() => setShowPhaseDetails(!showPhaseDetails)}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    {showPhaseDetails ? 'Hide' : 'Show'} Details
                  </button>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={previousPhase}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={nextPhase}
                  className={cn(twdStyles.btnSecondary, twdStyles.btnSmall)}
                >
                  Next Phase
                </button>
                <button
                  onClick={endBrawl}
                  className={cn(twdStyles.btnDanger, twdStyles.btnSmall)}
                >
                  End Brawl
                </button>
              </div>
            </div>

            {/* Phase Details */}
            {showPhaseDetails && currentPhase && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <h4 className="font-semibold mb-2">{currentPhase.name}</h4>
                <p className="text-sm mb-2">{currentPhase.description}</p>
                {currentPhase.actions && currentPhase.actions.length > 0 && (
                  <div>
                    <strong className="text-sm">Available Actions:</strong>
                    <ul className="text-sm mt-1 space-y-1">
                      {currentPhase.actions.map((action, index) => (
                        <li key={index} className="ml-4">• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Rules Reference Toggle */}
            <div>
              <button
                onClick={() => setShowRulesReference(!showRulesReference)}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                {showRulesReference ? 'Hide' : 'Show'} General Brawl Rules
              </button>
              {showRulesReference && (
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <h4 className="font-semibold mb-2">General Brawl Rules</h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Leadership:</strong> {BRAWL_GENERAL_RULES.leadership.description}
                      <br />
                      <em>Limitation:</em> {BRAWL_GENERAL_RULES.leadership.limitation}
                    </div>
                    <div>
                      <strong>Mess Up:</strong> {BRAWL_GENERAL_RULES.messUp.description}
                      <br />
                      <em>Consequences:</em> {BRAWL_GENERAL_RULES.messUp.consequences.join(', ')}
                    </div>
                    <div>
                      <strong>Quick Actions:</strong> {BRAWL_GENERAL_RULES.quickActions.description}
                      <br />
                      <em>Examples:</em> {BRAWL_GENERAL_RULES.quickActions.examples.join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Combat Grid - Only show if brawl is active */}
      {brawlState.isActive && (
        <>
          {/* Action Panel */}
          <Card title="Combat Actions">
            <div className="space-y-4">
              {/* Participant Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Selected Participant:</label>
                <select
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a participant...</option>
                  {brawlState.participants.map(participant => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name} ({participant.type}) - HP: {participant.health}/{participant.maxHealth}
                      {participant.hasActed ? ' [ACTED]' : ''}
                      {participant.coverStatus === 'partial' ? ' 🛡️' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Help Dice Controls */}
              {selectedParticipant && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Help Dice for {selectedParticipant.name}:</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setParticipantHelp(selectedParticipantId, getParticipantHelpDice(selectedParticipantId) - 1)}
                      disabled={getParticipantHelpDice(selectedParticipantId) <= -3}
                      className="px-2 py-1 bg-red-500 text-white rounded text-sm disabled:bg-gray-400"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-center min-w-[40px]">
                      {getParticipantHelpDice(selectedParticipantId)}
                    </span>
                    <button
                      onClick={() => setParticipantHelp(selectedParticipantId, getParticipantHelpDice(selectedParticipantId) + 1)}
                      disabled={getParticipantHelpDice(selectedParticipantId) >= 3}
                      className="px-2 py-1 bg-green-500 text-white rounded text-sm disabled:bg-gray-400"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setParticipantHelp(selectedParticipantId, 0)}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-sm"
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* Cover Status Toggle */}
                  <div className="mt-3 p-3 border rounded">
                    <label className="text-sm font-semibold">Cover Status:</label>
                    <div className="flex items-center space-x-4 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`cover-${selectedParticipantId}`}
                          checked={!selectedParticipant.coverStatus || selectedParticipant.coverStatus === 'none'}
                          onChange={() => setBrawlState(prev => ({
                            ...prev,
                            participants: prev.participants.map(p => 
                              p.id === selectedParticipantId ? { ...p, coverStatus: 'none' } : p
                            )
                          }))}
                          className="mr-1"
                        />
                        <span className="text-sm">No Cover</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`cover-${selectedParticipantId}`}
                          checked={selectedParticipant.coverStatus === 'partial'}
                          onChange={() => setBrawlState(prev => ({
                            ...prev,
                            participants: prev.participants.map(p => 
                              p.id === selectedParticipantId ? { ...p, coverStatus: 'partial' } : p
                            )
                          }))}
                          className="mr-1"
                        />
                        <span className="text-sm">🛡️ In Cover</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedParticipant.coverStatus === 'partial' 
                        ? 'Ranged attacks against this character have -1 dice' 
                        : 'Character is exposed to full damage'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <BrawlActionGrid
                participant={selectedParticipant}
                actions={actions}
              />

              {/* Custom Skill Roll Section */}
              <div className="border-t pt-4 space-y-2">
                <label className="text-sm font-semibold">Custom Skill Roll:</label>
                <div className="flex space-x-2">
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value as Skill)}
                    className="flex-1 p-2 border rounded"
                  >
                    {Object.values(Skill).map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleCustomSkillRoll}
                    disabled={!selectedParticipant}
                    className="px-4 py-2 bg-purple-600 text-white rounded disabled:bg-gray-400"
                  >
                    Roll
                  </button>
                </div>
              </div>

              {/* Roll Results */}
              {rollResult && (
                <div className="space-y-2 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <h4 className="font-semibold">Roll Result:</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-1">
                      {rollResult.baseDice.map((die, index) => (
                        <Die key={`base-${index}`} value={die} />
                      ))}
                      {rollResult.stressDice.map((die, index) => (
                        <Die key={`stress-${index}`} value={die} isStress />
                      ))}
                    </div>
                    <div className="text-sm">
                      <div>Successes: {rollResult.successes}</div>
                      <div>Messed Up: {rollResult.messedUp ? 'Yes' : 'No'}</div>
                      {rollResult.messedUp && <div className="text-red-600">MESSED UP!</div>}
                    </div>
                    {!rollResult.pushed && selectedParticipant?.type === 'PC' && (
                      <button
                        onClick={handlePushRoll}
                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm"
                      >
                        Push Roll
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Battlemap */}
          <Card title="Battlemap">
            <GridlessBattlemap
              participants={brawlState.participants}
              objects={brawlState.battlemap.objects}
              background={brawlState.battlemap.background}
              width={brawlState.battlemap.width}
              height={brawlState.battlemap.height}
              onParticipantMove={handleParticipantMove}
              onParticipantSelect={setSelectedParticipantId}
              onParticipantDelete={(id) => setBrawlState(prev => ({
                ...prev,
                participants: prev.participants.filter(p => p.id !== id)
              }))}
              onObjectMove={handleObjectMove}
              onObjectDelete={(id) => setBrawlState(prev => ({
                ...prev,
                battlemap: {
                  ...prev.battlemap,
                  objects: prev.battlemap.objects.filter(obj => obj.id !== id)
                }
              }))}
              onBackgroundGenerate={handleBackgroundGenerate}
              isEditMode={isEditMode}
            />
          </Card>
        </>
      )}
    </div>
  );
};
