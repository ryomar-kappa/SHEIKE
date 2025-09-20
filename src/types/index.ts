/**
 * 共通型定義
 */

// Re-export from utility modules
export type { FaceLandmark, FaceDetectionResult } from '../utils/mediapipe/faceLandmarkDetector'
export type { FacialFeatures, FeatureScores } from '../utils/scoring/goldenRatioCalculator'
export type { ProcessedImage, ImageProcessingOptions } from '../utils/image/imageProcessor'
export type { AnalysisState } from '../hooks/useFaceAnalysis'

// Application-specific types
export interface AppConfig {
  mediapipeModelUrl: string
  maxImageSize: number
  qualityThresholds: {
    minBrightness: number
    maxAngle: number
    minConfidence: number
  }
}

export interface SuggestionCategory {
  id: string
  name: string
  description: string
  targetAreas: ('eye' | 'nose' | 'jaw')[]
  scoreThreshold: number
}

export interface AnalysisHistory {
  id: string
  timestamp: number
  imageUrl: string
  scores: FeatureScores
  suggestions: string[]
}