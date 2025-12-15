// Profile page functionality
let currentTab = 'items';
let currentFilter = 'all';
let userProfile = null;
let userProducts = [];
let userNotifications = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadProfileFromAPI();
    setupTabNavigation();
    setupEventListeners();
});

// Load profile data from API
async function loadProfileFromAPI() {
    try {
        const response = await fetch('/api/get_profile.php', {
            credentials: 'include'
        });
        
        console.log('Profile API response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Not authenticated, redirect to login
                console.log('Not authenticated, redirecting to login');
                window.location.href = '/public/pages/login.html?next=' + encodeURIComponent(window.location.pathname);
                return;
            }
            throw new Error('Failed to load profile: ' + response.status);
        }
        
        const data = await response.json();
        console.log('Profile data loaded:', data);
        
        userProfile = {
            ...data.user,
            stats: data.stats
        };
        userProducts = data.products || [];
        userNotifications = data.notifications || [];
        
        loadProfileData();
        loadMyItems();
        loadNotifications();
    } catch (error) {
        console.error('Error loading profile:', error);
        
        // Only redirect to login if it's clearly an auth issue
        // Network errors or other issues should not log the user out
        if (error.message && error.message.includes('401')) {
            window.location.href = '/public/pages/login.html?next=' + encodeURIComponent(window.location.pathname);
        } else {
            // Show error message but don't redirect
            alert('Failed to load profile data. Please refresh the page.');
        }
    }
}

// Load notifications into the notifications tab
function loadNotifications() {
    const list = document.getElementById('notificationsList');
    const empty = document.getElementById('notificationsEmpty');
    if (!list) return;
    list.innerHTML = '';
    const notes = window.userNotifications || userNotifications || [];
    if (!notes || notes.length === 0) {
        list.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    list.style.display = 'block';
    if (empty) empty.style.display = 'none';
    notes.forEach(n => {
        const item = document.createElement('div');
        item.className = 'notification-item';
        item.innerHTML = `
            <div class="notification-message">${escapeHtml(n.message)}</div>
            <div class="notification-meta">${new Date(n.created_at).toLocaleString()}</div>
        `;
        list.appendChild(item);
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"'`]/g, function (s) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;","`":"&#96;"})[s];
    });
}

// Load profile data
function loadProfileData() {
    if (!userProfile) return;
    
    const displayName = userProfile.display_name || userProfile.name || 'User';
    
    const profileNameEl = document.getElementById('profileName');
    if (profileNameEl) profileNameEl.textContent = displayName;
    
    // Location - use first product location or default
    const location = userProducts.length > 0 ? userProducts[0].location : 'Philippines';
    const profileLocationEl = document.getElementById('profileLocation');
    if (profileLocationEl) {
        profileLocationEl.innerHTML = `
            <span class="icon-map-marker"></span>
            ${location}
        `;
    }
    
    const itemsCountEl = document.getElementById('itemsCount');
    if (itemsCountEl) itemsCountEl.textContent = userProfile.stats?.items_listed || 0;
    
    const soldCountEl = document.getElementById('soldCount');
    if (soldCountEl) soldCountEl.textContent = userProfile.stats?.items_sold || 0;
    
    // Set avatar
    const avatarContainer = document.getElementById('profileAvatar');
    if (avatarContainer) {
        avatarContainer.innerHTML = `<div class="avatar-placeholder-large">${getInitials(displayName)}</div>`;
    }
    
    // Settings
    document.getElementById('settingsName').value = displayName;
    document.getElementById('settingsEmail').value = userProfile.email || '';
    document.getElementById('settingsLocation').value = location;
}

