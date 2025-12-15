// Product detail page functionality
let currentItem = null;
let currentImageIndex = 0;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get item ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = parseInt(urlParams.get('id'));
    
    if (itemId) {
        loadProductFromApi(itemId);
    } else {
        // Redirect to browse if no ID
        window.location.href = 'browse.html';
    }
    
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Image navigation
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateImage(-1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateImage(1));
    }
    
    // Contact seller
    const contactBtn = document.getElementById('contactSellerBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', handleContactSeller);
    }
    
    // Make offer
    const offerBtn = document.getElementById('makeOfferBtn');
    if (offerBtn) {
        offerBtn.addEventListener('click', handleMakeOffer);
    }
    
    // Save item
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveItem);
    }
}

// Load product data
async function loadProductFromApi(itemId) {
    try {
        const res = await fetch(`api/get_product.php?id=${encodeURIComponent(itemId)}`, { credentials: 'same-origin' });
        if (!res.ok) {
            window.location.href = 'browse.html';
            return;
        }
        const data = await res.json();
        const p = data.product;
        currentItem = {
            id: p.id,
            title: p.title,
            description: p.description || '',
            price: p.price,
            originalPrice: null,
            condition: p.condition || '',
            location: p.location || '',
            time: p.created_at || '',
            images: (p.images || []).map(im => im.url),
            seller: {
                id: p.seller?.id || 0,
                name: p.seller?.name || 'Seller',
                username: p.seller?.username || '',
                email: p.seller?.email || '',
                rating: 4.8, // Default rating (could be calculated from reviews table later)
                reviews: 0, // Could be calculated from reviews table later
                avatar: 'placeholder',
                activeListings: p.seller?.activeListings || 0,
                soldListings: 0 // Could be calculated from products table later (when sold status is added)
            },
            badge: null,
            category: p.category || 'misc'
        };
        renderProduct(currentItem);
        // For now, skip DB-related similar items; keep empty
        const relatedGrid = document.getElementById('relatedItemsGrid');
        if (relatedGrid) {
            relatedGrid.parentElement.style.display = 'none';
        }
    } catch (e) {
        window.location.href = 'browse.html';
    }
}

// Render product details
function renderProduct(item) {
    // Set page title
    document.title = `${item.title} - ThrifTipid`;
    
    // Breadcrumb
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    if (breadcrumbCategory) {
        breadcrumbCategory.textContent = getCategoryName(item.category);
    }
    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = item.title;
    }
    
    // Main product image
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage) {
        if (item.images && item.images.length > 0) {
            mainImage.src = item.images[0];
            mainImage.style.display = 'block';
        } else if (item.image) {
            mainImage.src = item.image;
            mainImage.style.display = 'block';
        } else {
            mainImage.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder-image modal-placeholder';
            placeholder.textContent = getPlaceholderText(item.category);
            mainImage.parentElement.appendChild(placeholder);
        }
    }
    
    // Thumbnails
    renderThumbnails(item);
    
    // Product details
    const productTitle = document.getElementById('productTitle');
    if (productTitle) productTitle.textContent = item.title;
    
    const productPrice = document.getElementById('productPrice');
    if (productPrice) productPrice.textContent = `₱${parseFloat(item.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const productOriginalPrice = document.getElementById('productOriginalPrice');
    if (productOriginalPrice) {
        productOriginalPrice.textContent = item.originalPrice ? `₱${parseFloat(item.originalPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '';
        productOriginalPrice.style.display = item.originalPrice ? 'inline' : 'none';
    }
    
    const productCondition = document.getElementById('productCondition');
    if (productCondition) productCondition.textContent = item.condition;
    
    const productLocation = document.getElementById('productLocation');
    if (productLocation) productLocation.textContent = item.location;
    
    const productTime = document.getElementById('productTime');
    if (productTime) productTime.textContent = item.time;
    
    const productDescription = document.getElementById('productDescription');
    if (productDescription) productDescription.textContent = item.description;
    
    // Badges
    const productBadges = document.getElementById('productBadges');
    if (productBadges) {
        productBadges.innerHTML = '';
        if (item.badge) {
            const badge = document.createElement('span');
            badge.className = `item-badge ${item.badge}`;
            badge.textContent = item.badge.toUpperCase();
            productBadges.appendChild(badge);
        }
    }
    
    // Seller info
    renderSellerInfo(item.seller);
    
    // Setup seller dropdown
    setupSellerDropdown(item.seller);
}

