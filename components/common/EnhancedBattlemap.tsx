import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameState } from '../../context/GameStateContext';
import { GridObject, Combatant, RulerMeasurement, BattlemapTool } from '../../types';
import BattlemapToolbar from '../common/BattlemapToolbar';

interface EnhancedBattlemapProps {
  activeCombatantId: string | null;
  onSelectCombatant: (id: string | null) => void;
  className?: string;
}

interface ObjectMenu {
  x: number;
  y: number;
  objectId: string;
}

interface TextEditDialog {
  x: number;
  y: number;
  objectId?: string;
  initialText?: string;
}

interface EmojiSelector {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
}

const OBJECT_EMOJIS = [
  '🚗', '🛻', '🚌', '🚚', '🏠', '🏢', '🏪', '🏭', 
  '🌳', '🌲', '🪨', '🗿', '🛢️', '📦', '⚡', '🔥',
  '🚧', '🚪', '🪟', '💀', '🧟', '⚰️', '🩸', '💊'
];

const BATTLEMAP_TOOLS: BattlemapTool[] = [
  { type: 'select', name: 'Select', icon: '↖️', cursor: 'default' },
  { type: 'text', name: 'Text', icon: '📝', cursor: 'text' },
  { type: 'circle', name: 'Circle', icon: '⭕', cursor: 'crosshair' },
  { type: 'rectangle', name: 'Rectangle', icon: '⬜', cursor: 'crosshair' },
  { type: 'line', name: 'Line', icon: '📏', cursor: 'crosshair' },
  { type: 'emoji', name: 'Objects', icon: '🚗', cursor: 'copy' },
  { type: 'ruler', name: 'Ruler', icon: '📐', cursor: 'crosshair' },
];

