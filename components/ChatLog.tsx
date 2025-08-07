
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useGameState } from '../context/GameStateContext';
import { ChatMessage, ChatMessageType, DiceRollResult, Skill, TableRollResult, CombatType, CombatSetupParticipant } from '../types';
import Die from './common/Die';
import DiceRollCard from './common/DiceRollCard';
import RuleCard from './common/RuleCard';
import AutoLinkedText from './common/AutoLinkedText';
import { PlusIcon, ChevronDownIcon } from './common/Icons';
import CharacterSelector from './common/CharacterSelector';
import DuelChatCard from './DuelChatCard';
import { rollSkillCheck, rollD6, rollD66, rollD666 } from '../services/diceService';
import { searchRules, getRuleSuggestions } from '../data/rules';

const RollResultDisplay: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const { pushRoll } = useGameState();
    const { rollResult } = message;
    if (!rollResult) return null;

    return (
        <div className="mt-2 p-2 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex justify-between items-center mb-2">
             <div className="text-center">
              <div className={`text-lg font-bold ${rollResult.successes > 0 ? 'text-green-400' : 'text-red-400'}`}>{rollResult.successes > 0 ? "SUCCESS" : "FAILURE"}</div>
              <div className="text-xs text-gray-400">{rollResult.successes} Successes</div>
            </div>
            {rollResult.messedUp && (
              <div className="text-center">
                <div className="text-md font-bold text-yellow-400">Messed Up!</div>
                <div className="text-xs text-gray-400">Complication</div>
              </div>
            )}
          </div>
          <div className="space-y-1">
            {rollResult.baseDice.length > 0 && (
                <div>
                    <div className="flex flex-wrap gap-1">{rollResult.baseDice.map((d, i) => <Die key={`base-${i}`} value={d} size="sm" />)}</div>
                </div>
            )}
            {rollResult.stressDice.length > 0 && (
                 <div>
                    <div className="flex flex-wrap gap-1">{rollResult.stressDice.map((d, i) => <Die key={`stress-${i}`} value={d} isStress size="sm" />)}</div>
                </div>
            )}
          </div>
           {message.canBePushed && (
                <div className="mt-2 pt-2 border-t border-gray-600 text-center">
                    <button 
                        onClick={() => pushRoll(message.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-4 rounded-md transition-colors text-sm"
                    >
                        Push Roll
                    </button>
                </div>
            )}
        </div>
    );
};

const TableRollResultDisplay: React.FC<{ tableRollResult: TableRollResult }> = ({ tableRollResult }) => {
    return (
        <div className="mt-2 p-2 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-center">
                    <div className="w-12 h-12 bg-gray-900 rounded-md flex flex-col items-center justify-center border border-gray-500">
                        {tableRollResult.dice && tableRollResult.dice.length > 0 &&
                          <div className="flex gap-0.5">
                            {tableRollResult.dice.map((d, i) => (
                                <span key={i} className="text-xs text-gray-400">{d}</span>
                            ))}
                          </div>
                        }
                        <span className="text-xl font-bold text-white">{tableRollResult.roll}</span>
                    </div>
                     <h4 className="font-semibold text-xs text-red-400 mt-1">{tableRollResult.tableName}</h4>
                </div>
                <p className="text-gray-300 text-sm italic">{tableRollResult.resultText}</p>
            </div>
        </div>
    );
};

const CombatSetupMessage: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const { gameState, updateCombatSetup, finalizeCombatSetup } = useGameState();
    const { characters, npcs } = gameState;
    const [npcSearch, setNpcSearch] = useState('');
    const payload = message.combatSetupPayload;
    const inputRef = useRef<HTMLInputElement>(null);

    if (!payload) return null;

    // Handle search input change with focus preservation
    const handleNpcSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNpcSearch(e.target.value);
        // Ensure focus stays on input after state update
        setTimeout(() => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        }, 0);
    }, []);

    // Monitor and maintain focus on the input when typing
    useEffect(() => {
        if (inputRef.current && document.activeElement === inputRef.current) {
            const interval = setInterval(() => {
                if (inputRef.current && document.activeElement !== inputRef.current && npcSearch.length > 0) {
                    inputRef.current.focus();
                }
            }, 100);

            return () => clearInterval(interval);
        }
    }, [npcSearch]); // Re-run when search changes to maintain focus

    const allCombatants = useMemo(() => [
        ...characters.map(c => ({ id: c.id, name: c.name, type: 'PC' as const, tokenImage: c.tokenImage })),
        ...npcs.map(n => ({ id: n.id, name: n.name, type: 'NPC' as const, tokenImage: n.tokenImage }))
    ], [characters, npcs]);

    const { sideA, sideB } = payload;
    const sideACombatants = sideA.map(p => allCombatants.find(c => c.id === p.id)).filter(Boolean);
    const sideBCombatants = sideB.map(p => allCombatants.find(c => c.id === p.id)).filter(Boolean);

    // Only show NPCs that match search (limit to 5 results) + all PCs that aren't assigned
    const availableCombatants = useMemo(() => {
        const unassignedCombatants = allCombatants.filter(c =>
            !sideA.some(p => p.id === c.id) && !sideB.some(p => p.id === c.id)
        );
        
        if (npcSearch.trim() === '') {
            // Show only PCs when no search
            return unassignedCombatants.filter(c => c.type === 'PC');
        } else {
            // Show PCs + matching NPCs (limited to 5)
            const pcs = unassignedCombatants.filter(c => c.type === 'PC');
            const matchingNpcs = unassignedCombatants
                .filter(c => c.type === 'NPC' && c.name.toLowerCase().includes(npcSearch.toLowerCase()))
                .slice(0, 5); // Limit NPCs to 5 results
            return [...pcs, ...matchingNpcs];
        }
    }, [allCombatants, sideA, sideB, npcSearch]);

    const moveCombatant = (combatantId: string, combatantType: 'PC' | 'NPC', targetSide: 'A' | 'B' | 'available') => {
        let newSideA = sideA.filter(p => p.id !== combatantId);
        let newSideB = sideB.filter(p => p.id !== combatantId);

        if (targetSide === 'A') {
            newSideA.push({ id: combatantId, type: combatantType });
        } else if (targetSide === 'B') {
            newSideB.push({ id: combatantId, type: combatantType });
        }
        // For 'available', we just remove from teams

        updateCombatSetup(message.id, { sideA: newSideA, sideB: newSideB });
    };

    const handleStartCombat = (type: CombatType) => {
        finalizeCombatSetup(message.id, type);
    };

    const isDuelReady = sideA.length === 1 && sideB.length === 1;

    const CombatantCard: React.FC<{ combatant: any, currentSide: 'available' | 'A' | 'B' }> = ({ combatant, currentSide }) => {
        const tokenSrc = combatant.tokenImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234A5568'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' fill='%23E2E8F0' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E";
        
        // Compact layout for team sections, full layout for available
        const isTeamSection = currentSide === 'A' || currentSide === 'B';
        
        return (
            <div className={`flex items-center rounded text-xs sm:text-sm lg:text-base transition-colors min-w-0 ${
                isTeamSection 
                    ? 'gap-1 sm:gap-1.5 p-1 sm:p-1 lg:p-1.5' 
                    : 'gap-1.5 sm:gap-2 lg:gap-3 p-1 sm:p-1.5 lg:p-2'
            } ${combatant.type === 'PC' ? 'bg-gray-600/50' : 'bg-gray-700/50'}`}>
                <img 
                    src={tokenSrc} 
                    alt={combatant.name} 
                    className={`rounded-full object-cover border border-gray-600 flex-shrink-0 ${
                        isTeamSection 
                            ? 'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6' 
                            : 'w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8'
                    }`}
                />
                <div className="flex-grow min-w-0 flex flex-col">
                    <span 
                        className={`font-medium truncate ${combatant.type === 'PC' ? 'text-white' : 'text-gray-300'}`}
                        title={combatant.name} // Tooltip shows full name on hover
                    >
                        {combatant.name}
                    </span>
                    {/* Show abbreviated name if it's too long */}
                    {combatant.name.length > 12 && isTeamSection && (
                        <span className="text-xs text-gray-400 truncate">
                            {combatant.name.substring(0, 10)}...
                        </span>
                    )}
                </div>
                <div className={`flex flex-shrink-0 ${
                    isTeamSection 
                        ? 'gap-0.5 sm:gap-0.5' 
                        : 'gap-0.5 sm:gap-1 lg:gap-1.5'
                }`}>
                    {currentSide !== 'A' && (
                        <button
                            onClick={() => moveCombatant(combatant.id, combatant.type, 'A')}
                            className={`bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors whitespace-nowrap ${
                                isTeamSection 
                                    ? 'text-xs px-1 py-0.5 sm:px-1.5 sm:py-0.5' 
                                    : 'text-xs lg:text-sm px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5'
                            }`}
                            title="Move to Team A"
                        >
                            A
                        </button>
                    )}
                    {currentSide !== 'B' && (
                        <button
                            onClick={() => moveCombatant(combatant.id, combatant.type, 'B')}
                            className={`bg-red-600 hover:bg-red-500 text-white rounded transition-colors whitespace-nowrap ${
                                isTeamSection 
                                    ? 'text-xs px-1 py-0.5 sm:px-1.5 sm:py-0.5' 
                                    : 'text-xs lg:text-sm px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5'
                            }`}
                            title="Move to Team B"
                        >
                            B
                        </button>
                    )}
                    {currentSide !== 'available' && (
                        <button
                            onClick={() => moveCombatant(combatant.id, combatant.type, 'available')}
                            className={`bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors whitespace-nowrap ${
                                isTeamSection 
                                    ? 'text-xs px-1 py-0.5 sm:px-1.5 sm:py-0.5' 
                                    : 'text-xs lg:text-sm px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5'
                            }`}
                            title="Remove from team"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>
        );
    };    const TeamSection: React.FC<{ 
        title: string, 
        combatants: any[], 
        titleColor: string,
        side: 'available' | 'A' | 'B',
        children?: React.ReactNode 
    }> = ({ title, combatants, titleColor, side, children }) => (
        <div className={`bg-gray-800/50 rounded-lg p-2 sm:p-3 lg:p-4 flex flex-col min-w-0 overflow-hidden ${
            side === 'available' 
                ? 'min-h-[120px] sm:min-h-[150px] lg:min-h-[200px]' 
                : 'min-h-[180px] sm:min-h-[220px] lg:min-h-[280px] flex-1'
        }`}>
            <h5 className={`font-bold text-center mb-2 lg:mb-3 text-sm sm:text-base lg:text-lg ${titleColor}`}>{title}</h5>
            {children}
            <div className={`space-y-1 lg:space-y-2 flex-grow overflow-y-auto overflow-x-hidden ${
                side === 'available' 
                    ? 'max-h-32 sm:max-h-48 lg:max-h-64' 
                    : 'max-h-40 sm:max-h-52 lg:max-h-72'
            }`}>
                {combatants.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs sm:text-sm lg:text-base py-2 sm:py-4 lg:py-6 italic">
                        {side === 'available' && npcSearch.trim() === '' ? 'Search for NPCs above' : 'No combatants'}
                    </div>
                ) : (
                    combatants.map(c => (
                        <CombatantCard key={c.id} combatant={c} currentSide={side} />
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="my-2 p-2 sm:p-4 lg:p-6 bg-gray-700/50 rounded-lg border border-red-700/50 overflow-hidden">
            <h4 className="font-bold text-red-400 text-center text-base sm:text-lg lg:text-xl mb-2 sm:mb-3 lg:mb-4">COMBAT SETUP</h4>
            
            {/* Team A and Team B side by side */}
            <div className="flex gap-2 lg:gap-4 xl:gap-6 w-full min-w-0 mb-3 lg:mb-4">
                <TeamSection side="A" title="Team A" combatants={sideACombatants} titleColor="text-blue-400" />
                <TeamSection side="B" title="Team B" combatants={sideBCombatants} titleColor="text-red-400" />
            </div>
            
            {/* Available section below */}
            <div className="w-full min-w-0">
                <TeamSection side="available" title="Available" combatants={availableCombatants} titleColor="text-gray-300">
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search NPCs..." 
                        value={npcSearch} 
                        onChange={handleNpcSearchChange}
                        onBlur={(e) => {
                            // Prevent blur if clicking within the same component
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            if (relatedTarget && e.currentTarget.closest('.bg-gray-700\\/50')?.contains(relatedTarget)) {
                                e.preventDefault();
                                inputRef.current?.focus();
                            }
                        }}
                        className="w-full bg-gray-900 p-1.5 sm:p-2 lg:p-3 rounded-md text-xs sm:text-sm lg:text-base mb-2 focus:ring-red-500 focus:border-red-500"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                    />
                </TeamSection>
            </div>

            <div className="mt-3 sm:mt-4 lg:mt-6 pt-2 sm:pt-3 lg:pt-4 border-t border-gray-600 flex flex-col sm:flex-row justify-center gap-2 lg:gap-4">
                 <button onClick={() => handleStartCombat('Duel')} disabled={!isDuelReady} className={`bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-2 px-4 sm:px-6 lg:px-8 rounded-md transition-all text-sm sm:text-base lg:text-lg ${!isDuelReady ? 'opacity-50 cursor-not-allowed' : ''}`}>Start Duel (1v1)</button>
                 <button onClick={() => handleStartCombat('Brawl')} disabled={sideA.length === 0 && sideB.length === 0} className={`bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 sm:px-6 lg:px-8 rounded-md transition-all text-sm sm:text-base lg:text-lg ${(sideA.length === 0 && sideB.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}>Start Brawl</button>
            </div>
        </div>
    );
};

const ChatLog: React.FC = () => {
    const { gameState, addChatMessage, rollOnTable, pushRoll, nextTurn } = useGameState();
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<ChatMessageType>('IC');
    const [showRuleSuggestions, setShowRuleSuggestions] = useState(false);
    const [ruleSuggestions, setRuleSuggestions] = useState<string[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const { characters, npcs } = gameState;
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>('GM');
    const [messageTypeDropdownOpen, setMessageTypeDropdownOpen] = useState(false);
    const [messageTypeOpenUpward, setMessageTypeOpenUpward] = useState(false);
    const messageTypeRef = useRef<HTMLDivElement>(null);
    const messageTypeButtonRef = useRef<HTMLButtonElement>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom()
    }, [gameState.chatLog]);

    // Handle rule autocomplete
    useEffect(() => {
        if (message.startsWith('/rule ')) {
            const query = message.substring(6).trim();
            if (query.length > 0) {
                const suggestions = getRuleSuggestions(query, 5);
                setRuleSuggestions(suggestions);
                setShowRuleSuggestions(suggestions.length > 0);
                setSelectedSuggestionIndex(-1);
            } else {
                setShowRuleSuggestions(false);
                setRuleSuggestions([]);
            }
        } else {
            setShowRuleSuggestions(false);
            setRuleSuggestions([]);
        }
    }, [message]);
    
    useEffect(() => {
        if (selectedCharacterId === 'GM' || characters.find(c => c.id === selectedCharacterId)) {
            // All good
        } else {
            setSelectedCharacterId('GM');
        }
    }, [characters, selectedCharacterId]);

    // Handle message type dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (messageTypeRef.current && !messageTypeRef.current.contains(event.target as Node)) {
                setMessageTypeDropdownOpen(false);
            }
        };

        if (messageTypeDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            
            // Determine if dropdown should open upward
            if (messageTypeButtonRef.current) {
                const buttonRect = messageTypeButtonRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                const dropdownHeight = 100; // Approximate height of dropdown
                
                setMessageTypeOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [messageTypeDropdownOpen]);

    const handleDiceRoll = (diceString: string) => {
        try {
            let charName = 'GM';
            if (selectedCharacterId !== 'GM') {
                const char = characters.find(c => c.id === selectedCharacterId) || npcs.find(n => n.id === selectedCharacterId);
                if (char) {
                    charName = char.name;
                }
            }

            // Parse different dice formats
            if (diceString.includes('b') && diceString.includes('s')) {
                // Skill check format: "4b 2s" (4 base dice, 2 stress dice)
                const match = diceString.match(/(\d+)b\s*(\d+)s/i);
                if (match) {
                    const baseDice = parseInt(match[1]);
                    const stressDice = parseInt(match[2]);
                    const rollResult = rollSkillCheck(baseDice, stressDice, Skill.ManualRoll);
                    
                    addChatMessage({
                        characterId: selectedCharacterId,
                        characterName: charName,
                        content: `Rolling ${baseDice}b ${stressDice}s`,
                        type: 'ROLL',
                        rollResult
                    });
                    return;
                }
            }
            
            if (diceString.match(/\d+d666/i)) {
                // d666 format
                const match = diceString.match(/(\d+)d666/i);
                if (match) {
                    const count = parseInt(match[1]);
                    for (let i = 0; i < count; i++) {
                        const tableResult = rollD666('Custom Roll');
                        addChatMessage({
                            characterId: selectedCharacterId,
                            characterName: charName,
                            content: `Rolling 1d666`,
                            type: 'ROLL',
                            tableRollResult: tableResult
                        });
                    }
                    return;
                }
            }
            
            if (diceString.match(/\d+d66/i)) {
                // d66 format
                const match = diceString.match(/(\d+)d66/i);
                if (match) {
                    const count = parseInt(match[1]);
                    for (let i = 0; i < count; i++) {
                        const tableResult = rollD66('Custom Roll');
                        addChatMessage({
                            characterId: selectedCharacterId,
                            characterName: charName,
                            content: `Rolling 1d66`,
                            type: 'ROLL',
                            tableRollResult: tableResult
                        });
                    }
                    return;
                }
            }
            
            if (diceString.match(/\d+d\d+/i)) {
                // Generic dice format (XdY)
                const match = diceString.match(/(\d+)d(\d+)/i);
                if (match) {
                    const count = parseInt(match[1]);
                    const sides = parseInt(match[2]);
                    const dice = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
                    const total = dice.reduce((sum, die) => sum + die, 0);
                    
                    addChatMessage({
                        characterId: selectedCharacterId,
                        characterName: charName,
                        content: `Rolling ${count}d${sides}`,
                        type: 'ROLL',
                        diceResult: { dice, total, type: `d${sides}` }
                    });
                    return;
                }
            }
            
            // If no format matched, show error
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: `Invalid dice format: "${diceString}". Use formats like "1d6", "4b 2s", "1d66", or "1d666"`,
                type: 'SYSTEM',
            });
            
        } catch (error) {
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: `Error rolling dice: ${error}`,
                type: 'SYSTEM',
            });
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showRuleSuggestions && ruleSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => 
                    prev < ruleSuggestions.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                if (selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    const suggestion = ruleSuggestions[selectedSuggestionIndex];
                    setMessage(`/rule ${suggestion}`);
                    setShowRuleSuggestions(false);
                    if (e.key === 'Enter') {
                        // Submit the command immediately on Enter
                        setTimeout(() => {
                            const form = e.currentTarget.closest('form');
                            if (form) {
                                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                                form.dispatchEvent(submitEvent);
                            }
                        }, 0);
                    }
                }
            } else if (e.key === 'Escape') {
                setShowRuleSuggestions(false);
                setSelectedSuggestionIndex(-1);
            }
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setMessage(`/rule ${suggestion}`);
        setShowRuleSuggestions(false);
        inputRef.current?.focus();
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        // Check for chat commands
        if (message.startsWith('/')) {
            if (message === '/help') {
                addChatMessage({
                    characterId: 'SYSTEM',
                    characterName: 'System',
                    content: 'Available commands:\n/help - Show this help\n/table [tablename] - Roll on a table\n/r [dice] - Roll dice (e.g., /r 1d6, /r 4b 2s, /r 1d666)\n/rule [keyword] - Look up game rules and mechanics\n\nDice formats:\n• Basic: /r 1d6, /r 3d6, /r 2d10, /r 1d20\n• Skill checks: /r 4b 2s (4 base dice, 2 stress dice)\n• Special: /r 1d66, /r 1d666\n• Generic: /r XdY (any dice format)\n\nRule examples:\n• /rule stress - Learn about stress mechanics\n• /rule duel - Combat rules\n• /rule help dice - Bonus dice mechanics',
                    type: 'SYSTEM',
                });
                setMessage('');
                return;
            }
            
            if (message.startsWith('/rule ')) {
                const query = message.substring(6).trim();
                console.log('🎯 Rule command triggered with query:', query);
                
                if (!query) {
                    addChatMessage({
                        characterId: 'SYSTEM',
                        characterName: 'System',
                        content: 'Please specify a rule to look up. Examples:\n• /rule stress\n• /rule duel\n• /rule help dice\n• /rule walker\n\nTip: Rule keywords are also automatically linked in chat messages!',
                        type: 'SYSTEM',
                    });
                    setMessage('');
                    return;
                }
                
                const results = searchRules(query, 5);
                console.log('📋 Search results returned:', results.length, 'rules');
                
                if (results.length === 0) {
                    console.log('❌ No results found, getting suggestions...');
                    const suggestions = getRuleSuggestions(query, 3);
                    const suggestionText = suggestions.length > 0 
                        ? `\n\nDid you mean: ${suggestions.join(', ')}?`
                        : '';
                    
                    addChatMessage({
                        characterId: 'SYSTEM',
                        characterName: 'System',
                        content: `No rules found for "${query}".${suggestionText}`,
                        type: 'SYSTEM',
                    });
                } else {
                    console.log('✅ Found results, adding to chat...');
                    // Add the search query message
                    addChatMessage({
                        characterId: 'SYSTEM',
                        characterName: 'System',
                        content: `📚 Rule lookup: "${query}" (${results.length} result${results.length > 1 ? 's' : ''})`,
                        type: 'SYSTEM',
                    });
                    
                    // Add rule cards for each result
                    results.forEach((rule, index) => {
                        console.log(`📖 Adding rule card ${index + 1}:`, rule.name);
                        addChatMessage({
                            characterId: 'SYSTEM',
                            characterName: 'Rules',
                            content: `📖 ${rule.name}`,
                            type: 'SYSTEM',
                            ruleCard: rule
                        });
                    });
                }
                setMessage('');
                return;
            }
            
            if (message.startsWith('/table ')) {
                const tableName = message.substring(7);
                rollOnTable(tableName);
                setMessage('');
                return;
            }
            
            if (message.startsWith('/r ')) {
                const diceString = message.substring(3).trim();
                handleDiceRoll(diceString);
                setMessage('');
                return;
            }
            
            // Unknown command
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: 'Unknown command. Type /help for available commands.',
                type: 'SYSTEM',
            });
            setMessage('');
            return;
        }

        let charName = 'GM';
        if (selectedCharacterId !== 'GM') {
            const char = characters.find(c => c.id === selectedCharacterId) || npcs.find(n => n.id === selectedCharacterId);
            if (char) {
                charName = char.name;
            }
        }

        addChatMessage({
            characterId: selectedCharacterId,
            characterName: charName,
            content: message,
            type: messageType,
        });

        setMessage('');
    };
    
    const renderMessage = useCallback((msg: ChatMessage) => {
        const nameStyle = msg.characterId === 'GM' ? "text-blue-400" : "text-red-400";
        const tokenSrc = msg.characterTokenImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234A5568'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' fill='%23E2E8F0' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E";

        // Determine duel context
        const isDuelActive = gameState.combat.isActive && gameState.combat.type === 'Duel';
        const currentCombatant = isDuelActive && gameState.combat.combatants[gameState.combat.currentTurnIndex];
        const isCurrentTurn = isDuelActive && currentCombatant?.id === msg.characterId;
        const canPush = msg.type === 'ROLL' && msg.rollResult && !msg.rollResult.pushed && msg.characterId !== 'GM';

        // Action handlers for duel context
        const handlePushRoll = () => pushRoll(msg.id);
        const handleEndTurn = () => nextTurn();

        if (msg.type === 'SCENARIO_INTRO') {
            return (
                <div key={msg.id} className="my-4">
                    <div className="bg-gray-800/80 border-t-2 border-b-2 border-red-700/50 py-4 px-6 shadow-xl">
                        <p className="text-gray-300 whitespace-pre-wrap italic text-center text-md">
                            {msg.content}
                        </p>
                    </div>
                </div>
            );
        }
        
        if (msg.type === 'COMBAT_SETUP') {
            return <CombatSetupMessage key={msg.id} message={msg} />
        }

        if (msg.type === 'SYSTEM') {
            const content = msg.content.toLowerCase();
            let style = 'bg-gray-700/30 text-yellow-400/80';
            if (content.includes('failure') || content.includes('fallen') || content.includes('broken')) {
                style = 'bg-red-900/40 text-red-300';
            } else if (content.includes('phase') || content.includes('round')) {
                style = 'bg-blue-900/40 text-blue-300';
            } else if (content.includes('success')) {
                 style = 'bg-green-900/40 text-green-300';
            }
            return (
                <div key={msg.id}>
                    <div className={`my-1 text-center text-xs italic font-semibold p-1 rounded-md ${style}`}>
                        {msg.content}
                    </div>
                    {msg.ruleCard && (
                        <RuleCard rule={msg.ruleCard} />
                    )}
                    {!msg.ruleCard && msg.characterName === 'Rules' && (
                        <div className="bg-red-600 text-white p-3 m-2 rounded-lg">
                            ❌ NO RULE CARD FOUND but this looks like a rule message!
                        </div>
                    )}
                </div>
            )
        }
        
        let content = msg.content;
        if (msg.type === 'IC') content = `"${content}"`;
        if (msg.type === 'OOC') content = `((${content}))`;
        
        return (
            <div key={msg.id} className="py-2 px-1 text-sm break-words flex gap-2 items-start">
                <img src={tokenSrc} alt={msg.characterName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1 border-2 border-gray-600" />
                <div className="flex-grow">
                    <span className={`font-bold ${nameStyle}`}>{msg.characterName}</span>
                    <div className="text-gray-300 whitespace-pre-wrap">
                        <AutoLinkedText text={content} />
                    </div>
                    {msg.ruleCard && (
                        <RuleCard rule={msg.ruleCard} />
                    )}
                    {!msg.ruleCard && msg.characterName === 'Rules' && (
                        <div className="bg-red-500 text-white p-4 rounded">
                            ❌ NO RULE CARD FOUND but this looks like a rule message!
                        </div>
                    )}
                    {msg.type === 'ROLL' && msg.rollResult && (
                        <DiceRollCard 
                            result={msg.rollResult} 
                            command={msg.content} 
                            timestamp={new Date(msg.timestamp).toLocaleTimeString()}
                            onPushRoll={canPush ? handlePushRoll : undefined}
                            onEndTurn={isCurrentTurn ? handleEndTurn : undefined}
                            canPush={canPush}
                            isDuelActive={isDuelActive}
                            isCurrentTurn={isCurrentTurn}
                        />
                    )}
                    {msg.diceResult && (
                        <DiceRollCard 
                            result={msg.diceResult} 
                            command={msg.content} 
                            timestamp={new Date(msg.timestamp).toLocaleTimeString()}
                            onPushRoll={canPush ? handlePushRoll : undefined}
                            onEndTurn={isCurrentTurn ? handleEndTurn : undefined}
                            canPush={canPush}
                            isDuelActive={isDuelActive}
                            isCurrentTurn={isCurrentTurn}
                        />
                    )}
                    {msg.tableRollResult && (
                        <DiceRollCard 
                            result={msg.tableRollResult} 
                            command={msg.content} 
                            timestamp={new Date(msg.timestamp).toLocaleTimeString()}
                            onPushRoll={undefined}
                            onEndTurn={isCurrentTurn ? handleEndTurn : undefined}
                            canPush={false}
                            isDuelActive={isDuelActive}
                            isCurrentTurn={isCurrentTurn}
                        />
                    )}
                </div>
            </div>
        );
    }, [gameState.combat, pushRoll, nextTurn]);

    return (
        <div className="flex flex-col h-full bg-transparent">
            <h3 className="text-xl font-bold text-red-500 mb-4 border-b border-gray-700 pb-2 hidden lg:block">Session Log</h3>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {gameState.chatLog.map(renderMessage)}
                
                {/* Show DuelChatCard if a duel is active */}
                {gameState.combat.isActive && gameState.combat.type === 'Duel' && (
                    <DuelChatCard
                        combatants={gameState.combat.combatants}
                        round={gameState.combat.round}
                        currentTurn={gameState.combat.currentTurnIndex}
                        currentRange={gameState.combat.duelRange}
                    />
                )}
                
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                    <CharacterSelector
                        characters={characters}
                        npcs={npcs}
                        selectedCharacterId={selectedCharacterId}
                        onSelect={setSelectedCharacterId}
                        className="min-w-0 flex-shrink-0 w-40"
                    />
                    <div className="relative min-w-0 flex-shrink-0" ref={messageTypeRef}>
                        <button
                            ref={messageTypeButtonRef}
                            type="button"
                            onClick={() => setMessageTypeDropdownOpen(!messageTypeDropdownOpen)}
                            className="bg-gray-700 text-sm rounded p-1 focus:ring-red-500 focus:border-red-500 px-3 py-2 text-white flex items-center gap-1 min-w-[120px] justify-between"
                        >
                            <span>{messageType === 'IC' ? 'In-Character' : 'Out-of-Character'}</span>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={1.5} 
                                stroke="currentColor" 
                                className={`w-4 h-4 transition-transform ${messageTypeDropdownOpen ? 'rotate-180' : ''}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                        
                        {messageTypeDropdownOpen && (
                            <div className={`absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg overflow-hidden ${
                                messageTypeOpenUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                            }`}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMessageType('IC');
                                        setMessageTypeDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-white ${
                                        messageType === 'IC' ? 'bg-gray-700' : ''
                                    }`}
                                >
                                    In-Character
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMessageType('OOC');
                                        setMessageTypeDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-white ${
                                        messageType === 'OOC' ? 'bg-gray-700' : ''
                                    }`}
                                >
                                    Out-of-Character
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 relative">
                    <div className="flex-grow relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            placeholder="Type message or /help..."
                            className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500"
                        />
                        
                        {/* Rule suggestions dropdown */}
                        {showRuleSuggestions && ruleSuggestions.length > 0 && (
                            <div className="absolute bottom-full mb-1 left-0 right-0 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                <div className="p-2 text-xs text-gray-400 border-b border-gray-700">
                                    Rule suggestions (Use ↑↓ to navigate, Tab/Enter to select):
                                </div>
                                {ruleSuggestions.map((suggestion, index) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-white text-sm ${
                                            index === selectedSuggestionIndex ? 'bg-gray-700' : ''
                                        }`}
                                    >
                                        <span className="text-blue-400">/rule</span> {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button type="submit" className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatLog;