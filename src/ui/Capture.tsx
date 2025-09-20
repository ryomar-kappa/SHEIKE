/**
 * Camera capture component with getUserMedia integration
 * Provides mobile-optimized camera interface for facial image capture
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { MediaPipeFaceLandmarker } from '@/lib/mediapipe';
import { QualityValidator } from '@/lib/quality';
import { FacialMetricsCalculator } from '@/lib/metrics';
import { FileUpload } from '@/ui/FileUpload';
import { processImageFile, ImageProcessingError } from '@/utils/imageProcessing';
import type { NormalizedLandmark } from '@/types/mediapipe';
import type { QualityCheckResult } from '@/types/quality';
import type { FacialFeatures, QualityScores } from '@/types/metrics';

type CaptureMode = 'camera' | 'file';

interface CaptureState {
  readonly mode: CaptureMode;
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

export function Capture({ onCapture, onError, className = '' }: CaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captureState, setCaptureState] = useState<CaptureState>({ mode: 'camera', status: 'idle' });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MediaPipe components
  const landmarkerRef = useRef<MediaPipeFaceLandmarker | undefined>(undefined);
  const qualityValidatorRef = useRef<QualityValidator | undefined>(undefined);
  const metricsCalculatorRef = useRef<FacialMetricsCalculator | undefined>(undefined);

  useEffect(() => {
    const initializeComponents = async (): Promise<void> => {
      try {
        landmarkerRef.current = new MediaPipeFaceLandmarker({});
        await landmarkerRef.current.initialize();
        
        qualityValidatorRef.current = new QualityValidator();
        metricsCalculatorRef.current = new FacialMetricsCalculator();
        
        setIsInitialized(true);
      } catch (error) {
        const errorMessage = `Failed to initialize components: ${String(error)}`;
        setCaptureState(prev => ({ ...prev, status: 'error', error: errorMessage }));
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
  }, [captureState.stream, onError]);

  const startCamera = useCallback(async (): Promise<void> => {
    if (!isInitialized) {
      const errorMessage = 'Components not initialized';
      setCaptureState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onError?.(errorMessage);
      return;
    }

    setCaptureState(prev => ({ ...prev, status: 'requesting_camera' }));

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

        setCaptureState(prev => ({ ...prev, status: 'camera_active', stream }));
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

      setCaptureState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [isInitialized, onError]);

  const stopCamera = useCallback((): void => {
    if (captureState.stream !== undefined) {
      captureState.stream.getTracks().forEach(track => track.stop());
    }
    setCaptureState(prev => ({ ...prev, status: 'idle' }));
  }, [captureState.stream]);

  const processImage = useCallback(async (imageElement: HTMLImageElement): Promise<void> => {
    if (!landmarkerRef.current || !qualityValidatorRef.current || !metricsCalculatorRef.current) {
      const errorMessage = 'Components not initialized';
      setCaptureState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onError?.(errorMessage);
      return;
    }

    setCaptureState(prev => ({ ...prev, status: 'processing' }));

    try {
      // Detect landmarks
      const landmarks = await landmarkerRef.current.detectLandmarks(imageElement);

      if (landmarks.length === 0) {
        throw new Error('顔が検出されませんでした。顔全体がフレーム内に映るように調整してください。');
      }

      // Validate quality
      const qualityCheck = await qualityValidatorRef.current.validateImage(imageElement, landmarks);

      // Calculate facial features and scores
      const features = metricsCalculatorRef.current.calculateFacialFeatures(landmarks);
      const scores = metricsCalculatorRef.current.calculateQualityScores(features);

      // Create canvas to get image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx === null) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);
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
  }, [onCapture, onError]);

  const captureImage = useCallback(async (): Promise<void> => {
    if (!videoRef.current || !canvasRef.current || captureState.status !== 'camera_active') {
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

      // Create image element from canvas for processing
      const imageElement = new Image();
      imageElement.onload = () => {
        void processImage(imageElement);
      };
      imageElement.src = canvas.toDataURL('image/jpeg', 0.9);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '画像の処理中にエラーが発生しました';
      setCaptureState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [captureState.status, processImage]);

  const handleFileSelected = useCallback(async (file: File): Promise<void> => {
    setCaptureState(prev => ({ ...prev, status: 'processing' }));

    try {
      // Process uploaded file (EXIF correction and resize)
      const result = await processImageFile(file, { maxWidth: 1280, maxHeight: 1280 });

      // Process the corrected image
      await processImage(result.image);

    } catch (error) {
      let errorMessage = '画像ファイルの処理中にエラーが発生しました';

      if (error instanceof ImageProcessingError) {
        switch (error.code) {
          case 'LOAD_FAILED':
            errorMessage = '画像ファイルの読み込みに失敗しました。ファイルが破損していないか確認してください。';
            break;
          case 'INVALID_FILE':
            errorMessage = '無効な画像ファイルです。JPEG、PNG、WebP形式をご使用ください。';
            break;
          case 'PROCESSING_FAILED':
            errorMessage = '画像の処理に失敗しました。別の画像をお試しください。';
            break;
          default:
            errorMessage = error.message;
        }
      }

      setCaptureState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [processImage, onError]);

  const handleFileError = useCallback((error: string): void => {
    setCaptureState(prev => ({ ...prev, status: 'error', error }));
    onError?.(error);
  }, [onError]);

  const handleModeSwitch = useCallback((newMode: CaptureMode): void => {
    // Stop camera if switching away from camera mode
    if (captureState.mode === 'camera' && captureState.stream) {
      captureState.stream.getTracks().forEach(track => track.stop());
    }

    setCaptureState({ mode: newMode, status: 'idle' });
  }, [captureState.mode, captureState.stream]);

  const getStatusText = (): string => {
    switch (captureState.status) {
      case 'idle':
        return captureState.mode === 'camera' ? 'カメラを開始' : 'ファイルを選択';
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
      {/* Mode Selection */}
      <div className="mode-selector" style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => handleModeSwitch('camera')}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: captureState.mode === 'camera' ? '#2196f3' : '#f5f5f5',
            color: captureState.mode === 'camera' ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: captureState.mode === 'camera' ? 'bold' : 'normal',
          }}
        >
          📷 カメラ撮影
        </button>
        <button
          onClick={() => handleModeSwitch('file')}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: captureState.mode === 'file' ? '#2196f3' : '#f5f5f5',
            color: captureState.mode === 'file' ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: captureState.mode === 'file' ? 'bold' : 'normal',
          }}
        >
          📁 ファイル選択
        </button>
      </div>

      {/* Camera Mode */}
      {captureState.mode === 'camera' && (
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
              onClick={() => setCaptureState(prev => ({ ...prev, status: 'idle' }))}
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
      )}

      {/* File Upload Mode */}
      {captureState.mode === 'file' && (
        <div className="file-upload-section">
          {captureState.status === 'error' && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              エラー: {captureState.error}
            </div>
          )}

          <FileUpload
            onFileSelected={handleFileSelected}
            onError={handleFileError}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Camera Controls */}
      {captureState.mode === 'camera' && (
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
      )}

      {/* Processing Status */}
      {isLoading && (
        <div style={{
          marginTop: '20px',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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

            .mode-selector {
              flex-direction: column;
              align-items: center;
            }

            .mode-selector button {
              width: 100%;
              max-width: 200px;
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