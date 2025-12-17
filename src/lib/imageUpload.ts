/**
 * Upload image to Cloudinary and return URL
 * Falls back to base64 if Cloudinary is not configured
 */
export async function uploadImage(file: File): Promise<string> {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  
  try {
    // Try uploading as file first (more efficient)
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    
    if (result.success && result.data?.url) {
      return result.data.url;
    } else {
      throw new Error('Invalid response from upload endpoint');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    
    // Fallback: convert to base64 if upload fails
    // Falling back to base64 encoding
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Upload base64 image to Cloudinary
 * Useful when you already have a base64 string
 */
export async function uploadImageBase64(base64Image: string): Promise<string> {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  
  try {
    const response = await fetch(`${API_URL}/upload-image-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    
    if (result.success && result.data?.url) {
      return result.data.url;
    } else {
      // If Cloudinary not configured, it returns the base64 as-is
      return base64Image;
    }
  } catch (error) {
    console.error('Base64 image upload error:', error);
    // Return original base64 if upload fails
    return base64Image;
  }
}

