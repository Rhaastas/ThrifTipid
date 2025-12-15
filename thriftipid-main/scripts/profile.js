// Profile page functionality
let currentTab = 'items';
let currentFilter = 'all';
let userProfile = null;
let userProducts = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadProfileFromAPI();
    setupTabNavigation();
    setupEventListeners();
});

// Load profile data from API
async function loadProfileFromAPI() {
    try {
        const response = await fetch('api/get_profile.php', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Not authenticated, redirect to login
                window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname);
                return;
            }
            throw new Error('Failed to load profile');
        }
        
        const data = await response.json();
        userProfile = {
            ...data.user,
            stats: data.stats
        };
        userProducts = data.products || [];
        
        loadProfileData();
        loadMyItems();
    } catch (error) {
        console.error('Error loading profile:', error);
        // Redirect to login on error
        window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname);
    }
}

// Load profile data
function loadProfileData() {
    if (!userProfile) return;
    
    const displayName = userProfile.display_name || userProfile.name || 'User';
    
    document.getElementById('profileName').textContent = displayName;
    
    // Location - use first product location or default
    const location = userProducts.length > 0 ? userProducts[0].location : 'Philippines';
    document.getElementById('profileLocation').innerHTML = `
        <span class="icon-map-marker"></span>
        ${location}
    `;
    
    document.getElementById('itemsCount').textContent = userProfile.stats?.items_listed || 0;
    document.getElementById('soldCount').textContent = userProfile.stats?.items_sold || 0;
    document.getElementById('profileRating').textContent = userProfile.stats?.rating || '0.0';
    document.getElementById('reviewCount').textContent = `${userProfile.stats?.reviews_count || 0} Reviews`;
    
    // Update overall rating in reviews section
    const overallRating = document.getElementById('overallRating');
    if (overallRating) {
        overallRating.textContent = (userProfile.stats?.rating || 0).toFixed(1);
    }
    
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
    } else if (tabName === 'saved') {
        loadSavedItems();
    } else if (tabName === 'reviews') {
        loadReviews();
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
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    try {
        const response = await fetch('api/logout.php', {
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
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Failed to logout. Please try again.');
    }
}

// Load my items from API data
function loadMyItems() {
    const itemsGrid = document.getElementById('myItemsGrid');
    const emptyState = document.getElementById('itemsEmpty');
    
    if (!itemsGrid) return;
    
    // Filter items based on current filter
    let filteredItems = [...userProducts];
    
    if (currentFilter === 'active') {
        // All items are active for now (no sold status yet)
        filteredItems = userProducts;
    } else if (currentFilter === 'sold') {
        filteredItems = []; // No sold items yet
    } else if (currentFilter === 'draft') {
        filteredItems = []; // No drafts yet
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

// Load saved items
function loadSavedItems() {
    const savedGrid = document.getElementById('savedItemsGrid');
    const emptyState = document.getElementById('savedEmpty');
    
    if (!savedGrid) return;
    
    // For now, no saved items functionality
    const savedItems = [];
    
    savedGrid.innerHTML = '';
    
    if (savedItems.length === 0) {
        savedGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    savedGrid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    savedItems.forEach(item => {
        const itemCard = createItemCard(item, false);
        savedGrid.appendChild(itemCard);
    });
}

// Load reviews
function loadReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    const emptyState = document.getElementById('reviewsEmpty');
    const overallRating = document.getElementById('overallRating');
    
    if (!reviewsContainer) return;
    
    // For now, no reviews functionality
    const reviews = [];
    
    reviewsContainer.innerHTML = '';
    
    if (reviews.length === 0) {
        reviewsContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    reviewsContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    
    if (overallRating) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        overallRating.textContent = avgRating.toFixed(1);
    }
    
    reviews.forEach(review => {
        const reviewElement = createReviewElement(review);
        reviewsContainer.appendChild(reviewElement);
    });
}

// Create item card
function createItemCard(item, isOwnItem) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const badge = item.badge ? `<div class="item-badge ${item.badge}">${item.badge}</div>` : '';
    const originalPrice = item.originalPrice ? `<span class="original-price">₱${parseFloat(item.originalPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : '';
    
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
                <span class="price">₱${parseFloat(item.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
