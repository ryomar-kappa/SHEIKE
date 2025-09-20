/**
 * Image and facial detection quality validation module
 * Validates face angle, lighting, and image quality for accurate analysis
 */

import type { NormalizedLandmark } from '@/types/mediapipe';
import type {
  QualityCheckResult,
  QualityIssue,
  QualityThresholds,
  ImageQualityMetrics,
  FaceQualityMetrics,
  QualityValidationError,
} from '@/types/quality';
import { LANDMARK_INDICES, extractLandmarksByIndices } from '@/lib/mediapipe';

const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  faceAngle: {
    maxYaw: 15, // degrees
    maxPitch: 15, // degrees
    maxRoll: 10, // degrees
  },
  brightness: {
    min: 80, // 0-255 scale
    max: 200,
  },
  contrast: {
    min: 30, // minimum contrast ratio
  },
  blur: {
    max: 0.1, // normalized blur metric
  },
  faceSize: {
    minWidth: 0.3, // relative to image width
    minHeight: 0.4, // relative to image height
    maxWidth: 0.8,
    maxHeight: 0.9,
  },
  facePosition: {
    centerTolerance: 0.15, // relative to image center
  },
} as const;

export class QualityValidator {
  constructor(private readonly thresholds: QualityThresholds = DEFAULT_QUALITY_THRESHOLDS) {}

  async validateImage(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    landmarks: readonly NormalizedLandmark[]
  ): Promise<QualityCheckResult> {
    const issues: QualityIssue[] = [];

    try {
      // Check if face was detected
      if (landmarks.length === 0) {
        issues.push({
          type: 'no_face_detected',
          severity: 'high',
          message: 'No face detected in the image. Please ensure your face is clearly visible.',
        });
        return this.createResult(false, issues, 0);
      }

      // Check for multiple faces (we only want one)
      const faceCount = this.estimateFaceCount(landmarks);
      if (faceCount > 1) {
        issues.push({
          type: 'multiple_faces',
          severity: 'medium',
          message: 'Multiple faces detected. Please ensure only one face is visible.',
          value: faceCount,
        });
      }

      // Validate image quality
      const imageQuality = await this.analyzeImageQuality(imageElement);
      issues.push(...this.validateImageQuality(imageQuality));

      // Validate face quality
      const faceQuality = this.analyzeFaceQuality(landmarks, imageElement);
      issues.push(...this.validateFaceQuality(faceQuality));

      // Calculate overall confidence
      const confidence = this.calculateConfidence(issues, imageQuality, faceQuality);
      const isValid = issues.filter(issue => issue.severity === 'high').length === 0;

      return this.createResult(isValid, issues, confidence);
    } catch (error) {
      const validationError: QualityValidationError = {
        name: 'QualityValidationError',
        message: `Quality validation failed: ${String(error)}`,
        code: 'ANALYSIS_FAILED',
        details: error,
      };
      throw validationError;
    }
  }

  private async analyzeImageQuality(
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<ImageQualityMetrics> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('Could not get canvas context for image analysis');
    }

    // Draw image to canvas for pixel analysis
    canvas.width = imageElement instanceof HTMLImageElement ? imageElement.naturalWidth : imageElement.width;
    canvas.height = imageElement instanceof HTMLImageElement ? imageElement.naturalHeight : imageElement.height;
    
    if (imageElement instanceof HTMLImageElement) {
      ctx.drawImage(imageElement, 0, 0);
    } else {
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Calculate brightness (average luminance)
    let totalBrightness = 0;
    const pixelCount = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      
      // Calculate luminance using standard formula
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += luminance;
    }

    const brightness = totalBrightness / pixelCount;

