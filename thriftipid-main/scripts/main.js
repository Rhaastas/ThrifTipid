// Sample data for items
const sampleItems = [
    {
        id: 1,
        title: "iPhone 13 Pro Max 256GB",
        price: 899,
        originalPrice: 1099,
        condition: "Like New",
        location: "Manila, Philippines",
        time: "2 hours ago",
        category: "electronics",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=200&fit=crop"
        ],
        description: "Excellent condition iPhone 13 Pro Max with original box and accessories. Battery health 98%. No scratches or dents.",
        seller: {
            name: "Steven Suarez",
            avatar: "placeholder",
            rating: 4.8,
            reviews: 127
        },
        likes: 23,
        badge: "new"
    },
    {
        id: 2,
        title: "Nike Air Jordan 1 Retro",
        price: 120,
        originalPrice: 160,
        condition: "Good",
        location: "Quezon City, Philippines",
        time: "5 hours ago",
        category: "fashion",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop"
        ],
        description: "Classic Air Jordan 1 in excellent condition. Size 9.5. Worn a few times, very clean.",
        seller: {
            name: "James Dimino",
            avatar: "placeholder",
            rating: 4.6,
            reviews: 89
        },
        likes: 45,
        badge: "hot"
    },
    {
        id: 3,
        title: "MacBook Pro 13-inch M1",
        price: 1299,
        originalPrice: 1499,
        condition: "Like New",
        location: "Makati, Philippines",
        time: "1 day ago",
        category: "electronics",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop"
        ],
        description: "MacBook Pro 13-inch with M1 chip, 8GB RAM, 256GB SSD. Perfect for work and creative projects.",
        seller: {
            name: "Zhak Carreon",
            avatar: "placeholder",
            rating: 4.9,
            reviews: 203
        },
        likes: 67,
        badge: "new"
    },
    {
        id: 4,
        title: "Vintage Leather Jacket",
        price: 85,
        originalPrice: 120,
        condition: "Good",
        location: "Cebu City, Philippines",
        time: "2 days ago",
        category: "fashion",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=200&fit=crop"
        ],
        description: "Authentic vintage leather jacket from the 80s. Size M. Great condition with character.",
        seller: {
            name: "Christian Camba",
            avatar: "placeholder",
            rating: 4.7,
            reviews: 156
        },
        likes: 34,
        badge: null
    },
    {
        id: 5,
        title: "Gaming Chair Ergonomic",
        price: 150,
        originalPrice: 200,
        condition: "Like New",
        location: "Davao City, Philippines",
        time: "3 days ago",
        category: "home",
        image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop"
        ],
        description: "High-quality ergonomic gaming chair with lumbar support. Perfect for long gaming sessions or work from home.",
        seller: {
            name: "Makaveli Manaois",
            avatar: "placeholder",
            rating: 4.5,
            reviews: 78
        },
        likes: 28,
        badge: null
    },
    {
        id: 6,
        title: "Canon EOS R5 Camera",
        price: 2899,
        originalPrice: 3299,
        condition: "New",
        location: "Taguig, Philippines",
        time: "4 days ago",
        category: "electronics",
        image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop"
        ],
        description: "Professional mirrorless camera with 45MP sensor. Includes 24-70mm lens. Perfect for professional photography.",
        seller: {
            name: "Pat Verzosa",
            avatar: "placeholder",
            rating: 4.9,
            reviews: 234
        },
        likes: 89,
        badge: "hot"
    }
];

// Global variables
let currentItems = [...sampleItems];
let currentCategory = 'all';
let currentView = 'grid';

// DOM elements
const itemsGrid = document.getElementById('itemsGrid');
const searchInput = document.getElementById('searchInput');
const categoryTabs = document.querySelectorAll('.category-tab');
const viewBtns = document.querySelectorAll('.view-btn');
const priceSlider = document.getElementById('priceSlider');
const priceValue = document.getElementById('priceValue');
const itemModal = document.getElementById('itemModal');
const sellModal = document.getElementById('sellModal');
const sellBtn = document.getElementById('sellBtn');
const sellForm = document.getElementById('sellForm');
const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const uploadedImages = document.getElementById('uploadedImages');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    renderItems();
    setupEventListeners();
    setupPriceSlider();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Category filtering
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => handleCategoryChange(tab.dataset.category));
    });
    
    // View toggle
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => handleViewChange(btn.dataset.view));
    });
    
    // Modal functionality
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });
    
    // Sell button
    sellBtn.addEventListener('click', () => {
        sellModal.style.display = 'block';
    });
    
    // Sell form
    sellForm.addEventListener('submit', handleSellSubmit);
    
    // Image upload
    uploadArea.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === itemModal) {
            itemModal.style.display = 'none';
        }
        if (e.target === sellModal) {
            sellModal.style.display = 'none';
        }
    });
    
    // Load more button
    document.querySelector('.load-more-btn').addEventListener('click', loadMoreItems);
}

