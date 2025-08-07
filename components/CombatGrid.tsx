

import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import { CELL_SIZE, GRID_HEIGHT, GRID_WIDTH, RANGE_THRESHOLDS, BRAWL_PHASES } from '../constants';
import { RangeCategory, Combatant, GridObject } from '../types';

interface CombatGridProps {
    activeCombatantId: string | null;
    onSelectCombatant: (id: string | null) => void;
    placingObject: GridObject['type'] | null;
    onObjectPlaced: () => void;
    onSetPlacingObject: (type: GridObject['type'] | null) => void;
}

interface EmojiMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onSelectEmoji: (emoji: string) => void;
}

const EmojiMenu: React.FC<EmojiMenuProps> = ({ x, y, onClose, onSelectEmoji }) => {
    const emojis = ['🚗', '🛢️', '📦', '🏢', '🌳', '🚧', '🔥', '💀', '⚡', '🗿', '🚪', '🪟'];
    
    return (
        <div 
            className="fixed bg-gray-800 border border-gray-600 rounded-lg p-2 z-50 shadow-xl"
            style={{ 
                left: `${x}px`, 
                top: `${y}px`,
                transform: 'translate(-50%, -100%)'
            }}
        >
            <div className="grid grid-cols-4 gap-1">
                {emojis.map((emoji, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            onSelectEmoji(emoji);
                            onClose();
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-lg"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <button
                onClick={onClose}
                className="w-full mt-2 text-xs text-gray-400 hover:text-white"
            >
                Cancel
            </button>
        </div>
    );
};

const GridObjectToken: React.FC<{ object: GridObject, onRightClick?: () => void }> = ({ object, onRightClick }) => {
    let emoji = '?';
    if (object.type === 'car') emoji = '🚗';
    if (object.type === 'barrel') emoji = '🛢️';
    if (object.type === 'crate') emoji = '📦';
    if (object.emoji) emoji = object.emoji;
    
    return (
        <div 
            className="w-full h-full flex items-center justify-center text-3xl opacity-80 cursor-pointer hover:opacity-100 transition-opacity" 
            style={{ 
                transform: object.type === 'car' ? 'scaleX(-1)' : 'none',
                fontSize: object.size ? `${object.size * 24}px` : '24px'
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                if (onRightClick) onRightClick();
            }}
        >
            {emoji}
        </div>
    );
};

const CombatGrid: React.FC<CombatGridProps> = ({ activeCombatantId, onSelectCombatant, placingObject, onObjectPlaced, onSetPlacingObject }) => {
    const { gameState, isEditMode, moveCombatant, toggleCover, updateCombatant, addGridObject, moveGridObject, removeGridObject } = useGameState();
    const { combat } = gameState;
    const [draggingItem, setDraggingItem] = useState<{ id: string, type: 'combatant' | 'object' } | null>(null);
    const [emojiMenu, setEmojiMenu] = useState<{ x: number, y: number, gridX: number, gridY: number } | null>(null);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [resizingObject, setResizingObject] = useState<{ id: string, startSize: number } | null>(null);

    const activeCombatant = combat.combatants.find(c => c.id === activeCombatantId);
    const isMovementPhase = combat.type === 'Brawl' && BRAWL_PHASES[combat.currentPhaseIndex] === 'Movement';
    const isBrawlOrEdit = isEditMode || (combat.type === 'Brawl');

    // Close emoji menu when clicking elsewhere and cleanup timer on unmount
    useEffect(() => {
        const handleClickOutside = () => setEmojiMenu(null);
        if (emojiMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
        
        // Cleanup long press timer on unmount
        return () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                setLongPressTimer(null);
            }
        };
    }, [emojiMenu, longPressTimer]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isBrawlOrEdit || !draggingItem) return;

        const gridRect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - gridRect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - gridRect.top) / CELL_SIZE);
        
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            const isOccupied = combat.combatants.some(c => c.position.x === x && c.position.y === y) || combat.gridObjects.some(o => o.position.x === x && o.position.y === y);
            if (!isOccupied) {
                if(draggingItem.type === 'combatant') {
                    moveCombatant(draggingItem.id, { x, y });
                } else {
                    moveGridObject(draggingItem.id, {x, y});
                }
            }
        }
        setDraggingItem(null);
    };
    
    const handleCellClick = (x: number, y: number) => {
        if (placingObject) {
            addGridObject(placingObject, { x, y });
            onObjectPlaced();
            return;
        }
        
        // In movement phase or in edit mode, allow movement
        if ((isMovementPhase || isEditMode) && activeCombatant) {
            const isOccupied = combat.combatants.some(c => c.position.x === x && c.position.y === y) || combat.gridObjects.some(o => o.position.x === x && o.position.y === y);
            if (!isOccupied) {
                moveCombatant(activeCombatant.id, { x, y });
                
                // Only mark as acted if it's a brawl in movement phase
                if (isMovementPhase && !isEditMode) {
                    updateCombatant(activeCombatant.id, { hasActed: true, plannedAction: null });
                }
                onSelectCombatant(null);
            }
        }
    };
    
    const handleRightClick = (e: React.MouseEvent<HTMLDivElement>, x: number, y: number) => {
        // Allow right-click actions in both edit mode and combat
        e.preventDefault();
        
        // Check if there's an object at this position
        const objectAtPos = combat.gridObjects.find(o => o.position.x === x && o.position.y === y);
        if (objectAtPos) {
            // In edit mode, remove objects on right click
            if (isEditMode) {
                removeGridObject(objectAtPos.id);
            }
            // Otherwise do nothing (don't remove objects during combat)
        } else {
            // Show the emoji menu for adding objects
            const rect = e.currentTarget.getBoundingClientRect();
            setEmojiMenu({
                x: e.clientX,
                y: e.clientY,
                gridX: x,
                gridY: y
            });
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, x: number, y: number) => {
        if (!isBrawlOrEdit || e.button !== 2) return; // Only right mouse button
        
        const timer = setTimeout(() => {
            // Long press - show emoji menu
            const rect = e.currentTarget.getBoundingClientRect();
            setEmojiMenu({
                x: e.clientX,
                y: e.clientY,
                gridX: x,
                gridY: y
            });
        }, 500); // 500ms for long press
        
        setLongPressTimer(timer);
    };

    const handleMouseUp = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        if (emojiMenu) {
            const { gridX, gridY } = emojiMenu;
            const objectAtPos = combat.gridObjects.find(o => o.position.x === gridX && o.position.y === gridY);
            
            if (objectAtPos) {
                // Update existing object with new emoji
                // Since we don't have an updateGridObject function,
                // we can remove and re-add with the new emoji
                removeGridObject(objectAtPos.id);
                addGridObject('crate', { x: gridX, y: gridY }, { emoji });
            } else {
                // Create new object with custom emoji
                addGridObject('crate', { x: gridX, y: gridY }, { emoji });
            }
        }
    };

    const handleCombatantRightClick = (e: React.MouseEvent, combatant: Combatant) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle cover for combatant
        toggleCover(combatant.position);
    };
    
    const handleTokenClick = (e: React.MouseEvent, combatant: Combatant) => {
        e.stopPropagation();
        const currentActiveAction = activeCombatant?.plannedAction?.type;
        if(currentActiveAction === 'RangedAttack' || currentActiveAction === 'CloseAttack' || currentActiveAction === 'FirstAid') {
            if (activeCombatant?.id !== combatant.id) {
                updateCombatant(activeCombatant.id, { targetId: combatant.id });
                onSelectCombatant(null); // Deselect after targeting
            }
        } else {
            onSelectCombatant(combatant.id === activeCombatantId ? null : combatant.id);
        }
    }
    
    const getRangeCategory = (pos1: {x:number, y:number}, pos2: {x:number, y:number}): RangeCategory => {
        const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)) * (25 / 6); // Approx meters
        if (distance <= 25) return RangeCategory.Short;
        if (distance <= 100) return RangeCategory.Long;
        return RangeCategory.Extreme;
    };

    const isCovered = (target: Combatant, attacker: Combatant) => {
        if (!attacker) return false;
        
        const dx = target.position.x - attacker.position.x;
        const dy = target.position.y - attacker.position.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        if (steps === 0) return false;

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = Math.round(attacker.position.x + t * dx);
            const checkY = Math.round(attacker.position.y + t * dy);
            if(combat.grid.cover.some(c => c.x === checkX && c.y === checkY) || combat.gridObjects.some(o => o.position.x === checkX && o.position.y === checkY)){
                return true;
            }
        }
        return false;
    };


    return (
        <div 
            className={`relative bg-gray-800 border-2 border-gray-700 overflow-hidden ${
                placingObject ? 'cursor-crosshair ring-2 ring-blue-400' : ''
            }`} 
            style={{ 
                width: GRID_WIDTH * CELL_SIZE, 
                height: GRID_HEIGHT * CELL_SIZE,
                backgroundImage: combat.backgroundImage ? `url(${combat.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: GRID_WIDTH - 1 }).map((_, i) => (
                    <div key={`v-${i}`} className="absolute bg-gray-500/20" style={{ left: (i + 1) * CELL_SIZE, top: 0, width: 1, height: '100%' }} />
                ))}
                {Array.from({ length: GRID_HEIGHT - 1 }).map((_, i) => (
                    <div key={`h-${i}`} className="absolute bg-gray-500/20" style={{ left: 0, top: (i + 1) * CELL_SIZE, width: '100%', height: 1 }} />
                ))}
            </div>

            {/* Grid Cells for clicks and cover */}
            <div className="absolute inset-0 grid" style={{gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`, gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`}}>
                {Array.from({ length: GRID_WIDTH * GRID_HEIGHT }).map((_, i) => {
                    const x = i % GRID_WIDTH;
                    const y = Math.floor(i / GRID_WIDTH);
                    const isCover = combat.grid.cover.some(c => c.x === x && c.y === y);
                    const isMoveable = isMovementPhase && activeCombatant?.plannedAction?.type === 'Move';
                    
                    return (
                        <div 
                            key={`${x}-${y}`} 
                            className={`relative border-transparent ${isMoveable || placingObject ? 'hover:bg-blue-500/30 cursor-pointer' : ''}`}
                            onClick={() => handleCellClick(x, y)}
                            onContextMenu={(e) => handleRightClick(e, x, y)}
                            onMouseDown={(e) => handleMouseDown(e, x, y)}
                            onMouseUp={handleMouseUp}
                        >
                            {isCover && <div className="absolute inset-0.5 bg-gray-500/50 rounded-md flex items-center justify-center text-white text-xl">🛡</div>}
                        </div>
                    );
                })}
            </div>

            {/* Grid Objects */}
            {combat.gridObjects.map(obj => (
                 <div
                    key={obj.id}
                    draggable={isEditMode}
                    onDragStart={() => setDraggingItem({id: obj.id, type: 'object'})}
                    className="absolute transition-all duration-200 cursor-pointer"
                    style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        transform: `translate(${obj.position.x * CELL_SIZE}px, ${obj.position.y * CELL_SIZE}px)`,
                    }}
                 >
                    <GridObjectToken 
                        object={obj} 
                        onRightClick={() => {
                            if (isEditMode) removeGridObject(obj.id);
                        }}
                    />
                 </div>
            ))}
            
            {/* Combatants */}
            {combat.combatants.map(c => {
                 const isSelected = c.id === activeCombatantId;
                 const isPC = c.type === 'PC';
                 const isBroken = c.health <= 0;
                 const tokenSrc = c.tokenImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234A5568'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' fill='%23E2E8F0' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E";
                 const coverStatus = activeCombatant && isCovered(c, activeCombatant);

                 return (
                    <div
                        key={c.id}
                        draggable={isEditMode}
                        onDragStart={() => setDraggingItem({id: c.id, type: 'combatant'})}
                        onClick={(e) => handleTokenClick(e, c)}
                        onContextMenu={(e) => handleCombatantRightClick(e, c)}
                        className={`absolute flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${isBroken ? 'opacity-40 filter grayscale' : ''}`}
                        style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            transform: `translate(${c.position.x * CELL_SIZE}px, ${c.position.y * CELL_SIZE}px)`,
                        }}
                    >
                        <div className={`relative w-full h-full rounded-full border-2 shadow-lg ${isSelected ? 'ring-4 ring-yellow-400' : ''} ${isPC ? 'border-blue-300' : 'border-red-400'}`}>
                           <img src={tokenSrc} alt={c.name} className="w-full h-full rounded-full object-cover"/>
                           {coverStatus && <div className="absolute -top-1 -right-1 text-blue-300 text-2xl drop-shadow-lg">🛡</div>}
                        </div>
                        <div className="absolute -bottom-5 w-max text-center">
                            <span className="text-xs font-bold bg-black/60 px-1.5 py-0.5 rounded text-white">{c.name}</span>
                        </div>
                         {/* Health Bar */}
                        <div className="absolute -top-2 w-full h-1.5 bg-gray-900/70 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{width: `${(c.health / (isPC ? gameState.characters.find(pc => pc.id === c.id)?.maxHealth : gameState.npcs.find(npc => npc.id === c.id)?.maxHealth) || 3) * 100}%`}}></div>
                        </div>
                    </div>
                 );
            })}
            
            {/* Floating Text & Animations */}
            {combat.floatingText.map(ft => (
                <div key={ft.id} className="absolute text-xl font-bold pointer-events-none animate-float-up" style={{left: ft.position.x * CELL_SIZE + CELL_SIZE/2, top: ft.position.y * CELL_SIZE, color: ft.color, textShadow: '0 0 5px black'}}>
                    {ft.text}
                </div>
            ))}
            {combat.animations.map(anim => {
                if(anim.type === 'ranged') {
                    const dx = (anim.endPos.x - anim.startPos.x) * CELL_SIZE;
                    const dy = (anim.endPos.y - anim.startPos.y) * CELL_SIZE;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                    return <div key={anim.id} className="shot-line" style={{
                        left: anim.startPos.x * CELL_SIZE + CELL_SIZE / 2,
                        top: anim.startPos.y * CELL_SIZE + CELL_SIZE / 2,
                        width: dist,
                        height: 2,
                        transform: `rotate(${angle}deg)`,
                    }}/>
                }
                 if (anim.type === 'melee') {
                    return <div key={anim.id} className="absolute w-10 h-10 bg-no-repeat bg-center bg-contain pointer-events-none" style={{
                        left: anim.endPos.x * CELL_SIZE + (CELL_SIZE - 40) / 2,
                        top: anim.endPos.y * CELL_SIZE + (CELL_SIZE - 40) / 2,
                        backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"rgba(255,255,255,0.8)\"%3E%3Cpath d='M14.25 5.25a.75.75 0 0 0-1.06 1.06l5.22 5.22H3a.75.75 0 0 0 0 1.5h15.41l-5.22 5.22a.75.75 0 0 0 1.06 1.06l6.75-6.75a.75.75 0 0 0 0-1.06l-6.75-6.75Z' /%3E%3C/svg%3E')",
                        animation: 'slash-anim 0.4s ease-out forwards'
                    }}/>;
                }
                return null;
            })}

            {/* Emoji Menu */}
            {emojiMenu && (
                <EmojiMenu
                    x={emojiMenu.x}
                    y={emojiMenu.y}
                    onClose={() => setEmojiMenu(null)}
                    onSelectEmoji={handleEmojiSelect}
                />
            )}
            
            {/* Object Selector Toolbar - Show in edit mode or during brawl */}
            {isBrawlOrEdit && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800/70 backdrop-blur-sm rounded-md p-2 z-10 flex space-x-2">
                    <button 
                        className={`w-8 h-8 flex items-center justify-center rounded text-xl transition-colors ${
                            placingObject === 'barrel' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        onClick={() => {
                            if (placingObject === 'barrel') {
                                onObjectPlaced();
                            } else {
                                onSetPlacingObject('barrel');
                            }
                        }}
                        title="Place Barrel"
                    >
                        🛢️
                    </button>
                    <button 
                        className={`w-8 h-8 flex items-center justify-center rounded text-xl transition-colors ${
                            placingObject === 'crate' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        onClick={() => {
                            if (placingObject === 'crate') {
                                onObjectPlaced();
                            } else {
                                onSetPlacingObject('crate');
                            }
                        }}
                        title="Place Crate"
                    >
                        📦
                    </button>
                    <button 
                        className={`w-8 h-8 flex items-center justify-center rounded text-xl transition-colors ${
                            placingObject === 'car' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        onClick={() => {
                            if (placingObject === 'car') {
                                onObjectPlaced();
                            } else {
                                onSetPlacingObject('car');
                            }
                        }}
                        title="Place Car"
                    >
                        �
                    </button>
                    <button 
                        className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-xl"
                        onClick={() => {
                            // Show emoji menu in the center of the grid
                            const gridElement = document.querySelector('.combat-grid');
                            if (gridElement) {
                                const rect = gridElement.getBoundingClientRect();
                                const centerX = rect.left + rect.width / 2;
                                const centerY = rect.top + rect.height / 2;
                                setEmojiMenu({ 
                                    x: centerX, 
                                    y: centerY, 
                                    gridX: -1,
                                    gridY: -1
                                });
                            }
                        }}
                        title="Choose Custom Emoji"
                    >
                        �
                    </button>
                    {placingObject && (
                        <button 
                            className="w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded text-sm text-white"
                            onClick={() => onObjectPlaced()}
                            title="Cancel Placement"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CombatGrid;