import { useState } from 'react';
import { Capture } from './ui/Capture';
import { DebugOverlay } from './ui/DebugOverlay';
import type { NormalizedLandmark } from './types/mediapipe';
import type { QualityCheckResult } from './types/quality';
import type { FacialFeatures, QualityScores } from './types/metrics';

interface CaptureResult {
  readonly imageData: ImageData;
  readonly landmarks: readonly NormalizedLandmark[];
  readonly qualityCheck: QualityCheckResult;
  readonly features: FacialFeatures;
  readonly scores: QualityScores;
}

export function App() {
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = (captureResult: CaptureResult) => {
    setResult(captureResult);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setResult(null);
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>SHEIKE - 顔分析PoC</h1>
        <p>MediaPipe Face Landmarker による顔特徴解析システム（STEP1）</p>
      </header>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          エラー: {error}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <Capture onCapture={handleCapture} onError={handleError} />
      </div>

      {result && (
        <div>
          <h2>解析結果</h2>
          <div style={{ 
            display: 'grid', 
            gap: '20px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            marginBottom: '20px'
          }}>
            <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <h3>スコア</h3>
              <div>👁️ Eyes: {result.scores.eyes}/100</div>
              <div>👃 Nose: {result.scores.nose}/100</div>
              <div>🦴 Jaw: {result.scores.jaw}/100</div>
              <div><strong>📊 Overall: {result.scores.overall}/100</strong></div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <h3>品質チェック</h3>
              <div style={{ color: result.qualityCheck.isValid ? '#4caf50' : '#f44336' }}>
                {result.qualityCheck.isValid ? '✅ 合格' : '❌ 不合格'}
              </div>
              <div>信頼度: {result.qualityCheck.confidence}%</div>
              <div>ランドマーク: {result.landmarks.length}点</div>
            </div>
          </div>

          <DebugOverlay
            imageData={result.imageData}
            landmarks={result.landmarks}
            qualityCheck={result.qualityCheck}
            features={result.features}
            scores={result.scores}
          />

          {result.qualityCheck.recommendations.length > 0 && (
            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px'
            }}>
              <h3>推奨事項</h3>
              <ul>
                {result.qualityCheck.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <footer style={{ 
        marginTop: '40px', 
        textAlign: 'center', 
        color: '#666', 
        fontSize: '14px' 
      }}>
        <p>
          STEP1: Input, Detection, Normalization<br/>
          TypeScript strict mode | MediaPipe Face Landmarker | Mobile-first design
        </p>
      </footer>
    </div>
  );
}