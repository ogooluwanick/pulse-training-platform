'use client';

import { useState } from 'react';
import { Module } from '@/types/culture';
import ModuleList from '@/components/culture/ModuleList';
import ModuleEditor from '@/components/culture/ModuleEditor';

export default function CultureBuilderPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const handleAddModule = () => {
    const newModule: Module = {
      id: new Date().toISOString(),
      title: 'Untitled Module',
      content: '',
      quiz: [],
    };
    setModules([...modules, newModule]);
    setSelectedModule(newModule);
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules(modules.filter((m) => m.id !== moduleId));
    if (selectedModule?.id === moduleId) {
      setSelectedModule(null);
    }
  };

  const handleUpdateModule = (updatedModule: Module) => {
    setModules(
      modules.map((m) => (m.id === updatedModule.id ? updatedModule : m))
    );
    setSelectedModule(updatedModule);
  };

  return (
    <div className="flex h-screen bg-parchment">
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full">
        <div className="w-[30%] bg-alabaster border-r border-warm-gray/20">
          <ModuleList
            modules={modules}
            selectedModule={selectedModule}
            onSelectModule={setSelectedModule}
            onAddModule={handleAddModule}
            onDeleteModule={handleDeleteModule}
          />
        </div>
        <div className="w-[70%] p-8">
          <ModuleEditor
            module={selectedModule}
            onUpdate={handleUpdateModule}
            onDelete={handleDeleteModule}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden w-full">
        {!selectedModule ? (
          <ModuleList
            modules={modules}
            selectedModule={selectedModule}
            onSelectModule={setSelectedModule}
            onAddModule={handleAddModule}
            onDeleteModule={handleDeleteModule}
          />
        ) : (
          <div className="p-4">
            <button
              onClick={() => setSelectedModule(null)}
              className="mb-4 text-charcoal font-semibold"
            >
              &larr; Back to Modules
            </button>
            <ModuleEditor
              module={selectedModule}
              onUpdate={handleUpdateModule}
              onDelete={(moduleId) => {
                handleDeleteModule(moduleId);
                setSelectedModule(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
