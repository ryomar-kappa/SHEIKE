import React from 'react'

interface LoadingSpinnerProps {
  message?: string
}

/**
 * ローディングスピナーコンポーネンツ
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = '処理中...' }) => {
  // Implementation will be added here
  return (
    <div className="loading-spinner">
      {/* Loading spinner implementation */}
    </div>
  )
}

export default LoadingSpinner