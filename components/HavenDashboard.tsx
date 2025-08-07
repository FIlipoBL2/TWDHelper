



import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import Clock from './common/Clock';
import EditableField from './common/EditableField';
import { TrashIcon, PlusIcon } from './common/Icons';
import InlineConfirmation from './common/InlineConfirmation';
import NpcList from './NpcList';
import { NPCList } from './npc/NPCList';
import { AnimalList as NewAnimalList } from './animal/AnimalList';

const HavenDashboard: React.FC = () => {
  const { gameState, isEditMode, updateHaven, addHavenProject, updateHavenProject, removeHavenProject, addHavenIssue, removeHavenIssue } = useGameState();
  const { haven } = gameState;
  const [newIssue, setNewIssue] = useState('');

  const handleAddIssue = () => {
    addHavenIssue(newIssue);
    setNewIssue('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <EditableField 
          isEditing={isEditMode}
          value={haven.name}
          onChange={v => updateHaven({ name: v })}
          inputClassName="text-2xl font-bold text-red-500"
        />
        <p className="text-gray-400 mb-6">Current status of the group's home base.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Stats */}
          <div className="md:col-span-1 space-y-6">
            <Card className="text-center">
              <EditableField isEditing={isEditMode} value={haven.capacity} onChange={v => updateHaven({capacity: Number(v)})} type="number" inputClassName="text-4xl font-bold text-center" />
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Capacity</div>
            </Card>
            <Card className="text-center">
              <EditableField isEditing={isEditMode} value={haven.defense} onChange={v => updateHaven({defense: Number(v)})} type="number" inputClassName="text-4xl font-bold text-center" />
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Defense</div>
            </Card>
            <Card>
              <h3 className="text-lg font-bold text-red-400 mb-2">Haven Issues</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-400">
                {haven.issues.map((issue, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{issue}</span>
                    {isEditMode && (
                       <InlineConfirmation question="Delete?" onConfirm={() => removeHavenIssue(index)}>
                          {start => <button onClick={start} className="text-red-500 hover:text-red-400"><TrashIcon/></button>}
                      </InlineConfirmation>
                    )}
                  </li>
                ))}
              </ul>
              {isEditMode && (
                <div className="mt-4 flex gap-2">
                  <input value={newIssue} onChange={e => setNewIssue(e.target.value)} placeholder="New issue..." className="flex-grow bg-gray-700 p-1 rounded"/>
                  <button onClick={handleAddIssue} className="bg-red-700 text-white px-3 rounded">Add</button>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Projects */}
          <div className="md:col-span-2">
            <Card>
              <h3 className="text-lg font-bold text-red-400 mb-4">Ongoing Projects</h3>
              {isEditMode ? (
                  // EDIT MODE LAYOUT
                  <div className="space-y-4">
                      {haven.projects.map((project) => (
                          <div key={project.id} className="p-3 bg-gray-900/50 rounded-lg space-y-3">
                              <div className="flex justify-between items-center">
                                  <input value={project.name} onChange={e => updateHavenProject(project.id, {name: e.target.value})} className="flex-grow bg-gray-700 p-1 rounded font-bold" />
                                  <InlineConfirmation question="Delete?" onConfirm={() => removeHavenProject(project.id)}>
                                    {start => <button onClick={start} className="text-red-500 hover:text-red-400 ml-2 flex-shrink-0"><TrashIcon/></button>}
                                  </InlineConfirmation>
                              </div>
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <label className="text-sm text-gray-400">Progress:</label>
                                      <button onClick={() => updateHavenProject(project.id, { current: Math.max(0, project.current - 1) })} className="bg-gray-600 hover:bg-gray-500 rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg">-</button>
                                      <span className="font-bold text-white tabular-nums">{project.current} / {project.max}</span>
                                      <button onClick={() => updateHavenProject(project.id, { current: Math.min(project.max, project.current + 1) })} className="bg-gray-600 hover:bg-gray-500 rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg">+</button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <label className="text-sm text-gray-400">Segments:</label>
                                      <input 
                                          type="number" 
                                          min="1"
                                          value={project.max} 
                                          onChange={e => updateHavenProject(project.id, { max: Number(e.target.value) || 1, current: Math.min(project.current, Number(e.target.value) || 1) })} 
                                          className="w-16 bg-gray-700 p-1 rounded" 
                                      />
                                  </div>
                              </div>
                          </div>
                      ))}
                      <button onClick={addHavenProject} className="w-full mt-4 bg-red-800/50 hover:bg-red-800/80 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Add Project
                      </button>
                  </div>
              ) : (
                  // VIEW MODE LAYOUT
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {haven.projects.map((project) => (
                          <div key={project.id} className="flex flex-col items-center text-center p-2 bg-gray-700/50 rounded-lg">
                              <Clock current={project.current} max={project.max} size={100} />
                              <p className="font-bold text-white mt-2">{project.name}</p>
                              <p className="text-sm text-gray-400 mb-2">{project.current} / {project.max}</p>
                              <div className="flex items-center gap-2">
                                  <button
                                      onClick={() => updateHavenProject(project.id, { current: Math.max(0, project.current - 1) })}
                                      className="bg-gray-600 hover:bg-gray-500 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold transition-colors"
                                      aria-label={`Decrease progress for ${project.name}`}
                                  >
                                      -
                                  </button>
                                  <button
                                      onClick={() => updateHavenProject(project.id, { current: Math.min(project.max, project.current + 1) })}
                                      className="bg-gray-600 hover:bg-gray-500 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold transition-colors"
                                      aria-label={`Increase progress for ${project.name}`}
                                  >
                                      +
                                  </button>
                              </div>
                          </div>
                      ))}
                      {haven.projects.length === 0 && <p className="text-center text-gray-500 col-span-2">No active projects.</p>}
                  </div>
              )}
            </Card>
          </div>
        </div>
      </Card>

      {/* Haven Survivors */}
      <div className="space-y-4">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-red-400 mb-2">Haven Survivors</h3>
          <p className="text-gray-400 text-sm mb-4">
            NPCs currently assigned to the haven. Use the "↗" button to remove them from the haven.
          </p>
        </div>
        
        <NPCList 
          inHavenOnly={true}
          showOnlyHavenSurvivors={true}
          showHavenControls={true}
          allowHavenManagement={true}
          title="Haven NPCs"
          maxDisplayed={15}
        />
        
        <NewAnimalList 
          inHavenOnly={true}
          showOnlyHavenSurvivors={true}
          showHavenControls={true}
          allowHavenManagement={true}
          title="Haven Animals"
          maxDisplayed={10}
        />
      </div>
    </div>
  );
};

export default HavenDashboard;