// Setup tab navigation
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.profile-tab');
    const sections = document.querySelectorAll('.profile-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

// Switch tab
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update sections
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${tabName}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load data for the tab if needed
    if (tabName === 'items') {
        loadMyItems();
    } else if (tabName === 'purchased') {
        loadPurchasedItems();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            switchTab('settings');
        });
    }
    
    // View settings button
    const viewSettingsBtn = document.getElementById('viewSettingsBtn');
    if (viewSettingsBtn) {
        viewSettingsBtn.addEventListener('click', () => {
            switchTab('settings');
        });
    }
    
    // Edit avatar button
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', () => {
            showMaintenanceModal('Avatar Upload');
        });
    }
    
    // Edit cover button
    const editCoverBtn = document.querySelector('.edit-cover-btn');
    if (editCoverBtn) {
        editCoverBtn.addEventListener('click', () => {
            showMaintenanceModal('Cover Photo Upload');
        });
    }
    
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadMyItems();
        });
    });
    
    // Edit field buttons in settings
    document.querySelectorAll('.edit-field-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input && input.hasAttribute('readonly')) {
                input.removeAttribute('readonly');
                input.focus();
                this.textContent = 'Save';
                this.onclick = function() {
                    input.setAttribute('readonly', 'readonly');
                    this.textContent = 'Edit';
                    showMaintenanceModal('Save Settings');
                };
            }
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle logout
function handleLogout() {
    // Show logout confirmation popup
    const popup = document.getElementById('logoutModal');
    if (popup) {
        popup.style.display = 'flex';
    }
}

