"use client";

import { Question, AnswerOption } from "@/types/culture";
import { Plus, Trash2 } from "lucide-react";

interface QuizBuilderProps {
  quiz: Question[];
  onUpdateQuiz: (quiz: Question[]) => void;
}

export default function QuizBuilder({ quiz, onUpdateQuiz }: QuizBuilderProps) {
  const addQuestion = () => {
    const newQuestion: Question = {
      id: new Date().toISOString(),
      text: "",
      type: "Multiple Choice",
      options: [
        { id: "1", text: "" },
        { id: "2", text: "" },
      ],
      correctAnswerId: "1",
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
        <button
          onClick={addQuestion}
          className="bg-warm-gray/20 text-charcoal py-2 px-4 rounded-md flex items-center shadow-soft hover:bg-warm-gray/30 transition-all"
        >
          <Plus size={16} className="mr-2" />
          <span>Add Question</span>
        </button>
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

function QuestionEditor({
  question,
  onUpdate,
  onDelete,
}: QuestionEditorProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...question, text: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as "Multiple Choice" | "True/False";
    const newOptions =
      newType === "Multiple Choice" ? question.options : [];
    const newCorrectAnswer = newType === "Multiple Choice" ? (question.options[0]?.id || "1") : "True";
    onUpdate({ ...question, type: newType, options: newOptions, correctAnswerId: newCorrectAnswer });
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    const newOptions = question.options.map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt
    );
    onUpdate({ ...question, options: newOptions });
  };

  const handleCorrectAnswerChange = (id: string) => {
    onUpdate({ ...question, correctAnswerId: id });
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
        <button onClick={() => onDelete(question.id)} className="ml-4 text-warm-gray hover:text-red-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
      <div className="mt-4 flex items-center">
        <label className="mr-4 text-sm text-warm-gray">Type:</label>
        <select value={question.type} onChange={handleTypeChange} className="p-2 bg-alabaster rounded-md border border-warm-gray/30 text-charcoal focus:ring-1 focus:ring-charcoal">
          <option value="Multiple Choice">Multiple Choice</option>
          <option value="True/False">True/False</option>
        </select>
      </div>
      <div className="mt-4 pl-2">
        {question.type === "Multiple Choice" && (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="radio"
                  name={`correct-answer-${question.id}`}
                  checked={question.correctAnswerId === option.id}
                  onChange={() => handleCorrectAnswerChange(option.id)}
                  className="mr-3 h-4 w-4 text-charcoal bg-warm-gray/20 border-warm-gray/30 focus:ring-charcoal"
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  placeholder="Answer option..."
                  className="flex-grow p-2 bg-transparent border-b border-warm-gray/30 focus:outline-none focus:border-charcoal text-charcoal"
                />
              </div>
            ))}
          </div>
        )}
        {question.type === "True/False" && (
          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={`correct-answer-${question.id}`}
                value="True"
                checked={question.correctAnswerId === "True"}
                onChange={() => handleCorrectAnswerChange("True")}
                className="mr-2 h-4 w-4 text-charcoal bg-warm-gray/20 border-warm-gray/30 focus:ring-charcoal"
              />
              True
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={`correct-answer-${question.id}`}
                value="False"
                checked={question.correctAnswerId === "False"}
                onChange={() => handleCorrectAnswerChange("False")}
                className="mr-2 h-4 w-4 text-charcoal bg-warm-gray/20 border-warm-gray/30 focus:ring-charcoal"
              />
              False
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
