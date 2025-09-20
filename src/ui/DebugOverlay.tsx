/**
 * Debug overlay component for landmark visualization
 * Displays facial landmarks, quality metrics, and analysis results
 */

import React, { useRef, useEffect, useState } from 'react';
import type { NormalizedLandmark } from '@/types/mediapipe';
import type { QualityCheckResult } from '@/types/quality';
import type { FacialFeatures, QualityScores } from '@/types/metrics';
import { LANDMARK_INDICES } from '@/lib/mediapipe';

interface DebugOverlayProps {
  readonly imageData?: ImageData;
  readonly landmarks?: readonly NormalizedLandmark[];
  readonly qualityCheck?: QualityCheckResult;
  readonly features?: FacialFeatures;
  readonly scores?: QualityScores;
  readonly className?: string;
}

type VisualizationMode = 'landmarks' | 'features' | 'quality' | 'metrics';

export function DebugOverlay({
  imageData,
  landmarks = [],
  qualityCheck,
  features,
  scores,
  className = '',
}: DebugOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<VisualizationMode>('landmarks');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // Draw the image
    ctx.putImageData(imageData, 0, 0);

    // Draw overlays based on mode
    switch (mode) {
      case 'landmarks':
        drawLandmarks(ctx, landmarks, imageData.width, imageData.height);
        break;
      case 'features':
        if (features) {
          drawFeatureOverlays(ctx, features, imageData.width, imageData.height);
        }
        break;
      case 'quality':
        if (qualityCheck) {
          drawQualityOverlays(ctx, qualityCheck, landmarks, imageData.width, imageData.height);
        }
        break;
      case 'metrics':
        if (features && scores) {
          drawMetricsOverlays(ctx, features, scores, imageData.width, imageData.height);
        }
        break;
    }
  }, [imageData, landmarks, qualityCheck, features, scores, mode]);

  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: readonly NormalizedLandmark[],
    width: number,
    height: number
  ): void => {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;

    // Draw all landmarks as small circles
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Label key landmarks
      if (index % 50 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px monospace';
        ctx.fillText(index.toString(), x + 3, y - 3);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      }
    });

    // Highlight key feature areas
    drawFeatureOutlines(ctx, landmarks, width, height);
  };

  const drawFeatureOutlines = (
    ctx: CanvasRenderingContext2D,
    landmarks: readonly NormalizedLandmark[],
    width: number,
    height: number
  ): void => {
    const drawLandmarkGroup = (indices: readonly number[], color: string, label: string): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      indices.forEach((index, i) => {
        const landmark = landmarks[index];
        if (!landmark) return;

        const x = landmark.x * width;
        const y = landmark.y * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.closePath();
      ctx.stroke();

      // Draw label
      const firstLandmark = landmarks[indices[0]];
      if (firstLandmark) {
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Arial';
        ctx.fillText(label, firstLandmark.x * width, firstLandmark.y * height - 10);
      }
    };

    drawLandmarkGroup(LANDMARK_INDICES.LEFT_EYE, '#00ff00', 'L.Eye');
    drawLandmarkGroup(LANDMARK_INDICES.RIGHT_EYE, '#00ff00', 'R.Eye');
    drawLandmarkGroup(LANDMARK_INDICES.NOSE_TIP, '#ffff00', 'Nose');
    drawLandmarkGroup(LANDMARK_INDICES.CHIN, '#ff00ff', 'Chin');
  };

  const drawFeatureOverlays = (
    ctx: CanvasRenderingContext2D,
    features: FacialFeatures,
    width: number,
    height: number
  ): void => {
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;

    let yOffset = 30;

    // Eye metrics
    const eyeText = [
      `Left Eye: ${features.eyes.leftEye.width.toFixed(3)} x ${features.eyes.leftEye.height.toFixed(3)}`,
      `Right Eye: ${features.eyes.rightEye.width.toFixed(3)} x ${features.eyes.rightEye.height.toFixed(3)}`,
      `IPD: ${features.eyes.interPupillaryDistance.toFixed(3)}`,
      `Eye Symmetry: ${features.eyes.eyeSymmetry.toFixed(3)}`,
    ];

    eyeText.forEach(text => {
      ctx.strokeText(text, 10, yOffset);
      ctx.fillText(text, 10, yOffset);
      yOffset += 20;
    });

    yOffset += 10;

    // Nose metrics
    const noseText = [
      `Nose Width: ${features.nose.width.toFixed(3)}`,
      `Nose Length: ${features.nose.length.toFixed(3)}`,
      `Bridge Width: ${features.nose.bridgeWidth.toFixed(3)}`,
      `Nostril Symmetry: ${features.nose.nostrilSymmetry.toFixed(3)}`,
    ];

    noseText.forEach(text => {
      ctx.strokeText(text, 10, yOffset);
      ctx.fillText(text, 10, yOffset);
      yOffset += 20;
    });

    yOffset += 10;

    // Jaw metrics
    const jawText = [
      `Jaw Width: ${features.jaw.width.toFixed(3)}`,
      `Jaw Angle: ${features.jaw.angle.toFixed(1)}°`,
      `Lower Face Ratio: ${features.jaw.lowerFaceRatio.toFixed(3)}`,
      `Jaw Asymmetry: ${features.jaw.asymmetry.toFixed(3)}`,
    ];

    jawText.forEach(text => {
      ctx.strokeText(text, 10, yOffset);
      ctx.fillText(text, 10, yOffset);
      yOffset += 20;
    });
  };

  const drawQualityOverlays = (
    ctx: CanvasRenderingContext2D,
    qualityCheck: QualityCheckResult,
    landmarks: readonly NormalizedLandmark[],
    width: number,
    height: number
  ): void => {
    // Draw quality status banner
    const bannerHeight = 60;
    ctx.fillStyle = qualityCheck.isValid ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)';
    ctx.fillRect(0, 0, width, bannerHeight);

    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(
      qualityCheck.isValid ? '✅ 品質チェック: 合格' : '❌ 品質チェック: 不合格',
      width / 2,
      25
    );

    ctx.font = '12px Arial';
    ctx.fillText(`信頼度: ${qualityCheck.confidence}%`, width / 2, 45);

    // Draw quality issues
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    let yOffset = bannerHeight + 20;

    qualityCheck.issues.forEach(issue => {
      const color = issue.severity === 'high' ? '#f44336' : 
                    issue.severity === 'medium' ? '#ff9800' : '#ffc107';
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      
      const text = `${issue.type}: ${issue.message}`;
      ctx.strokeText(text, 10, yOffset);
      ctx.fillStyle = color;
      ctx.fillText(text, 10, yOffset);
      yOffset += 18;
    });

    // Draw quality indicators on face
    if (landmarks.length > 0) {
      drawQualityIndicators(ctx, qualityCheck, landmarks, width, height);
    }
  };

  const drawQualityIndicators = (
    ctx: CanvasRenderingContext2D,
    qualityCheck: QualityCheckResult,
    landmarks: readonly NormalizedLandmark[],
    width: number,
    height: number
  ): void => {
    // Draw face bounding box with quality color
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    landmarks.forEach(landmark => {
      minX = Math.min(minX, landmark.x * width);
      maxX = Math.max(maxX, landmark.x * width);
      minY = Math.min(minY, landmark.y * height);
      maxY = Math.max(maxY, landmark.y * height);
    });

    const boxColor = qualityCheck.isValid ? '#4caf50' : '#f44336';
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(minX - 10, minY - 10, maxX - minX + 20, maxY - minY + 20);

    // Draw angle indicators
    const hasAngleIssue = qualityCheck.issues.some(issue => issue.type === 'face_angle');
    if (hasAngleIssue) {
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      // Draw angle guides
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX - 50, centerY);
      ctx.lineTo(centerX + 50, centerY);
      ctx.moveTo(centerX, centerY - 50);
      ctx.lineTo(centerX, centerY + 50);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }
  };

  const drawMetricsOverlays = (
    ctx: CanvasRenderingContext2D,
    features: FacialFeatures,
    scores: QualityScores,
    width: number,
    height: number
  ): void => {
    // Draw score display
    const scoreHeight = 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, height - scoreHeight, width, scoreHeight);

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Analysis Scores', width / 2, height - scoreHeight + 25);

    // Draw individual scores
    const scoreWidth = width / 4;
    const scoreData = [
      { label: 'Eyes', score: scores.eyes, color: '#2196f3' },
      { label: 'Nose', score: scores.nose, color: '#4caf50' },
      { label: 'Jaw', score: scores.jaw, color: '#ff9800' },
      { label: 'Overall', score: scores.overall, color: '#9c27b0' },
    ];

    scoreData.forEach((item, index) => {
      const x = scoreWidth * index + scoreWidth / 2;
      const y = height - 45;

      // Draw score circle
      const radius = 15;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw score text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.score.toString(), x, y + 4);

      // Draw label
      ctx.font = '10px Arial';
      ctx.fillText(item.label, x, y + 25);
    });
  };

  const hasData = imageData && landmarks.length > 0;

  return (
    <div className={`debug-overlay ${className}`}>
      {hasData && (
        <>
          <div className="debug-controls" style={{
            marginBottom: '15px',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              {(['landmarks', 'features', 'quality', 'metrics'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: mode === m ? '#2196f3' : '#f5f5f5',
                    color: mode === m ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                padding: '6px 12px',
                backgroundColor: showDetails ? '#4caf50' : '#f5f5f5',
                color: showDetails ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              詳細 {showDetails ? '▼' : '▶'}
            </button>
          </div>

          <div className="debug-canvas-container" style={{
            position: 'relative',
            display: 'inline-block',
            border: '2px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>

          {showDetails && (
            <div className="debug-details" style={{
              marginTop: '15px',
              padding: '15px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Landmarks:</strong> {landmarks.length} points detected
              </div>
              
              {qualityCheck && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Quality:</strong> {qualityCheck.isValid ? 'Valid' : 'Invalid'} 
                  (Confidence: {qualityCheck.confidence}%)
                  <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                    {qualityCheck.recommendations.map((rec, i) => (
                      <div key={i} style={{ color: '#666' }}>• {rec}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {scores && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>Scores:</strong> Eye: {scores.eyes}, Nose: {scores.nose}, 
                  Jaw: {scores.jaw}, Overall: {scores.overall}
                </div>
              )}
              
              {features && (
                <div>
                  <strong>Features:</strong>
                  <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                    <div>IPD: {features.eyes.interPupillaryDistance.toFixed(4)}</div>
                    <div>Nose W/L: {features.nose.width.toFixed(4)}/{features.nose.length.toFixed(4)}</div>
                    <div>Jaw W/A: {features.jaw.width.toFixed(4)}/{features.jaw.angle.toFixed(1)}°</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!hasData && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#666',
          fontSize: '16px',
        }}>
          📊 撮影後に解析結果が表示されます
        </div>
      )}
    </div>
  );
}