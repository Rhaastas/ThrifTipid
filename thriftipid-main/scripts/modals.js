// Custom Modal System - Replaces browser alert(), prompt(), confirm()

// Create modal HTML structure
function createModalStructure() {
    const existing = document.getElementById('modalContainer');
    if (existing) return;
    
    const container = document.createElement('div');
    container.id = 'modalContainer';
    document.body.appendChild(container);
}

// Initialize modals
createModalStructure();

// Custom Alert
function customAlert(message, title = 'Notice') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-dialog alert-modal">
                <div class="modal-header">
                    <h2>${escapeHtml(title)}</h2>
                    <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove(); resolve()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert-icon">ℹ️</div>
                    <div class="alert-message">${escapeHtml(message)}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); resolve()">OK</button>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                resolve();
            }
        });
    });
}

// Custom Prompt
function customPrompt(message, defaultValue = '', title = 'Input Required') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        
        const inputId = 'prompt-input-' + Date.now();
        modal.innerHTML = `
            <div class="modal-dialog prompt-modal">
                <div class="modal-header">
                    <h2>${escapeHtml(title)}</h2>
                    <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove(); resolve(null)">&times;</button>
                </div>
                <div class="modal-body">
                    <label class="prompt-label">${escapeHtml(message)}</label>
                    <input type="text" id="${inputId}" class="prompt-input" value="${escapeHtml(defaultValue)}" autofocus>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" onclick="this.closest('.modal-overlay').remove(); resolve(null)">Cancel</button>
                    <button class="btn-primary" onclick="submitPrompt('${inputId}', this.closest('.modal-overlay'))">Submit</button>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').appendChild(modal);
        
        // Focus input
        setTimeout(() => {
            const input = document.getElementById(inputId);
            if (input) {
                input.focus();
                input.select();
                
                // Submit on Enter
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        modal.querySelector('.btn-primary').click();
                    }
                });
            }
        }, 100);
        
        // Close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        });
        
        // Store resolve function
        modal._resolve = resolve;
    });
}

// Submit prompt helper
function submitPrompt(inputId, modal) {
    const input = document.getElementById(inputId);
    const value = input ? input.value.trim() : null;
    if (modal && modal._resolve) {
        modal.remove();
        modal._resolve(value);
    }
}

// Custom Confirm
function customConfirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-dialog confirm-modal">
                <div class="modal-header">
                    <h2>${escapeHtml(title)}</h2>
                    <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove(); resolve(false)">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="confirm-icon">❓</div>
                    <div class="confirm-message">${escapeHtml(message)}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" onclick="this.closest('.modal-overlay').remove(); resolve(false)">Cancel</button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); resolve(true)">Confirm</button>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        });
        
        // Store resolve function
        modal._resolve = resolve;
    });
}

// Maintenance/Construction Modal
function showMaintenanceModal(featureName = 'This feature') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-dialog maintenance-modal">
                <div class="modal-header">
                    <h2>Under Construction</h2>
                    <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove(); resolve()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="maintenance-icon">🚧</div>
                    <div class="maintenance-title">Feature Coming Soon</div>
                    <div class="maintenance-message">
                        ${escapeHtml(featureName)} is currently under construction. We're working hard to bring you this feature soon!
                    </div>
                    <div class="maintenance-details">
                        <h3>What we're building:</h3>
                        <ul>
                            <li>Enhanced user experience</li>
                            <li>Improved functionality</li>
                            <li>Better security features</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); resolve()">Got it</button>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                resolve();
            }
        });
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.customAlert = customAlert;
window.customPrompt = customPrompt;
window.customConfirm = customConfirm;
window.showMaintenanceModal = showMaintenanceModal;

