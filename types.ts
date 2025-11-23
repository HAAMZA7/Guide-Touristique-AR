export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisResult {
  landmarkName: string;
  description: string;
  groundingSource: GroundingChunk[];
  audioBuffer: AudioBuffer | null;
}

export enum AppState {
  IDLE = 'IDLE',
  CAMERA = 'CAMERA',
  ANALYZING = 'ANALYZING',
  SEARCHING = 'SEARCHING',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
}
