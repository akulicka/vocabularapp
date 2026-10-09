export interface Dashboard {
  user: { username: string; createdAt: string };
  summary: {
    quizCount: number;
    correct: number;
    attempts: number;
    wordsStudied: number;
  };
  quizzes: {
    quizId: string;
    completedAt: string;
    correctAnswers: number;
    poolSize: number;
  }[];
  words: {
    wordId: string;
    arabic: string;
    english: string;
    correct: number;
    attempts: number;
  }[];
  tags: {
    tagId: string;
    tagName: string;
    correct: number;
    attempts: number;
  }[];
}
