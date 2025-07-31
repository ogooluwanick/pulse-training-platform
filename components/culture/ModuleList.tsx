'use client';

import { Module } from '@/types/culture';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ModuleListProps {
  modules: Module[];
  selectedModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  onAddModule: () => void;
  onDeleteModule: (moduleId: string) => void;
  isCreating?: boolean;
  isDeleting?: boolean;
}

export default function ModuleList({
  modules,
  selectedModuleId,
  onSelectModule,
  onAddModule,
  onDeleteModule,
  isCreating = false,
  isDeleting = false,
}: ModuleListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  const openModal = (moduleId: string) => {
    setModuleToDelete(moduleId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setModuleToDelete(null);
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (moduleToDelete) {
      onDeleteModule(moduleToDelete);
    }
    closeModal();
  };

  return (
    <div className="p-4 h-full text-charcoal">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-charcoal">Course Modules</h2>
        <button
          onClick={onAddModule}
          disabled={isCreating || isDeleting}
          className="bg-charcoal text-white py-2 px-4 rounded-md flex items-center shadow-soft hover:bg-charcoal/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Plus size={18} className="mr-2" />
              <span>Add Module</span>
            </>
          )}
        </button>
      </div>
      <div className="space-y-3">
        {modules.map((module) => (
          <div
            key={module.id}
            className={`flex items-center justify-between p-4 rounded-lg cursor-pointer bg-white shadow-soft transition-all duration-200 ${
              selectedModuleId === module.id
                ? 'border-2 border-charcoal bg-warm-gray/10'
                : 'border border-transparent hover:bg-warm-gray/10'
            } ${isDeleting ? 'opacity-50' : ''}`}
            onClick={() => !isDeleting && onSelectModule(module.id)}
          >
            <h3 className="font-semibold text-charcoal truncate pr-4">
              {module.title || 'Untitled Module'}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal(module.id);
              }}
              disabled={isDeleting}
              className="text-warm-gray hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
