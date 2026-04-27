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
    console.warn('Image compression with WebWorker failed, retrying without WebWorker:', error);
    try {
      options.useWebWorker = false;
      const fallbackFile = await imageCompression(file, options);
      return fallbackFile;
    } catch (fallbackError) {
      console.error('Image compression error:', fallbackError);
      throw fallbackError;
    }
  }
};