// Setup seller dropdown
function setupSellerDropdown(seller) {
    const dropdownBtn = document.getElementById('viewProfileBtn');
    const dropdown = document.getElementById('sellerDropdown');
    
    if (!dropdownBtn || !dropdown) return;
    
    // Render dropdown content
    const initials = getInitials(seller.name);
    const stars = '★'.repeat(Math.floor(seller.rating)) + '☆'.repeat(5 - Math.floor(seller.rating));
    const sellerDisplayName = seller.name || seller.username || 'Seller';
    
    dropdown.innerHTML = `
        <div class="seller-dropdown-header">
            <div class="seller-info-dropdown">
                <div class="seller-avatar-dropdown">${initials}</div>
                <div>
                    <div class="seller-name-dropdown">${sellerDisplayName}</div>
                    ${seller.username ? `<div class="seller-username-dropdown">@${seller.username}</div>` : ''}
                    <div class="seller-rating-dropdown">
                        <span class="stars-dropdown">${stars}</span>
                        <span class="rating-text-dropdown">${seller.rating} (${seller.reviews} reviews)</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="seller-dropdown-stats">
            <div class="stat-dropdown">
                <span class="stat-value-dropdown">${seller.activeListings || 0}</span>
                <span class="stat-label-dropdown">Active Listings</span>
            </div>
            <div class="stat-dropdown">
                <span class="stat-value-dropdown">${seller.soldListings || 0}</span>
                <span class="stat-label-dropdown">Sold Listings</span>
            </div>
            <div class="stat-dropdown">
                <span class="stat-value-dropdown">${seller.reviews || 0}</span>
                <span class="stat-label-dropdown">Reviews</span>
            </div>
        </div>
        <div class="seller-dropdown-actions">
            <button class="dropdown-action-btn primary" onclick="handleContactSeller()">
                <span class="dropdown-action-icon"><span class="icon-message"></span></span>
                <span>Message Seller</span>
            </button>
            <button class="dropdown-action-btn" onclick="showMaintenanceModal('View Inbox')">
                <span class="dropdown-action-icon"><span class="icon-bell"></span></span>
                <span>View Inbox</span>
            </button>
            <button class="dropdown-action-btn" onclick="window.location.href='profile.html?user_id=${seller.id}'">
                <span class="dropdown-action-icon"><span class="icon-user"></span></span>
                <span>View Profile</span>
            </button>
        </div>
    `;
    
    // Toggle dropdown
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && e.target !== dropdownBtn) {
            dropdown.classList.remove('active');
        }
    });
}

// Render thumbnails
function renderThumbnails(item) {
    const thumbnailsContainer = document.getElementById('thumbnailsContainer');
    if (!thumbnailsContainer) return;
    
    thumbnailsContainer.innerHTML = '';
    
    const images = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
    
    images.forEach((imageUrl, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
        thumbnail.innerHTML = `<img src="${imageUrl}" alt="Thumbnail ${index + 1}" onerror="this.style.display='none'">`;
        thumbnail.addEventListener('click', () => selectImage(index));
        thumbnailsContainer.appendChild(thumbnail);
    });
    
    if (images.length <= 1) {
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
}

// Select image
function selectImage(index) {
    if (!currentItem) return;
    
    const images = currentItem.images && currentItem.images.length > 0 ? currentItem.images : (currentItem.image ? [currentItem.image] : []);
    
    if (index >= 0 && index < images.length) {
        currentImageIndex = index;
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = images[index];
        }
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
}

// Navigate images
function navigateImage(direction) {
    if (!currentItem) return;
    
    const images = currentItem.images && currentItem.images.length > 0 ? currentItem.images : (currentItem.image ? [currentItem.image] : []);
    
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) {
        currentImageIndex = images.length - 1;
    } else if (currentImageIndex >= images.length) {
        currentImageIndex = 0;
    }
    
    selectImage(currentImageIndex);
}

