// js/upload.js
import { supabase, STORAGE_BUCKET, STORAGE_PATHS, IMAGE_CONFIG } from '../config/supabase.js';

// Compress image before upload
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if needed
        if (width > IMAGE_CONFIG.maxWidth || height > IMAGE_CONFIG.maxHeight) {
          if (width > height) {
            height *= IMAGE_CONFIG.maxWidth / width;
            width = IMAGE_CONFIG.maxWidth;
          } else {
            width *= IMAGE_CONFIG.maxHeight / height;
            height = IMAGE_CONFIG.maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', IMAGE_CONFIG.quality);
      };
    };
    reader.onerror = reject;
  });
}

// Upload file to appropriate folder in single bucket
export async function uploadFile(file, folder, userId, isImage = true) {
  try {
    // Validate file type for images
    if (isImage && !IMAGE_CONFIG.allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Compress if it's an image
    let fileToUpload = file;
    if (isImage && file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return { 
      success: true, 
      url: publicUrl,
      path: filePath 
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
}

// Delete file from storage
export async function deleteFile(filePath) {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
}

// Upload profile image
export async function uploadProfileImage(file, userId) {
  return uploadFile(file, STORAGE_PATHS.PROFILE_IMAGES, userId, true);
}

// Upload post image
export async function uploadPostImage(file, userId) {
  return uploadFile(file, STORAGE_PATHS.POST_IMAGES, userId, true);
}

// Upload ebook cover
export async function uploadEbookCover(file, userId) {
  return uploadFile(file, STORAGE_PATHS.EBOOK_COVERS, userId, true);
}

// Upload ebook PDF
export async function uploadEbookPDF(file, userId) {
  // PDFs don't need compression
  return uploadFile(file, STORAGE_PATHS.EBOOK_PDFS, userId, false);
}