// Home page functionality

// Categories will be loaded from database
let categories = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadFeaturedItems();
});

// Load categories from database
async function loadCategories() {
    try {
        const response = await fetch('/api/get_categories.php');
        const data = await response.json();
        
        if (data.success && data.categories) {
            categories = data.categories.map(cat => ({
                id: cat.name,
                name: cat.name,
                icon: getCategoryIcon(cat.name),
                count: 0 // Will be updated if we add product counts to the API
            }));
            renderCategories();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to default categories if API fails
        categories = [
            { id: 'Electronics', name: 'Electronics', icon: '📱', count: 0 },
            { id: 'Fashion', name: 'Fashion', icon: '👗', count: 0 },
            { id: 'Home & Garden', name: 'Home & Garden', icon: '🪑', count: 0 },
            { id: 'Sports', name: 'Sports', icon: '⚽', count: 0 },
            { id: 'Books', name: 'Books', icon: '📚', count: 0 },
            { id: 'Automotive', name: 'Automotive', icon: '🚗', count: 0 }
        ];
        renderCategories();
    }
}

// Get icon for category
function getCategoryIcon(categoryName) {
    const icons = {
        'Electronics': '📱',
        'Fashion': '👗',
        'Home & Garden': '🪑',
        'Sports': '⚽',
        'Books': '📚',
        'Automotive': '🚗',
        'Collectibles': '🎨'
    };
    return icons[categoryName] || '📦';
}

// Render categories
function renderCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    categoriesGrid.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = document.createElement('a');
        categoryCard.href = `browse.html?category=${category.id}`;
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            <div class="category-name">${category.name}</div>
            <div class="category-count">${category.count} items</div>
        `;
        categoriesGrid.appendChild(categoryCard);
    });
}

// Load featured items from API
async function loadFeaturedItems() {
    try {
        const response = await fetch('/api/get_products.php', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('Failed to load featured items');
            renderFeaturedItems([]); // Show empty state instead of default items
            return;
        }
        
        const data = await response.json();
        const items = data.items || [];
        
        // If no items in database, show empty state
        if (items.length === 0) {
            renderFeaturedItems([]);
            return;
        }
        
        // Get random 4 items (or all if less than 4)
        const featuredItems = items
            .sort(() => Math.random() - 0.5) // Shuffle
            .slice(0, 4)
            .map(item => {
                // Parse prices safely - handle both string and number formats
                const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) : parseFloat(item.price);
                const buyoutPrice = item.buyout_price ? (typeof item.buyout_price === 'string' ? parseFloat(item.buyout_price.replace(/,/g, '')) : parseFloat(item.buyout_price)) : null;
                
                return {
                    id: item.id,
                    title: item.title,
                    description: item.description || '',
                    price: price || 0,
                    buyoutPrice: buyoutPrice,
                    bidPrice: price || 0,
                    category: item.category || 'misc',
                    condition: item.product_condition || '',
                    location: item.location || '',
                    created_at: item.created_at,
                    image: item.image_url || null,
                    availability: 'available',
                    likes: 0
                };
            });
        
        renderFeaturedItems(featuredItems);
    } catch (error) {
        console.error('Error loading featured items:', error);
        renderFeaturedItems([]); // Show empty state instead of default items
    }
}

// Render featured items
function renderFeaturedItems(featuredItems) {
    const featuredGrid = document.getElementById('featuredGrid');
    if (!featuredGrid) return;
    
    featuredGrid.innerHTML = '';
    
    if (featuredItems.length === 0) {
        featuredGrid.innerHTML = '<p>No featured items available at the moment.</p>';
        return;
    }
    
    featuredItems.forEach(item => {
        const itemCard = createItemCard(item);
        featuredGrid.appendChild(itemCard);
    });
}

// Create item card (reusable function)
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
                ${item.buyoutPrice ? `
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; align-items: baseline; gap: 6px;">
                            <span style="font-size: 11px; color: #28a745; font-weight: 600;">BUY NOW</span>
                            <span class="price" style="color: #28a745;">₱${item.buyoutPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div style="display: flex; align-items: baseline; gap: 6px;">
                            <span style="font-size: 11px; color: #6c757d; font-weight: 500;">BID</span>
                            <span style="font-size: 14px; color: #6c757d;">₱${item.bidPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                    </div>
                ` : `
                    <span class="price">₱${item.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                `}
                ${originalPrice}
            </div>
            <div class="item-meta">
                <span class="item-location">
                    <span class="icon-map-marker"></span>
                    ${item.location}
                </span>
                <span class="item-likes">
                    <span class="icon-heart"></span>
                    ${item.likes || 0}
                </span>
            </div>
        </div>
    `;
    
    // Add click handler to navigate to product page
    card.addEventListener('click', () => {
        window.location.href = `product.html?id=${item.id}`;
    });
    
    return card;
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

// Handle category filter from URL
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        // Redirect to browse page with category filter
        window.location.href = `browse.html?category=${category}`;
    }
});