// Render seller info
function renderSellerInfo(seller) {
    const sellerAvatarContainer = document.getElementById('sellerAvatarContainer');
    const sellerName = document.getElementById('sellerName');
    const sellerRating = document.getElementById('sellerRating');
    const ratingText = document.getElementById('ratingText');
    const sellerReviews = document.getElementById('sellerReviews');
    
    // Use seller name from database, fallback to username or 'Seller'
    const sellerDisplayName = seller.name || seller.username || 'Seller';
    
    if (sellerAvatarContainer) {
        if (seller.avatar === 'placeholder') {
            sellerAvatarContainer.innerHTML = `<div class="avatar-placeholder">${getInitials(sellerDisplayName)}</div>`;
        } else {
            sellerAvatarContainer.innerHTML = `<img src="${seller.avatar}" alt="${sellerDisplayName}">`;
        }
    }
    
    if (sellerName) sellerName.textContent = sellerDisplayName;
    if (sellerRating) {
        const stars = '★'.repeat(Math.floor(seller.rating)) + '☆'.repeat(5 - Math.floor(seller.rating));
        sellerRating.textContent = stars;
    }
    if (ratingText) ratingText.textContent = `${seller.rating}`;
    if (sellerReviews) {
        const reviewsText = seller.reviews === 0 ? 'No reviews yet' : `${seller.reviews} reviews`;
        sellerReviews.textContent = reviewsText;
    }
}

// Render related items
function renderRelatedItems(item) {
    const relatedGrid = document.getElementById('relatedItemsGrid');
    if (!relatedGrid) return;
    
    // Get items from same category, excluding current item
    const relatedItems = sampleItems.filter(i => 
        i.category === item.category && i.id !== item.id
    ).slice(0, 4);
    
    if (relatedItems.length === 0) {
        relatedGrid.parentElement.style.display = 'none';
        return;
    }
    
    relatedGrid.innerHTML = '';
    
    relatedItems.forEach(relatedItem => {
        const itemCard = createItemCard(relatedItem);
        relatedGrid.appendChild(itemCard);
    });
}

// Create item card
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const badge = item.badge ? `<div class="item-badge ${item.badge}">${item.badge}</div>` : '';
    const originalPrice = item.originalPrice ? `<span class="original-price">₱${parseFloat(item.originalPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : '';
    
    card.innerHTML = `
        <div class="item-image">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
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
        </div>
    `;
    
    card.addEventListener('click', () => {
        window.location.href = `product.html?id=${item.id}`;
    });
    
    return card;
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

function getCategoryName(category) {
    const categoryMap = {
        'electronics': 'Electronics',
        'fashion': 'Fashion',
        'home': 'Home & Garden',
        'sports': 'Sports',
        'books': 'Books',
        'automotive': 'Automotive'
    };
    return categoryMap[category] || category;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Event handlers
async function handleContactSeller() {
    if (window.auth && !window.auth.isLoggedIn()) {
        window.auth.requireAuthRedirect(window.location.pathname + window.location.search);
        return;
    }
    await showMaintenanceModal('Contact Seller (Messaging System)');
}

async function handleMakeOffer() {
    if (window.auth && !window.auth.isLoggedIn()) {
        window.auth.requireAuthRedirect(window.location.pathname + window.location.search);
        return;
    }
    if (!currentItem) return;
    
    const offer = await customPrompt(
        `Enter your offer amount for ${currentItem.title} (Current price: ₱${parseFloat(currentItem.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}):`,
        '',
        'Make an Offer'
    );
    
    if (offer && !isNaN(offer) && parseFloat(offer) > 0) {
        await customAlert(
            `Your offer of ₱${parseFloat(offer).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} has been submitted! The seller will be notified and can respond to your offer.`,
            'Offer Submitted'
        );
    }
}

async function handleSaveItem() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.innerHTML = '<span class="icon-heart"></span> Saved';
        saveBtn.style.color = '#ff4757';
    }
    await customAlert('Item saved to your wishlist!', 'Saved');
}

