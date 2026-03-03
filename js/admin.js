/* Admin Screen */
.admin-tabs {
    display: flex;
    gap: var(--spacing-xs);
    padding: var(--spacing-md);
    background: var(--surface);
    border-bottom: 1px solid var(--surface-light);
    overflow-x: auto;
}

.admin-tab {
    padding: var(--spacing-sm) var(--spacing-lg);
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
}

.admin-tab:hover {
    background: var(--surface-light);
    color: var(--text-primary);
}

.admin-tab.active {
    background: var(--accent);
    color: #000;
}

.admin-panel {
    display: none;
    padding: var(--spacing-lg);
    max-width: 1000px;
    margin: 0 auto;
}

.admin-panel.active {
    display: block;
}

.admin-list {
    margin-top: var(--spacing-lg);
}

.admin-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--surface);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
}

.admin-item img {
    width: 50px;
    height: 70px;
    object-fit: cover;
    border-radius: var(--radius-sm);
}

.admin-item-info {
    flex: 1;
}

.admin-item-title {
    font-weight: 600;
    margin-bottom: 2px;
}

.admin-item-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.admin-item-actions {
    display: flex;
    gap: var(--spacing-sm);
}

/* Unlock Admin */
.unlock-tabs {
    display: flex;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.unlock-tab {
    padding: var(--spacing-sm) var(--spacing-md);
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
}

.unlock-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
}

.unlock-panel {
    display: none;
}

.unlock-panel.active {
    display: block;
}

.unlock-request {
    background: var(--surface);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
}

.unlock-request-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
}

.unlock-request-info h4 {
    font-size: 1.125rem;
    margin-bottom: var(--spacing-xs);
}

.unlock-request-info p {
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.unlock-request-price {
    background: rgba(245, 158, 11, 0.2);
    color: var(--warning);
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-sm);
    font-weight: 600;
}

.unlock-request-actions {
    display: flex;
    gap: var(--spacing-md);
}

.unlock-request-actions button {
    flex: 1;
}

/* User Management */
.user-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--surface);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
}

.user-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-light));
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #000;
}

.user-info {
    flex: 1;
}

.user-name {
    font-weight: 600;
    margin-bottom: 2px;
}

.user-email {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.user-role {
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
}

.user-role.user { background: var(--text-muted); }
.user-role.postAdmin { background: #3B82F6; }
.user-role.ebookAdmin { background: var(--success); }
.user-role.unlockAdmin { background: var(--warning); }
.user-role.superAdmin { background: #8B5CF6; }

.role-selector {
    background: var(--surface-light);
    color: var(--text-primary);
    border: 1px solid var(--surface-lighter);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);
    cursor: pointer;
}
