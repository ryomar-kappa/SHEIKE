/**
 * Facial metrics and scoring type definitions
 */

import type { NormalizedLandmark } from '@/types/mediapipe';

export interface FacialFeatures {
  readonly eyes: EyeMetrics;
  readonly nose: NoseMetrics;
  readonly jaw: JawMetrics;
}

export interface EyeMetrics {
  readonly leftEye: SingleEyeMetrics;
  readonly rightEye: SingleEyeMetrics;
  readonly interPupillaryDistance: number;
  readonly eyeSymmetry: number;
}

export interface SingleEyeMetrics {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
  readonly tilt: number;
  readonly landmarks: readonly NormalizedLandmark[];
}

export interface NoseMetrics {
  readonly width: number;
  readonly length: number;
  readonly tipProjection: number;
  readonly bridgeWidth: number;
  readonly nostrilSymmetry: number;
  readonly landmarks: readonly NormalizedLandmark[];
}

export interface JawMetrics {
  readonly width: number;
  readonly angle: number;
  readonly chinProjection: number;
  readonly lowerFaceRatio: number;
  readonly asymmetry: number;
  readonly landmarks: readonly NormalizedLandmark[];
}

export interface QualityScores {
  readonly eyes: number;
  readonly nose: number;
  readonly jaw: number;
  readonly overall: number;
}

export interface BaselineRanges {
  readonly eyes: {
    readonly aspectRatio: readonly [number, number];
    readonly symmetry: readonly [number, number];
    readonly tilt: readonly [number, number];
  };
  readonly nose: {
    readonly widthRatio: readonly [number, number];
    readonly projection: readonly [number, number];
    readonly symmetry: readonly [number, number];
  };
  readonly jaw: {
    readonly angle: readonly [number, number];
    readonly chinRatio: readonly [number, number];
    readonly asymmetry: readonly [number, number];
  };
}

export interface WeightingFactors {
  readonly eyes: {
    readonly aspectRatio: number;
    readonly symmetry: number;
    readonly tilt: number;
  };
  readonly nose: {
    readonly width: number;
    readonly projection: number;
    readonly symmetry: number;
  };
  readonly jaw: {
    readonly angle: number;
    readonly projection: number;
    readonly asymmetry: number;
  };
}

export interface MetricsCalculationError extends Error {
  readonly code: 'INSUFFICIENT_LANDMARKS' | 'CALCULATION_ERROR' | 'INVALID_INPUT';
  readonly feature: 'eyes' | 'nose' | 'jaw' | 'general';
  readonly details?: unknown;
}