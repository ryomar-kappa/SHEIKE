/**
 * Type definition tests for quality validation system
 */

import { expectType, expectError, expectAssignable, expectNotAssignable } from 'tsd';
import type {
  QualityCheckResult,
  QualityIssue,
  QualityIssueType,
  QualityThresholds,
  ImageQualityMetrics,
  FaceQualityMetrics,
  QualityValidationError,
} from '../../src/types/quality';
import { QualityValidator } from '../../src/lib/quality';
import type { NormalizedLandmark } from '../../src/types/mediapipe';

// Type tests for quality check result
declare const result: QualityCheckResult;
expectType<boolean>(result.isValid);
expectType<readonly QualityIssue[]>(result.issues);
expectType<number>(result.confidence);
expectType<readonly string[]>(result.recommendations);

// Type tests for quality issue
declare const issue: QualityIssue;
expectType<QualityIssueType>(issue.type);
expectType<'low' | 'medium' | 'high'>(issue.severity);
expectType<string>(issue.message);
expectType<number | undefined>(issue.value);
expectType<number | undefined>(issue.threshold);

// Type tests for issue types
expectAssignable<QualityIssueType>('face_angle');
expectAssignable<QualityIssueType>('brightness');
expectAssignable<QualityIssueType>('contrast');
expectAssignable<QualityIssueType>('blur');
expectAssignable<QualityIssueType>('face_size');
expectAssignable<QualityIssueType>('face_position');
expectAssignable<QualityIssueType>('multiple_faces');
expectAssignable<QualityIssueType>('no_face_detected');
expectAssignable<QualityIssueType>('partial_face');
expectAssignable<QualityIssueType>('poor_lighting');
expectAssignable<QualityIssueType>('shadow');
expectAssignable<QualityIssueType>('reflection');

expectNotAssignable<QualityIssueType>('invalid_type');

// Type tests for quality thresholds
declare const thresholds: QualityThresholds;
expectType<{ readonly maxYaw: number; readonly maxPitch: number; readonly maxRoll: number }>(thresholds.faceAngle);
expectType<{ readonly min: number; readonly max: number }>(thresholds.brightness);
expectType<{ readonly min: number }>(thresholds.contrast);
expectType<{ readonly max: number }>(thresholds.blur);
expectType<{
  readonly minWidth: number;
  readonly minHeight: number;
  readonly maxWidth: number;
  readonly maxHeight: number;
}>(thresholds.faceSize);
expectType<{ readonly centerTolerance: number }>(thresholds.facePosition);

// Type tests for image quality metrics
declare const imageMetrics: ImageQualityMetrics;
expectType<number>(imageMetrics.brightness);
expectType<number>(imageMetrics.contrast);
expectType<number>(imageMetrics.blur);
expectType<number>(imageMetrics.saturation);
expectType<number>(imageMetrics.noise);

// Type tests for face quality metrics
declare const faceMetrics: FaceQualityMetrics;
expectType<{ readonly yaw: number; readonly pitch: number; readonly roll: number }>(faceMetrics.angle);
expectType<{ readonly width: number; readonly height: number; readonly area: number }>(faceMetrics.size);
expectType<{
  readonly centerX: number;
  readonly centerY: number;
  readonly offsetFromCenter: number;
}>(faceMetrics.position);
expectType<number>(faceMetrics.completeness);
expectType<number>(faceMetrics.symmetry);

// Type tests for validation error
declare const validationError: QualityValidationError;
expectType<'ANALYSIS_FAILED' | 'INVALID_IMAGE' | 'PROCESSING_ERROR'>(validationError.code);
expectType<string>(validationError.message);
expectType<unknown>(validationError.details);

// Type tests for validator class
declare const validator: QualityValidator;
declare const imageElement: HTMLImageElement;
declare const canvasElement: HTMLCanvasElement;
declare const landmarks: readonly NormalizedLandmark[];

expectType<Promise<QualityCheckResult>>(validator.validateImage(imageElement, landmarks));
expectType<Promise<QualityCheckResult>>(validator.validateImage(canvasElement, landmarks));

// Test constructor overloads
expectType<QualityValidator>(new QualityValidator());
expectType<QualityValidator>(new QualityValidator(thresholds));

// Test readonly constraints
expectError(result.issues.push({} as QualityIssue));
expectError(result.recommendations.push('test'));
expectError(thresholds.faceAngle.maxYaw = 20);

// Test exact property constraints
expectNotAssignable<QualityThresholds>({
  faceAngle: { maxYaw: 15 }, // missing required properties
});

expectAssignable<QualityThresholds>({
  faceAngle: {
    maxYaw: 15,
    maxPitch: 15,
    maxRoll: 10,
  },
  brightness: {
    min: 80,
    max: 200,
  },
  contrast: {
    min: 30,
  },
  blur: {
    max: 0.1,
  },
  faceSize: {
    minWidth: 0.3,
    minHeight: 0.4,
    maxWidth: 0.8,
    maxHeight: 0.9,
  },
  facePosition: {
    centerTolerance: 0.15,
  },
});

// Test severity level constraints
expectAssignable<QualityIssue>({
  type: 'face_angle',
  severity: 'low',
  message: 'test',
});

expectAssignable<QualityIssue>({
  type: 'brightness',
  severity: 'medium',
  message: 'test',
  value: 50,
  threshold: 80,
});

expectNotAssignable<QualityIssue>({
  type: 'face_angle',
  severity: 'critical', // invalid severity
  message: 'test',
});

// Test confidence range (should be 0-100)
expectAssignable<QualityCheckResult>({
  isValid: true,
  issues: [],
  confidence: 0,
  recommendations: [],
});

expectAssignable<QualityCheckResult>({
  isValid: false,
  issues: [],
  confidence: 100,
  recommendations: [],
});

// Test normalized values for face metrics (should be 0-1 for positions/sizes)
expectAssignable<FaceQualityMetrics>({
  angle: { yaw: 0, pitch: 0, roll: 0 },
  size: { width: 0.5, height: 0.6, area: 0.3 },
  position: { centerX: 0.5, centerY: 0.5, offsetFromCenter: 0.1 },
  completeness: 0.95,
  symmetry: 0.9,
});

// Test that optional properties work correctly
expectAssignable<QualityIssue>({
  type: 'face_angle',
  severity: 'low',
  message: 'test',
  // value and threshold are optional
});

expectAssignable<QualityIssue>({
  type: 'brightness',
  severity: 'high',
  message: 'test',
  value: 50,
  // threshold is optional even when value is provided
});