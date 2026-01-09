
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
  enrolledFaceData?: string;
  enrolledAt: number;
}

export interface RecognitionResult {
  match: boolean;
  confidence: number;
  message: string;
  analysis?: {
    liveness: boolean;
    lighting: string;
    focus: string;
    landmarks_detected?: boolean;
    risk_score?: number; // 0-100
  };
}

export interface AuthLog {
  id: string;
  timestamp: number;
  type: 'enrollment' | 'verification';
  success: boolean;
  confidence: number;
}
