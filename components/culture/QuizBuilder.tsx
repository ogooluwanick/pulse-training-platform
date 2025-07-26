'use client';

import { Question, AnswerOption } from '@/types/culture';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface QuizBuilderProps {
  quiz: Question[];
  onUpdateQuiz: (quiz: Question[]) => void;
}

export default function QuizBuilder({ quiz, onUpdateQuiz }: QuizBuilderProps) {
  const addQuestion = () => {
    const newQuestion: Question = {
      id: new Date().toISOString(),
      text: '',
      type: 'Multiple Choice',
      options: [
        { id: '1', text: '' },
        { id: '2', text: '' },
      ],
      correctAnswerId: '1',
      answer: '', // Initialize answer field
    };
    onUpdateQuiz([...quiz, newQuestion]);
  };

  const deleteQuestion = (questionId: string) => {
    onUpdateQuiz(quiz.filter((q) => q.id !== questionId));
  };

  const updateQuestion = (updatedQuestion: Question) => {
    onUpdateQuiz(
      quiz.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h3 className="text-xl font-bold text-charcoal">Module Quiz</h3>
        <Button
          onClick={addQuestion}
          variant="outline"
          className="bg-warm-gray/20 text-charcoal hover:bg-warm-gray/30"
        >
          <Plus size={16} className="mr-2" />
          <span>Add Question</span>
        </Button>
      </div>
      <div className="space-y-4">
        {quiz.map((question) => (
          <QuestionEditor
            key={question.id}
            question={question}
            onUpdate={updateQuestion}
            onDelete={deleteQuestion}
          />
        ))}
      </div>
    </div>
  );
}

interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

function QuestionEditor({ question, onUpdate, onDelete }: QuestionEditorProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...question, text: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'Multiple Choice' | 'True/False';

    if (newType === 'True/False') {
      onUpdate({
        ...question,
        type: newType,
        options: [],
        correctAnswerId: 'True',
        answer: 'True', // Set answer field for true/false
      });
    } else {
      // Multiple Choice - ensure at least 2 options
      const newOptions =
        question.options.length >= 2
          ? question.options
          : [
              { id: '1', text: '' },
              { id: '2', text: '' },
            ];
      onUpdate({
        ...question,
        type: newType,
        options: newOptions,
        correctAnswerId: newOptions[0]?.id || '1',
        answer: '', // Clear answer field for multiple choice
      });
    }
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    const newOptions = question.options.map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt
    );
    onUpdate({ ...question, options: newOptions });
  };

  const handleCorrectAnswerChange = (answerId: string) => {
    const updatedQuestion: Question = {
      ...question,
      correctAnswerId: answerId,
      // For true/false questions, also set the answer field for backend validation
      answer: question.type === 'True/False' ? answerId : question.answer,
    };
    onUpdate(updatedQuestion);
  };

  const addOption = () => {
    if (question.options.length >= 6) return; // Max 6 options

    const newOptionId = (question.options.length + 1).toString();
    const newOptions = [...question.options, { id: newOptionId, text: '' }];
    onUpdate({ ...question, options: newOptions });
  };

  const removeOption = (optionId: string) => {
    if (question.options.length <= 2) return; // Min 2 options

    const newOptions = question.options.filter((opt) => opt.id !== optionId);

    // If we're removing the currently selected correct answer, select the first option
    const newCorrectAnswerId =
      question.correctAnswerId === optionId
        ? newOptions[0]?.id
        : question.correctAnswerId;

    onUpdate({
      ...question,
      options: newOptions,
      correctAnswerId: newCorrectAnswerId,
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-soft">
      <div className="flex justify-between items-start mb-4">
        <input
          type="text"
          value={question.text}
          onChange={handleTextChange}
          placeholder="Question text..."
          className="flex-grow p-2 bg-transparent border-b border-warm-gray/30 focus:outline-none focus:border-charcoal text-charcoal"
        />
        <button
          onClick={() => onDelete(question.id)}
          className="ml-4 text-warm-gray hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-4 flex items-center">
        <label className="mr-4 text-sm text-warm-gray">Type:</label>
        <select
          value={question.type}
          onChange={handleTypeChange}
          className="p-2 bg-alabaster rounded-md border border-warm-gray/30 text-charcoal focus:ring-1 focus:ring-charcoal"
        >
          <option value="Multiple Choice">Multiple Choice</option>
          <option value="True/False">True/False</option>
        </select>
      </div>

      {/* Correct Answer Dropdown for Multiple Choice */}
      {question.type === 'Multiple Choice' && question.options.length > 0 && (
        <div className="mt-4 flex items-center gap-4">
          <Label className="text-sm text-warm-gray">Correct Answer:</Label>
          <Select
            value={question.correctAnswerId}
            onValueChange={handleCorrectAnswerChange}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select correct answer" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.text || `Option ${option.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Correct Answer Selection for True/False */}
      {question.type === 'True/False' && (
        <div className="mt-4 flex items-center gap-4">
          <Label className="text-sm text-warm-gray">Correct Answer:</Label>
          <Select
            value={question.correctAnswerId}
            onValueChange={handleCorrectAnswerChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select answer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="True">True</SelectItem>
              <SelectItem value="False">False</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mt-4 pl-2">
        {question.type === 'Multiple Choice' && (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    question.correctAnswerId === option.id
                      ? 'border-green-500 bg-green-100'
                      : 'border-warm-gray/30'
                  }`}
                >
                  {question.correctAnswerId === option.id && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) =>
                    handleOptionTextChange(option.id, e.target.value)
                  }
                  placeholder={`Option ${option.id}...`}
                  className="flex-grow p-2 bg-transparent border-b border-warm-gray/30 focus:outline-none focus:border-charcoal text-charcoal"
                />
                {question.options.length > 2 && (
                  <button
                    onClick={() => removeOption(option.id)}
                    className="text-warm-gray hover:text-red-500 transition-colors p-1"
                    title="Remove option"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={addOption}
                disabled={question.options.length >= 6}
                variant="outline"
                size="sm"
                className="text-charcoal border-warm-gray/30 hover:bg-warm-gray/10"
              >
                <Plus size={14} className="mr-1" />
                Add Option
              </Button>
              <span className="text-xs text-warm-gray">
                ({question.options.length}/6 options)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
