/* Navigation */
.navbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--surface);
    border-top: 1px solid var(--surface-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-lg);
    z-index: 100;
}

.nav-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.nav-icon {
    font-size: 1.5rem;
}

.nav-title {
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--accent-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-links {
    display: flex;
    gap: var(--spacing-xs);
}

.nav-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--spacing-xs) var(--spacing-md);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 1.25rem;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
}

.nav-link span:last-child {
    font-size: 0.625rem;
    font-weight: 500;
}

.nav-link:hover,
.nav-link.active {
    color: var(--accent);
    background: rgba(212, 175, 55, 0.1);
}

/* Content Screens */
.content-screen {
    display: none;
    padding-bottom: 80px;
    min-height: 100vh;
}

.content-screen.active {
    display: block;
    animation: fadeIn 0.3s ease;
}

/* Profile Screen */
.profile-container {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--spacing-lg);
}

.profile-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
}

.profile-avatar-container {
    position: relative;
    display: inline-block;
    margin-bottom: var(--spacing-md);
}

.profile-avatar,
.profile-avatar-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--accent);
}

.profile-avatar-placeholder {
    background: var(--surface-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
}

.btn-edit-avatar {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--accent) !important;
    color: #000 !important;
}

.profile-role {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-md);
    background: rgba(212, 175, 55, 0.2);
    color: var(--accent);
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-top: var(--spacing-sm);
}

.profile-info {
    background: var(--surface);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}

.info-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
    border-bottom: 1px solid var(--surface-light);
}

.info-item:last-child {
    border-bottom: none;
}

.info-icon {
    font-size: 1.25rem;
    opacity: 0.6;
}

.profile-bio {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--surface-light);
    font-style: italic;
    color: var(--text-secondary);
}

/* Modals */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all var(--transition-normal);
}

.modal-overlay.active {
    opacity: 1;
    visibility: visible;
}

.modal {
    background: var(--surface);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    transform: scale(0.9) translateY(20px);
    transition: all var(--transition-normal);
}

.modal-overlay.active .modal {
    transform: scale(1) translateY(0);
}

.modal-large {
    max-width: 600px;
}

.modal-full {
    max-width: 90vw;
    width: 90vw;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--surface-light);
}

.modal-header h3 {
    font-size: 1.25rem;
}

.modal form {
    padding: var(--spacing-lg);
}

.modal input,
.modal textarea,
.modal select {
    width: 100%;
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    background: var(--surface-light);
    border: 1px solid var(--surface-lighter);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 0.9375rem;
}

.modal input:focus,
.modal textarea:focus,
.modal select:focus {
    outline: none;
    border-color: var(--accent);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}

/* Edit Profile */
.edit-profile-form {
    max-width: 500px;
    margin: 0 auto;
    padding: var(--spacing-lg);
}
