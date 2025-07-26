'use client';

import { useState } from 'react';
import { Module } from '@/types/culture';
import ModuleList from '@/components/culture/ModuleList';
import ModuleEditor from '@/components/culture/ModuleEditor';
import { useCultureModules } from '@/hooks/use-culture-modules';
import { toast } from 'sonner';
import FullPageLoader from '@/components/full-page-loader';

export default function CultureBuilderPage() {
  const {
    modules,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createModule,
    updateModule,
    deleteModule,
  } = useCultureModules();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const handleAddModule = async () => {
    const newModule = await createModule();
    if (newModule) {
      setSelectedModule(newModule);
      toast.success('New culture module created');
    } else {
      toast.error('Failed to create culture module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    const success = await deleteModule(moduleId);
    if (success) {
      if (selectedModule?.id === moduleId) {
        setSelectedModule(null);
      }
      toast.success('Culture module deleted');
    } else {
      toast.error('Failed to delete culture module');
    }
  };

  const handleUpdateModule = async (updatedModule: Module) => {
    const result = await updateModule(updatedModule.id, updatedModule);
    if (result) {
      setSelectedModule(result);
      toast.success('Culture module updated');
    } else {
      toast.error('Failed to update culture module');
    }
  };

  // Show initial loading state only
  if (loading) {
    return <FullPageLoader placeholder="culture modules" />;
  }

  return (
    <div className="flex h-screen bg-parchment">
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full">
        <div className="w-[25%] max-w-[25%] bg-alabaster border-r border-warm-gray/20">
          <ModuleList
            modules={modules}
            selectedModule={selectedModule}
            onSelectModule={setSelectedModule}
            onAddModule={handleAddModule}
            onDeleteModule={handleDeleteModule}
            isCreating={isCreating}
            isDeleting={isDeleting}
          />
        </div>
        <div className="w-[75%] max-w-[75%] p-4">
          <ModuleEditor
            module={selectedModule}
            onUpdate={handleUpdateModule}
            onDelete={handleDeleteModule}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
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
              onDelete={async (moduleId) => {
                await handleDeleteModule(moduleId);
                setSelectedModule(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
