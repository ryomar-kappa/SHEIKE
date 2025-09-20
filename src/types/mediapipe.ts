/**
 * MediaPipe Face Landmarker type definitions
 * Based on MediaPipe Face Landmarker v0.10.3
 */

export interface FaceLandmarkerResult {
  readonly faceLandmarks: readonly NormalizedLandmark[][];
  readonly faceBlendshapes?: readonly Classifications[];
  readonly facialTransformationMatrixes?: readonly Matrix[];
}

export interface NormalizedLandmark {
  readonly x: number;
  readonly y: number;
  readonly z?: number;
  readonly visibility?: number;
  readonly presence?: number;
}

export interface Classifications {
  readonly categories: readonly Category[];
  readonly headIndex: number;
  readonly headName: string;
}

export interface Category {
  readonly index: number;
  readonly score: number;
  readonly categoryName: string;
  readonly displayName: string;
}

export interface Matrix {
  readonly data: readonly number[];
  readonly rows: number;
  readonly columns: number;
}

export interface MediaPipeConfig {
  readonly baseOptions: {
    readonly modelAssetPath: string;
    readonly delegate?: 'CPU' | 'GPU';
  };
  readonly runningMode: 'IMAGE' | 'VIDEO';
  readonly numFaces: number;
  readonly minFaceDetectionConfidence: number;
  readonly minFacePresenceConfidence: number;
  readonly minTrackingConfidence: number;
  readonly outputFaceBlendshapes: boolean;
  readonly outputFacialTransformationMatrixes: boolean;
}

export interface FaceLandmarkerOptions {
  readonly wasmLoaderScript?: string;
  readonly wasmBinaryFile?: string;
  readonly modelAssetPath?: string;
}

export interface MediaPipeError extends Error {
  readonly code: string;
  readonly details?: unknown;
}