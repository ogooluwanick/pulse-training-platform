'use client';

import { Question, AnswerOption } from '@/types/course';
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
    const defaultOptions = [
      { id: '1', text: 'Option 1' },
      { id: '2', text: 'Option 2' },
    ];

    const newQuestion: Question = {
      id: new Date().toISOString(),
      text: '',
      type: 'Multiple Choice',
      options: defaultOptions,
      correctAnswerId: '1',
      answer: 'Option 1', // ALWAYS set to first option by default
    };

    console.log('=== NEW QUESTION CREATED ===');
    console.log('New question:', newQuestion);

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
  // Helper function to get the answer text for current correct answer
  const getCurrentAnswerText = (question: Question): string => {
    if (question.type === 'True/False') {
      return question.correctAnswerId || 'True';
    } else if (question.type === 'Multiple Choice') {
      const selectedOption = question.options.find(
        (opt) => opt.id === question.correctAnswerId
      );
      return selectedOption?.text || question.options[0]?.text || '';
    }
    return '';
  };

  // Helper function to ensure question has proper answer field
  const ensureAnswerField = (question: Question): Question => {
    const answerText = getCurrentAnswerText(question);
    return {
      ...question,
      answer: answerText,
    };
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedQuestion = ensureAnswerField({
      ...question,
      text: e.target.value,
    });
    onUpdate(updatedQuestion);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'Multiple Choice' | 'True/False';

    console.log('=== QUESTION TYPE CHANGE ===');
    console.log('New type:', newType);
    console.log('Previous question:', question);

    if (newType === 'True/False') {
      const updatedQuestion = {
        ...question,
        type: newType,
        options: [],
        correctAnswerId: 'True',
        answer: 'True', // Set answer field for true/false
      };
      console.log('Updated to True/False:', updatedQuestion);
      onUpdate(updatedQuestion);
    } else {
      // Multiple Choice - ensure at least 2 options with default text
      const newOptions =
        question.options.length >= 2
          ? question.options.map((opt, index) => ({
              ...opt,
              text: opt.text || `Option ${index + 1}`, // Ensure options have default text
            }))
          : [
              { id: '1', text: 'Option 1' },
              { id: '2', text: 'Option 2' },
            ];

      const firstOptionId = newOptions[0]?.id || '1';
      const firstOptionText = newOptions[0]?.text || 'Option 1';

      const updatedQuestion = {
        ...question,
        type: newType,
        options: newOptions,
        correctAnswerId: firstOptionId,
        answer: firstOptionText, // ALWAYS set to first option
      };
      console.log('Updated to Multiple Choice:', updatedQuestion);
      onUpdate(updatedQuestion);
    }
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    const newOptions = question.options.map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt
    );

    // If this is the currently selected correct answer, update the answer field too
    // OR if no correct answer is selected yet, default to first option
    let updatedAnswer = question.answer;
    if (question.correctAnswerId === optionId) {
      updatedAnswer = text;
    } else if (
      !question.correctAnswerId ||
      question.correctAnswerId === newOptions[0]?.id
    ) {
      updatedAnswer = newOptions[0]?.text || '';
    }

    console.log('=== OPTION TEXT CHANGE ===');
    console.log('Changed option ID:', optionId);
    console.log('New text:', text);
    console.log('Is correct answer:', question.correctAnswerId === optionId);
    console.log('Updated answer field:', updatedAnswer);

    const updatedQuestion = ensureAnswerField({
      ...question,
      options: newOptions,
      answer: updatedAnswer,
    });
    onUpdate(updatedQuestion);
  };

  const handleCorrectAnswerChange = (answerId: string) => {
    let answerText = '';

    if (question.type === 'True/False') {
      // For true/false, the answer is the answerId itself
      answerText = answerId;
    } else if (question.type === 'Multiple Choice') {
      // For multiple choice, find the selected option's text
      const selectedOption = question.options.find(
        (opt) => opt.id === answerId
      );
      answerText = selectedOption?.text || question.options[0]?.text || '';
    }

    const updatedQuestion: Question = {
      ...question,
      correctAnswerId: answerId,
      answer: answerText, // Always set the answer field to the correct text
    };

    console.log('=== CORRECT ANSWER CHANGE ===');
    console.log('Selected answer ID:', answerId);
    console.log('Answer text:', answerText);
    console.log('Updated question:', updatedQuestion);

    onUpdate(updatedQuestion);
  };

  const addOption = () => {
    if (question.options.length >= 6) return; // Max 6 options

    const newOptionId = (question.options.length + 1).toString();
    const newOptions = [
      ...question.options,
      { id: newOptionId, text: `Option ${question.options.length + 1}` },
    ];

    const updatedQuestion = ensureAnswerField({
      ...question,
      options: newOptions,
    });
    onUpdate(updatedQuestion);
  };

  const removeOption = (optionId: string) => {
    if (question.options.length <= 2) return; // Min 2 options

    const newOptions = question.options.filter((opt) => opt.id !== optionId);

    // If we're removing the currently selected correct answer, select the first option
    let newCorrectAnswerId = question.correctAnswerId;
    let newAnswer = question.answer;

    if (question.correctAnswerId === optionId) {
      newCorrectAnswerId = newOptions[0]?.id || '1';
      newAnswer = newOptions[0]?.text || '';
    }

    const updatedQuestion = {
      ...question,
      options: newOptions,
      correctAnswerId: newCorrectAnswerId,
      answer: newAnswer,
    };

    console.log('=== OPTION REMOVED ===');
    console.log('Removed option ID:', optionId);
    console.log('New correct answer ID:', newCorrectAnswerId);
    console.log('New answer text:', newAnswer);

    onUpdate(updatedQuestion);
  };

  // Ensure this question has a proper answer field before rendering
  const currentQuestion = ensureAnswerField(question);

  return (
    <div className="p-4 bg-white rounded-lg shadow-soft">
      <div className="flex justify-between items-start mb-4">
        <input
          type="text"
          value={currentQuestion.text}
          onChange={handleTextChange}
          placeholder="Question text..."
          className="flex-grow p-2 bg-transparent border-b border-warm-gray/30 focus:outline-none focus:border-charcoal text-charcoal"
        />
        <button
          onClick={() => onDelete(currentQuestion.id)}
          className="ml-4 text-warm-gray hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-4 flex items-center">
        <label className="mr-4 text-sm text-warm-gray">Type:</label>
        <select
          value={currentQuestion.type}
          onChange={handleTypeChange}
          className="p-2 bg-alabaster rounded-md border border-warm-gray/30 text-charcoal focus:ring-1 focus:ring-charcoal"
        >
          <option value="Multiple Choice">Multiple Choice</option>
          <option value="True/False">True/False</option>
        </select>
      </div>

      {/* Correct Answer Dropdown for Multiple Choice */}
      {currentQuestion.type === 'Multiple Choice' &&
        currentQuestion.options.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <Label className="text-sm text-warm-gray">Correct Answer:</Label>
            <Select
              value={
                currentQuestion.correctAnswerId ||
                currentQuestion.options[0]?.id
              }
              onValueChange={handleCorrectAnswerChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                {currentQuestion.options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.text || `Option ${option.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              Answer: "{currentQuestion.answer || 'Not set'}"
            </span>
          </div>
        )}

      {/* Correct Answer Selection for True/False */}
      {currentQuestion.type === 'True/False' && (
        <div className="mt-4 flex items-center gap-4">
          <Label className="text-sm text-warm-gray">Correct Answer:</Label>
          <Select
            value={currentQuestion.correctAnswerId || 'True'}
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
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            Answer: "{currentQuestion.answer || 'Not set'}"
          </span>
        </div>
      )}

      <div className="mt-4 pl-2">
        {currentQuestion.type === 'Multiple Choice' && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    currentQuestion.correctAnswerId === option.id
                      ? 'border-green-500 bg-green-100'
                      : 'border-warm-gray/30'
                  }`}
                >
                  {currentQuestion.correctAnswerId === option.id && (
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
                {currentQuestion.options.length > 2 && (
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
                disabled={currentQuestion.options.length >= 6}
                variant="outline"
                size="sm"
                className="text-charcoal border-warm-gray/30 hover:bg-warm-gray/10"
              >
                <Plus size={14} className="mr-1" />
                Add Option
              </Button>
              <span className="text-xs text-warm-gray">
                ({currentQuestion.options.length}/6 options)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
