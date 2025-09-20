/**
 * Image and facial detection quality validation types
 */

import type { NormalizedLandmark } from '@/types/mediapipe';

export interface QualityCheckResult {
  readonly isValid: boolean;
  readonly issues: readonly QualityIssue[];
  readonly confidence: number;
  readonly recommendations: readonly string[];
}

export interface QualityIssue {
  readonly type: QualityIssueType;
  readonly severity: 'low' | 'medium' | 'high';
  readonly message: string;
  readonly value?: number;
  readonly threshold?: number;
}

export type QualityIssueType =
  | 'face_angle'
  | 'brightness'
  | 'contrast'
  | 'blur'
  | 'face_size'
  | 'face_position'
  | 'multiple_faces'
  | 'no_face_detected'
  | 'partial_face'
  | 'poor_lighting'
  | 'shadow'
  | 'reflection';

export interface QualityThresholds {
  readonly faceAngle: {
    readonly maxYaw: number;
    readonly maxPitch: number;
    readonly maxRoll: number;
  };
  readonly brightness: {
    readonly min: number;
    readonly max: number;
  };
  readonly contrast: {
    readonly min: number;
  };
  readonly blur: {
    readonly max: number;
  };
  readonly faceSize: {
    readonly minWidth: number;
    readonly minHeight: number;
    readonly maxWidth: number;
    readonly maxHeight: number;
  };
  readonly facePosition: {
    readonly centerTolerance: number;
  };
}

export interface ImageQualityMetrics {
  readonly brightness: number;
  readonly contrast: number;
  readonly blur: number;
  readonly saturation: number;
  readonly noise: number;
}

export interface FaceQualityMetrics {
  readonly angle: {
    readonly yaw: number;
    readonly pitch: number;
    readonly roll: number;
  };
  readonly size: {
    readonly width: number;
    readonly height: number;
    readonly area: number;
  };
  readonly position: {
    readonly centerX: number;
    readonly centerY: number;
    readonly offsetFromCenter: number;
  };
  readonly completeness: number;
  readonly symmetry: number;
}

export interface QualityValidationError extends Error {
  readonly code: 'ANALYSIS_FAILED' | 'INVALID_IMAGE' | 'PROCESSING_ERROR';
  readonly details?: unknown;
}