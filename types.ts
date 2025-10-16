export type QuestionType = 'multiple-choice' | 'matching' | 'dropdown' | 'fill-in-the-blank';

// Base interface for all questions
export interface BaseQuestion {
  questionType: QuestionType;
  imagePrompt: string;
  imageUrl?: string;
}

// Specific question types
export interface MultipleChoiceQuestion extends BaseQuestion {
  questionType: 'multiple-choice';
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface MatchingQuestion extends BaseQuestion {
  questionType: 'matching';
  title: string;
  prompts: string[];
  answers: string[]; // This will be the pool of answers to choose from
  correctMatches: Record<string, string>; // Maps a prompt to its correct answer
}

export interface DropdownQuestion extends BaseQuestion {
  questionType: 'dropdown';
  questionParts: [string, string]; // Text before and after the dropdown
  options: string[]; // Options for the dropdown
  correctAnswer: string;
}

export interface FillInTheBlankQuestion extends BaseQuestion {
  questionType: 'fill-in-the-blank';
  questionParts: [string, string]; // Text before and after the blank
  correctAnswer: string;
}

// Union type for any question
export type Question = MultipleChoiceQuestion | MatchingQuestion | DropdownQuestion | FillInTheBlankQuestion;

export type GameState = 'welcome' | 'generating' | 'playing' | 'results';

export type UserAnswer = {
  question: Question;
  userAnswer: any; // Can be number (index), string, or Record<string, string>
  isCorrect: boolean;
};
