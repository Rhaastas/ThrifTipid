// Home page functionality

// Categories data (static for display purposes)
const categories = [
    { id: 'electronics', name: 'Electronics', icon: '📱', count: 45 },
    { id: 'fashion', name: 'Fashion', icon: '👗', count: 128 },
    { id: 'home', name: 'Home & Garden', icon: '🪑', count: 92 },
    { id: 'sports', name: 'Sports', icon: '⚽', count: 67 },
    { id: 'books', name: 'Books', icon: '📚', count: 34 },
    { id: 'automotive', name: 'Automotive', icon: '🚗', count: 56 }
];

document.addEventListener('DOMContentLoaded', function() {
    renderCategories();
    loadFeaturedItems();
});

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
        const response = await fetch('api/get_products.php', {
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
            .map(item => ({
                id: item.id,
                title: item.title,
                description: item.description || '',
                price: parseFloat(item.price) || 0,
                category: item.category || 'misc',
                condition: item.product_condition || '',
                location: item.location || '',
                created_at: item.created_at,
                image: item.image_url || null,
                availability: 'available',
                likes: 0
            }));
        
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
                <span class="price">₱${parseFloat(item.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
