// js/upload.js
import { supabase, STORAGE_BUCKET, STORAGE_FOLDERS } from '../config/supabase.js';

// Image compression settings
const IMAGE_CONFIG = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
};

/**
 * Compress image before upload
 * @param {File} file - The image file to compress
 * @returns {Promise<Blob>} Compressed image blob
 */
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if image is too large
        if (width > IMAGE_CONFIG.maxWidth || height > IMAGE_CONFIG.maxHeight) {
          if (width > height) {
            height = Math.round(height * (IMAGE_CONFIG.maxWidth / width));
            width = IMAGE_CONFIG.maxWidth;
          } else {
            width = Math.round(width * (IMAGE_CONFIG.maxHeight / height));
            height = IMAGE_CONFIG.maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', IMAGE_CONFIG.quality);
      };
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Generate unique filename
 * @param {string} userId - User ID
 * @param {string} originalName - Original file name
 * @returns {string} Unique filename
 */
function generateFileName(userId, originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split('.').pop();
  return `${userId}-${timestamp}-${random}.${extension}`;
}

/**
 * Upload file to Supabase storage
 * @param {File} file - File to upload
 * @param {string} folder - Folder name (profile-images, post-images, ebook-covers, ebook-pdfs)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Upload result with URL or error
 */
export async function uploadFile(file, folder, userId) {
  try {
    // Validate inputs
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate file type for images
    if (folder !== STORAGE_FOLDERS.EBOOK_PDFS) {
      if (!IMAGE_CONFIG.allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP)');
      }
    }

    // Validate PDF files
    if (folder === STORAGE_FOLDERS.EBOOK_PDFS && file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF file');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB');
    }

    // Compress images (but not PDFs)
    let fileToUpload = file;
    if (folder !== STORAGE_FOLDERS.EBOOK_PDFS && file.type.startsWith('image/')) {
      try {
        fileToUpload = await compressImage(file);
      } catch (compressError) {
        console.warn('Image compression failed, using original:', compressError);
        // Continue with original file if compression fails
      }
    }

    // Generate unique filename
    const fileName = generateFileName(userId, file.name);
    const filePath = `${folder}/${fileName}`;

    console.log(`Uploading to ${filePath}...`);

    // Upload to Supabase
    const { error: uploadError, data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log('Upload successful:', publicUrl);

    return { 
      success: true, 
      url: publicUrl,
      path: filePath,
      fileName: fileName
    };

  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown upload error'
    };
  }
}

/**
 * Upload profile image
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Upload result
 */
export async function uploadProfileImage(file, userId) {
  return uploadFile(file, STORAGE_FOLDERS.PROFILE_IMAGES, userId);
}

/**
 * Upload post image
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Upload result
 */
export async function uploadPostImage(file, userId) {
  return uploadFile(file, STORAGE_FOLDERS.POST_IMAGES, userId);
}

/**
 * Upload ebook cover image
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Upload result
 */
export async function uploadEbookCover(file, userId) {
  return uploadFile(file, STORAGE_FOLDERS.EBOOK_COVERS, userId);
}

/**
 * Upload ebook PDF
 * @param {File} file - PDF file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Upload result
 */
export async function uploadEbookPDF(file, userId) {
  return uploadFile(file, STORAGE_FOLDERS.EBOOK_PDFS, userId);
}

/**
 * Delete file from storage
 * @param {string} filePath - Full path of file to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteFile(filePath) {
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get file info
 * @param {string} filePath - Full path of file
 * @returns {Promise<Object>} File info
 */
export async function getFileInfo(filePath) {
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }

    const pathParts = filePath.split('/');
    const folder = pathParts[0];
    const fileName = pathParts[1];

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, {
        limit: 1,
        search: fileName
      });

    if (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }

    return { 
      success: true, 
      data: data && data.length > 0 ? data[0] : null 
    };
  } catch (error) {
    console.error('Get file info error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List files in a folder
 * @param {string} folder - Folder name
 * @param {string} userId - Optional user ID to filter
 * @returns {Promise<Object>} List of files
 */
export async function listFiles(folder, userId = null) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    // Filter by userId if provided (files are named with userId prefix)
    let filteredData = data;
    if (userId) {
      filteredData = data.filter(file => file.name.startsWith(userId));
    }

    return { 
      success: true, 
      data: filteredData,
      count: filteredData.length
    };
  } catch (error) {
    console.error('List files error:', error);
    return { success: false, error: error.message };
  }
}