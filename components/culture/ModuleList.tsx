"use client";

import { Module } from "@/types/culture";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface ModuleListProps {
  modules: Module[];
  selectedModule: Module | null;
  onSelectModule: (module: Module) => void;
  onAddModule: () => void;
  onDeleteModule: (moduleId: string) => void;
}

export default function ModuleList({
  modules,
  selectedModule,
  onSelectModule,
  onAddModule,
  onDeleteModule,
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-charcoal">Culture Modules</h2>
        <button
          onClick={onAddModule}
          className="bg-charcoal text-white py-2 px-4 rounded-md flex items-center shadow-soft hover:bg-charcoal/90 transition-all"
        >
          <Plus size={18} className="mr-2" />
          <span>Add Module</span>
        </button>
      </div>
      <div className="space-y-3">
        {modules.map((module) => (
          <div
            key={module.id}
            className={`flex items-center justify-between p-4 rounded-lg cursor-pointer bg-white shadow-soft transition-all duration-200 ${
              selectedModule?.id === module.id
                ? "border-2 border-charcoal bg-warm-gray/10"
                : "border border-transparent hover:bg-warm-gray/10"
            }`}
            onClick={() => onSelectModule(module)}
          >
            <h3 className="font-semibold text-charcoal truncate pr-4">
              {module.title || "Untitled Module"}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal(module.id);
              }}
              className="text-warm-gray hover:text-red-500"
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
