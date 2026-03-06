// js/utils.js

// Share post via Web Share API or fallback
export async function shareContent(title, text, url) {
  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url
      });
      return { success: true, method: 'share' };
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback to clipboard
      return copyToClipboard(url);
    }
  } else {
    // Fallback to clipboard
    return copyToClipboard(url);
  }
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, method: 'clipboard' };
  } catch (err) {
    console.error('Failed to copy: ', err);
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return { success: true, method: 'clipboard' };
    } catch (fallbackErr) {
      return { success: false, error: fallbackErr };
    }
  }
}

// Show share notification
export function showShareNotification(method, message = null) {
  // Remove any existing notification
  const existingNotification = document.querySelector('.share-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'share-notification';
  
  if (method === 'share') {
    notification.textContent = message || 'Shared successfully!';
    notification.classList.add('success');
  } else if (method === 'clipboard') {
    notification.textContent = message || 'Link copied to clipboard!';
    notification.classList.add('success');
  } else {
    notification.textContent = message || 'Sharing failed. Please try again.';
    notification.classList.add('error');
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 2700);
}

// Format date nicely
export function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Debounce function for search inputs
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Validate email format
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Generate random color for avatars
export function getRandomColor() {
  const colors = ['#FFD700', '#00F0FF', '#4CAF50', '#F44336', '#FFC107', '#9C27B0', '#FF9800'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Local storage helpers with error handling
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage', e);
      return false;
    }
  },
  
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage', e);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing localStorage', e);
      return false;
    }
  }
};

// Session storage helpers
export const session = {
  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving to sessionStorage', e);
      return false;
    }
  },
  
  get: (key) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error reading from sessionStorage', e);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from sessionStorage', e);
      return false;
    }
  }
};

// Handle image loading errors
export function handleImageError(img, fallbackSrc = 'assets/images/default-avatar.png') {
  if (img) {
    img.onerror = null; // Prevent infinite loop
    img.src = fallbackSrc;
  }
}

// Get file extension
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Escape HTML to prevent XSS
export function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Create loading spinner
export function createSpinner(size = 'medium') {
  const spinner = document.createElement('div');
  spinner.className = `loading-spinner ${size}`;
  return spinner;
}

// Show loading overlay
export function showLoading(container, message = 'Loading...') {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner large"></div>
      <p>${message}</p>
    </div>
  `;
  container.appendChild(overlay);
  return overlay;
}

// Hide loading overlay
export function hideLoading(overlay) {
  if (overlay && overlay.parentNode) {
    overlay.remove();
  }
}

// Show toast message
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, duration);
}

// Get query parameter from URL
export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Set query parameter in URL without reload
export function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

// Remove query parameter from URL
export function removeQueryParam(param) {
  const url = new URL(window.location);
  url.searchParams.delete(param);
  window.history.pushState({}, '', url);
}

// Detect if user is on mobile
export function isMobile() {
  return window.innerWidth <= 768;
}

// Detect if user is on iOS
export function isIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}

// Smooth scroll to element
export function scrollToElement(element, offset = 0) {
  if (!element) return;
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

// Validate URL
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}