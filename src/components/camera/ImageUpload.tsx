import React from 'react'

interface ImageUploadProps {
  onUpload: (file: File) => void
  onError: (error: string) => void
  accept?: string
}

/**
 * ファイルアップロードコンポーネント
 * ファイル選択での画像アップロード機能
 */
const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, onError, accept = 'image/*' }) => {
  // Implementation will be added here
  return (
    <div className="image-upload">
      {/* Image upload implementation */}
    </div>
  )
}

export default ImageUpload