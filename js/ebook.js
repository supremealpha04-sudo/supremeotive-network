import { supabase } from '../config/supabase.js';
import { getCurrentUser } from './auth.js';

// Fetch all ebooks
export async function fetchEbooks() {
  try {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check unlocked status for each ebook
    const { user } = await getCurrentUser();
    
    if (user) {
      const { data: unlocks } = await supabase
        .from('unlocks')
        .select('ebook_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      const unlockedIds = new Set(unlocks?.map(u => u.ebook_id) || []);

      const ebooksWithStatus = data.map(ebook => ({
        ...ebook,
        is_unlocked: !ebook.is_paid || unlockedIds.has(ebook.id)
      }));

      return { success: true, ebooks: ebooksWithStatus };
    }

    return { success: true, ebooks: data };
  } catch (error) {
    console.error('Fetch ebooks error:', error);
    return { success: false, error: error.message };
  }
}

// Request ebook unlock (via WhatsApp)
export async function requestUnlock(ebookId) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    // Get ebook details
    const { data: ebook } = await supabase
      .from('ebooks')
      .select('title, price')
      .eq('id', ebookId)
      .single();

    // Create unlock request
    const { error: requestError } = await supabase
      .from('unlock_requests')
      .insert([
        {
          user_id: user.id,
          ebook_id: ebookId,
          status: 'pending'
        }
      ]);

    if (requestError) throw requestError;

    // Create WhatsApp message
    const message = encodeURIComponent(
      `Unlock Request - SupremeMotive\n\n` +
      `User ID: ${user.id}\n` +
      `Ebook ID: ${ebookId}\n` +
      `Ebook Title: ${ebook.title}\n` +
      `Price: $${ebook.price}\n\n` +
      `Please process this unlock request.`
    );

    // Open WhatsApp (replace with admin number)
    window.open(`https://wa.me/1234567890?text=${message}`, '_blank');

    return { success: true };
  } catch (error) {
    console.error('Request unlock error:', error);
    return { success: false, error: error.message };
  }
}

// Check if ebook is unlocked for user
export async function isEbookUnlocked(ebookId, userId) {
  try {
    const { data, error } = await supabase
      .from('unlocks')
      .select('*')
      .eq('user_id', userId)
      .eq('ebook_id', ebookId)
      .eq('status', 'approved')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, unlocked: !!data };
  } catch (error) {
    console.error('Check unlock error:', error);
    return { success: false, error: error.message };
  }
}

// Upload ebook (admin only)
export async function uploadEbook(ebookData, coverFile, pdfFile) {
  try {
    const { user } = await getCurrentUser();
    
    if (!user) throw new Error('Not authenticated');

    // Upload cover image
    const coverExt = coverFile.name.split('.').pop();
    const coverName = `cover-${Date.now()}.${coverExt}`;
    
    const { error: coverError } = await supabase.storage
      .from('ebook-covers')
      .upload(coverName, coverFile);

    if (coverError) throw coverError;

    const { data: { publicUrl: coverUrl } } = supabase.storage
      .from('ebook-covers')
      .getPublicUrl(coverName);

    // Upload PDF
    const pdfExt = pdfFile.name.split('.').pop();
    const pdfName = `ebook-${Date.now()}.${pdfExt}`;
    
    const { error: pdfError } = await supabase.storage
      .from('ebook-pdfs')
      .upload(pdfName, pdfFile);

    if (pdfError) throw pdfError;

    const { data: { publicUrl: pdfUrl } } = supabase.storage
      .from('ebook-pdfs')
      .getPublicUrl(pdfName);

    // Create ebook record
    const { data, error } = await supabase
      .from('ebooks')
      .insert([
        {
          title: ebookData.title,
          description: ebookData.description,
          cover_url: coverUrl,
          pdf_url: pdfUrl,
          price: ebookData.price || 0,
          currency: ebookData.currency || 'USD',
          is_paid: ebookData.is_paid || false,
          category: ebookData.is_paid ? 'paid' : 'free',
          created_by: user.id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, ebook: data };
  } catch (error) {
    console.error('Upload ebook error:', error);
    return { success: false, error: error.message };
  }
}

// Render ebook library
export function renderEbooks(ebooks, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ebooks.map(ebook => `
    <div class="ebook-card" data-ebook-id="${ebook.id}">
      <img src="${ebook.cover_url}" alt="${ebook.title}" class="ebook-cover">
      
      <div class="ebook-info">
        <span class="ebook-badge ${ebook.category}">
          ${ebook.category.toUpperCase()}
        </span>
        
        <h3 class="ebook-title">${ebook.title}</h3>
        <p class="ebook-description">${ebook.description}</p>
        
        <div class="ebook-price ${ebook.category}">
          ${ebook.is_paid ? `$${ebook.price}` : 'FREE'}
        </div>
        
        <div class="ebook-actions">
          ${ebook.is_paid && !ebook.is_unlocked ? `
            <button class="btn btn-primary unlock-btn" 
                    onclick="handleUnlock('${ebook.id}')">
              Unlock via WhatsApp
            </button>
          ` : `
            <button class="btn btn-primary read-btn" 
                    onclick="readEbook('${ebook.id}')">
              Read Now
            </button>
          `}
        </div>
      </div>
    </div>
  `).join('');
}