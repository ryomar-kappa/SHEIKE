/**
 * Type definition tests for facial metrics system
 */

import { expectType, expectError, expectAssignable, expectNotAssignable } from 'tsd';
import type {
  FacialFeatures,
  EyeMetrics,
  SingleEyeMetrics,
  NoseMetrics,
  JawMetrics,
  QualityScores,
  BaselineRanges,
  WeightingFactors,
  MetricsCalculationError,
} from '../../src/types/metrics';
import { FacialMetricsCalculator } from '../../src/lib/metrics';
import type { NormalizedLandmark } from '../../src/types/mediapipe';

// Type tests for facial features interface
declare const features: FacialFeatures;
expectType<EyeMetrics>(features.eyes);
expectType<NoseMetrics>(features.nose);
expectType<JawMetrics>(features.jaw);

// Type tests for eye metrics
declare const eyeMetrics: EyeMetrics;
expectType<SingleEyeMetrics>(eyeMetrics.leftEye);
expectType<SingleEyeMetrics>(eyeMetrics.rightEye);
expectType<number>(eyeMetrics.interPupillaryDistance);
expectType<number>(eyeMetrics.eyeSymmetry);

declare const singleEye: SingleEyeMetrics;
expectType<number>(singleEye.width);
expectType<number>(singleEye.height);
expectType<number>(singleEye.aspectRatio);
expectType<number>(singleEye.tilt);
expectType<readonly NormalizedLandmark[]>(singleEye.landmarks);

// Type tests for nose metrics
declare const noseMetrics: NoseMetrics;
expectType<number>(noseMetrics.width);
expectType<number>(noseMetrics.length);
expectType<number>(noseMetrics.tipProjection);
expectType<number>(noseMetrics.bridgeWidth);
expectType<number>(noseMetrics.nostrilSymmetry);
expectType<readonly NormalizedLandmark[]>(noseMetrics.landmarks);

// Type tests for jaw metrics
declare const jawMetrics: JawMetrics;
expectType<number>(jawMetrics.width);
expectType<number>(jawMetrics.angle);
expectType<number>(jawMetrics.chinProjection);
expectType<number>(jawMetrics.lowerFaceRatio);
expectType<number>(jawMetrics.asymmetry);
expectType<readonly NormalizedLandmark[]>(jawMetrics.landmarks);

// Type tests for quality scores
declare const scores: QualityScores;
expectType<number>(scores.eyes);
expectType<number>(scores.nose);
expectType<number>(scores.jaw);
expectType<number>(scores.overall);

// Test score range constraints (0-100)
expectAssignable<QualityScores>({ eyes: 0, nose: 50, jaw: 100, overall: 75 });
expectAssignable<QualityScores>({ eyes: 85, nose: 92, jaw: 78, overall: 85 });

// Type tests for baseline ranges
declare const baselines: BaselineRanges;
expectType<readonly [number, number]>(baselines.eyes.aspectRatio);
expectType<readonly [number, number]>(baselines.eyes.symmetry);
expectType<readonly [number, number]>(baselines.eyes.tilt);
expectType<readonly [number, number]>(baselines.nose.widthRatio);
expectType<readonly [number, number]>(baselines.nose.projection);
expectType<readonly [number, number]>(baselines.nose.symmetry);
expectType<readonly [number, number]>(baselines.jaw.angle);
expectType<readonly [number, number]>(baselines.jaw.chinRatio);
expectType<readonly [number, number]>(baselines.jaw.asymmetry);

// Type tests for weighting factors
declare const weights: WeightingFactors;
expectType<number>(weights.eyes.aspectRatio);
expectType<number>(weights.eyes.symmetry);
expectType<number>(weights.eyes.tilt);
expectType<number>(weights.nose.width);
expectType<number>(weights.nose.projection);
expectType<number>(weights.nose.symmetry);
expectType<number>(weights.jaw.angle);
expectType<number>(weights.jaw.projection);
expectType<number>(weights.jaw.asymmetry);

// Type tests for error interface
declare const metricsError: MetricsCalculationError;
expectType<'INSUFFICIENT_LANDMARKS' | 'CALCULATION_ERROR' | 'INVALID_INPUT'>(metricsError.code);
expectType<'eyes' | 'nose' | 'jaw' | 'general'>(metricsError.feature);
expectType<string>(metricsError.message);
expectType<unknown>(metricsError.details);

// Type tests for calculator class
declare const calculator: FacialMetricsCalculator;
declare const landmarks: readonly NormalizedLandmark[];

expectType<FacialFeatures>(calculator.calculateFacialFeatures(landmarks));
expectType<QualityScores>(calculator.calculateQualityScores(features));

// Test constructor overloads
expectType<FacialMetricsCalculator>(new FacialMetricsCalculator());
expectType<FacialMetricsCalculator>(new FacialMetricsCalculator(baselines));
expectType<FacialMetricsCalculator>(new FacialMetricsCalculator(baselines, weights));

// Test readonly constraints
expectError(features.eyes.leftEye.landmarks.push({} as NormalizedLandmark));
expectError(baselines.eyes.aspectRatio.push(5));
expectError(scores.eyes = 90); // scores should be readonly

// Test tuple constraints for ranges
expectAssignable<readonly [number, number]>([1.0, 2.0]);
expectNotAssignable<readonly [number, number]>([1.0]); // too few elements
expectNotAssignable<readonly [number, number]>([1.0, 2.0, 3.0]); // too many elements
expectNotAssignable<readonly [number, number]>(['1.0', '2.0']); // wrong type

// Test exact property types
expectNotAssignable<BaselineRanges>({
  eyes: { aspectRatio: [2.8, 3.2] }, // missing required properties
});

expectAssignable<BaselineRanges>({
  eyes: {
    aspectRatio: [2.8, 3.2],
    symmetry: [0.9, 1.1],
    tilt: [-5, 5],
  },
  nose: {
    widthRatio: [0.75, 0.85],
    projection: [0.67, 0.75],
    symmetry: [0.9, 1.1],
  },
  jaw: {
    angle: [120, 130],
    chinRatio: [0.85, 0.95],
    asymmetry: [0.95, 1.05],
  },
});

// Test weight factor constraints (should sum to reasonable values)
expectAssignable<WeightingFactors>({
  eyes: { aspectRatio: 0.4, symmetry: 0.35, tilt: 0.25 }, // sums to 1.0
  nose: { width: 0.4, projection: 0.35, symmetry: 0.25 },
  jaw: { angle: 0.45, projection: 0.3, asymmetry: 0.25 },
});