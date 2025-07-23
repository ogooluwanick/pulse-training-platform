export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'Multiple Choice' | 'True/False';
  options: AnswerOption[];
  correctAnswerId: string; // or boolean for True/False
}

export interface Module {
  id: string;
  title: string;
  content: string; // HTML from WYSIWYG editor
  quiz: Question[];
}