const EnhancedBattlemap: React.FC<EnhancedBattlemapProps> = ({
  activeCombatantId,
  onSelectCombatant,
  className = ''
}) => {
  const {
    gameState,
    isEditMode,
    moveCombatant,
    addGridObject,
    updateGridObject,
    moveGridObject,
    removeGridObject,
    addRulerMeasurement,
    removeRulerMeasurement,
    clearAllRulers,
    generateAndSetBattlemap
  } = useGameState();

  const { combat } = gameState;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Tool states
  const [selectedTool, setSelectedTool] = useState('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [mapPrompt, setMapPrompt] = useState('abandoned highway with crashed cars');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dragging states for combatants
  const [isDraggingCombatant, setIsDraggingCombatant] = useState(false);
  const [draggedCombatantId, setDraggedCombatantId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging states for objects
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [draggedObjectId, setDraggedObjectId] = useState<string | null>(null);

  // UI states
  const [objectMenu, setObjectMenu] = useState<ObjectMenu | null>(null);
  const [textEditDialog, setTextEditDialog] = useState<TextEditDialog | null>(null);
  const [emojiSelector, setEmojiSelector] = useState<EmojiSelector | null>(null);
  const [resizingObject, setResizingObject] = useState<{ id: string; startSize: number } | null>(null);

  // Constants
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 700;
  const GRID_SIZE = 25; // For snap-to-grid

  // Utility functions
  const getCanvasCoordinates = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const snapToGrid = useCallback((pos: { x: number; y: number }) => {
    if (selectedTool === 'select') {
      return {
        x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
      };
    }
    return pos;
  }, [selectedTool]);

  const calculateDistance = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const pixels = Math.sqrt(dx * dx + dy * dy);
    // Convert pixels to meters (approximate scale)
    const meters = Math.round((pixels / 10) * 10) / 10; // Round to 1 decimal place
    return meters;
  }, []);

  // Drawing functions
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background image if available
    if (combat.backgroundImage) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.7;
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.globalAlpha = 1.0;
      };
      img.src = combat.backgroundImage;
    }

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }, [combat.backgroundImage]);

  const drawCombatants = useCallback((ctx: CanvasRenderingContext2D) => {
    combat.combatants.forEach((combatant) => {
      const { x, y } = combatant.position;
      
      // Draw combatant token
      ctx.save();
      
      // Highlight if selected
      if (combatant.id === activeCombatantId) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, 2 * Math.PI);
        ctx.stroke();
      }
      
      // Draw token background
      ctx.fillStyle = combatant.type === 'PC' ? '#2563eb' : '#7c3aed';
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw token border
      ctx.strokeStyle = combatant.health <= 0 ? '#dc2626' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw initials or emoji
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = combatant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      ctx.fillText(initials, x, y);
      
      // Draw name below token
      ctx.font = '10px Arial';
      ctx.fillStyle = '#e5e7eb';
      ctx.textBaseline = 'top';
      ctx.fillText(combatant.name, x, y + 25);
      
      // Draw health indicator
      if (combatant.health < 3) {
        ctx.fillStyle = combatant.health <= 0 ? '#dc2626' : '#f59e0b';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${combatant.health}/3`, x, y + 35);
      }
      
      ctx.restore();
    });
  }, [combat.combatants, activeCombatantId]);

  const drawGridObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    combat.gridObjects.forEach((obj) => {
      ctx.save();
      
      // Highlight if selected
      if (obj.id === selectedObjectId) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        if (obj.type === 'line' && obj.endPosition) {
          ctx.beginPath();
          ctx.moveTo(obj.position.x, obj.position.y);
          ctx.lineTo(obj.endPosition.x, obj.endPosition.y);
          ctx.stroke();
        } else {
          const width = obj.width || 50;
          const height = obj.height || 50;
          ctx.strokeRect(obj.position.x - width/2, obj.position.y - height/2, width, height);
        }
        ctx.setLineDash([]);
      }
      
      // Draw object based on type
      switch (obj.type) {
        case 'text':
          ctx.fillStyle = obj.color || '#ffffff';
          ctx.font = `${(obj.size || 1) * 16}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.text || 'Text', obj.position.x, obj.position.y);
          break;
          
        case 'circle':
          ctx.strokeStyle = obj.color || '#ffffff';
          ctx.lineWidth = obj.strokeWidth || 2;
          ctx.beginPath();
          ctx.arc(obj.position.x, obj.position.y, (obj.width || 50) / 2, 0, 2 * Math.PI);
          ctx.stroke();
          break;
          
        case 'rectangle':
          ctx.strokeStyle = obj.color || '#ffffff';
          ctx.lineWidth = obj.strokeWidth || 2;
          const width = obj.width || 50;
          const height = obj.height || 50;
          ctx.strokeRect(obj.position.x - width/2, obj.position.y - height/2, width, height);
          break;
          
        case 'line':
          if (obj.endPosition) {
            ctx.strokeStyle = obj.color || '#ffffff';
            ctx.lineWidth = obj.strokeWidth || 2;
            ctx.beginPath();
            ctx.moveTo(obj.position.x, obj.position.y);
            ctx.lineTo(obj.endPosition.x, obj.endPosition.y);
            ctx.stroke();
          }
          break;
          
        case 'emoji':
          ctx.font = `${(obj.size || 1) * 24}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.emoji || '❓', obj.position.x, obj.position.y);
          break;
      }
      
      ctx.restore();
    });
  }, [combat.gridObjects, selectedObjectId]);

  const drawRulers = useCallback((ctx: CanvasRenderingContext2D) => {
    combat.rulerMeasurements.forEach((ruler) => {
      ctx.save();
      
      // Draw ruler line
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ruler.startPos.x, ruler.startPos.y);
      ctx.lineTo(ruler.endPos.x, ruler.endPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw distance label
      const midX = (ruler.startPos.x + ruler.endPos.x) / 2;
      const midY = (ruler.startPos.y + ruler.endPos.y) / 2;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(midX - 20, midY - 8, 40, 16);
      
      ctx.fillStyle = '#fbbf24';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${ruler.distance}m`, midX, midY);
      
      // Draw end points
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ruler.startPos.x, ruler.startPos.y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ruler.endPos.x, ruler.endPos.y, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
    });
  }, [combat.rulerMeasurements]);

  // Main drawing function
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx);
    drawGridObjects(ctx);
    drawCombatants(ctx);
    drawRulers(ctx);
  }, [drawBackground, drawGridObjects, drawCombatants, drawRulers]);

  // Event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e);
    
    // Close any open menus
    setObjectMenu(null);
    setTextEditDialog(null);
    setEmojiSelector(null);
    
    switch (selectedTool) {
      case 'select':
        // Find clicked object or combatant
        const clickedCombatant = combat.combatants.find(c => {
          const dist = Math.sqrt(Math.pow(c.position.x - coords.x, 2) + Math.pow(c.position.y - coords.y, 2));
          return dist <= 20;
        });
        
        if (clickedCombatant) {
          // Start dragging the combatant
          setDraggedCombatantId(clickedCombatant.id);
          setDragStartPos({ x: e.clientX, y: e.clientY });
          setDragOffset({
            x: coords.x - clickedCombatant.position.x,
            y: coords.y - clickedCombatant.position.y
          });
          setIsDraggingCombatant(false); // Will be set to true when mouse moves
          return;
        }
        
        const clickedObject = combat.gridObjects.find(obj => {
          if (obj.type === 'line' && obj.endPosition) {
            // Line click detection
            const dist = Math.abs((obj.endPosition.y - obj.position.y) * coords.x - 
                                (obj.endPosition.x - obj.position.x) * coords.y + 
                                obj.endPosition.x * obj.position.y - 
                                obj.endPosition.y * obj.position.x) /
                        Math.sqrt(Math.pow(obj.endPosition.y - obj.position.y, 2) + 
                                Math.pow(obj.endPosition.x - obj.position.x, 2));
            return dist <= 5;
          } else {
            const width = obj.width || 50;
            const height = obj.height || 50;
            return coords.x >= obj.position.x - width/2 && 
                   coords.x <= obj.position.x + width/2 &&
                   coords.y >= obj.position.y - height/2 && 
                   coords.y <= obj.position.y + height/2;
          }
        });
        
        if (clickedObject) {
          // Start dragging the object
          setDraggedObjectId(clickedObject.id);
          setDragStartPos({ x: e.clientX, y: e.clientY });
          setDragOffset({
            x: coords.x - clickedObject.position.x,
            y: coords.y - clickedObject.position.y
          });
          setIsDraggingObject(false); // Will be set to true when mouse moves
          setSelectedObjectId(clickedObject.id);
          return;
        } else {
          setSelectedObjectId(null);
          onSelectCombatant(null);
        }
        break;
        
      case 'text':
        setTextEditDialog({
          x: e.clientX,
          y: e.clientY,
          initialText: ''
        });
        break;
        
      case 'emoji':
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setEmojiSelector({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            gridX: coords.x,
            gridY: coords.y
          });
        }
        break;
        
      case 'circle':
      case 'rectangle':
      case 'line':
      case 'ruler':
        setIsDrawing(true);
        setDrawStart(coords);
        break;
    }
  }, [selectedTool, combat.combatants, combat.gridObjects, getCanvasCoordinates, onSelectCombatant]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle combatant dragging
    if (draggedCombatantId && dragStartPos) {
      const coords = getCanvasCoordinates(e);
      const mouseMoved = Math.abs(e.clientX - dragStartPos.x) + Math.abs(e.clientY - dragStartPos.y);
      if (mouseMoved > 5) { // 5px threshold to start dragging
        setIsDraggingCombatant(true);
        const newPosition = snapToGrid({
          x: coords.x - dragOffset.x,
          y: coords.y - dragOffset.y
        });
        moveCombatant(draggedCombatantId, newPosition);
      }
      return;
    }

    // Handle object dragging
    if (draggedObjectId && dragStartPos) {
      const coords = getCanvasCoordinates(e);
      const mouseMoved = Math.abs(e.clientX - dragStartPos.x) + Math.abs(e.clientY - dragStartPos.y);
      if (mouseMoved > 5) { // 5px threshold to start dragging
        setIsDraggingObject(true);
        const newPosition = snapToGrid({
          x: coords.x - dragOffset.x,
          y: coords.y - dragOffset.y
        });
        moveGridObject(draggedObjectId, newPosition);
      }
      return;
    }
    
    // Handle drawing tools
    if (!isDrawing || !drawStart) return;
    
    const drawCoords = getCanvasCoordinates(e);
    
    // Show preview for drawing tools
    redrawCanvas();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    switch (selectedTool) {
      case 'circle':
        const radius = Math.sqrt(Math.pow(drawCoords.x - drawStart.x, 2) + Math.pow(drawCoords.y - drawStart.y, 2));
        ctx.beginPath();
        ctx.arc(drawStart.x, drawStart.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
        
      case 'rectangle':
        const width = drawCoords.x - drawStart.x;
        const height = drawCoords.y - drawStart.y;
        ctx.strokeRect(drawStart.x, drawStart.y, width, height);
        break;
        
      case 'line':
      case 'ruler':
        ctx.beginPath();
        ctx.moveTo(drawStart.x, drawStart.y);
        ctx.lineTo(drawCoords.x, drawCoords.y);
        ctx.stroke();
        
        if (selectedTool === 'ruler') {
          const distance = calculateDistance(drawStart, drawCoords);
          const midX = (drawStart.x + drawCoords.x) / 2;
          const midY = (drawStart.y + drawCoords.y) / 2;
          
          ctx.fillStyle = '#000000';
          ctx.fillRect(midX - 20, midY - 8, 40, 16);
          
          ctx.fillStyle = '#fbbf24';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.setLineDash([]);
          ctx.fillText(`${distance}m`, midX, midY);
        }
        break;
    }
    
    ctx.restore();
  }, [isDrawing, drawStart, selectedTool, getCanvasCoordinates, redrawCanvas, calculateDistance, draggedCombatantId, dragStartPos, dragOffset, snapToGrid, moveCombatant, draggedObjectId, moveGridObject]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Handle end of combatant dragging
    if (draggedCombatantId) {
      setIsDraggingCombatant(false);
      setDraggedCombatantId(null);
      setDragStartPos(null);
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    // Handle end of object dragging
    if (draggedObjectId) {
      setIsDraggingObject(false);
      setDraggedObjectId(null);
      setDragStartPos(null);
      setDragOffset({ x: 0, y: 0 });
      return;
    }
    
    // Handle end of drawing
    if (!isDrawing || !drawStart) return;
    
    const upCoords = getCanvasCoordinates(e);
    
    switch (selectedTool) {
      case 'circle':
        const radius = Math.sqrt(Math.pow(upCoords.x - drawStart.x, 2) + Math.pow(upCoords.y - drawStart.y, 2));
        addGridObject('circle', drawStart, {
          width: radius * 2,
          height: radius * 2,
          color: '#ffffff'
        });
        break;
        
      case 'rectangle':
        const width = Math.abs(upCoords.x - drawStart.x);
        const height = Math.abs(upCoords.y - drawStart.y);
        const centerX = (drawStart.x + upCoords.x) / 2;
        const centerY = (drawStart.y + upCoords.y) / 2;
        
        addGridObject('rectangle', { x: centerX, y: centerY }, {
          width,
          height,
          color: '#ffffff'
        });
        break;
        
      case 'line':
        addGridObject('line', drawStart, {
          endPosition: upCoords,
          color: '#ffffff'
        });
        break;
        
      case 'ruler':
        const distance = calculateDistance(drawStart, upCoords);
        addRulerMeasurement(drawStart, upCoords);
        break;
    }
    
    setIsDrawing(false);
    setDrawStart(null);
  }, [isDrawing, drawStart, selectedTool, getCanvasCoordinates, addGridObject, addRulerMeasurement, calculateDistance, draggedCombatantId, draggedObjectId]);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (selectedTool !== 'select') return;
    
    const coords = getCanvasCoordinates(e);
    
    // Check for ruler click
    const clickedRuler = combat.rulerMeasurements.find(ruler => {
      const dist = Math.abs((ruler.endPos.y - ruler.startPos.y) * coords.x - 
                          (ruler.endPos.x - ruler.startPos.x) * coords.y + 
                          ruler.endPos.x * ruler.startPos.y - 
                          ruler.endPos.y * ruler.startPos.x) /
                  Math.sqrt(Math.pow(ruler.endPos.y - ruler.startPos.y, 2) + 
                          Math.pow(ruler.endPos.x - ruler.startPos.x, 2));
      return dist <= 5;
    });
    
    if (clickedRuler) {
      removeRulerMeasurement(clickedRuler.id);
      return;
    }
    
    // Check for object click
    const clickedObject = combat.gridObjects.find(obj => {
      if (obj.type === 'line' && obj.endPosition) {
        const dist = Math.abs((obj.endPosition.y - obj.position.y) * coords.x - 
                            (obj.endPosition.x - obj.position.x) * coords.y + 
                            obj.endPosition.x * obj.position.y - 
                            obj.endPosition.y * obj.position.x) /
                    Math.sqrt(Math.pow(obj.endPosition.y - obj.position.y, 2) + 
                            Math.pow(obj.endPosition.x - obj.position.x, 2));
        return dist <= 5;
      } else {
        const width = obj.width || 50;
        const height = obj.height || 50;
        return coords.x >= obj.position.x - width/2 && 
               coords.x <= obj.position.x + width/2 &&
               coords.y >= obj.position.y - height/2 && 
               coords.y <= obj.position.y + height/2;
      }
    });
    
    if (clickedObject) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setObjectMenu({
          x: e.clientX,
          y: e.clientY,
          objectId: clickedObject.id
        });
      }
    }
  }, [selectedTool, getCanvasCoordinates, combat.rulerMeasurements, combat.gridObjects, removeRulerMeasurement]);

  // Generate map handler
  const handleGenerateMap = useCallback(async () => {
    if (!mapPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      await generateAndSetBattlemap(mapPrompt);
    } finally {
      setIsGenerating(false);
    }
  }, [mapPrompt, generateAndSetBattlemap]);

  // Emoji selection handler
  const handleEmojiSelect = useCallback((emoji: string) => {
    if (emojiSelector) {
      addGridObject('emoji', { x: emojiSelector.gridX, y: emojiSelector.gridY }, {
        emoji,
        size: 1.0
      });
      setEmojiSelector(null);
    }
  }, [emojiSelector, addGridObject]);

  // Text submission handler
  const handleTextSubmit = useCallback((text: string) => {
    if (textEditDialog && text.trim()) {
      if (textEditDialog.objectId) {
        updateGridObject(textEditDialog.objectId, { text });
      } else {
        const coords = getCanvasCoordinates({ clientX: textEditDialog.x, clientY: textEditDialog.y } as React.MouseEvent);
        addGridObject('text', coords, {
          text,
          color: '#ffffff',
          size: 1.0
        });
      }
    }
    setTextEditDialog(null);
  }, [textEditDialog, updateGridObject, addGridObject, getCanvasCoordinates]);

  // Effect to redraw canvas
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Set cursor based on selected tool
  const getCursor = () => {
    const tool = BATTLEMAP_TOOLS.find(t => t.type === selectedTool);
    return tool?.cursor || 'default';
  };

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <BattlemapToolbar
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
        onGenerateMap={handleGenerateMap}
        onClearRulers={clearAllRulers}
        mapPrompt={mapPrompt}
        onMapPromptChange={setMapPrompt}
        isGenerating={isGenerating}
      />
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto border border-gray-600 bg-gray-800"
          style={{ cursor: getCursor() }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleRightClick}
        />
        
        {/* Object Context Menu */}
        {objectMenu && (
          <div
            className="fixed bg-gray-800 border border-gray-600 rounded-lg p-2 z-50 shadow-xl"
            style={{ left: objectMenu.x, top: objectMenu.y }}
          >
            <button
              onClick={() => {
                removeGridObject(objectMenu.objectId);
                setObjectMenu(null);
              }}
              className="block w-full px-3 py-1 text-left text-red-400 hover:bg-gray-700 rounded"
            >
              🗑️ Delete
            </button>
          </div>
        )}
        
        {/* Emoji Selector */}
        {emojiSelector && (
          <div
            className="fixed bg-gray-800 border border-gray-600 rounded-lg p-3 z-50 shadow-xl"
            style={{ 
              left: emojiSelector.x, 
              top: emojiSelector.y,
              transform: 'translate(-50%, 10px)'
            }}
          >
            <div className="grid grid-cols-8 gap-1 mb-2">
              {OBJECT_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEmojiSelector(null)}
              className="w-full text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
        
        {/* Text Edit Dialog */}
        {textEditDialog && (
          <div
            className="fixed bg-gray-800 border border-gray-600 rounded-lg p-3 z-50 shadow-xl"
            style={{ left: textEditDialog.x, top: textEditDialog.y }}
          >
            <input
              type="text"
              defaultValue={textEditDialog.initialText || ''}
              placeholder="Enter text..."
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm w-48"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTextSubmit((e.target as HTMLInputElement).value);
                } else if (e.key === 'Escape') {
                  setTextEditDialog(null);
                }
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                  handleTextSubmit(input.value);
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
              >
                Add
              </button>
              <button
                onClick={() => setTextEditDialog(null)}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedBattlemap;
