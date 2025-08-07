// NPCListItem - Refactored to follow SOLID principles with original beautiful UI
import React, { useState, useCallback } from 'react';
import { NPC, Skill, SkillExpertise } from '../../types';
import { NPCManagementService, NPCSkillService } from '../../utils/npcUtils';
import { useGameState } from '../../context/GameStateContext';
import { ChevronDownIcon, TrashIcon, PencilIcon } from '../common/Icons';
import InlineConfirmation from '../common/InlineConfirmation';
import { NPCEditor } from './NPCEditor';
import { NPCSkillRoller } from './NPCSkillRoller';

interface NPCListItemProps {
  npc: NPC;
  showHavenControls?: boolean;
  onEdit?: (npc: NPC) => void;
  showOnlyHavenSurvivors?: boolean;
  allowHavenManagement?: boolean;
  isEditMode?: boolean;
}

export const NPCListItem: React.FC<NPCListItemProps> = ({
  npc,
  showHavenControls = true,
  onEdit,
  showOnlyHavenSurvivors = false,
  allowHavenManagement = true,
  isEditMode = true
}) => {
  const { addNpcToHaven, removeNpcFromHaven, removeNpc } = useGameState();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const handleMoveToHaven = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (NPCManagementService.canBeMovedToHaven(npc)) {
      addNpcToHaven(npc.id);
    }
  }, [npc, addNpcToHaven]);

  const handleRemoveFromHaven = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (NPCManagementService.canBeRemovedFromHaven(npc)) {
      removeNpcFromHaven(npc.id);
    }
  }, [npc, removeNpcFromHaven]);

  const handleDelete = useCallback(() => {
    removeNpc(npc.id, npc.name);
  }, [npc.id, npc.name, removeNpc]);

  const canMoveToHaven = NPCManagementService.canBeMovedToHaven(npc);
  const canRemoveFromHaven = NPCManagementService.canBeRemovedFromHaven(npc);
  const expertiseSkills = NPCSkillService.getExpertiseSkills(npc);

  const headerBg = npc.health > 0 ? 'bg-gray-700/50 hover:bg-gray-700/80' : 'bg-red-900/40 hover:bg-red-900/60';
  const headerTextColor = npc.health > 0 ? 'text-white' : 'text-red-300';

  const ReadOnlyView = () => (
    <div className="space-y-4 text-sm animate-fade-in">
      {expertiseSkills.length > 0 && (
        <div>
          <h4 className="font-bold text-red-400 mb-2">Skills & Expertise</h4>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {expertiseSkills.map(skill => (
              <div key={skill} className="bg-blue-500/20 p-2 rounded-lg">
                <div className="font-medium text-blue-300">{skill}</div>
                <div className="text-xs text-gray-400">
                  {NPCSkillService.getSkillLevel(npc, skill)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Skill Rolling */}
          <div className="bg-gray-700/30 p-3 rounded-lg">
            <h5 className="font-medium text-white mb-2">Roll Skills</h5>
            <NPCSkillRoller npc={npc} />
          </div>
        </div>
      )}

      {npc.issues && npc.issues.length > 0 && (
        <div>
          <h4 className="font-bold text-red-400">Issues</h4>
          <div className="space-y-1 mt-2">
            {npc.issues.map((issue, index) => {
              const isSecret = issue.toLowerCase().includes('secret') || issue.startsWith('*');
              return (
                <p key={index} className={`text-sm ${isSecret ? 'text-red-300 italic' : 'text-gray-300'}`}>
                  {isSecret ? '🔒 ' : '• '}{issue}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {npc.inventory && npc.inventory.length > 0 && (
        <div>
          <h4 className="font-bold text-red-400">Inventory & Equipment</h4>
          <div className="mt-2 space-y-1">
            {npc.inventory.map((item, index) => (
              <p key={index} className="text-gray-300 text-sm">
                {item.toLowerCase().includes('unarmed') && '🥊 '}
                {item.toLowerCase().includes('weapon') && '⚔️ '}
                {item.toLowerCase().includes('armor') && '🛡️ '}
                {item}
              </p>
            ))}
          </div>
        </div>
      )}
      
      {/* Always show unarmed combat info */}
      {(!npc.inventory || npc.inventory.length === 0 || !npc.inventory.some(item => item.toLowerCase().includes('unarmed'))) && (
        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
          <h4 className="font-bold text-blue-400 text-sm">Default Combat</h4>
          <p className="text-blue-300 text-sm">🥊 Unarmed (1 damage, Close Combat skill)</p>
        </div>
      )}

      {/* Edit Button */}
      {isEditMode && (
        <div className="pt-3 border-t border-gray-600">
          <button
            onClick={() => setShowEditor(true)}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <PencilIcon />
            Edit NPC Details
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <header 
        className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${headerBg}`}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`npc-details-${npc.id}`}
      >
        <div className="flex-grow flex items-center gap-2">
          <div>
            <p className={`font-bold ${headerTextColor}`}>
              {npc.isCompanion ? '🤝' : '👤'} {npc.name}
              {npc.isCompanion && (
                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                  Companion
                </span>
              )}
            </p>
            <p className="text-sm font-normal text-gray-400">{npc.archetype}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0 ml-2">
          <div className="text-center">
            <p className="font-bold text-lg">{npc.health}</p>
            <p className="text-xs text-gray-400 uppercase">HP</p>
          </div>
          
          {npc.attackDice && npc.attackDice > 0 && (
            <div className="text-center">
              <p className="font-bold text-lg text-green-400">{npc.attackDice}</p>
              <p className="text-xs text-gray-400 uppercase">ATK</p>
            </div>
          )}
          
          {npc.damage && (
            <div className="text-center">
              <p className="font-bold text-lg text-red-400">{npc.damage}</p>
              <p className="text-xs text-gray-400 uppercase">DMG</p>
            </div>
          )}

          {isEditMode && (
            <InlineConfirmation
              question="Delete?"
              onConfirm={handleDelete}
            >
              {(startConfirmation) => (
                <button
                  onClick={(e) => { e.stopPropagation(); startConfirmation(e); }}
                  className="text-gray-400 hover:text-red-400 p-2 rounded-full"
                  aria-label={`Delete ${npc.name}`}
                >
                  <TrashIcon />
                </button>
              )}
            </InlineConfirmation>
          )}
          
          {/* Haven Management Buttons */}
          {isEditMode && allowHavenManagement && showHavenControls && (
            <>
              {showOnlyHavenSurvivors ? (
                <button
                  onClick={handleRemoveFromHaven}
                  className="text-orange-400 hover:text-orange-300 p-2 rounded-full text-xs"
                  aria-label={`Remove ${npc.name} from haven`}
                  title="Remove from Haven"
                >
                  ↗
                </button>
              ) : (
                npc.isInHaven === false && (
                  <button
                    onClick={handleMoveToHaven}
                    className="text-green-400 hover:text-green-300 p-2 rounded-full text-xs"
                    aria-label={`Add ${npc.name} to haven`}
                    title="Add to Haven"
                  >
                    ↙
                  </button>
                )
              )}
            </>
          )}
          
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </div>
        </div>
      </header>

      {isExpanded && (
        <section 
          id={`npc-details-${npc.id}`} 
          className="border-t border-gray-600 bg-gray-800/50"
        >
          <div className="p-4">
            <ReadOnlyView />
          </div>
        </section>
      )}
      
      {/* NPC Editor Modal */}
      {showEditor && (
        <NPCEditor
          npc={npc}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};
