/**
 * Facial metrics calculation system
 * Implements golden ratio-based feature analysis with 0-100 scoring
 */

import type { NormalizedLandmark } from '@/types/mediapipe';
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
} from '@/types/metrics';
import {
  LANDMARK_INDICES,
  extractLandmarksByIndices,
  calculateDistance,
  calculateAngle,
} from '@/lib/mediapipe';

// Golden ratio and ideal proportions based on facial analysis research
const GOLDEN_RATIO = 1.618;

const DEFAULT_BASELINE_RANGES: BaselineRanges = {
  eyes: {
    aspectRatio: [2.8, 3.2], // Ideal eye width to height ratio
    symmetry: [0.9, 1.1], // Left to right eye size ratio
    tilt: [-5, 5], // Acceptable eye tilt in degrees
  },
  nose: {
    widthRatio: [0.75, 0.85], // Nose width to eye distance ratio
    projection: [0.67, 0.75], // Nose length to face height ratio
    symmetry: [0.9, 1.1], // Nostril symmetry ratio
  },
  jaw: {
    angle: [120, 130], // Ideal jaw angle in degrees
    chinRatio: [0.85, 0.95], // Chin width to jaw width ratio
    asymmetry: [0.95, 1.05], // Left to right jaw symmetry
  },
} as const;

const DEFAULT_WEIGHTING_FACTORS: WeightingFactors = {
  eyes: {
    aspectRatio: 0.4,
    symmetry: 0.35,
    tilt: 0.25,
  },
  nose: {
    width: 0.4,
    projection: 0.35,
    symmetry: 0.25,
  },
  jaw: {
    angle: 0.45,
    projection: 0.3,
    asymmetry: 0.25,
  },
} as const;

export class FacialMetricsCalculator {
  constructor(
    private readonly baselineRanges: BaselineRanges = DEFAULT_BASELINE_RANGES,
    private readonly weightingFactors: WeightingFactors = DEFAULT_WEIGHTING_FACTORS
  ) {}

  calculateFacialFeatures(landmarks: readonly NormalizedLandmark[]): FacialFeatures {
    if (landmarks.length < 468) {
      const error: MetricsCalculationError = {
        name: 'MetricsCalculationError',
        message: `Insufficient landmarks: expected 468, got ${landmarks.length}`,
        code: 'INSUFFICIENT_LANDMARKS',
        feature: 'general',
      };
      throw error;
    }

    try {
      const eyes = this.calculateEyeMetrics(landmarks);
      const nose = this.calculateNoseMetrics(landmarks);
      const jaw = this.calculateJawMetrics(landmarks);

      return { eyes, nose, jaw };
    } catch (error) {
      const metricsError: MetricsCalculationError = {
        name: 'MetricsCalculationError',
        message: `Failed to calculate facial features: ${String(error)}`,
        code: 'CALCULATION_ERROR',
        feature: 'general',
        details: error,
      };
      throw metricsError;
    }
  }

