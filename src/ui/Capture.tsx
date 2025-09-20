/**
 * Camera capture component with getUserMedia integration
 * Provides mobile-optimized camera interface for facial image capture
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MediaPipeFaceLandmarker } from '@/lib/mediapipe';
import { QualityValidator } from '@/lib/quality';
import { FacialMetricsCalculator } from '@/lib/metrics';
import type { NormalizedLandmark } from '@/types/mediapipe';
import type { QualityCheckResult } from '@/types/quality';
import type { FacialFeatures, QualityScores } from '@/types/metrics';

interface CaptureState {
  readonly status: 'idle' | 'requesting_camera' | 'camera_active' | 'capturing' | 'processing' | 'complete' | 'error';
  readonly error?: string;
  readonly stream?: MediaStream;
}

interface CaptureResult {
  readonly imageData: ImageData;
  readonly landmarks: readonly NormalizedLandmark[];
  readonly qualityCheck: QualityCheckResult;
  readonly features: FacialFeatures;
  readonly scores: QualityScores;
}

interface CaptureProps {
  readonly onCapture?: (result: CaptureResult) => void;
  readonly onError?: (error: string) => void;
  readonly className?: string;
}

export function Capture({ onCapture, onError, className = '' }: CaptureProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captureState, setCaptureState] = useState<CaptureState>({ status: 'idle' });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MediaPipe components
  const landmarkerRef = useRef<MediaPipeFaceLandmarker>();
  const qualityValidatorRef = useRef<QualityValidator>();
  const metricsCalculatorRef = useRef<FacialMetricsCalculator>();

  useEffect(() => {
    const initializeComponents = async (): Promise<void> => {
      try {
        landmarkerRef.current = new MediaPipeFaceLandmarker();
        await landmarkerRef.current.initialize();
        
        qualityValidatorRef.current = new QualityValidator();
        metricsCalculatorRef.current = new FacialMetricsCalculator();
        
        setIsInitialized(true);
      } catch (error) {
        const errorMessage = `Failed to initialize components: ${String(error)}`;
        setCaptureState({ status: 'error', error: errorMessage });
        onError?.(errorMessage);
      }
    };

    void initializeComponents();

    // Cleanup on unmount
    return () => {
      landmarkerRef.current?.dispose();
      if (captureState.stream !== undefined) {
        captureState.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async (): Promise<void> => {
    if (!isInitialized) {
      const errorMessage = 'Components not initialized';
      setCaptureState({ status: 'error', error: errorMessage });
      onError?.(errorMessage);
      return;
    }

    setCaptureState({ status: 'requesting_camera' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera for selfies
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current !== null) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve, reject) => {
          if (videoRef.current === null) {
            reject(new Error('Video element not available'));
            return;
          }
          
          videoRef.current.onloadedmetadata = () => {
            void videoRef.current?.play();
            resolve();
          };
          videoRef.current.onerror = () => reject(new Error('Video failed to load'));
        });

        setCaptureState({ status: 'camera_active', stream });
      }
    } catch (error) {
      let errorMessage = 'Camera access denied or not available';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'カメラのアクセス許可が必要です。ブラウザの設定でカメラを有効にしてください。';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'カメラが見つかりません。デバイスにカメラが接続されていることを確認してください。';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'カメラが使用中です。他のアプリケーションでカメラを使用していないか確認してください。';
        }
      }

      setCaptureState({ status: 'error', error: errorMessage });
      onError?.(errorMessage);
    }
  }, [isInitialized, onError]);

  const stopCamera = useCallback((): void => {
    if (captureState.stream !== undefined) {
      captureState.stream.getTracks().forEach(track => track.stop());
    }
    setCaptureState({ status: 'idle' });
  }, [captureState.stream]);

  const captureImage = useCallback(async (): Promise<void> => {
    if (!videoRef.current || !canvasRef.current || 
        captureState.status !== 'camera_active' ||
        !landmarkerRef.current || !qualityValidatorRef.current || !metricsCalculatorRef.current) {
      return;
    }

    setCaptureState(prev => ({ ...prev, status: 'capturing' }));

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx === null) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setCaptureState(prev => ({ ...prev, status: 'processing' }));

      // Detect landmarks
      const landmarks = await landmarkerRef.current.detectLandmarks(canvas);

      if (landmarks.length === 0) {
        throw new Error('顔が検出されませんでした。顔全体がフレーム内に映るように調整してください。');
      }

      // Validate quality
      const qualityCheck = await qualityValidatorRef.current.validateImage(canvas, landmarks);

      // Calculate facial features and scores
      const features = metricsCalculatorRef.current.calculateFacialFeatures(landmarks);
      const scores = metricsCalculatorRef.current.calculateQualityScores(features);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const result: CaptureResult = {
        imageData,
        landmarks,
        qualityCheck,
        features,
        scores,
      };

      setCaptureState(prev => ({ ...prev, status: 'complete' }));
      onCapture?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '画像の処理中にエラーが発生しました';
      setCaptureState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [captureState.status, onCapture, onError]);

  const getStatusText = (): string => {
    switch (captureState.status) {
      case 'idle':
        return 'カメラを開始';
      case 'requesting_camera':
        return 'カメラアクセス中...';
      case 'camera_active':
        return '撮影準備完了';
      case 'capturing':
        return '撮影中...';
      case 'processing':
        return '解析中...';
      case 'complete':
        return '完了';
      case 'error':
        return 'エラー';
    }
  };

  const canCapture = captureState.status === 'camera_active';
  const isLoading = ['requesting_camera', 'capturing', 'processing'].includes(captureState.status);

  return (
    <div className={`capture-container ${className}`}>
      <div className="capture-video-container">
        <video
          ref={videoRef}
          className="capture-video"
          playsInline
          muted
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '70vh',
            objectFit: 'cover',
            borderRadius: '12px',
            display: captureState.status === 'camera_active' ? 'block' : 'none',
          }}
        />
        
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {captureState.status === 'idle' && (
          <div className="capture-placeholder" style={{
            width: '100%',
            height: '300px',
            backgroundColor: '#f0f0f0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#666',
          }}>
            📷 カメラを開始してください
          </div>
        )}

        {captureState.status === 'error' && (
          <div className="capture-error" style={{
            width: '100%',
            minHeight: '200px',
            backgroundColor: '#ffebee',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
            <div style={{ color: '#c62828', marginBottom: '15px' }}>
              {captureState.error}
            </div>
            <button
              onClick={() => setCaptureState({ status: 'idle' })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              再試行
            </button>
          </div>
        )}
      </div>

      <div className="capture-controls" style={{
        marginTop: '20px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {captureState.status === 'idle' && (
          <button
            onClick={startCamera}
            disabled={!isInitialized}
            style={{
              padding: '12px 24px',
              backgroundColor: isInitialized ? '#4caf50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: isInitialized ? 'pointer' : 'not-allowed',
              minWidth: '120px',
            }}
          >
            {isInitialized ? '📷 カメラ開始' : '初期化中...'}
          </button>
        )}

        {captureState.status === 'camera_active' && (
          <>
            <button
              onClick={captureImage}
              disabled={!canCapture}
              style={{
                padding: '12px 24px',
                backgroundColor: canCapture ? '#2196f3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: canCapture ? 'pointer' : 'not-allowed',
                minWidth: '120px',
              }}
            >
              📸 撮影
            </button>
            <button
              onClick={stopCamera}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              ⏹️ 停止
            </button>
          </>
        )}

        {isLoading && (
          <div style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#666',
          }}>
            <div className="loading-spinner" style={{
              width: '16px',
              height: '16px',
              border: '2px solid #ddd',
              borderTop: '2px solid #2196f3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            {getStatusText()}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .capture-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .capture-video-container {
            position: relative;
            width: 100%;
          }
          
          @media (max-width: 768px) {
            .capture-container {
              padding: 10px;
            }
            
            .capture-controls {
              flex-direction: column;
              align-items: center;
            }
            
            .capture-controls button {
              width: 100%;
              max-width: 300px;
            }
          }
        `}
      </style>
    </div>
  );
}