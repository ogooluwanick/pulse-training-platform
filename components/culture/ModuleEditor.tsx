'use client';

import { Module } from '@/types/culture';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import QuizBuilder from './QuizBuilder';
import { Trash2 } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface ModuleEditorProps {
  module: Module | null;
  onUpdate: (module: Module) => void;
  onDelete: (moduleId: string) => void;
}

export default function ModuleEditor({
  module,
  onUpdate,
  onDelete,
}: ModuleEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setContent(module.content);
    }
  }, [module]);

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-warm-gray">
        <p className="text-xl">Select a module to begin</p>
        <p className="text-sm">or create a new one to get started</p>
      </div>
    );
  }

  const handleSaveChanges = () => {
    if (module) {
      onUpdate({ ...module, title, content });
    }
  };

  const handleDelete = () => {
    if (module) {
      onDelete(module.id);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 rounded-lg h-full flex flex-col text-charcoal">
      <div className="flex-grow overflow-y-auto pr-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Module Title"
          className="w-full p-3 mb-6 bg-white text-charcoal rounded-md text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-charcoal shadow-soft"
        />
        <div className="quill-light-theme mb-6">
          <ReactQuill
            value={content}
            onChange={setContent}
            theme="snow"
            modules={{
              toolbar: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [
                  { list: 'ordered' },
                  { list: 'bullet' },
                  { indent: '-1' },
                  { indent: '+1' },
                ],
                ['link', 'image'],
                ['clean'],
              ],
            }}
          />
        </div>
        <QuizBuilder
          quiz={module.quiz}
          onUpdateQuiz={(newQuiz) => {
            if (module) {
              onUpdate({ ...module, quiz: newQuiz });
            }
          }}
        />
      </div>
      <div className="flex justify-end items-center mt-6 pt-4 border-t border-warm-gray/20 space-x-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-red-500 hover:text-red-400 flex items-center transition-colors"
        >
          <Trash2 size={16} className="mr-2" />
          <span>Delete Module</span>
        </button>
        <button
          onClick={handleSaveChanges}
          className="bg-charcoal text-white py-2 px-6 rounded-md shadow-soft hover:bg-charcoal/90 transition-all"
        >
          Save Changes
        </button>
      </div>
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
