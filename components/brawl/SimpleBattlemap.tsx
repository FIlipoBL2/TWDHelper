import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BrawlParticipant } from '../../types/brawl';

interface TeamMember extends BrawlParticipant {
  team: 'A' | 'B';
  tokenImage?: string;
}

interface BattlemapObject {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'text' | 'emoji';
  position: { x: number; y: number };
  size?: { width: number; height: number };
  radius?: number;
  color: string;
  text?: string;
  emoji?: string;
  lineEnd?: { x: number; y: number };
  isSelected?: boolean;
}

interface SimpleBattlemapProps {
  teamA: TeamMember[];
  teamB: TeamMember[];
  objects: BattlemapObject[];
  width: number;
  height: number;
  onParticipantMove: (participantId: string, newPosition: { x: number; y: number }) => void;
  onObjectsChange: (objects: BattlemapObject[]) => void;
}

type Tool = 'select' | 'rectangle' | 'circle' | 'triangle' | 'line' | 'text' | 'emoji' | 'delete';

export const SimpleBattlemap: React.FC<SimpleBattlemapProps> = ({
  teamA,
  teamB,
  objects,
  width,
  height,
  onParticipantMove,
  onObjectsChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentObject, setCurrentObject] = useState<Partial<BattlemapObject> | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [emojiInput, setEmojiInput] = useState('🏢');
  const [currentColor, setCurrentColor] = useState('#ff6600');
  const [dragPreview, setDragPreview] = useState<Partial<BattlemapObject> | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Grid configuration (500x500m map with 5x5 grid = 100m per cell)
  const GRID_SIZE = Math.min(width, height) / 5; // 5x5 grid cells
  const METERS_PER_GRID = 100; // Each grid cell = 100m x 100m
  const TOKEN_SIZE = GRID_SIZE / 5; // Smaller tokens - 1/5 of grid cell (20m)

  // Convert screen coordinates to world coordinates (no zoom)
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: screenX - rect.left - pan.x,
      y: screenY - rect.top - pan.y
    };
  }, [pan]);

  // Convert world coordinates to screen coordinates (no zoom)
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: worldX + pan.x,
      y: worldY + pan.y
    };
  }, [pan]);

  // Draw grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Grid labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const x = i * GRID_SIZE + GRID_SIZE / 2;
        const y = j * GRID_SIZE + GRID_SIZE / 2;
        const gridCoord = `${String.fromCharCode(65 + i)}${j + 1}`;
        ctx.fillText(gridCoord, x, y);
      }
    }

    ctx.restore();
  }, [showGrid, width, height, GRID_SIZE]);

  // Draw objects with triangle support
  const drawObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    objects.forEach(obj => {
      ctx.save();
      ctx.strokeStyle = obj.color;
      ctx.fillStyle = obj.color;
      ctx.lineWidth = 2;

      // Selection highlight
      if (selectedObjects.includes(obj.id)) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
      }

      switch (obj.type) {
        case 'rectangle':
          if (obj.size) {
            ctx.strokeRect(obj.position.x, obj.position.y, obj.size.width, obj.size.height);
            ctx.globalAlpha = 0.3;
            ctx.fillRect(obj.position.x, obj.position.y, obj.size.width, obj.size.height);
          }
          break;

        case 'circle':
          if (obj.radius) {
            ctx.beginPath();
            ctx.arc(obj.position.x, obj.position.y, obj.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.3;
            ctx.fill();
          }
          break;

        case 'triangle':
          if (obj.size) {
            const { x, y } = obj.position;
            const { width, height } = obj.size;
            ctx.beginPath();
            ctx.moveTo(x + width / 2, y); // Top point
            ctx.lineTo(x, y + height); // Bottom left
            ctx.lineTo(x + width, y + height); // Bottom right
            ctx.closePath();
            ctx.stroke();
            ctx.globalAlpha = 0.3;
            ctx.fill();
          }
          break;

        case 'line':
          if (obj.lineEnd) {
            ctx.beginPath();
            ctx.moveTo(obj.position.x, obj.position.y);
            ctx.lineTo(obj.lineEnd.x, obj.lineEnd.y);
            ctx.stroke();
          }
          break;

        case 'text':
          if (obj.text) {
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(obj.text, obj.position.x, obj.position.y);
          }
          break;

        case 'emoji':
          if (obj.emoji) {
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(obj.emoji, obj.position.x, obj.position.y);
          }
          break;
      }

      ctx.restore();
    });
  }, [objects, selectedObjects]);

  // Draw drag preview with ghost effect
  const drawDragPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!dragPreview) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    switch (dragPreview.type) {
      case 'rectangle':
        if (dragPreview.size) {
          ctx.strokeRect(dragPreview.position!.x, dragPreview.position!.y, dragPreview.size.width, dragPreview.size.height);
        }
        break;

      case 'circle':
        if (dragPreview.radius) {
          ctx.beginPath();
          ctx.arc(dragPreview.position!.x, dragPreview.position!.y, dragPreview.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;

      case 'triangle':
        if (dragPreview.size) {
          const { x, y } = dragPreview.position!;
          const { width, height } = dragPreview.size;
          ctx.beginPath();
          ctx.moveTo(x + width / 2, y);
          ctx.lineTo(x, y + height);
          ctx.lineTo(x + width, y + height);
          ctx.closePath();
          ctx.stroke();
        }
        break;

      case 'emoji':
        if (dragPreview.emoji) {
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(dragPreview.emoji, dragPreview.position!.x, dragPreview.position!.y);
        }
        break;
    }

    ctx.restore();
  }, [dragPreview]);

  // Draw participants with token images and smaller size
  const drawParticipants = useCallback((ctx: CanvasRenderingContext2D) => {
    const allParticipants = [...teamA, ...teamB];
    
    allParticipants.forEach(participant => {
      ctx.save();
      
      const { x, y } = participant.position;
      const radius = TOKEN_SIZE / 2;
      
      if (participant.tokenImage) {
        // Draw token image if available
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
          ctx.restore();
          
          // Health indicator border
          const healthPercent = participant.health / participant.maxHealth;
          if (healthPercent < 1) {
            ctx.strokeStyle = healthPercent > 0.5 ? '#fbbf24' : '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
            ctx.stroke();
          }
        };
        img.src = participant.tokenImage;
      } else {
        // Fallback to colored circle with initial
        const teamColor = participant.team === 'A' ? '#3b82f6' : '#ef4444';
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = teamColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Character initial
        ctx.fillStyle = '#ffffff';
        ctx.font = `${radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(participant.name.charAt(0).toUpperCase(), x, y);
        
        // Health indicator
        const healthPercent = participant.health / participant.maxHealth;
        if (healthPercent < 1) {
          ctx.strokeStyle = healthPercent > 0.5 ? '#fbbf24' : '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      ctx.restore();
    });
  }, [teamA, teamB, TOKEN_SIZE]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw layers
    drawGrid(ctx);
    drawObjects(ctx);
    drawDragPreview(ctx);
    drawParticipants(ctx);
  }, [width, height, drawGrid, drawObjects, drawDragPreview, drawParticipants]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    setDragStart({ x, y });
    setIsDragging(true);

    if (selectedTool === 'select') {
      // Check if clicking on participant
      const allParticipants = [...teamA, ...teamB];
      const clickedParticipant = allParticipants.find(p => {
        const distance = Math.sqrt((p.position.x - x) ** 2 + (p.position.y - y) ** 2);
        return distance <= TOKEN_SIZE / 2;
      });

      if (clickedParticipant) {
        setDragTarget(clickedParticipant.id);
        return;
      }

      // Check if clicking on object
      const clickedObject = objects.find(obj => {
        switch (obj.type) {
          case 'rectangle':
            return obj.size && 
              x >= obj.position.x && x <= obj.position.x + obj.size.width &&
              y >= obj.position.y && y <= obj.position.y + obj.size.height;
          case 'circle':
            return obj.radius && 
              Math.sqrt((obj.position.x - x) ** 2 + (obj.position.y - y) ** 2) <= obj.radius;
          default:
            return false;
        }
      });

      if (clickedObject) {
        setSelectedObjects([clickedObject.id]);
      } else {
        setSelectedObjects([]);
      }
    } else if (selectedTool !== 'delete') {
      // Start creating new object
      setIsDrawing(true);
      const newObj: Partial<BattlemapObject> = {
        id: Date.now().toString(),
        type: selectedTool,
        position: { x, y },
        color: currentColor
      };

      if (selectedTool === 'text') {
        newObj.text = textInput || 'Text';
      } else if (selectedTool === 'emoji') {
        newObj.emoji = emojiInput;
      }

      setCurrentObject(newObj);
      setDragPreview(newObj);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    setMousePosition({ x, y });

    if (isDragging) {
      if (dragTarget) {
        // Move participant
        onParticipantMove(dragTarget, { x, y });
      } else if (isDrawing && currentObject) {
        // Update object being drawn
        const updatedObj = { ...currentObject };
        
        switch (currentObject.type) {
          case 'rectangle':
          case 'triangle':
            updatedObj.size = {
              width: Math.abs(x - dragStart.x),
              height: Math.abs(y - dragStart.y)
            };
            updatedObj.position = {
              x: Math.min(dragStart.x, x),
              y: Math.min(dragStart.y, y)
            };
            break;
          case 'circle':
            updatedObj.radius = Math.sqrt((x - dragStart.x) ** 2 + (y - dragStart.y) ** 2);
            break;
          case 'line':
            updatedObj.lineEnd = { x, y };
            break;
        }
        
        setDragPreview(updatedObj);
      }
    } else {
      // Show preview for tools
      if (selectedTool === 'emoji') {
        setDragPreview({
          type: 'emoji',
          position: { x, y },
          emoji: emojiInput,
          color: currentColor
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentObject && dragPreview) {
      // Finalize object creation
      const newObject = { ...dragPreview } as BattlemapObject;
      onObjectsChange([...objects, newObject]);
    }

    setIsDragging(false);
    setIsDrawing(false);
    setDragTarget(null);
    setCurrentObject(null);
    setDragPreview(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'emoji' || selectedTool === 'text') {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      const newObject: BattlemapObject = {
        id: Date.now().toString(),
        type: selectedTool,
        position: { x, y },
        color: currentColor,
        emoji: selectedTool === 'emoji' ? emojiInput : undefined,
        text: selectedTool === 'text' ? textInput || 'Text' : undefined
      };
      onObjectsChange([...objects, newObject]);
    }
  };

  const handleDelete = () => {
    if (selectedObjects.length > 0) {
      const newObjects = objects.filter(obj => !selectedObjects.includes(obj.id));
      onObjectsChange(newObjects);
      setSelectedObjects([]);
    }
  };

  const toolIcons = {
    select: '🖱️',
    rectangle: '⬜',
    circle: '⭕',
    triangle: '🔺',
    line: '📏',
    text: '📝',
    emoji: '😀',
    delete: '🗑️'
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        {/* Tool Selection */}
        <div className="flex gap-1">
          {Object.entries(toolIcons).map(([tool, icon]) => (
            <button
              key={tool}
              onClick={() => setSelectedTool(tool as Tool)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                selectedTool === tool
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Color:</span>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>

        {/* Text Input */}
        {selectedTool === 'text' && (
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text..."
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        )}

        {/* Emoji Input */}
        {selectedTool === 'emoji' && (
          <input
            type="text"
            value={emojiInput}
            onChange={(e) => setEmojiInput(e.target.value)}
            placeholder="🏢"
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm w-16"
          />
        )}

        {/* Delete Button */}
        {selectedObjects.length > 0 && (
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Delete Selected
          </button>
        )}

        {/* Grid toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            showGrid
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Grid
        </button>
      </div>

      {/* Canvas */}
      <div className="border border-gray-600 rounded overflow-hidden bg-gray-900">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          className="cursor-crosshair"
          style={{ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }}
        />
      </div>

      {/* Info panel */}
      <div className="text-sm text-gray-400 space-y-1">
        <div>🗺️ Map Scale: 500m x 500m • Grid: {METERS_PER_GRID}m per cell</div>
        <div>🔵 Blue Team: {teamA.length} • 🔴 Red Team: {teamB.length}</div>
        <div>📊 Objects: {objects.length} • Selected: {selectedObjects.length}</div>
        <div>💡 Click with emoji tool to place objects • Drag to create shapes</div>
        <div>🎯 Mouse: ({Math.round(mousePosition.x)}, {Math.round(mousePosition.y)})</div>
      </div>
    </div>
  );
};
