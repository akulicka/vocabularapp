// Shared types for quiz-related DTOs

export interface QuizPrompt {
  wordId: string;
  english: string;
}

export interface StartedQuiz {
  quizId: string;
  endsAt: Date;
  words: QuizPrompt[];
}

export interface GradedAnswer {
  isCorrect: boolean;
  userAnswer: string;
  root: string | null;
  arabic: string;
}

export interface QuizTally {
  quizId: string;
  poolSize: number;
  answered: number;
  correctAnswers: number;
}

export interface QuizHistoryItem extends QuizTally {
  selectedTags: string[] | null;
  completedAt: Date;
  endsAt: Date;
}

export interface QuizHistoryResponse {
  quizzes: QuizHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QuizAnswerDetail {
  wordId: string;
  userAnswer: string;
  isCorrect: boolean;
  english: string;
  arabic: string;
  root: string | null;
}

export interface QuizDetail {
  quizId: string;
  userId: string;
  selectedTags: string[] | null;
  wordIds: string[];
  endsAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  answers: QuizAnswerDetail[];
}

export type {
  StartQuizRequest,
  SubmitAnswerRequest,
  QuizIdParams,
  QuizHistoryQuery,
} from "../schemas/quiz.js";
