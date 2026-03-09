/**
 * Shared types for Study Game
 */

export type QuestionType = "multiple_choice" | "true_false";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: QuizOption[];
  explanation?: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface StudyFile {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  storage_path: string;
  extracted_text: string | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  file_id: string;
  questions: QuizQuestion[];
  created_at: string;
}