  private calculateEyeMetrics(landmarks: readonly NormalizedLandmark[]): EyeMetrics {
    const leftEyeLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.LEFT_EYE);
    const rightEyeLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.RIGHT_EYE);

    const leftEye = this.calculateSingleEyeMetrics(leftEyeLandmarks);
    const rightEye = this.calculateSingleEyeMetrics(rightEyeLandmarks);

    // Calculate inter-pupillary distance (approximate eye centers)
    const leftCenter = this.calculateCentroid(leftEyeLandmarks);
    const rightCenter = this.calculateCentroid(rightEyeLandmarks);
    const interPupillaryDistance = calculateDistance(leftCenter, rightCenter);

    // Calculate eye symmetry (size ratio)
    const eyeSymmetry = leftEye.width / rightEye.width;

    return {
      leftEye,
      rightEye,
      interPupillaryDistance,
      eyeSymmetry,
    };
  }

  private calculateSingleEyeMetrics(eyeLandmarks: readonly NormalizedLandmark[]): SingleEyeMetrics {
    // Calculate eye width (horizontal distance)
    const leftCorner = eyeLandmarks[0];
    const rightCorner = eyeLandmarks[8];
    if (leftCorner === undefined || rightCorner === undefined) {
      throw new Error('Missing eye corner landmarks');
    }
    const width = calculateDistance(leftCorner, rightCorner);

    // Calculate eye height (vertical distance at center)
    const topPoint = eyeLandmarks[4];
    const bottomPoint = eyeLandmarks[12];
    if (topPoint === undefined || bottomPoint === undefined) {
      throw new Error('Missing eye vertical landmarks');
    }
    const height = calculateDistance(topPoint, bottomPoint);

    const aspectRatio = width / height;

    // Calculate eye tilt
    const tilt = Math.atan2(rightCorner.y - leftCorner.y, rightCorner.x - leftCorner.x) * (180 / Math.PI);

    return {
      width,
      height,
      aspectRatio,
      tilt,
      landmarks: eyeLandmarks,
    };
  }

  private calculateNoseMetrics(landmarks: readonly NormalizedLandmark[]): NoseMetrics {
    const noseTipLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.NOSE_TIP);
    const noseBridgeLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.NOSE_BRIDGE);
    const leftNostrilLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.NOSTRIL_LEFT);
    const rightNostrilLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.NOSTRIL_RIGHT);

    // Calculate nose width (nostril to nostril)
    const leftNostril = leftNostrilLandmarks[0];
    const rightNostril = rightNostrilLandmarks[0];
    if (leftNostril === undefined || rightNostril === undefined) {
      throw new Error('Missing nostril landmarks');
    }
    const width = calculateDistance(leftNostril, rightNostril);

    // Calculate nose length (bridge to tip)
    const bridgeTop = noseBridgeLandmarks[0];
    const noseTip = noseTipLandmarks[0];
    if (bridgeTop === undefined || noseTip === undefined) {
      throw new Error('Missing nose bridge or tip landmarks');
    }
    const length = calculateDistance(bridgeTop, noseTip);

    // Calculate tip projection (how much the tip projects forward)
    const tipProjection = noseTip.z ?? 0;

    // Calculate bridge width
    const bridgeLeft = noseBridgeLandmarks[4];
    const bridgeRight = noseBridgeLandmarks[12];
    if (bridgeLeft === undefined || bridgeRight === undefined) {
      throw new Error('Missing nose bridge width landmarks');
    }
    const bridgeWidth = calculateDistance(bridgeLeft, bridgeRight);

    // Calculate nostril symmetry
    const leftNostrilWidth = this.calculateNostrilWidth(leftNostrilLandmarks);
    const rightNostrilWidth = this.calculateNostrilWidth(rightNostrilLandmarks);
    const nostrilSymmetry = leftNostrilWidth / rightNostrilWidth;

    const allNoseLandmarks = [
      ...noseTipLandmarks,
      ...noseBridgeLandmarks,
      ...leftNostrilLandmarks,
      ...rightNostrilLandmarks,
    ];

    return {
      width,
      length,
      tipProjection,
      bridgeWidth,
      nostrilSymmetry,
      landmarks: allNoseLandmarks,
    };
  }

  private calculateNostrilWidth(nostrilLandmarks: readonly NormalizedLandmark[]): number {
    const outerPoint = nostrilLandmarks[0];
    const innerPoint = nostrilLandmarks[8];
    if (outerPoint === undefined || innerPoint === undefined) {
      throw new Error('Missing nostril width landmarks');
    }
    return calculateDistance(outerPoint, innerPoint);
  }

  private calculateJawMetrics(landmarks: readonly NormalizedLandmark[]): JawMetrics {
    const leftJawLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.JAW_LEFT);
    const rightJawLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.JAW_RIGHT);
    const chinLandmarks = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.CHIN);

    // Calculate jaw width
    const leftJawPoint = leftJawLandmarks[0];
    const rightJawPoint = rightJawLandmarks[0];
    if (leftJawPoint === undefined || rightJawPoint === undefined) {
      throw new Error('Missing jaw landmarks');
    }
    const width = calculateDistance(leftJawPoint, rightJawPoint);

    // Calculate jaw angle (approximate)
    const chinPoint = chinLandmarks[0];
    if (chinPoint === undefined) {
      throw new Error('Missing chin landmark');
    }
    const angle = calculateAngle(leftJawPoint, chinPoint, rightJawPoint);

    // Calculate chin projection
    const chinProjection = chinPoint.z ?? 0;

    // Calculate lower face ratio (chin width to jaw width)
    const chinWidth = this.calculateChinWidth(chinLandmarks);
    const lowerFaceRatio = chinWidth / width;

    // Calculate jaw asymmetry
    const leftJawSize = this.calculateJawSideSize(leftJawLandmarks);
    const rightJawSize = this.calculateJawSideSize(rightJawLandmarks);
    const asymmetry = leftJawSize / rightJawSize;

    const allJawLandmarks = [...leftJawLandmarks, ...rightJawLandmarks, ...chinLandmarks];

    return {
      width,
      angle,
      chinProjection,
      lowerFaceRatio,
      asymmetry,
      landmarks: allJawLandmarks,
    };
  }

  private calculateChinWidth(chinLandmarks: readonly NormalizedLandmark[]): number {
    const leftChin = chinLandmarks[4];
    const rightChin = chinLandmarks[12];
    if (leftChin === undefined || rightChin === undefined) {
      throw new Error('Missing chin width landmarks');
    }
    return calculateDistance(leftChin, rightChin);
  }

  private calculateJawSideSize(jawSideLandmarks: readonly NormalizedLandmark[]): number {
    // Calculate perimeter of jaw side as approximation of size
    let perimeter = 0;
    for (let i = 0; i < jawSideLandmarks.length - 1; i++) {
      const current = jawSideLandmarks[i];
      const next = jawSideLandmarks[i + 1];
      if (current !== undefined && next !== undefined) {
        perimeter += calculateDistance(current, next);
      }
    }
    return perimeter;
  }

  private calculateCentroid(landmarks: readonly NormalizedLandmark[]): NormalizedLandmark {
    const sum = landmarks.reduce(
      (acc, landmark) => ({
        x: acc.x + landmark.x,
        y: acc.y + landmark.y,
        z: acc.z + (landmark.z ?? 0),
      }),
      { x: 0, y: 0, z: 0 }
    );

    return {
      x: sum.x / landmarks.length,
      y: sum.y / landmarks.length,
      z: sum.z / landmarks.length,
    };
  }

  calculateQualityScores(features: FacialFeatures): QualityScores {
    const eyeScore = this.calculateEyeScore(features.eyes);
    const noseScore = this.calculateNoseScore(features.nose);
    const jawScore = this.calculateJawScore(features.jaw);

    // Overall score is weighted average
    const overall = (eyeScore + noseScore + jawScore) / 3;

    return {
      eyes: Math.round(eyeScore),
      nose: Math.round(noseScore),
      jaw: Math.round(jawScore),
      overall: Math.round(overall),
    };
  }

  private calculateEyeScore(eyeMetrics: EyeMetrics): number {
    const aspectRatioDeviation = this.calculateDeviation(
      (eyeMetrics.leftEye.aspectRatio + eyeMetrics.rightEye.aspectRatio) / 2,
      this.baselineRanges.eyes.aspectRatio
    );

    const symmetryDeviation = this.calculateDeviation(
      eyeMetrics.eyeSymmetry,
      this.baselineRanges.eyes.symmetry
    );

    const tiltDeviation = this.calculateDeviation(
      (Math.abs(eyeMetrics.leftEye.tilt) + Math.abs(eyeMetrics.rightEye.tilt)) / 2,
      this.baselineRanges.eyes.tilt
    );

    const weightedDeviation =
      this.weightingFactors.eyes.aspectRatio * aspectRatioDeviation +
      this.weightingFactors.eyes.symmetry * symmetryDeviation +
      this.weightingFactors.eyes.tilt * tiltDeviation;

    return this.deviationToScore(weightedDeviation);
  }

  private calculateNoseScore(noseMetrics: NoseMetrics): number {
    // Normalize nose width relative to some face width measurement
    const normalizedWidth = noseMetrics.width / noseMetrics.bridgeWidth;
    const widthDeviation = this.calculateDeviation(
      normalizedWidth,
      this.baselineRanges.nose.widthRatio
    );

    const projectionDeviation = this.calculateDeviation(
      Math.abs(noseMetrics.tipProjection),
      this.baselineRanges.nose.projection
    );

    const symmetryDeviation = this.calculateDeviation(
      noseMetrics.nostrilSymmetry,
      this.baselineRanges.nose.symmetry
    );

    const weightedDeviation =
      this.weightingFactors.nose.width * widthDeviation +
      this.weightingFactors.nose.projection * projectionDeviation +
      this.weightingFactors.nose.symmetry * symmetryDeviation;

    return this.deviationToScore(weightedDeviation);
  }

  private calculateJawScore(jawMetrics: JawMetrics): number {
    const angleDeviation = this.calculateDeviation(
      jawMetrics.angle,
      this.baselineRanges.jaw.angle
    );

    const projectionDeviation = this.calculateDeviation(
      jawMetrics.lowerFaceRatio,
      this.baselineRanges.jaw.chinRatio
    );

    const asymmetryDeviation = this.calculateDeviation(
      jawMetrics.asymmetry,
      this.baselineRanges.jaw.asymmetry
    );

    const weightedDeviation =
      this.weightingFactors.jaw.angle * angleDeviation +
      this.weightingFactors.jaw.projection * projectionDeviation +
      this.weightingFactors.jaw.asymmetry * asymmetryDeviation;

    return this.deviationToScore(weightedDeviation);
  }

  private calculateDeviation(value: number, idealRange: readonly [number, number]): number {
    const [min, max] = idealRange;
    if (value >= min && value <= max) {
      return 0; // Perfect score within range
    }
    
    const center = (min + max) / 2;
    const rangeSize = max - min;
    const deviation = Math.abs(value - center) / rangeSize;
    
    return Math.min(deviation, 1); // Cap at 1.0 maximum deviation
  }

  private deviationToScore(weightedDeviation: number): number {
    // Convert weighted deviation to 0-100 score
    // Formula: 100 × (1 - Σ w_i * d_i)
    const score = 100 * (1 - weightedDeviation);
    return Math.max(0, Math.min(100, score));
  }
}