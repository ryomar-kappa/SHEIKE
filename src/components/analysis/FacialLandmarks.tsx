import React from 'react'

interface FacialLandmarksProps {
  imageUrl: string
  landmarks: number[][]
  onAnalysisComplete: (features: any) => void
}

/**
 * 顔ランドマーク表示コンポーネント
 * MediaPipeの468点ランドマークを画像上に重畳表示
 */
const FacialLandmarks: React.FC<FacialLandmarksProps> = ({ imageUrl, landmarks, onAnalysisComplete }) => {
  // Implementation will be added here
  return (
    <div className="facial-landmarks">
      {/* Facial landmarks overlay implementation */}
    </div>
  )
}

export default FacialLandmarks