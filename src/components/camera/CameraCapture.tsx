import React from 'react'

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onError: (error: string) => void
}

/**
 * カメラキャプチャーコンポーネント
 * getUserMediaを使用してスマホカメラから画像を撮影
 */
const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onError }) => {
  // Implementation will be added here
  return (
    <div className="camera-capture">
      {/* Camera capture implementation */}
    </div>
  )
}

export default CameraCapture