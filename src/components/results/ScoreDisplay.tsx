import React from 'react'

interface ScoreDisplayProps {
  eyeScore: number
  noseScore: number
  jawScore: number
  suggestions: string[]
}

/**
 * スコア表示コンポーネント
 * 目/鼻/あごの0-100スコアと施術提案を表示
 */
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ eyeScore, noseScore, jawScore, suggestions }) => {
  // Implementation will be added here
  return (
    <div className="score-display">
      {/* Score gauges and suggestions implementation */}
    </div>
  )
}

export default ScoreDisplay