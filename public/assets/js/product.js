// Product detail page functionality
let currentItem = null;
let currentImageIndex = 0;
let currentUserId = null;
let isOwner = false;
// Derive project root so API calls work whether site is served at /, /public, or /thriftipid/public
const ROOT_PREFIX = (function () {
    const parts = window.location.pathname.split('/public/');
    return parts.length > 1 ? parts[0] : '';
})();
const API_BASE = `${ROOT_PREFIX}/api`;

// Show notification message
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Set color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get current logged-in user ID
async function getCurrentUserId() {
    try {
        const response = await fetch(`${API_BASE}/get_profile.php`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            return data.user?.id || null;
        }
    } catch (error) {
        console.error('Error getting user ID:', error);
    }
    return null;
}

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
    
    // Bind auth guards for contact and offer buttons
    function bindGuard(id){
        var el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('click', function(e){
            if (window.auth && !window.auth.isLoggedIn()) {
                e.preventDefault();
                window.auth.requireAuthRedirect(window.location.pathname + window.location.search);
            }
        });
    }
    bindGuard('contactSellerBtn');
    bindGuard('makeOfferBtn');
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
    
    // Buy Now
    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', handleBuyNow);
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
        // Get current user ID first
        currentUserId = await getCurrentUserId();
        
        const res = await fetch(`${API_BASE}/get_product.php?id=${encodeURIComponent(itemId)}`, { credentials: 'same-origin' });
        if (!res.ok) {
            window.location.href = 'browse.html';
            return;
        }
        const data = await res.json();
        const p = data.product;
        const priceBase = p.base_price ?? p.price ?? 0;
        const buyoutPrice = p.buyout_price ? parseFloat(p.buyout_price) : null;
        const highestOffer = p.highest_offer ?? 0;
        const currentPrice = Math.max(priceBase, highestOffer);
        
        // Check if current user is the seller
        console.log('DEBUG - Current User ID:', currentUserId);
        console.log('DEBUG - Seller ID:', p.seller?.id);
        console.log('DEBUG - Seller object:', p.seller);
        isOwner = currentUserId && p.seller?.id && currentUserId === p.seller.id;
        console.log('DEBUG - isOwner:', isOwner);

        currentItem = {
            id: p.id,
            title: p.title,
            description: p.description || '',
            price: currentPrice,
            priceBase: priceBase,
            buyoutPrice: buyoutPrice,
            highestOffer: highestOffer,
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
                avatar: 'placeholder',
                activeListings: p.seller?.activeListings || 0,
                soldListings: 0
            },
            badge: null,
            category: p.category || 'misc'
        };
        renderProduct(currentItem);
        
        // If user is the seller, show offers section and load offers
        if (isOwner) {
            showSellerSection();
            loadOffers(itemId);
        } else {
            showBuyerSection();
        }
        
        // For now, skip DB-related similar items; keep empty
        const relatedGrid = document.getElementById('relatedItemsGrid');
        if (relatedGrid) {
            relatedGrid.parentElement.style.display = 'none';
        }
    } catch (e) {
        window.location.href = 'browse.html';
    }
}

// Show seller section (offers)
function showSellerSection() {
    const sellerSection = document.getElementById('sellerOffersSection');
    const buyerActions = document.getElementById('buyerActions');
    
    if (sellerSection) sellerSection.style.display = 'block';
    if (buyerActions) buyerActions.style.display = 'none';
}

// Show buyer section (action buttons)
function showBuyerSection() {
    const sellerSection = document.getElementById('sellerOffersSection');
    const buyerActions = document.getElementById('buyerActions');
    
    if (sellerSection) sellerSection.style.display = 'none';
    if (buyerActions) buyerActions.style.display = 'block';
}

