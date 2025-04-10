export interface AnswerHistoryEntry {
  optionIndex: number;
  questionId: number;
  seasonScoreEffect?: Partial<SeasonScore>;
  stage: QuizStage;
  subSeasonScoreEffect?: Partial<SubSeasonScore>;
  undertoneScoreEffect?: Partial<UndertoneScore>;
}

export interface ColorInfo {
  hex: string;
  name: string;
}

export type PaletteColor = string;

export interface QuizOption {
  choiceLabel: string;
  isUnsure?: boolean;
  seasonScoreEffect?: Partial<SeasonScore>;
  subSeasonScoreEffect?: Partial<SubSeasonScore>;
  swatches?: ColorInfo[];
  text: string;
  undertoneScoreEffect?: Partial<UndertoneScore>;
}

export interface QuizQuestion {
  guidanceText?: string;
  id: number;
  options: QuizOption[];
  questionText: string;
  relevantSeasons?: Season[];
  relevantUndertones?: Undertone[];
  tier?: 1 | 2;
}

export interface SeasonScore {
  autumn: number;
  spring: number;
  summer: number;
  winter: number;
}

export interface SubSeasonScore {
  [key: string]: number;
}

export interface UndertoneScore {
  cool: number;
  neutral: number;
  olive: number;
  warm: number;
}

export type QuizStage = "Result" | "Season" | "SubSeason" | "Undertone";
export type Season = "Autumn" | "Spring" | "Summer" | "Winter" | null;
export type SubSeason = string | null;
export type Undertone =
  | "Cool"
  | "Neutral"
  | "Neutral-Cool"
  | "Neutral-Warm"
  | "Olive"
  | "Warm"
  | null;
