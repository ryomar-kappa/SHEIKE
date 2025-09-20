/**
 * Type definition tests for MediaPipe integration
 */

import { expectType, expectError, expectAssignable, expectNotAssignable } from 'tsd';
import type {
  FaceLandmarkerResult,
  NormalizedLandmark,
  MediaPipeConfig,
  FaceLandmarkerOptions,
  MediaPipeError,
} from '../../src/types/mediapipe';
import {
  MediaPipeFaceLandmarker,
  LANDMARK_INDICES,
  extractLandmarksByIndices,
  calculateDistance,
  calculateAngle,
} from '../../src/lib/mediapipe';

// Type tests for interfaces
declare const landmarkerResult: FaceLandmarkerResult;
expectType<readonly NormalizedLandmark[][]>(landmarkerResult.faceLandmarks);
expectType<readonly Classifications[] | undefined>(landmarkerResult.faceBlendshapes);

declare const landmark: NormalizedLandmark;
expectType<number>(landmark.x);
expectType<number>(landmark.y);
expectType<number | undefined>(landmark.z);
expectType<number | undefined>(landmark.visibility);

// Config type tests
declare const config: MediaPipeConfig;
expectType<string>(config.baseOptions.modelAssetPath);
expectType<'CPU' | 'GPU' | undefined>(config.baseOptions.delegate);
expectType<'IMAGE' | 'VIDEO'>(config.runningMode);
expectType<number>(config.numFaces);
expectType<boolean>(config.outputFaceBlendshapes);

// Options type tests
declare const options: FaceLandmarkerOptions;
expectType<string | undefined>(options.wasmLoaderScript);
expectType<string | undefined>(options.wasmBinaryFile);
expectType<string | undefined>(options.modelAssetPath);

// Error type tests
declare const error: MediaPipeError;
expectType<string>(error.code);
expectType<string>(error.message);
expectType<unknown>(error.details);

// Class type tests
declare const landmarker: MediaPipeFaceLandmarker;
expectType<Promise<void>>(landmarker.initialize());
expectType<void>(landmarker.dispose());

declare const imageElement: HTMLImageElement;
expectType<Promise<readonly NormalizedLandmark[]>>(landmarker.detectLandmarks(imageElement));

declare const canvasElement: HTMLCanvasElement;
expectType<Promise<readonly NormalizedLandmark[]>>(landmarker.detectLandmarks(canvasElement));

declare const videoElement: HTMLVideoElement;
expectType<Promise<readonly NormalizedLandmark[]>>(landmarker.detectLandmarks(videoElement));

// Landmark indices type tests
expectType<readonly number[]>(LANDMARK_INDICES.LEFT_EYE);
expectType<readonly number[]>(LANDMARK_INDICES.RIGHT_EYE);
expectType<readonly number[]>(LANDMARK_INDICES.NOSE_TIP);
expectType<readonly number[]>(LANDMARK_INDICES.CHIN);

// Utility function type tests
declare const landmarks: readonly NormalizedLandmark[];
declare const indices: readonly number[];
expectType<readonly NormalizedLandmark[]>(extractLandmarksByIndices(landmarks, indices));

declare const point1: NormalizedLandmark;
declare const point2: NormalizedLandmark;
expectType<number>(calculateDistance(point1, point2));

declare const center: NormalizedLandmark;
expectType<number>(calculateAngle(point1, center, point2));

// Test that readonly arrays are enforced
expectError(landmarks.push({} as NormalizedLandmark));
expectError(LANDMARK_INDICES.LEFT_EYE.push(999));

// Test that landmark access requires proper checking
declare const maybeLandmark: NormalizedLandmark | undefined;
expectError(calculateDistance(maybeLandmark, point1)); // Should require non-undefined

// Test strict null checks
expectNotAssignable<NormalizedLandmark>({ x: 1, y: 2, z: null }); // null not allowed
expectAssignable<NormalizedLandmark>({ x: 1, y: 2, z: undefined }); // undefined is ok
expectAssignable<NormalizedLandmark>({ x: 1, y: 2 }); // optional properties can be omitted