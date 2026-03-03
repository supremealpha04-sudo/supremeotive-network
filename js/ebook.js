// eBooks Logic

let ebooks = [];
let currentEbook = null;

async function showEbooks() {
    setContentScreen('ebooks-screen');
    await loadEbooks();
}

async function loadEbooks() {
    const container = document.getElementById('ebooks-container');
    container.innerHTML = `
        <div class="loading-shimmer">
            <div class="shimmer-ebook"></div>
            <div class="shimmer-ebook"></div>
            <div class="shimmer-ebook"></div>
            <div class="shimmer-ebook"></div>
        </div>
    `;

    try {
        ebooks = await db.getEbooks();
        renderEbooks();
    } catch (error) {
        showToast('Failed to load eBooks', 'error');
    }
}

function renderEbooks() {
    const container = document.getElementById('ebooks-container');
    
    if (ebooks.length === 0) {
        container.innerHTML = '<p class="empty-state">No eBooks available</p>';
        return;
    }

    container.innerHTML = ebooks.map(ebook => `
        <div class="ebook-card" onclick="handleEbookClick('${ebook.id}')">
            <div class="ebook-cover">
                <img src="${ebook.cover_url}" alt="${escapeHtml(ebook.title)}" loading="lazy">
                ${ebook.category === 'paid' && !ebook.is_unlocked ? `
                    <span class="ebook-badge price">${utils.formatPrice(ebook.price, ebook.currency)}</span>
                ` : ebook.is_unlocked ? `
                    <span class="ebook-badge unlocked">✓</span>
                ` : `
                    <span class="ebook-badge free">FREE</span>
                `}
            </div>
            <div class="ebook-info">
                <h3 class="ebook-title">${escapeHtml(ebook.title)}</h3>
                <span class="ebook-category ${ebook.category}">
                    ${ebook.is_unlocked ? 'Unlocked' : ebook.category}
                </span>
            </div>
        </div>
    `).join('');
}

function handleEbookClick(ebookId) {
    const ebook = ebooks.find(e => e.id === ebookId);
    if (!ebook) return;

    if (ebook.category === 'free' || ebook.is_unlocked) {
        openEbook(ebook);
    } else {
        showUnlockModal(ebook);
    }
}

function openEbook(ebook) {
    currentEbook = ebook;
    document.getElementById('reader-title').textContent = ebook.title;
    document.getElementById('pdf-viewer').src = ebook.pdf_url;
    openModal('ebook-reader-modal');
}

function showUnlockModal(ebook) {
    currentEbook = ebook;
    document.getElementById('whatsapp-ebook-cover').src = ebook.cover_url;
    document.getElementById('whatsapp-ebook-title').textContent = ebook.title;
    document.getElementById('whatsapp-ebook-price').textContent = utils.formatPrice(ebook.price, ebook.currency);
    
    const message = `Hello SupremeMotive Team,\n\nI would like to request access to:\n\nTitle: ${ebook.title}\nPrice: ${utils.formatPrice(ebook.price, ebook.currency)}\nMy User ID: ${currentUser.id}\neBook ID: ${ebook.id}\n\nPlease confirm payment details.`;
    
    const whatsappUrl = `https://wa.me/2348012345678?text=${encodeURIComponent(message)}`;
    document.getElementById('whatsapp-link').href = whatsappUrl;
    
    openModal('whatsapp-modal');
}

// Create eBook
function showCreateEbook() {
    document.getElementById('create-ebook-form').reset();
    document.getElementById('ebook-cover-preview').classList.add('hidden');
    document.getElementById('ebook-pdf-name').textContent = '';
    openModal('create-ebook-modal');
}

document.getElementById('ebook-pdf').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('ebook-pdf-name').textContent = file.name;
    }
});

document.getElementById('create-ebook-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    showLoading(btn);

    try {
        const title = document.getElementById('ebook-title').value;
        const description = document.getElementById('ebook-description').value;
        const price = parseFloat(document.getElementById('ebook-price').value) || 0;
        const currency = document.getElementById('ebook-currency').value;
        const category = document.getElementById('ebook-category').value;
        const coverFile = document.getElementById('ebook-cover').files[0];
        const pdfFile = document.getElementById('ebook-pdf').files[0];

        if (!coverFile || !pdfFile) {
            throw new Error('Please select both cover and PDF files');
        }

        // Upload cover
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `ebooks/covers/${utils.generateId()}.${coverExt}`;
        await storage.uploadFile('images', coverPath, coverFile);
        const coverUrl = await storage.getPublicUrl('images', coverPath);

        // Upload PDF
        const pdfExt = pdfFile.name.split('.').pop();
        const pdfPath = `ebooks/pdfs/${utils.generateId()}.${pdfExt}`;
        await storage.uploadFile('documents', pdfPath, pdfFile);
        const pdfUrl = await storage.getPublicUrl('documents', pdfPath);

        await db.createEbook({
            title,
            description,
            cover_url: coverUrl,
            pdf_url: pdfUrl,
            price,
            currency,
            category,
            created_by: currentUser.id
        });

        closeModal();
        await loadEbooks();
        showToast('eBook added successfully', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading(btn);
    }
});
