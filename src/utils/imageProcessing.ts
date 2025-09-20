/**
 * Image processing utilities for facial analysis
 * Handles EXIF correction and resizing for optimal MediaPipe processing
 */

interface ProcessingOptions {
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly quality?: number;
  readonly preserveAspectRatio?: boolean;
}

interface ProcessingResult {
  readonly image: HTMLImageElement;
  readonly canvas: HTMLCanvasElement;
  readonly originalDimensions: {
    readonly width: number;
    readonly height: number;
  };
  readonly processedDimensions: {
    readonly width: number;
    readonly height: number;
  };
  readonly wasResized: boolean;
  readonly wasRotated: boolean;
}

export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: 'LOAD_FAILED' | 'PROCESSING_FAILED' | 'INVALID_FILE' | 'EXIF_ERROR',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

const DEFAULT_OPTIONS: Required<ProcessingOptions> = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.9,
  preserveAspectRatio: true,
} as const;

/**
 * Process uploaded image file with EXIF correction and resizing
 */
export async function processImageFile(
  file: File,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Load image and get EXIF orientation
    const { image, orientation } = await loadImageWithEXIF(file);
    const originalDimensions = {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };

    // Calculate target dimensions
    const targetDimensions = calculateTargetDimensions(
      originalDimensions,
      opts.maxWidth,
      opts.maxHeight,
      opts.preserveAspectRatio
    );

    // Create canvas and apply corrections
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ImageProcessingError(
        'Could not get canvas context',
        'PROCESSING_FAILED'
      );
    }

    // Apply EXIF orientation and resize
    const { wasRotated } = await applyOrientationAndResize(
      ctx,
      canvas,
      image,
      orientation,
      targetDimensions
    );

    const wasResized =
      targetDimensions.width !== originalDimensions.width ||
      targetDimensions.height !== originalDimensions.height;

    // Create processed image element
    const processedImage = await canvasToImage(canvas);

    return {
      image: processedImage,
      canvas,
      originalDimensions,
      processedDimensions: targetDimensions,
      wasResized,
      wasRotated,
    };

  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw error;
    }
    throw new ImageProcessingError(
      `Image processing failed: ${String(error)}`,
      'PROCESSING_FAILED',
      error
    );
  }
}

/**
 * Load image from file and extract EXIF orientation
 */
async function loadImageWithEXIF(file: File): Promise<{
  image: HTMLImageElement;
  orientation: number;
}> {
  const [image, orientation] = await Promise.all([
    loadImageFromFile(file),
    extractEXIFOrientation(file),
  ]);

  return { image, orientation };
}

/**
 * Load image from file as HTMLImageElement
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageProcessingError(
        'Failed to load image file',
        'LOAD_FAILED'
      ));
    };

    image.src = url;
  });
}

/**
 * Extract EXIF orientation from image file
 */
async function extractEXIFOrientation(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Check for JPEG format (starts with 0xFFD8)
    if (dataView.getUint16(0) !== 0xFFD8) {
      return 1; // No orientation data for non-JPEG
    }

    let offset = 2;
    const length = dataView.byteLength;

    // Look for EXIF marker (0xFFE1)
    while (offset < length) {
      const marker = dataView.getUint16(offset);

      if (marker === 0xFFE1) {
        // const exifLength = dataView.getUint16(offset + 2);
        const exifOffset = offset + 4;

        // Check for EXIF header "Exif\0\0"
        if (dataView.getUint32(exifOffset) === 0x45786966 &&
            dataView.getUint16(exifOffset + 4) === 0x0000) {

          return parseEXIFOrientation(dataView, exifOffset + 6);
        }
      }

      // Move to next marker
      if (marker === 0xFFDA) break; // Start of image data
      offset += 2 + dataView.getUint16(offset + 2);
    }

    return 1; // Default orientation (no transformation)
  } catch (error) {
    console.warn('Failed to extract EXIF orientation:', error);
    return 1; // Default orientation on error
  }
}

/**
 * Parse EXIF orientation from TIFF header
 */