// Setup price slider
function setupPriceSlider() {
    priceSlider.addEventListener('input', function() {
        priceValue.textContent = '$' + this.value;
        filterItems();
    });
}

// Render items
function renderItems() {
    itemsGrid.innerHTML = '';
    
    currentItems.forEach(item => {
        const itemCard = createItemCard(item);
        itemsGrid.appendChild(itemCard);
    });
}

// Get placeholder text based on category
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

// Create item card
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.onclick = () => openItemModal(item);
    
    const badge = item.badge ? `<div class="item-badge ${item.badge}">${item.badge}</div>` : '';
    const originalPrice = item.originalPrice ? `<span class="original-price">$${item.originalPrice}</span>` : '';
    
    card.innerHTML = `
        <div class="item-image">
            <img src="${item.image}" alt="${item.title}">
            ${badge}
        </div>
        <div class="item-info">
            <h3 class="item-title">${item.title}</h3>
            <div class="item-price">
                <span class="price">$${item.price}</span>
                ${originalPrice}
            </div>
            <div class="item-meta">
                <span class="item-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${item.location}
                </span>
                <span class="item-likes">
                    <i class="fas fa-heart"></i>
                    ${item.likes}
                </span>
            </div>
        </div>
    `;
    
    return card;
}

// Open item modal
function openItemModal(item) {
    const modal = document.getElementById('itemModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalOriginalPrice = document.getElementById('modalOriginalPrice');
    const modalCondition = document.getElementById('modalCondition');
    const modalLocation = document.getElementById('modalLocation');
    const modalTime = document.getElementById('modalTime');
    const modalDescription = document.getElementById('modalDescription');
    const sellerAvatar = document.getElementById('sellerAvatar');
    const sellerName = document.getElementById('sellerName');
    const sellerRating = document.getElementById('sellerRating');
    const ratingText = document.getElementById('ratingText');
    
    modalImage.src = item.image;
    modalImage.style.display = 'block';
    modalImage.nextElementSibling?.remove();
    modalTitle.textContent = item.title;
    modalPrice.textContent = `$${item.price}`;
    modalOriginalPrice.textContent = item.originalPrice ? `$${item.originalPrice}` : '';
    modalCondition.textContent = item.condition;
    modalLocation.textContent = item.location;
    modalTime.textContent = item.time;
    modalDescription.textContent = item.description;
    if (item.seller.avatar === 'placeholder') {
        sellerAvatar.style.display = 'none';
        sellerAvatar.nextElementSibling?.remove();
        const avatarPlaceholder = document.createElement('div');
        avatarPlaceholder.className = 'avatar-placeholder';
        const initials = item.seller.name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatarPlaceholder.textContent = initials;
        sellerAvatar.parentNode.insertBefore(avatarPlaceholder, sellerAvatar.nextSibling);
    } else {
        sellerAvatar.src = item.seller.avatar;
        sellerAvatar.style.display = 'block';
        sellerAvatar.nextElementSibling?.remove();
    }
    sellerName.textContent = item.seller.name;
    ratingText.textContent = `${item.seller.rating} (${item.seller.reviews} reviews)`;
    
    // Star rating
    const stars = '★'.repeat(Math.floor(item.seller.rating)) + '☆'.repeat(5 - Math.floor(item.seller.rating));
    sellerRating.textContent = stars;
    
    modal.style.display = 'block';
}

// Close modals
function closeModals() {
    itemModal.style.display = 'none';
    sellModal.style.display = 'none';
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    currentItems = sampleItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
    renderItems();
}

// Handle category change
function handleCategoryChange(category) {
    currentCategory = category;
    
    // Update active tab
    categoryTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });
    
    // Filter items
    if (category === 'all') {
        currentItems = [...sampleItems];
    } else {
        currentItems = sampleItems.filter(item => item.category === category);
    }
    
    renderItems();
}