// Close logout popup
function closeLogoutModal() {
    const popup = document.getElementById('logoutModal');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Confirm logout and execute
async function confirmLogout() {
    try {
        const response = await fetch('/api/logout.php', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Logout failed');
        }
        
        // Clear any cached auth state
        if (window.auth && window.auth.refresh) {
            window.auth.refresh();
        }
        
        // Redirect to home page
        window.location.href = '/public/pages/index.html';
    } catch (error) {
        console.error('Error logging out:', error);
        closeLogoutModal();
        alert('Failed to logout. Please try again.');
    }
}

// Make functions globally accessible
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;

// Load my items from API data
function loadMyItems() {
    const itemsGrid = document.getElementById('myItemsGrid');
    const emptyState = document.getElementById('itemsEmpty');
    
    if (!itemsGrid) return;
    
    // Filter items based on current filter
    let filteredItems = [...userProducts];
    
    if (currentFilter === 'active') {
        // Filter out sold items
        filteredItems = userProducts.filter(item => !item.status || item.status === 'active');
    } else if (currentFilter === 'sold') {
        filteredItems = userProducts.filter(item => item.status === 'sold');
    } else if (currentFilter === 'draft') {
        filteredItems = userProducts.filter(item => item.status === 'draft');
    }
    
    itemsGrid.innerHTML = '';
    
    if (filteredItems.length === 0) {
        itemsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    itemsGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    filteredItems.forEach(item => {
        const itemCard = createItemCard(item, true);
        itemsGrid.appendChild(itemCard);
    });
}

// Load purchased items
async function loadPurchasedItems() {
    const purchasedGrid = document.getElementById('purchasedItemsGrid');
    const emptyState = document.getElementById('purchasedEmpty');
    
    if (!purchasedGrid) {
        console.error('purchasedItemsGrid element not found');
        return;
    }
    
    console.log('Loading purchased items...');
    
    try {
        const response = await fetch('/api/get_purchased_items.php', {
            credentials: 'include'
        });
        
        console.log('Purchased items response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to load purchased items');
        }
        
        const data = await response.json();
        console.log('Purchased items data:', data);
        const purchasedItems = data.data?.items || [];
        
        purchasedGrid.innerHTML = '';
        
        if (purchasedItems.length === 0) {
            console.log('No purchased items found');
            purchasedGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        console.log(`Found ${purchasedItems.length} purchased items`);
        purchasedGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        
        purchasedItems.forEach(item => {
            const itemCard = createPurchasedItemCard(item);
            purchasedGrid.appendChild(itemCard);
        });
    } catch (error) {
        console.error('Error loading purchased items:', error);
        // Show empty state on error (likely database not updated yet)
        purchasedGrid.innerHTML = '';
        purchasedGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    }
}

// Create purchased item card
function createPurchasedItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const purchaseDate = new Date(item.purchased_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    card.innerHTML = `
        <a href="product.html?id=${item.id}" class="item-link">
            <div class="item-image">
                <img src="${item.image_url}" alt="${item.title}">
                <div class="item-status-badge" style="background: #28a745; color: white;">
                    Purchased
                </div>
            </div>
            <div class="item-details">
                <h3 class="item-title">${item.title}</h3>
                <p class="item-description">${item.description.substring(0, 80)}${item.description.length > 80 ? '...' : ''}</p>
                <div class="item-meta">
                    <span class="item-location">${item.location}</span>
                    <span class="item-condition">${item.condition}</span>
                </div>
                <div class="item-footer">
                    <div class="item-price">
                        <span class="price-label">Paid:</span>
                        <span class="price-amount">₱${parseFloat(item.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <span class="item-date" style="font-size: 0.85rem; color: #666;">
                        ${purchaseDate}
                    </span>
                </div>
                <div class="seller-info" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                    <span style="font-size: 0.85rem; color: #666;">
                        Seller: <strong>${item.seller_name}</strong>
                    </span>
                </div>
            </div>
        </a>
    `;
    
    return card;
}

// Create item card
function createItemCard(item, isOwnItem) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const badge = item.badge ? `<div class="item-badge ${item.badge}">${item.badge}</div>` : '';
    const originalPrice = item.originalPrice ? `<span class="original-price">₱${parseFloat(item.originalPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : '';
    
    // Parse prices for display
    const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) : parseFloat(item.price);
    const buyoutPrice = item.buyout_price ? (typeof item.buyout_price === 'string' ? parseFloat(item.buyout_price.replace(/,/g, '')) : parseFloat(item.buyout_price)) : null;
    
    card.innerHTML = `
        <div class="item-image">
            ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="placeholder-image" style="display: none;">${getPlaceholderText(item.category)}</div>` : 
            `<div class="placeholder-image">${getPlaceholderText(item.category)}</div>`}
            ${badge}
        </div>
        <div class="item-info">
            <h3 class="item-title">${item.title}</h3>
            <div class="item-price">
                ${buyoutPrice ? `
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; align-items: baseline; gap: 6px;">
                            <span style="font-size: 11px; color: #28a745; font-weight: 600;">BUY NOW</span>
                            <span class="price" style="color: #28a745;">₱${buyoutPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div style="display: flex; align-items: baseline; gap: 6px;">
                            <span style="font-size: 11px; color: #6c757d; font-weight: 500;">BID</span>
                            <span style="font-size: 14px; color: #6c757d;">₱${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                    </div>
                ` : `
                    <span class="price">₱${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                `}
                ${originalPrice}
            </div>
            <div class="item-meta">
                <span class="item-location">
                    <span class="icon-map-marker"></span>
                    ${item.location}
                </span>
            </div>
            ${isOwnItem ? `
            <div class="item-actions-profile">
                <button class="btn-outline btn-small" onclick="window.location.href='product.html?id=${item.id}'">View</button>
                <button class="btn-outline btn-small danger" onclick="showMaintenanceModal('Delete Item')">Delete</button>
            </div>
            ` : ''}
        </div>
    `;
    
    // Add click handler
    if (!isOwnItem) {
        card.addEventListener('click', () => {
            window.location.href = `product.html?id=${item.id}`;
        });
    }
    
    return card;
}

// Create review element
function createReviewElement(review) {
    const reviewDiv = document.createElement('div');
    reviewDiv.className = 'review-item';
    
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    reviewDiv.innerHTML = `
        <div class="review-header">
            <div class="reviewer-info">
                <div class="reviewer-avatar">${review.reviewerInitials}</div>
                <div>
                    <div class="reviewer-name">${review.reviewer}</div>
                    <div class="review-date">${review.date}</div>
                </div>
            </div>
            <div class="review-rating">${stars}</div>
        </div>
        <div class="review-text">${review.text}</div>
    `;
    
    return reviewDiv;
}

// Helper functions
function getPlaceholderText(category) {
    const placeholders = {
        'Electronics': '📱',
        'Fashion': '👟',
        'Home & Garden': '🪑',
        'Sports': '⚽',
        'Books': '📚',
        'Automotive': '🚗',
        'Collectibles': '🎨',
        // Legacy lowercase support
        'electronics': '📱',
        'fashion': '👟',
        'home': '🪑',
        'sports': '⚽',
        'books': '📚',
        'automotive': '🚗'
    };
    return placeholders[category] || '📦';
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}