function parseEXIFOrientation(dataView: DataView, offset: number): number {
  try {
    // Check byte order (II or MM)
    const byteOrder = dataView.getUint16(offset);
    const littleEndian = byteOrder === 0x4949;

    // Skip to IFD offset
    const ifdOffset = offset + dataView.getUint32(offset + 4, littleEndian);
    const entryCount = dataView.getUint16(ifdOffset, littleEndian);

    // Look for orientation tag (0x0112)
    for (let i = 0; i < entryCount; i++) {
      const entryOffset = ifdOffset + 2 + (i * 12);
      const tag = dataView.getUint16(entryOffset, littleEndian);

      if (tag === 0x0112) { // Orientation tag
        const value = dataView.getUint16(entryOffset + 8, littleEndian);
        return value >= 1 && value <= 8 ? value : 1;
      }
    }

    return 1; // Default orientation
  } catch (error) {
    console.warn('Failed to parse EXIF orientation:', error);
    return 1;
  }
}

/**
 * Calculate target dimensions with aspect ratio preservation
 */
function calculateTargetDimensions(
  original: { width: number; height: number },
  maxWidth: number,
  maxHeight: number,
  preserveAspectRatio: boolean
): { width: number; height: number } {
  if (!preserveAspectRatio) {
    return { width: maxWidth, height: maxHeight };
  }

  const { width, height } = original;

  // No resizing needed if already within limits
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calculate scaling factor
  const scaleX = maxWidth / width;
  const scaleY = maxHeight / height;
  const scale = Math.min(scaleX, scaleY);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Apply EXIF orientation correction and resize image
 */
async function applyOrientationAndResize(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  orientation: number,
  targetDimensions: { width: number; height: number }
): Promise<{ wasRotated: boolean }> {
  const { width: targetWidth, height: targetHeight } = targetDimensions;

  // Set canvas dimensions based on orientation
  const needsRotation = orientation >= 5 && orientation <= 8;
  const wasRotated = needsRotation;

  if (needsRotation) {
    // Swap dimensions for rotated images
    canvas.width = targetHeight;
    canvas.height = targetWidth;
  } else {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  // Apply transformation matrix based on EXIF orientation
  ctx.save();

  switch (orientation) {
    case 1:
      // Normal - no transformation
      break;
    case 2:
      // Horizontal flip
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      // 180 degree rotation
      ctx.translate(targetWidth, targetHeight);
      ctx.rotate(Math.PI);
      break;
    case 4:
      // Vertical flip
      ctx.translate(0, targetHeight);
      ctx.scale(1, -1);
      break;
    case 5:
      // 90 degree rotation + horizontal flip
      ctx.rotate(Math.PI / 2);
      ctx.scale(1, -1);
      break;
    case 6:
      // 90 degree rotation
      ctx.translate(targetHeight, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 7:
      // 270 degree rotation + horizontal flip
      ctx.translate(targetHeight, targetWidth);
      ctx.rotate(Math.PI / 2);
      ctx.scale(1, -1);
      break;
    case 8:
      // 270 degree rotation
      ctx.translate(0, targetWidth);
      ctx.rotate(-Math.PI / 2);
      break;
  }

  // Draw the image with applied transformations
  if (needsRotation) {
    ctx.drawImage(image, 0, 0, targetHeight, targetWidth);
  } else {
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  }

  ctx.restore();

  return { wasRotated };
}

/**
 * Convert canvas to HTMLImageElement
 */
function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new ImageProcessingError(
      'Failed to create processed image',
      'PROCESSING_FAILED'
    ));

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    image.src = dataUrl;
  });
}

/**
 * Get image processing statistics for debugging
 */
export function getProcessingStats(result: ProcessingResult): {
  readonly originalSize: string;
  readonly processedSize: string;
  readonly compressionRatio: number;
  readonly wasResized: boolean;
  readonly wasRotated: boolean;
} {
  const originalPixels = result.originalDimensions.width * result.originalDimensions.height;
  const processedPixels = result.processedDimensions.width * result.processedDimensions.height;
  const compressionRatio = originalPixels > 0 ? processedPixels / originalPixels : 1;

  return {
    originalSize: `${result.originalDimensions.width}x${result.originalDimensions.height}`,
    processedSize: `${result.processedDimensions.width}x${result.processedDimensions.height}`,
    compressionRatio,
    wasResized: result.wasResized,
    wasRotated: result.wasRotated,
  };
}