// Handle view change
function handleViewChange(view) {
    currentView = view;
    
    // Update active button
    viewBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    // Update grid layout
    if (view === 'list') {
        itemsGrid.style.gridTemplateColumns = '1fr';
    } else {
        itemsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
    }
}

// Filter items based on current filters
function filterItems() {
    const maxPrice = parseInt(priceSlider.value);
    const selectedConditions = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    currentItems = sampleItems.filter(item => {
        const priceMatch = item.price <= maxPrice;
        const conditionMatch = selectedConditions.length === 0 || selectedConditions.includes(item.condition.toLowerCase().replace(' ', '-'));
        const categoryMatch = currentCategory === 'all' || item.category === currentCategory;
        
        return priceMatch && conditionMatch && categoryMatch;
    });
    
    renderItems();
}

// Handle sell form submission
function handleSellSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(sellForm);
    const newItem = {
        id: sampleItems.length + 1,
        title: document.getElementById('itemTitle').value,
        price: parseInt(document.getElementById('itemPrice').value),
        condition: document.getElementById('itemCondition').value,
        category: document.getElementById('itemCategory').value,
        description: document.getElementById('itemDescription').value,
        image: uploadedImages.querySelector('img')?.src || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
        images: Array.from(uploadedImages.querySelectorAll('img')).map(img => img.src),
        location: 'Your Location',
        time: 'Just now',
        seller: {
            name: 'You',
            avatar: 'placeholder',
            rating: 5.0,
            reviews: 0
        },
        likes: 0,
        badge: 'new'
    };
    
    sampleItems.unshift(newItem);
    currentItems = [...sampleItems];
    renderItems();
    
    // Reset form
    sellForm.reset();
    uploadedImages.innerHTML = '';
    
    // Close modal
    sellModal.style.display = 'none';
    
    alert('Item listed successfully!');
}

// Handle image upload
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'uploaded-image';
                imageContainer.innerHTML = `
                    <img src="${e.target.result}" alt="Uploaded image">
                    <button class="remove-image" onclick="removeImage(this)">×</button>
                `;
                uploadedImages.appendChild(imageContainer);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Remove uploaded image
function removeImage(button) {
    button.parentElement.remove();
}

// Load more items (simulate loading more items)
function loadMoreItems() {
    // In a real app, this would fetch more items from an API
    const loadMoreBtn = document.querySelector('.load-more-btn');
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
    
    setTimeout(() => {
        // Simulate adding more items
        const additionalItems = sampleItems.slice(0, 3).map(item => ({
            ...item,
            id: item.id + 100,
            title: item.title + ' (Similar)',
            price: Math.floor(item.price * 0.8)
        }));
        
        sampleItems.push(...additionalItems);
        currentItems = [...sampleItems];
        renderItems();
        
        loadMoreBtn.textContent = 'Load More Items';
        loadMoreBtn.disabled = false;
    }, 1000);
}

// Contact seller functionality
document.addEventListener('click', function(e) {
    if (e.target.id === 'contactSeller') {
        alert('Contact seller functionality would open here (e.g., messaging system)');
    }
    
    if (e.target.id === 'makeOffer') {
        const offer = prompt('Enter your offer amount:');
        if (offer && !isNaN(offer)) {
            alert(`Offer of $${offer} submitted! The seller will be notified.`);
        }
    }
    
    if (e.target.id === 'addToWishlist') {
        e.target.innerHTML = '<i class="fas fa-heart" style="color: #ff4757;"></i> Saved';
        e.target.style.color = '#ff4757';
    }
});

// Cancel sell functionality
document.getElementById('cancelSell').addEventListener('click', function() {
    sellModal.style.display = 'none';
    sellForm.reset();
    uploadedImages.innerHTML = '';
});

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading animation for better UX
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
}

document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove("show");
      }
    });
  }
});

// CSS for loading animation
const loadingCSS = `
.loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #ff6b35;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}


`;

// Inject loading CSS
const style = document.createElement('style');
style.textContent = loadingCSS;
document.head.appendChild(style);


