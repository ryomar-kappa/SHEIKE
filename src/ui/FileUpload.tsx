/**
 * File upload component for facial image analysis
 * Supports drag & drop and file selection with image preview
 */

import { useRef, useState, useCallback, useEffect } from 'react';

interface FileUploadState {
  readonly status: 'idle' | 'selecting' | 'loading' | 'ready' | 'error';
  readonly error?: string;
  readonly file?: File;
  readonly previewUrl?: string;
}

interface FileUploadProps {
  readonly onFileSelected?: (file: File, previewUrl: string) => void;
  readonly onError?: (error: string) => void;
  readonly className?: string;
  readonly disabled?: boolean;
}

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({ onFileSelected, onError, className = '', disabled = false }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<FileUploadState>({ status: 'idle' });
  const [isDragOver, setIsDragOver] = useState(false);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (uploadState.previewUrl) {
        URL.revokeObjectURL(uploadState.previewUrl);
      }
    };
  }, [uploadState.previewUrl]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type as typeof ACCEPTED_FILE_TYPES[number])) {
      return `サポートされていないファイル形式です。JPEG、PNG、WebP形式をご使用ください。（選択されたファイル: ${file.type})`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `ファイルサイズが大きすぎます。10MB以下のファイルをご使用ください。（選択されたファイル: ${sizeMB}MB）`;
    }

    return null;
  }, []);

  const processFile = useCallback(async (file: File): Promise<void> => {
    setUploadState({ status: 'loading' });

    try {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadState({ status: 'error', error: validationError });
        onError?.(validationError);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      setUploadState({
        status: 'ready',
        file,
        previewUrl
      });

      onFileSelected?.(file, previewUrl);

    } catch (error) {
      const errorMessage = `ファイルの処理中にエラーが発生しました: ${String(error)}`;
      setUploadState({ status: 'error', error: errorMessage });
      onError?.(errorMessage);
    }
  }, [validateFile, onFileSelected, onError]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  }, [processFile]);

  const handleClick = useCallback((): void => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleDragOver = useCallback((event: React.DragEvent): void => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent): void => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent): void => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(event.dataTransfer.files);
    const file = files[0];

    if (file) {
      void processFile(file);
    }
  }, [disabled, processFile]);

  const handleClear = useCallback((): void => {
    if (uploadState.previewUrl) {
      URL.revokeObjectURL(uploadState.previewUrl);
    }
    setUploadState({ status: 'idle' });

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadState.previewUrl]);

  const getStatusText = (): string => {
    switch (uploadState.status) {
      case 'idle':
        return '画像ファイルを選択';
      case 'selecting':
        return 'ファイル選択中...';
      case 'loading':
        return '画像を読み込み中...';
      case 'ready':
        return '画像準備完了';
      case 'error':
        return 'エラー';
    }
  };

  const isLoading = uploadState.status === 'loading';
  const hasFile = uploadState.status === 'ready' && uploadState.file && uploadState.previewUrl;

  return (
    <div className={`file-upload-container ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {!hasFile && (
        <div
          className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            width: '100%',
            minHeight: '200px',
            backgroundColor: isDragOver ? '#e3f2fd' : (uploadState.status === 'error' ? '#ffebee' : '#f5f5f5'),
            border: `2px dashed ${isDragOver ? '#2196f3' : (uploadState.status === 'error' ? '#f44336' : '#ddd')}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {uploadState.status === 'error' ? '⚠️' : '📷'}
          </div>

          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: uploadState.status === 'error' ? '#c62828' : '#333'
          }}>
            {getStatusText()}
          </div>

          {uploadState.status === 'error' && uploadState.error && (
            <div style={{
              color: '#c62828',
              fontSize: '14px',
              marginBottom: '16px',
              padding: '8px',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
              border: '1px solid #ffcdd2',
            }}>
              {uploadState.error}
            </div>
          )}

          {uploadState.status !== 'error' && (
            <>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '12px'
              }}>
                クリックまたはドラッグ&ドロップでファイルを選択
              </div>

              <div style={{
                fontSize: '12px',
                color: '#999'
              }}>
                対応形式: JPEG, PNG, WebP（最大10MB）
              </div>
            </>
          )}

          {isLoading && (
            <div style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div className="loading-spinner" style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ddd',
                borderTop: '2px solid #2196f3',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              読み込み中...
            </div>
          )}
        </div>
      )}

      {hasFile && (
        <div className="file-preview" style={{
          width: '100%',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <img
              src={uploadState.previewUrl}
              alt="選択された画像のプレビュー"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '16px',
          }}>
            📁 {uploadState.file.name} ({(uploadState.file.size / (1024 * 1024)).toFixed(1)}MB)
          </div>

          <button
            onClick={handleClear}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🗑️ 選択解除
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .file-upload-container {
            max-width: 600px;
            margin: 0 auto;
          }

          .file-upload-area.drag-over {
            transform: scale(1.02);
          }

          .file-upload-area.disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .file-upload-area:hover:not(.disabled) {
            background-color: #fafafa;
          }

          @media (max-width: 768px) {
            .file-upload-container {
              padding: 10px;
            }

            .file-upload-area {
              min-height: 160px;
              padding: 16px;
            }
          }
        `}
      </style>
    </div>
  );
}