    // Calculate contrast (standard deviation of luminance)
    let varianceSum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      varianceSum += Math.pow(luminance - brightness, 2);
    }
    const contrast = Math.sqrt(varianceSum / pixelCount);

    // Estimate blur using edge detection
    const blur = this.estimateBlur(pixels, canvas.width, canvas.height);

    // Calculate saturation
    const saturation = this.calculateSaturation(pixels);

    // Estimate noise
    const noise = this.estimateNoise(pixels, canvas.width, canvas.height);

    return {
      brightness,
      contrast,
      blur,
      saturation,
      noise,
    };
  }

  private estimateBlur(pixels: Uint8ClampedArray, width: number, height: number): number {
    // Simple edge detection to estimate blur
    let edgeSum = 0;
    let edgeCount = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4;
        const current = pixels[index] ?? 0;
        const right = pixels[index + 4] ?? 0;
        const down = pixels[(y + 1) * width * 4 + x * 4] ?? 0;
        
        const edgeStrength = Math.abs(current - right) + Math.abs(current - down);
        edgeSum += edgeStrength;
        edgeCount++;
      }
    }

    const averageEdge = edgeSum / edgeCount;
    // Normalize to 0-1 range (higher = more blur)
    return Math.max(0, Math.min(1, 1 - averageEdge / 255));
  }

  private calculateSaturation(pixels: Uint8ClampedArray): number {
    let totalSaturation = 0;
    const pixelCount = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;
    }

    return (totalSaturation / pixelCount) * 255;
  }

  private estimateNoise(pixels: Uint8ClampedArray, width: number, height: number): number {
    // Estimate noise using local variance
    let totalVariance = 0;
    let sampleCount = 0;

    for (let y = 1; y < height - 1; y += 4) {
      for (let x = 1; x < width - 1; x += 4) {
        const neighbors: number[] = [];
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const index = ((y + dy) * width + (x + dx)) * 4;
            const luminance = 0.299 * (pixels[index] ?? 0) + 
                             0.587 * (pixels[index + 1] ?? 0) + 
                             0.114 * (pixels[index + 2] ?? 0);
            neighbors.push(luminance);
          }
        }

        const mean = neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;
        const variance = neighbors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / neighbors.length;
        totalVariance += variance;
        sampleCount++;
      }
    }

    return totalVariance / sampleCount;
  }

  private analyzeFaceQuality(
    landmarks: readonly NormalizedLandmark[],
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): FaceQualityMetrics {
    const imageWidth = imageElement instanceof HTMLImageElement ? imageElement.naturalWidth : imageElement.width;
    const imageHeight = imageElement instanceof HTMLImageElement ? imageElement.naturalHeight : imageElement.height;

    // Calculate face angles
    const faceOutline = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.FACE_OUTLINE);
    const angles = this.calculateFaceAngles(faceOutline);

    // Calculate face size and position
    const boundingBox = this.calculateFaceBoundingBox(landmarks);
    const _faceWidth = boundingBox.width * imageWidth;
    const _faceHeight = boundingBox.height * imageHeight;
    const faceArea = _faceWidth * _faceHeight;

    const centerX = (boundingBox.left + boundingBox.width / 2) * imageWidth;
    const centerY = (boundingBox.top + boundingBox.height / 2) * imageHeight;
    const imageCenterX = imageWidth / 2;
    const imageCenterY = imageHeight / 2;
    const offsetFromCenter = Math.sqrt(
      Math.pow(centerX - imageCenterX, 2) + Math.pow(centerY - imageCenterY, 2)
    ) / Math.sqrt(Math.pow(imageWidth / 2, 2) + Math.pow(imageHeight / 2, 2));

    // Calculate face completeness (how much of the face is visible)
    const completeness = this.calculateFaceCompleteness(landmarks);

    // Calculate face symmetry
    const symmetry = this.calculateFaceSymmetry(landmarks);

    return {
      angle: angles,
      size: {
        width: _faceWidth / imageWidth,
        height: _faceHeight / imageHeight,
        area: faceArea / (imageWidth * imageHeight),
      },
      position: {
        centerX: centerX / imageWidth,
        centerY: centerY / imageHeight,
        offsetFromCenter,
      },
      completeness,
      symmetry,
    };
  }

  private calculateFaceAngles(faceOutline: readonly NormalizedLandmark[]): { yaw: number; pitch: number; roll: number } {
    // Simplified angle calculation using key face points
    const leftPoint = faceOutline[0];
    const rightPoint = faceOutline[16];
    const topPoint = faceOutline[8];
    const bottomPoint = faceOutline[24];

    if (leftPoint === undefined || rightPoint === undefined || topPoint === undefined || bottomPoint === undefined) {
      return { yaw: 0, pitch: 0, roll: 0 };
    }

    // Roll: rotation around z-axis (head tilt)
    const roll = Math.atan2(rightPoint.y - leftPoint.y, rightPoint.x - leftPoint.x) * (180 / Math.PI);

    // Yaw: rotation around y-axis (left/right turn)
    // Calculate face dimensions for angle estimation
    const centerX = (leftPoint.x + rightPoint.x) / 2;
    const yaw = (centerX - 0.5) * 60; // Approximate yaw from face position

    // Pitch: rotation around x-axis (up/down tilt)
    const centerY = (topPoint.y + bottomPoint.y) / 2;
    const pitch = (centerY - 0.5) * 40; // Approximate pitch from face position

    return { yaw, pitch, roll };
  }

  private calculateFaceBoundingBox(landmarks: readonly NormalizedLandmark[]): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const landmark of landmarks) {
      minX = Math.min(minX, landmark.x);
      maxX = Math.max(maxX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxY = Math.max(maxY, landmark.y);
    }

    return {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private calculateFaceCompleteness(landmarks: readonly NormalizedLandmark[]): number {
    // Check if key landmarks are within image bounds and have good visibility
    const keyLandmarkIndices = [
      ...LANDMARK_INDICES.LEFT_EYE.slice(0, 4),
      ...LANDMARK_INDICES.RIGHT_EYE.slice(0, 4),
      ...LANDMARK_INDICES.NOSE_TIP.slice(0, 4),
      ...LANDMARK_INDICES.CHIN.slice(0, 4),
    ];

    let visibleCount = 0;
    for (const index of keyLandmarkIndices) {
      const landmark = landmarks[index];
      if (landmark !== undefined && 
          landmark.x >= 0 && landmark.x <= 1 && 
          landmark.y >= 0 && landmark.y <= 1 &&
          (landmark.visibility === undefined || landmark.visibility > 0.5)) {
        visibleCount++;
      }
    }

    return visibleCount / keyLandmarkIndices.length;
  }

  private calculateFaceSymmetry(landmarks: readonly NormalizedLandmark[]): number {
    // Calculate symmetry by comparing left and right side landmarks
    const leftEye = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.LEFT_EYE);
    const rightEye = extractLandmarksByIndices(landmarks, LANDMARK_INDICES.RIGHT_EYE);

    // Calculate centroids
    const leftCentroid = this.calculateCentroid(leftEye);
    const rightCentroid = this.calculateCentroid(rightEye);

    // Face center (approximate)
    const faceCenter = { x: 0.5, y: 0.5 };

    // Calculate distances from center
    const leftDistance = Math.sqrt(
      Math.pow(leftCentroid.x - faceCenter.x, 2) + Math.pow(leftCentroid.y - faceCenter.y, 2)
    );
    const rightDistance = Math.sqrt(
      Math.pow(rightCentroid.x - faceCenter.x, 2) + Math.pow(rightCentroid.y - faceCenter.y, 2)
    );

    // Symmetry is the ratio of distances (closer to 1 = more symmetric)
    const symmetryRatio = Math.min(leftDistance, rightDistance) / Math.max(leftDistance, rightDistance);
    return symmetryRatio;
  }

  private calculateCentroid(landmarks: readonly NormalizedLandmark[]): { x: number; y: number } {
    const sum = landmarks.reduce(
      (acc, landmark) => ({
        x: acc.x + landmark.x,
        y: acc.y + landmark.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / landmarks.length,
      y: sum.y / landmarks.length,
    };
  }

  private estimateFaceCount(landmarks: readonly NormalizedLandmark[]): number {
    // For simplicity, assume one face if we have landmarks
    // In a more sophisticated implementation, we'd analyze landmark clusters
    return landmarks.length > 0 ? 1 : 0;
  }

  private validateImageQuality(imageQuality: ImageQualityMetrics): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check brightness
    if (imageQuality.brightness < this.thresholds.brightness.min) {
      issues.push({
        type: 'brightness',
        severity: 'medium',
        message: 'Image is too dark. Please ensure adequate lighting.',
        value: imageQuality.brightness,
        threshold: this.thresholds.brightness.min,
      });
    } else if (imageQuality.brightness > this.thresholds.brightness.max) {
      issues.push({
        type: 'brightness',
        severity: 'medium',
        message: 'Image is too bright. Please reduce lighting or avoid direct light.',
        value: imageQuality.brightness,
        threshold: this.thresholds.brightness.max,
      });
    }

    // Check contrast
    if (imageQuality.contrast < this.thresholds.contrast.min) {
      issues.push({
        type: 'contrast',
        severity: 'low',
        message: 'Image has low contrast. Please ensure even lighting.',
        value: imageQuality.contrast,
        threshold: this.thresholds.contrast.min,
      });
    }

    // Check blur
    if (imageQuality.blur > this.thresholds.blur.max) {
      issues.push({
        type: 'blur',
        severity: 'high',
        message: 'Image is blurry. Please hold the camera steady and ensure focus.',
        value: imageQuality.blur,
        threshold: this.thresholds.blur.max,
      });
    }

    return issues;
  }

  private validateFaceQuality(faceQuality: FaceQualityMetrics): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check face angles
    if (Math.abs(faceQuality.angle.yaw) > this.thresholds.faceAngle.maxYaw) {
      issues.push({
        type: 'face_angle',
        severity: 'medium',
        message: 'Please face the camera more directly (reduce left/right turn).',
        value: Math.abs(faceQuality.angle.yaw),
        threshold: this.thresholds.faceAngle.maxYaw,
      });
    }

    if (Math.abs(faceQuality.angle.pitch) > this.thresholds.faceAngle.maxPitch) {
      issues.push({
        type: 'face_angle',
        severity: 'medium',
        message: 'Please look straight ahead (reduce up/down tilt).',
        value: Math.abs(faceQuality.angle.pitch),
        threshold: this.thresholds.faceAngle.maxPitch,
      });
    }

    if (Math.abs(faceQuality.angle.roll) > this.thresholds.faceAngle.maxRoll) {
      issues.push({
        type: 'face_angle',
        severity: 'low',
        message: 'Please straighten your head (reduce tilt).',
        value: Math.abs(faceQuality.angle.roll),
        threshold: this.thresholds.faceAngle.maxRoll,
      });
    }

    // Check face size
    if (faceQuality.size.width < this.thresholds.faceSize.minWidth) {
      issues.push({
        type: 'face_size',
        severity: 'medium',
        message: 'Please move closer to the camera for better analysis.',
        value: faceQuality.size.width,
        threshold: this.thresholds.faceSize.minWidth,
      });
    } else if (faceQuality.size.width > this.thresholds.faceSize.maxWidth) {
      issues.push({
        type: 'face_size',
        severity: 'medium',
        message: 'Please move further from the camera.',
        value: faceQuality.size.width,
        threshold: this.thresholds.faceSize.maxWidth,
      });
    }

    // Check face position
    if (faceQuality.position.offsetFromCenter > this.thresholds.facePosition.centerTolerance) {
      issues.push({
        type: 'face_position',
        severity: 'low',
        message: 'Please center your face in the frame.',
        value: faceQuality.position.offsetFromCenter,
        threshold: this.thresholds.facePosition.centerTolerance,
      });
    }

    // Check completeness
    if (faceQuality.completeness < 0.8) {
      issues.push({
        type: 'partial_face',
        severity: 'high',
        message: 'Part of your face is cut off. Please ensure your entire face is visible.',
        value: faceQuality.completeness,
        threshold: 0.8,
      });
    }

    return issues;
  }

  private calculateConfidence(
    issues: readonly QualityIssue[],
    imageQuality: ImageQualityMetrics,
    faceQuality: FaceQualityMetrics
  ): number {
    // Start with base confidence
    let confidence = 100;

    // Reduce confidence based on issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'high':
          confidence -= 30;
          break;
        case 'medium':
          confidence -= 15;
          break;
        case 'low':
          confidence -= 5;
          break;
      }
    }

    // Bonus for good metrics
    if (imageQuality.contrast > this.thresholds.contrast.min * 1.5) confidence += 5;
    if (imageQuality.blur < this.thresholds.blur.max * 0.5) confidence += 5;
    if (faceQuality.completeness > 0.95) confidence += 10;
    if (faceQuality.symmetry > 0.9) confidence += 5;

    return Math.max(0, Math.min(100, confidence));
  }

  private createResult(
    isValid: boolean,
    issues: readonly QualityIssue[],
    confidence: number
  ): QualityCheckResult {
    const recommendations: string[] = [];

    // Generate recommendations based on issues
    const issueTypes = new Set(issues.map(issue => issue.type));
    
    if (issueTypes.has('brightness') || issueTypes.has('poor_lighting')) {
      recommendations.push('💡 良好な照明環境で撮影してください（自然光が理想的）');
    }
    
    if (issueTypes.has('face_angle')) {
      recommendations.push('📐 カメラに対してまっすぐ顔を向けてください');
    }
    
    if (issueTypes.has('face_size')) {
      recommendations.push('📏 顔全体がフレームに収まる距離を調整してください');
    }
    
    if (issueTypes.has('blur')) {
      recommendations.push('🎯 カメラをしっかり固定し、ピントを合わせてください');
    }

    if (recommendations.length === 0 && isValid) {
      recommendations.push('✅ 画像品質は分析に適しています');
    }

    return {
      isValid,
      issues,
      confidence,
      recommendations,
    };
  }
}