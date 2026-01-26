// app/lib/image-utils.ts
// Client-side image compression utility

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputFormat?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    outputFormat: 'webp'
};

/**
 * Compress an image file before upload
 * - Resizes if dimensions exceed max
 * - Converts to WebP for better compression
 * - Maintains aspect ratio
 * - Reduces file size by ~60-80%
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Return original if not an image
    if (!file.type.startsWith('image/')) {
        console.warn('File is not an image, skipping compression');
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions maintaining aspect ratio
                let { width, height } = img;
                const aspectRatio = width / height;

                if (width > opts.maxWidth! || height > opts.maxHeight!) {
                    if (width > height) {
                        width = opts.maxWidth!;
                        height = width / aspectRatio;
                    } else {
                        height = opts.maxHeight!;
                        width = height * aspectRatio;
                    }
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Use high-quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new File from blob
                        const compressedFile = new File(
                            [blob],
                            file.name.replace(/\.[^.]+$/, `.${opts.outputFormat}`),
                            {
                                type: `image/${opts.outputFormat}`,
                                lastModified: Date.now()
                            }
                        );

                        // Log compression stats
                        const originalSize = (file.size / 1024 / 1024).toFixed(2);
                        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
                        const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

                        console.log(`📸 Image compressed: ${originalSize}MB → ${compressedSize}MB (${reduction}% reduction)`);

                        resolve(compressedFile);
                    },
                    `image/${opts.outputFormat}`,
                    opts.quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
    files: File[],
    options?: CompressionOptions
): Promise<File[]> {
    return Promise.all(files.map(file => compressImage(file, options)));
}