// Load offers for the product (seller only)
async function loadOffers(productId) {
    try {
        console.log('DEBUG - Loading offers for product ID:', productId);
        const response = await fetch(`${API_BASE}/Offers/get_offers.php?product_id=${productId}`, {
            credentials: 'include'
        });
        
        console.log('DEBUG - Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('DEBUG - Error response:', errorText);
            throw new Error('Failed to load offers');
        }
        
        const data = await response.json();
        console.log('DEBUG - Response data:', data);
        
        if (!data.success) {
            console.error('DEBUG - API returned error:', data.error);
            throw new Error(data.error || 'Failed to load offers');
        }
        
        // Response::success wraps data in a 'data' property
        const offers = data.data?.offers || [];
        console.log('DEBUG - Number of offers:', offers.length);
        console.log('DEBUG - Offers:', offers);
        
        const offersCount = document.getElementById('offersCount');
        const offersList = document.getElementById('offersList');
        
        // Update count
        if (offersCount) {
            offersCount.textContent = `${offers.length} ${offers.length === 1 ? 'offer' : 'offers'}`;
        }
        
        // Display offers
        if (offersList) {
            if (offers.length === 0) {
                offersList.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: #999;">
                        <p style="font-size: 18px; margin-bottom: 8px;">No offers yet</p>
                        <p style="font-size: 14px;">Buyers can make offers on your item</p>
                    </div>
                `;
            } else {
                offersList.innerHTML = `
                    <div style="max-height: 500px; overflow-y: auto; padding-right: 8px;">
                        ${offers.map((offer, index) => `
                            <div class="offer-item" style="
                                padding: 16px;
                                border: 1px solid #e1e5e9;
                                border-radius: 8px;
                                margin-bottom: 12px;
                                background: ${offer.status === 'accepted' ? '#f0f9f4' : '#fff'};
                                ${index === 0 ? 'border-color: #ff6b35; border-width: 2px;' : ''}
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                    <div>
                                        <div style="font-size: 24px; font-weight: 700; color: #ff6b35;">
                                            ₱${parseFloat(offer.amount).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                        ${index === 0 ? '<span style="font-size: 12px; color: #ff6b35; font-weight: 600;">HIGHEST OFFER</span>' : ''}
                                    </div>
                                    <span class="offer-status" style="
                                        padding: 4px 12px;
                                        border-radius: 12px;
                                        font-size: 12px;
                                        font-weight: 600;
                                        ${offer.status === 'accepted' ? 'background: #d4edda; color: #155724;' : 
                                          offer.status === 'rejected' ? 'background: #f8d7da; color: #721c24;' : 
                                          'background: #fff3cd; color: #856404;'}
                                    ">${offer.status.toUpperCase()}</span>
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${offer.buyer.name}</div>
                                    <div style="font-size: 14px; color: #666;">@${offer.buyer.username}</div>
                                </div>
                                <div style="font-size: 13px; color: #999; margin-bottom: 12px;">
                                    Offered ${new Date(offer.created_at).toLocaleString('en-PH', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                ${offer.status === 'pending' ? `
                                    <div style="display: flex; gap: 8px;">
                                        <button 
                                            class="btn-success" 
                                            onclick="acceptOffer(${offer.id})"
                                            style="flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
                                        >
                                            Accept Offer
                                        </button>
                                        <button 
                                            class="btn-outline" 
                                            onclick="rejectOffer(${offer.id})"
                                            style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error loading offers:', error);
        const offersList = document.getElementById('offersList');
        if (offersList) {
            offersList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #dc3545;">
                    <p>Failed to load offers. Please refresh the page.</p>
                </div>
            `;
        }
    }
}

// Accept an offer
async function acceptOffer(offerId) {
    if (!confirm('Are you sure you want to accept this offer? This will mark the item as sold and reject all other offers.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/Offers/accept_offer.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                offer_id: offerId
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Offer accepted successfully! Item marked as sold.', 'success');
            // Reload the page to show updated status
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification(data.message || 'Failed to accept offer', 'error');
        }
    } catch (error) {
        console.error('Error accepting offer:', error);
        showNotification('An error occurred while accepting the offer', 'error');
    }
}

// Reject an offer
async function rejectOffer(offerId) {
    if (!confirm('Are you sure you want to decline this offer?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/Offers/reject_offer.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                offer_id: offerId
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Offer declined successfully', 'success');
            // Reload offers to show updated status
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            if (productId) {
                await loadOffers(productId);
            }
        } else {
            showNotification(data.message || 'Failed to decline offer', 'error');
        }
    } catch (error) {
        console.error('Error declining offer:', error);
        showNotification('An error occurred while declining the offer', 'error');
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
    
    // Handle price display - show both buyout and bid prices if buyout exists
    const productPrice = document.getElementById('productPrice');
    const buyoutPriceContainer = document.getElementById('buyoutPriceContainer');
    const bidPriceContainer = document.getElementById('bidPriceContainer');
    const bidPriceLabel = document.getElementById('bidPriceLabel');
    const productBuyoutPrice = document.getElementById('productBuyoutPrice');
    
    if (item.buyoutPrice && item.buyoutPrice > 0) {
        // Show buyout price
        if (productBuyoutPrice) {
            productBuyoutPrice.textContent = `₱${parseFloat(item.buyoutPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        if (buyoutPriceContainer) {
            buyoutPriceContainer.style.display = 'block';
        }
        
        // Show bid price below
        if (productPrice) {
            productPrice.textContent = `₱${parseFloat(item.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        if (bidPriceLabel) {
            bidPriceLabel.style.display = 'block';
        }
    } else {
        // Only bid price, hide buyout container
        if (buyoutPriceContainer) {
            buyoutPriceContainer.style.display = 'none';
        }
        if (productPrice) {
            productPrice.textContent = `₱${parseFloat(item.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        if (bidPriceLabel) {
            bidPriceLabel.style.display = 'none';
        }
    }
    
    // Show/hide Buy Now button based on buyout price
    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        if (item.buyoutPrice && item.buyoutPrice > 0) {
            buyNowBtn.style.display = 'flex';
        } else {
            buyNowBtn.style.display = 'none';
        }
    }
    
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
    const sellerDisplayName = seller.name || seller.username || 'Seller';
    
    dropdown.innerHTML = `
        <div class="seller-dropdown-header">
            <div class="seller-info-dropdown">
                <div class="seller-avatar-dropdown">${initials}</div>
                <div>
                    <div class="seller-name-dropdown">${sellerDisplayName}</div>
                    ${seller.username ? `<div class="seller-username-dropdown">@${seller.username}</div>` : ''}
                </div>
            </div>
        </div>
        <div class="seller-dropdown-stats">
            <div class="stat-dropdown">
                <span class="stat-value-dropdown">${seller.activeListings || 0}</span>
                <span class="stat-label-dropdown">Active Listings</span>
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

function getCategoryName(category) {
    // If it's already a proper category name, return it
    if (category && category[0] === category[0].toUpperCase()) {
        return category;
    }
    // Legacy lowercase category mapping
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

// Open offer modal
function openOfferModal() {
    if (window.auth && !window.auth.isLoggedIn()) {
        window.auth.requireAuthRedirect(window.location.pathname + window.location.search);
        return;
    }
    if (!currentItem) return;
    
    const modal = document.getElementById('offerModal');
    const info = document.getElementById('offerProductInfo');
    const input = document.getElementById('offerAmount');
    
    info.textContent = `Enter your offer amount for ${currentItem.title} (Current price: ₱${parseFloat(currentItem.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`;
    input.value = '';
    input.focus();
    modal.classList.add('active');
    modal.style.display = 'flex';
}

// Close offer modal
function closeOfferModal() {
    const modal = document.getElementById('offerModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
}

// Handle offer form submission
async function handleOfferFormSubmit(event) {
    event.preventDefault();
    
    if (!currentItem) {
        showCustomModal('Product not found', 'Error', false);
        return;
    }

    const form = document.getElementById('offerForm');
    const amount = parseFloat(document.getElementById('offerAmount').value);

    const minRequired = Math.max(currentItem.priceBase || 0, currentItem.highestOffer || 0, currentItem.price || 0);

    if (!amount || amount <= 0) {
        showCustomModal('Please enter a valid offer amount', 'Validation Error', false);
        return;
    }

    if (amount < minRequired) {
        showCustomModal(`Offer must be at least ₱${minRequired.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Offer Too Low', false);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/Offers/place_offer.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                product_id: currentItem.id,
                amount: amount
            })
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
            // Update local state to reflect new highest offer
            currentItem.highestOffer = Math.max(currentItem.highestOffer || 0, amount);
            currentItem.price = Math.max(currentItem.price || 0, amount);

            // Update displayed price
            const productPrice = document.getElementById('productPrice');
            if (productPrice) productPrice.textContent = `₱${currentItem.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

            closeOfferModal();
            showCustomModal(
                `Your offer of ₱${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} has been submitted! The seller will be notified and can respond to your offer.`,
                'Offer Submitted',
                true
            );
        } else {
            const msg = data && (data.message || data.error) ? (data.message || data.error) : 'Unknown error';
            showCustomModal(`Failed to submit offer: ${msg}`, 'Error', false);
            console.error('Offer submit failed', { status: response.status, data });
        }
    } catch (err) {
        showCustomModal(`Error submitting offer: ${err.message}`, 'Error', false);
        console.error('Offer submit exception', err);
    }
}

// Show styled modal message
function showCustomModal(message, title, isSuccess) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.style.display = 'flex';
    
    const iconEmoji = isSuccess ? '✓' : '✕';
    const iconStyle = isSuccess ? 'color:#27ae60; font-size:64px;' : 'color:#e74c3c; font-size:64px;';
    
    modal.innerHTML = `
        <div class="modal-dialog" style="max-width: 500px;">
            <div class="modal-header">
                <h2>${escapeHtml(title)}</h2>
                <button type="button" class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center; padding: 32px 24px;">
                <div style="${iconStyle}; margin-bottom: 16px;">${iconEmoji}</div>
                <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0;">${escapeHtml(message)}</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-primary" onclick="this.closest('.modal-overlay').remove()" style="margin-left: auto;">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event handlers
async function handleContactSeller() {
    if (window.auth && !window.auth.isLoggedIn()) {
        window.auth.requireAuthRedirect(window.location.pathname + window.location.search);
        return;
    }
    
    if (!currentItem || !currentItem.seller) {
        alert('Seller information not available');
        return;
    }
    
    // Open chat with seller
    if (window.chatSystem && window.chatSystem.openChat) {
        window.chatSystem.openChat(currentItem.seller.id, currentItem.seller.name);
    } else {
        // Wait a bit and try again
        console.log('Chat system not ready, waiting...');
        setTimeout(() => {
            if (window.chatSystem && window.chatSystem.openChat) {
                window.chatSystem.openChat(currentItem.seller.id, currentItem.seller.name);
            } else {
                console.error('Chat system failed to initialize');
                alert('Unable to open chat. Please refresh the page and try again.');
            }
        }, 500);
    }
}

async function handleBuyNow() {
    if (window.auth && !window.auth.isLoggedIn()) {
        window.auth.requireAuthRedirect(window.location.pathname + window.location.search);
        return;
    }
    
    if (!currentItem || !currentItem.buyoutPrice) {
        await showCustomModal('error', 'Error', 'Buyout price not available for this item.');
        return;
    }
    
    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal-overlay active';
    confirmModal.style.display = 'flex';
    confirmModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Confirm Purchase</h3>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to purchase <strong>"${currentItem.title}"</strong> for <strong>₱${currentItem.buyoutPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>?</p>
                <p style="margin-top: 12px; color: #6c757d; font-size: 14px;">This action cannot be undone. The seller will be notified immediately.</p>
            </div>
            <div class="modal-footer">
                <button class="btn-outline" id="cancelBuyoutBtn">Cancel</button>
                <button class="btn-success" id="confirmBuyoutBtn">
                    <span class="icon-check"></span>
                    Confirm Purchase
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmModal);
    
    // Handle cancel
    const cancelBtn = confirmModal.querySelector('#cancelBuyoutBtn');
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(confirmModal);
    });
    
    // Handle confirm
    const confirmBtn = confirmModal.querySelector('#confirmBuyoutBtn');
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = 'Processing...';
        
        try {
            const formData = new FormData();
            formData.append('product_id', currentItem.id);
            
            const response = await fetch(`${API_BASE}/buyout.php`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const data = await response.json();
            
            // Remove confirmation modal
            document.body.removeChild(confirmModal);
            
            if (response.ok && data.success) {
                await showCustomModal('success', 'Purchase Successful!', data.message || 'You have successfully purchased this item. The seller has been notified.');
                // Optionally redirect to messages or profile
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 2000);
            } else {
                await showCustomModal('error', 'Purchase Failed', data.error || 'Unable to complete purchase. Please try again.');
            }
        } catch (error) {
            console.error('Buyout error:', error);
            document.body.removeChild(confirmModal);
            await showCustomModal('error', 'Network Error', 'Failed to connect to server. Please check your connection and try again.');
        }
    });
}

async function handleMakeOffer() {
    openOfferModal();
}

async function handleSaveItem() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.innerHTML = '<span class="icon-heart"></span> Saved';
        saveBtn.style.color = '#ff4757';
    }
    await customAlert('Item saved to your wishlist!', 'Saved');
}

