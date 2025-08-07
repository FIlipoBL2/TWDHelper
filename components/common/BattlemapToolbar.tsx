import React from 'react';
import { BattlemapTool } from '../../types';

interface BattlemapToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  onGenerateMap: () => void;
  onClearRulers: () => void;
  mapPrompt: string;
  onMapPromptChange: (prompt: string) => void;
  isGenerating?: boolean;
}

const BATTLEMAP_TOOLS: BattlemapTool[] = [
  { type: 'select', name: 'Select', icon: '↖️', cursor: 'default' },
  { type: 'text', name: 'Text', icon: '📝', cursor: 'text' },
  { type: 'circle', name: 'Circle', icon: '⭕', cursor: 'crosshair' },
  { type: 'rectangle', name: 'Rectangle', icon: '⬜', cursor: 'crosshair' },
  { type: 'line', name: 'Line', icon: '📏', cursor: 'crosshair' },
  { type: 'emoji', name: 'Objects', icon: '🚗', cursor: 'copy' },
  { type: 'ruler', name: 'Ruler', icon: '📐', cursor: 'crosshair' },
];

const BattlemapToolbar: React.FC<BattlemapToolbarProps> = ({
  selectedTool,
  onToolSelect,
  onGenerateMap,
  onClearRulers,
  mapPrompt,
  onMapPromptChange,
  isGenerating = false
}) => {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Battlemap Generation */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <input
            type="text"
            value={mapPrompt}
            onChange={(e) => onMapPromptChange(e.target.value)}
            placeholder="Describe the battlemap (e.g., 'abandoned highway with crashed cars')"
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm min-w-0 flex-1 sm:w-64"
            disabled={isGenerating}
          />
          <button
            onClick={onGenerateMap}
            disabled={isGenerating || !mapPrompt.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors whitespace-nowrap"
          >
            {isGenerating ? '🔄 Generating...' : '🎨 Generate Map'}
          </button>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-600"></div>

        {/* Drawing Tools */}
        <div className="flex flex-wrap gap-2">
          {BATTLEMAP_TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => onToolSelect(tool.type)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors border ${
                selectedTool === tool.type
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              title={tool.name}
            >
              {tool.icon} {tool.name}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-600"></div>

        {/* Utility Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClearRulers}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium transition-colors"
            title="Clear all ruler measurements"
          >
            🗑️ Clear Rulers
          </button>
        </div>
      </div>

      {/* Tool Instructions */}
      <div className="mt-3 text-xs text-gray-400">
        {selectedTool === 'select' && '↖️ Click to select objects. Drag to move. Right-click to delete.'}
        {selectedTool === 'text' && '📝 Click to place text. Double-click to edit existing text.'}
        {selectedTool === 'circle' && '⭕ Click and drag to draw circles.'}
        {selectedTool === 'rectangle' && '⬜ Click and drag to draw rectangles.'}
        {selectedTool === 'line' && '📏 Click and drag to draw lines.'}
        {selectedTool === 'emoji' && '🚗 Click to place objects. A menu will appear to choose the object type.'}
        {selectedTool === 'ruler' && '📐 Click and drag to measure distance. Click ruler lines to remove them.'}
      </div>
    </div>
  );
};

export default BattlemapToolbar;
