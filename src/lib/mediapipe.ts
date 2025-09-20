/**
 * MediaPipe Face Landmarker integration module
 * Provides type-safe wrapper for MediaPipe Face Landmarker functionality
 */

import type {
  FaceLandmarkerResult,
  NormalizedLandmark,
  MediaPipeConfig,
  FaceLandmarkerOptions,
  MediaPipeError,
} from '@/types/mediapipe';

// MediaPipe landmark indices for key facial features
export const LANDMARK_INDICES = {
  // Left eye landmarks (36-41 in 68-point, mapped to 468-point)
  LEFT_EYE: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246] as const,
  
  // Right eye landmarks  
  RIGHT_EYE: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398] as const,
  
  // Nose landmarks
  NOSE_TIP: [1, 2, 5, 4, 6, 19, 20, 94, 125, 141, 235, 236, 237, 238, 239, 240, 241, 242] as const,
  NOSE_BRIDGE: [6, 9, 10, 151, 195, 197, 196, 3, 51, 48, 115, 131, 134, 102, 49, 220] as const,
  NOSTRIL_LEFT: [235, 31, 228, 229, 230, 231, 232, 233, 244, 245, 122, 6, 202, 214, 234] as const,
  NOSTRIL_RIGHT: [455, 462, 459, 458, 457, 456, 448, 449, 451, 452, 453, 464, 435, 410, 454] as const,
  
  // Jaw landmarks
  JAW_LEFT: [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323] as const,
  JAW_RIGHT: [397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93] as const,
  CHIN: [18, 175, 199, 200, 9, 10, 151, 175, 18, 175, 199, 200, 9, 10, 151] as const,
  
  // Face outline for angle calculation
  FACE_OUTLINE: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109] as const,
} as const;

export class MediaPipeFaceLandmarker {
  private faceLandmarker: unknown = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(private readonly options: FaceLandmarkerOptions = {}) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise !== null) return this.initializationPromise;

    this.initializationPromise = this.doInitialize();
    await this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Dynamic import to handle MediaPipe loading - types will be resolved at runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediaPipeModule = await import('@mediapipe/tasks-vision' as any);
      const { FaceLandmarker, FilesetResolver } = mediaPipeModule;

      const vision = await FilesetResolver.forVisionTasks(
        this.options.wasmLoaderScript ?? 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      const config: MediaPipeConfig = {
        baseOptions: {
          modelAssetPath: this.options.modelAssetPath ?? 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      };

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, config);
      this.isInitialized = true;
    } catch (error) {
      const mpError: MediaPipeError = {
        name: 'MediaPipeInitializationError',
        message: `Failed to initialize MediaPipe: ${String(error)}`,
        code: 'INIT_FAILED',
        details: error,
      };
      throw mpError;
    }
  }

  async detectLandmarks(imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<readonly NormalizedLandmark[]> {
    if (!this.isInitialized || this.faceLandmarker === null) {
      throw new Error('MediaPipe not initialized. Call initialize() first.');
    }

    try {
      // Type assertion needed due to dynamic import
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (this.faceLandmarker as any).detect(imageElement) as FaceLandmarkerResult;
      
      if (result.faceLandmarks.length === 0) {
        return [];
      }

      // Return first face landmarks (we only detect 1 face)
      const landmarks = result.faceLandmarks[0];
      if (landmarks === undefined) {
        return [];
      }

      return landmarks;
    } catch (error) {
      const mpError: MediaPipeError = {
        name: 'MediaPipeLandmarkError',
        message: `Failed to detect landmarks: ${String(error)}`,
        code: 'DETECTION_FAILED',
        details: error,
      };
      throw mpError;
    }
  }

  dispose(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (this.faceLandmarker !== null && 'close' in (this.faceLandmarker as any)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.faceLandmarker as any).close();
    }
    this.faceLandmarker = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}

/**
 * Extract specific landmark points by indices
 */
export function extractLandmarksByIndices(
  landmarks: readonly NormalizedLandmark[],
  indices: readonly number[]
): readonly NormalizedLandmark[] {
  return indices.map(index => {
    const landmark = landmarks[index];
    if (landmark === undefined) {
      throw new Error(`Landmark at index ${index} not found`);
    }
    return landmark;
  });
}

/**
 * Calculate distance between two landmark points
 */
export function calculateDistance(
  point1: NormalizedLandmark,
  point2: NormalizedLandmark
): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between three landmark points
 */
export function calculateAngle(
  point1: NormalizedLandmark,
  center: NormalizedLandmark,
  point2: NormalizedLandmark
): number {
  const vector1 = { x: point1.x - center.x, y: point1.y - center.y };
  const vector2 = { x: point2.x - center.x, y: point2.y - center.y };
  
  const dot = vector1.x * vector2.x + vector1.y * vector2.y;
  const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  const cosAngle = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}