'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Module } from '@/types/culture';
import ModuleList from '@/components/culture/ModuleList';
import ModuleEditor from '@/components/culture/ModuleEditor';
import FullPageLoader from '@/components/full-page-loader';
import { useCultureModules } from '@/hooks/use-culture-modules';
import toast from 'react-hot-toast';

export default function CultureBuilderPage() {
  const { data: session, status } = useSession();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const {
    modules,
    loading,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createModule,
    updateModule,
    deleteModule,
  } = useCultureModules({ isAdmin: true });

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;

  const handleAddModule = async () => {
    const newModule = await createModule();
    if (newModule) {
      setSelectedModuleId(newModule.id);
      toast.success('New course module created');
    } else {
      toast.error('Failed to create course module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    const success = await deleteModule(moduleId);
    if (success) {
      setSelectedModuleId(null);
      toast.success('Course module deleted');
    } else {
      toast.error('Failed to delete course module');
    }
  };

  const handleUpdateModule = async (module: Module) => {
    // Extract the module ID and create the updates object
    const { id, ...updates } = module;
    const updatedModule = await updateModule(id, updates);
    if (updatedModule) {
      toast.success('Course module updated');
    } else {
      toast.error('Failed to update course module');
    }
  };

  if (status === 'loading') {
    return <FullPageLoader placeholder="Loading session..." />;
  }

  // Show full page loader when fetching modules
  if (loading || isLoading) {
    return <FullPageLoader placeholder="Loading course modules..." />;
  }

  return (
    <div className="flex h-full">
      {/* Module List - Left Sidebar */}
      <div className="w-[25%] max-w-[25%] bg-warm-gray/5 border-r border-warm-gray/20">
        <ModuleList
          modules={modules}
          selectedModuleId={selectedModuleId}
          onSelectModule={setSelectedModuleId}
          onAddModule={handleAddModule}
          onDeleteModule={handleDeleteModule}
          isCreating={isCreating}
          isDeleting={isDeleting}
        />
      </div>

      {/* Module Editor - Main Content */}
      <div className="w-[75%] max-w-[75%] overflow-auto">
        {selectedModule ? (
          <ModuleEditor
            module={selectedModule}
            onUpdate={handleUpdateModule}
            onDelete={handleDeleteModule}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-charcoal mb-4">
                Welcome to the Course Builder
              </h2>
              <p className="text-warm-gray mb-6 max-w-md">
                As an admin, you can create and manage universal course modules
                for all companies. Select a module from the left panel or create
                a new one to get started.
              </p>
              <button
                onClick={handleAddModule}
                disabled={isCreating}
                className="bg-charcoal text-white px-6 py-3 rounded-lg hover:bg-charcoal/90 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create a New Module'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
