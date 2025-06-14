export interface Student {
  id?: string;
  name: string;
  yearGroup: string;
  homeLanguage: string;
  createdAt: Date;
}

export interface Question {
  id?: string;
  language: "en" | "l1";
  text: string;
  choices: string[];
  correctIdx: number;
  difficulty: number;
  skillTag: string;
}

export interface Assessment {
  id?: string;
  title: string;
  language: "en" | "l1";
  questionIds: string[];
  levelBand: string;
}

export interface Attempt {
  id?: string;
  sessionCode: string;
  started: Date;
  completed?: Date;
  englishScore?: number;
  l1Score?: number;
  gap?: number;
  colourBand?: "green" | "amber" | "red";
  summary?: string;
}

export interface Response {
  id?: string;
  questionId: string;
  selectedIdx: number;
  isCorrect: boolean;
  timeMs: number;
}

export interface Resource {
  id?: string;
  language: string;
  gapBand: "green" | "amber" | "red";
  url: string;
  description: string;
}

export interface GPTScoreResponse {
  englishScore: number;
  l1Score: number;
  summary: string;
}

export interface SessionData {
  sessionCode: string;
}

export interface AnswerRequest {
  studentId: string;
  attemptId: string;
  questionId: string;
  selectedIdx: number;
  timeMs: number;
}

export interface AnswerResponse {
  nextQuestion?: Question;
  completed?: boolean;
}
