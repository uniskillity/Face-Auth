
export enum AuthState {
  IDLE = 'IDLE',
  ENROLLING = 'ENROLLING',
  VERIFYING = 'VERIFYING',
  AUTHENTICATED = 'AUTHENTICATED',
  FAILED = 'FAILED'
}

export interface UserProfile {
  id: string;
  email: string;
  enrolledFaceData?: string; // Base64 string of the face snapshot
}

export interface RecognitionResult {
  match: boolean;
  confidence: number;
  message: string;
  analysis?: {
    liveness: boolean;
    lighting: string;
    focus: string;
  };
}
