// GridlessBattlemap - Free movement combat map for TWD RPG
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BrawlParticipant, BattlemapObject, AIBackgroundPrompt } from '../../types/brawl';

interface GridlessBattlemapProps {
  participants: BrawlParticipant[];
  objects: BattlemapObject[];
  background?: string;
  width?: number;
  height?: number;
  onParticipantMove: (participantId: string, newPosition: { x: number; y: number }) => void;
  onObjectMove: (objectId: string, newPosition: { x: number; y: number }) => void;
  onBackgroundGenerate: (prompt: AIBackgroundPrompt) => void;
  onParticipantSelect?: (participantId: string) => void;
  onObjectDelete?: (objectId: string) => void;
  onParticipantDelete?: (participantId: string) => void;
  isEditMode?: boolean;
}

export const GridlessBattlemap: React.FC<GridlessBattlemapProps> = ({
  participants,
  objects,
  background,
  width = 800,
  height = 600,
  onParticipantMove,
  onObjectMove,
  onBackgroundGenerate,
  onParticipantSelect,
  onObjectDelete,
  onParticipantDelete,
  isEditMode = false
}) => {
  const [draggedItem, setDraggedItem] = useState<{ type: 'participant' | 'object'; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressTarget, setLongPressTarget] = useState<{ type: 'participant' | 'object'; id: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ 
    visible: boolean; 
    x: number; 
    y: number; 
    type: 'participant' | 'object'; 
    id: string 
  } | null>(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAIPrompt] = useState<AIBackgroundPrompt>({
    prompt: '',
    style: 'apocalyptic',
    mood: 'tense'
  });
  const [showObjectPalette, setShowObjectPalette] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Handle token selection/deselection
  const handleItemClick = useCallback((
    e: React.MouseEvent,
    type: 'participant' | 'object',
    id: string
  ) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior
    
    // Don't trigger selection if we just finished dragging or currently dragging
    if (draggedItem || isDragging) return;
    
    // Only handle object selection for editing purposes
    if (type === 'object' && isEditMode) {
      if (e.ctrlKey || e.metaKey) {
        // Multi-select with Ctrl/Cmd
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
      } else {
        // Single select
        setSelectedItems(new Set([id]));
      }
    }
    // Completely ignore participant clicks and object clicks when not in edit mode
  }, [draggedItem, isDragging, isEditMode]);

  // Handle long press for mobile/touch devices
  const handleLongPress = useCallback((
    type: 'participant' | 'object',
    id: string
  ) => {
    // Delete the item on long press
    if (type === 'participant' && onParticipantDelete) {
      onParticipantDelete(id);
    } else if (type === 'object' && onObjectDelete) {
      onObjectDelete(id);
    }
    
    // Remove from selection
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, [onParticipantDelete, onObjectDelete]);

  // Handle touch start for long press detection
  const handleTouchStart = useCallback((
    e: React.TouchEvent,
    type: 'participant' | 'object',
    id: string
  ) => {
    const timer = setTimeout(() => {
      handleLongPress(type, id);
      setLongPressTimer(null);
      setLongPressTarget(null);
    }, 800); // 800ms long press
    
    setLongPressTimer(timer);
    setLongPressTarget({ type, id });
  }, [handleLongPress]);

  // Handle touch end to cancel long press if moved
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      setLongPressTarget(null);
    }
  }, [longPressTimer]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((
    e: React.MouseEvent,
    type: 'participant' | 'object',
    id: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Show context menu at mouse position
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      id
    });
  }, []);

  // Handle context menu actions
  const handleContextMenuAction = useCallback((action: string) => {
    if (!contextMenu) return;
    
    const { type, id } = contextMenu;
    
    switch (action) {
      case 'delete':
        if (type === 'participant' && onParticipantDelete) {
          onParticipantDelete(id);
        } else if (type === 'object' && onObjectDelete) {
          onObjectDelete(id);
        }
        // Remove from selection
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        break;
      case 'select':
        if (type === 'participant' && onParticipantSelect) {
          onParticipantSelect(id);
        }
        break;
    }
    
    setContextMenu(null);
  }, [contextMenu, onParticipantDelete, onObjectDelete, onParticipantSelect]);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    
    if (contextMenu?.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Handle keyboard events for selection and deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle key events if the map is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).contentEditable === 'true'
      );
      
      if (isInputFocused) return;
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault(); // Prevent browser back navigation
        
        if (selectedItems.size > 0) {
          selectedItems.forEach(id => {
            const participant = participants.find(p => p.id === id);
            const object = objects.find(o => o.id === id);
            
            if (participant && onParticipantDelete) {
              onParticipantDelete(id);
            } else if (object && onObjectDelete) {
              onObjectDelete(id);
            }
          });
          setSelectedItems(new Set());
        }
      }
      
      if (e.key === 'Escape') {
        setSelectedItems(new Set());
        setIsSelecting(false);
      }
    };

    // Add event listener to document to catch key presses globally
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, participants, objects, onParticipantDelete, onObjectDelete]);

  // Handle mouse down for dragging or selection
  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    type?: 'participant' | 'object',
    id?: string,
    currentPosition?: { x: number; y: number }
  ) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // If clicking on a specific item
    if (type && id && currentPosition) {
      // Always allow dragging for participants, only in edit mode for objects
      if (type === 'participant' || (type === 'object' && isEditMode)) {
        setDraggedItem({ type, id });
        setDragStartPosition({ x: mouseX, y: mouseY });
        setDragOffset({
          x: mouseX - currentPosition.x,
          y: mouseY - currentPosition.y
        });
        setIsDragging(false); // Will be set to true when mouse moves
        e.stopPropagation();
        e.preventDefault(); // Prevent any default behavior
        return;
      }
    } 
    
    // If clicking on empty space and in edit mode, start rectangle selection
    if (!type && !id && isEditMode) {
      setIsSelecting(true);
      setSelectionStart({ x: mouseX, y: mouseY });
      setSelectionEnd({ x: mouseX, y: mouseY });
      
      // Clear selection if not holding Ctrl/Cmd
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedItems(new Set());
      }
    }
  }, [isEditMode]);

  // Handle mouse move for dragging or selection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedItem) {
      // Check if we've moved enough to start dragging (prevents accidental drags)
      const dragDistance = Math.sqrt(
        Math.pow(mouseX - dragStartPosition.x, 2) + 
        Math.pow(mouseY - dragStartPosition.y, 2)
      );
      
      if (!isDragging && dragDistance > 5) {
        setIsDragging(true);
      }
      
      if (isDragging || dragDistance > 5) {
        // Handle dragging
        const newX = Math.max(0, Math.min(width - 40, mouseX - dragOffset.x));
        const newY = Math.max(0, Math.min(height - 40, mouseY - dragOffset.y));
        const newPosition = { x: newX, y: newY };
        
        if (draggedItem.type === 'participant') {
          onParticipantMove(draggedItem.id, newPosition);
        } else {
          onObjectMove(draggedItem.id, newPosition);
        }
      }
    } else if (isSelecting) {
      // Handle rectangle selection
      setSelectionEnd({ x: mouseX, y: mouseY });
    }
  }, [draggedItem, dragOffset, dragStartPosition, isDragging, width, height, onParticipantMove, onObjectMove, isSelecting]);

  // Handle mouse up to end dragging or selection
  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      // Complete rectangle selection
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);

      const newSelected = new Set(selectedItems);

      // Only select in edit mode
      if (isEditMode) {
        // Check participants
        participants.forEach(participant => {
          const px = participant.position.x + 20; // Center of token
          const py = participant.position.y + 20;
          if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
            newSelected.add(participant.id);
          }
        });

        // Check objects
        objects.forEach(object => {
          const ox = object.position.x + 20; // Center of object
          const oy = object.position.y + 20;
          if (ox >= minX && ox <= maxX && oy >= minY && oy <= maxY) {
            newSelected.add(object.id);
          }
        });
      }

      setSelectedItems(newSelected);
      setIsSelecting(false);
    }

    // Reset all dragging states
    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setDragStartPosition({ x: 0, y: 0 });
  }, [isSelecting, selectionStart, selectionEnd, selectedItems, participants, objects, isEditMode]);

  // Add event listeners for dragging
  useEffect(() => {
    if (draggedItem) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Check if we've moved enough to start dragging
        const dragDistance = Math.sqrt(
          Math.pow(mouseX - dragStartPosition.x, 2) + 
          Math.pow(mouseY - dragStartPosition.y, 2)
        );
        
        if (!isDragging && dragDistance > 5) {
          setIsDragging(true);
        }
        
        if (isDragging || dragDistance > 5) {
          const newX = Math.max(0, Math.min(width - 40, e.clientX - rect.left - dragOffset.x));
          const newY = Math.max(0, Math.min(height - 40, e.clientY - rect.top - dragOffset.y));
          
          const newPosition = { x: newX, y: newY };
          if (draggedItem.type === 'participant') {
            onParticipantMove(draggedItem.id, newPosition);
          } else {
            onObjectMove(draggedItem.id, newPosition);
          }
        }
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedItem, dragOffset, dragStartPosition, isDragging, width, height, onParticipantMove, onObjectMove, handleMouseUp]);

  const handleGenerateBackground = useCallback(() => {
    onBackgroundGenerate(aiPrompt);
    setShowAIPrompt(false);
  }, [aiPrompt, onBackgroundGenerate]);

  const getTokenImage = useCallback((participant: BrawlParticipant) => {
    if (participant.tokenImage) return participant.tokenImage;
    
    // Default tokens based on type
    const defaultTokens = {
      PC: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%234F46E5' stroke='%23FFFFFF' stroke-width='4'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='36' fill='%23FFFFFF' text-anchor='middle'%3EPC%3C/text%3E%3C/svg%3E",
      NPC: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23F59E0B' stroke='%23FFFFFF' stroke-width='4'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='32' fill='%23FFFFFF' text-anchor='middle'%3ENPC%3C/text%3E%3C/svg%3E",
      Animal: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2310B981' stroke='%23FFFFFF' stroke-width='4'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' fill='%23FFFFFF' text-anchor='middle'%3E🐾%3C/text%3E%3C/svg%3E"
    };
    
    return defaultTokens[participant.type];
  }, []);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header with controls */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Battlemap</h3>
          
          <div className="flex items-center gap-4">
            {/* Help tooltip */}
            <div className="text-xs text-gray-400">
              {isEditMode ? (
                <span>🖱️ Drag tokens & objects • Click & drag to select • Backspace to delete • Long press on mobile</span>
              ) : (
                <span>🖱️ Drag tokens to move • Click Edit Mode to modify battlemap</span>
              )}
            </div>
            
            {isEditMode && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowObjectPalette(!showObjectPalette)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                >
                  Add Objects
                </button>
                <button
                  onClick={() => setShowAIPrompt(true)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm transition-colors"
                >
                  🎨 Generate Background
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Object Palette */}
        {showObjectPalette && isEditMode && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">Quick Objects</h4>
            <div className="flex flex-wrap gap-2">
              {['Cover Wall', 'Car', 'Tree', 'Building', 'Debris'].map(objectType => (
                <button
                  key={objectType}
                  onClick={() => {
                    const newObject: BattlemapObject = {
                      id: `obj-${Date.now()}`,
                      name: objectType,
                      position: { x: Math.random() * (width - 100), y: Math.random() * (height - 100) },
                      size: { width: 60, height: 60 },
                      type: objectType === 'Cover Wall' ? 'cover' : 'obstacle',
                      provideseCover: objectType === 'Cover Wall',
                      isPassable: false
                    };
                    onObjectMove(newObject.id, newObject.position);
                  }}
                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
                >
                  {objectType}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Battlemap Area */}
      <div className="relative">
        <div
          ref={mapRef}
          className="relative overflow-hidden cursor-crosshair focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ 
            width: `${width}px`, 
            height: `${height}px`,
            backgroundImage: background ? `url(${background})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: background ? 'transparent' : '#1F2937'
          }}
          tabIndex={0} // Make it focusable
          onMouseDown={(e) => {
            // Focus the map when clicked
            if (mapRef.current) {
              mapRef.current.focus();
            }
            handleMouseDown(e);
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Grid lines for reference (subtle) */}
          <svg className="absolute inset-0 pointer-events-none opacity-20">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#6B7280" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Selection rectangle */}
          {isSelecting && (
            <div
              className="absolute border-2 border-blue-400 bg-blue-400/20 pointer-events-none"
              style={{
                left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
                top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
                width: `${Math.abs(selectionEnd.x - selectionStart.x)}px`,
                height: `${Math.abs(selectionEnd.y - selectionStart.y)}px`
              }}
            />
          )}

          {/* Objects */}
          {objects.map(object => (
            <div
              key={object.id}
              className={`absolute border-2 rounded-md flex items-center justify-center text-white text-xs font-bold transition-all duration-200 ${
                selectedItems.has(object.id) 
                  ? 'border-blue-400 bg-blue-400/40 shadow-lg shadow-blue-400/50' 
                  : object.type === 'cover' ? 'border-blue-500 bg-blue-500/30' :
                    object.type === 'obstacle' ? 'border-red-500 bg-red-500/30' :
                    'border-gray-500 bg-gray-500/30'
              } ${isEditMode ? 'cursor-move hover:opacity-80' : ''}`}
              style={{
                left: `${object.position.x}px`,
                top: `${object.position.y}px`,
                width: `${object.size.width}px`,
                height: `${object.size.height}px`
              }}
              onMouseDown={(e) => handleMouseDown(e, 'object', object.id, object.position)}
              onClick={(e) => handleItemClick(e, 'object', object.id)}
              onContextMenu={(e) => handleContextMenu(e, 'object', object.id)}
              onTouchStart={(e) => {
                handleTouchStart(e, 'object', object.id);
                // Also handle as mouse down for dragging on touch devices
                const touch = e.touches[0];
                const rect = mapRef.current?.getBoundingClientRect();
                if (rect) {
                  const mouseEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    stopPropagation: () => e.stopPropagation()
                  } as any;
                  handleMouseDown(mouseEvent, 'object', object.id, object.position);
                }
              }}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd} // Cancel long press if user moves finger
            >
              {object.name}
              {/* Selection indicator */}
              {selectedItems.has(object.id) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white" />
              )}
            </div>
          ))}

          {/* Participants */}
          {participants.map(participant => (
            <div
              key={participant.id}
              className={`absolute w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                selectedItems.has(participant.id) && isEditMode
                  ? 'border-blue-400 shadow-lg shadow-blue-400/50 scale-110'
                  : participant.isActive ? 'border-yellow-400' : 'border-gray-400'
              } ${participant.hasActed ? 'opacity-60' : 'opacity-100'} cursor-move hover:scale-110`}
              style={{
                left: `${participant.position.x}px`,
                top: `${participant.position.y}px`,
                backgroundImage: `url(${getTokenImage(participant)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'participant', participant.id, participant.position)}
              onContextMenu={(e) => isEditMode ? handleContextMenu(e, 'participant', participant.id) : e.preventDefault()}
              onTouchStart={(e) => {
                if (isEditMode) {
                  handleTouchStart(e, 'participant', participant.id);
                }
                // Handle touch drag for all modes
                const touch = e.touches[0];
                const rect = mapRef.current?.getBoundingClientRect();
                if (rect) {
                  const mouseEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    stopPropagation: () => e.stopPropagation(),
                    preventDefault: () => e.preventDefault()
                  } as any;
                  handleMouseDown(mouseEvent, 'participant', participant.id, participant.position);
                }
              }}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd} // Cancel long press if user moves finger
              title={`${participant.name} (${participant.health}/${participant.maxHealth} HP)`}
            >
              {/* Health indicator */}
              <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white text-xs px-1 rounded">
                {participant.health}
              </div>
              
              {/* Selection indicator - only show in edit mode */}
              {selectedItems.has(participant.id) && isEditMode && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white" />
              )}
            </div>
          ))}

          {/* Range indicators when dragging */}
          {draggedItem && draggedItem.type === 'participant' && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Add range circles here if needed */}
            </div>
          )}
        </div>
      </div>

      {/* AI Background Generation Modal */}
      {showAIPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" onClick={() => setShowAIPrompt(false)}>
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Generate Background</h3>
              <button 
                onClick={() => setShowAIPrompt(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scene Description</label>
                <textarea
                  value={aiPrompt.prompt}
                  onChange={(e) => setAIPrompt(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Describe the battlemap scene (e.g., 'Abandoned shopping mall with broken escalators and overturned cars')"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
                  <select
                    value={aiPrompt.style}
                    onChange={(e) => setAIPrompt(prev => ({ ...prev, style: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="realistic">Realistic</option>
                    <option value="apocalyptic">Apocalyptic</option>
                    <option value="urban">Urban</option>
                    <option value="rural">Rural</option>
                    <option value="indoor">Indoor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mood</label>
                  <select
                    value={aiPrompt.mood}
                    onChange={(e) => setAIPrompt(prev => ({ ...prev, mood: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="tense">Tense</option>
                    <option value="desperate">Desperate</option>
                    <option value="dark">Dark</option>
                    <option value="hopeful">Hopeful</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
              <button 
                onClick={() => setShowAIPrompt(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerateBackground}
                disabled={!aiPrompt.prompt.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
            onClick={() => handleContextMenuAction('delete')}
          >
            Delete
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
            onClick={() => handleContextMenuAction('select')}
          >
            Select
          </button>
        </div>
      )}
    </div>
  );
};
