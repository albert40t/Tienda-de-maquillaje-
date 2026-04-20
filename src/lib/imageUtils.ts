import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File, maxWidth = 1024, quality = 0.8): Promise<Blob> => {
  const options = {
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
    initialQuality: quality,
    alwaysKeepAspectRatio: true,
    fileType: 'image/webp' as any
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};
