export interface GroundingSource {
  title: string;
  uri: string;
}

export interface WikiPageData {
  topic: string;
  content: string; // Markdown content
  sources: GroundingSource[];
}

export interface HistoryItem {
  topic: string;
  timestamp: number;
}

export enum AppState {
  HOME = 'HOME',
  LOADING = 'LOADING',
  VIEWING = 'VIEWING',
  ERROR = 'ERROR',
}