// Browse page functionality
let currentItems = [];
let allItems = []; // Store all items from API
let currentCategory = 'all';
let currentView = 'grid';
let categories = []; // Store categories from database

// DOM elements
const itemsGrid = document.getElementById('itemsGrid');
const searchInput = document.getElementById('searchInput');
let categoryTabs = [];
const viewBtns = document.querySelectorAll('.view-btn');
const priceSlider = document.getElementById('priceSlider');
const priceValue = document.getElementById('priceValue');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load categories and items
    Promise.all([loadCategories(), loadItemsFromAPI()]).then(() => {
        // Check for search query in URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        const categoryFilter = urlParams.get('category');
        
        if (categoryFilter) {
            handleCategoryChange(categoryFilter);
        } else if (searchQuery) {
            if (searchInput) {
                searchInput.value = searchQuery;
                handleSearch({ target: { value: searchQuery } });
            }
        } else {
            renderItems();
        }
        
        setupEventListeners();
        setupPriceSlider();
        setupSorting();
    });
});

// Load categories from database
async function loadCategories() {
    try {
        const response = await fetch('/api/get_categories.php');
        const data = await response.json();
        
        if (data.success && data.categories) {
            categories = data.categories;
            renderCategoryTabs();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render category tabs
function renderCategoryTabs() {
    const categoryTabsContainer = document.getElementById('categoryTabs');
    if (!categoryTabsContainer) return;
    
    // Keep the "All" button and add dynamic categories
    const allButton = categoryTabsContainer.querySelector('[data-category="all"]');
    categoryTabsContainer.innerHTML = '';
    if (allButton) {
        categoryTabsContainer.appendChild(allButton);
    }
    
    // Add category tabs from database
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-tab';
        button.setAttribute('data-category', category.name);
        button.textContent = category.name;
        categoryTabsContainer.appendChild(button);
    });
    
    // Re-query category tabs after adding them
    categoryTabs = document.querySelectorAll('.category-tab');
}

// Load items from API
async function loadItemsFromAPI() {
    try {
        const response = await fetch('/api/get_products.php', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load items');
        }
        
        const data = await response.json();
        
        // Transform API data to match expected format
        allItems = (data.items || []).map(item => {
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
                dateListed: item.created_at,
                image: item.image_url || null,
                availability: 'available', // Default to available
                likes: 0, // Not stored in DB yet
                badge: null
            };
        });
        
        currentItems = [...allItems];
        
        // Update price slider max value based on items
        if (priceSlider && allItems.length > 0) {
            const maxPrice = Math.max(...allItems.map(item => item.price));
            priceSlider.max = Math.ceil(maxPrice * 1.2); // 20% above max
            priceSlider.value = Math.ceil(maxPrice);
            if (priceValue) {
                priceValue.textContent = '₱' + Math.ceil(maxPrice);
            }
        }
    } catch (error) {
        console.error('Error loading items:', error);
        allItems = [];
        currentItems = [];
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Category filtering
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => handleCategoryChange(tab.dataset.category));
    });
    
    // View toggle
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => handleViewChange(btn.dataset.view));
    });
    
    // Load more button
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreItems);
    }
}

// Setup price slider
function setupPriceSlider() {
    if (priceSlider) {
        priceSlider.addEventListener('input', function() {
            if (priceValue) {
                priceValue.textContent = '₱' + this.value;
            }
            filterItems();
        });
    }
}

// Render items
function renderItems() {
    if (!itemsGrid) return;
    
    itemsGrid.innerHTML = '';
    
    if (currentItems.length === 0) {
        itemsGrid.innerHTML = '<div class="no-results"><p>No items found. Try adjusting your filters.</p></div>';
        return;
    }
    
    currentItems.forEach(item => {
        const itemCard = createItemCard(item);
        itemsGrid.appendChild(itemCard);
    });
}

// Create item card
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const badge = item.badge ? `<div class="item-badge ${item.badge}">${item.badge}</div>` : '';
    const originalPrice = item.originalPrice ? `<span class="original-price">₱${item.originalPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : '';
    
    // Availability badge
    let availabilityBadge = '';
    if (item.availability) {
        const availabilityClass = item.availability === 'available' ? 'available' : 
                                  item.availability === 'pending' ? 'pending' : 'sold';
        const availabilityText = item.availability.charAt(0).toUpperCase() + item.availability.slice(1);
        availabilityBadge = `<div class="availability-badge ${availabilityClass}">${availabilityText}</div>`;
    }
    
    // Format date listed
    let dateText = 'Recently';
    if (item.created_at) {
        const date = new Date(item.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) dateText = 'Today';
        else if (diffDays === 1) dateText = 'Yesterday';
        else if (diffDays < 7) dateText = `${diffDays} days ago`;
        else dateText = date.toLocaleDateString();
    }
    
    card.innerHTML = `
        <div class="item-image">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="placeholder-image" style="display: none;">${getPlaceholderText(item.category)}</div>` : 
            `<div class="placeholder-image">${getPlaceholderText(item.category)}</div>`}
            ${badge}
            ${availabilityBadge}
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
                <div class="item-meta-row">
                    <span class="item-location">
                        <span class="icon-map-marker"></span>
                        ${item.location}
                    </span>
                    <span class="item-date">${dateText}</span>
                </div>
            </div>
        </div>
    `;
    
    // Add click handler to navigate to product page
    card.addEventListener('click', function(e) {
        // Prevent any default behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Navigate to product page
        window.location.href = `product.html?id=${item.id}`;
    });
    
    // Make sure card is clickable
    card.style.cursor = 'pointer';
    
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

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    currentItems = allItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
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
        currentItems = [...allItems];
    } else {
        currentItems = allItems.filter(item => item.category === category);
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
    if (!itemsGrid) return;
    
    if (view === 'list') {
        itemsGrid.style.gridTemplateColumns = '1fr';
        itemsGrid.querySelectorAll('.item-card').forEach(card => {
            card.style.display = 'grid';
            card.style.gridTemplateColumns = '200px 1fr';
        });
    } else {
        itemsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
        itemsGrid.querySelectorAll('.item-card').forEach(card => {
            card.style.display = 'block';
        });
    }
}

// Setup sorting
function setupSorting() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
}

// Handle sort
function handleSort(e) {
    const sortValue = e.target.value;
    sortItems(sortValue);
}

// Sort items
function sortItems(sortBy) {
    const sorted = [...currentItems];
    
    switch(sortBy) {
        case 'recent':
            sorted.sort((a, b) => new Date(b.created_at || b.dateListed) - new Date(a.created_at || a.dateListed));
            break;
        case 'oldest':
            sorted.sort((a, b) => new Date(a.created_at || a.dateListed) - new Date(b.created_at || b.dateListed));
            break;
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'date-listed':
            sorted.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                return dateB - dateA;
            });
            break;
        case 'most-liked':
            sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
        default:
            break;
    }
    
    currentItems = sorted;
    renderItems();
}

// Filter items based on current filters
function filterItems() {
    if (!priceSlider) return;
    
    const maxPrice = parseFloat(priceSlider.value);
    
    // Get condition checkboxes
    const conditionSection = Array.from(document.querySelectorAll('.filter-section')).find(section => 
        section.querySelector('h3')?.textContent === 'Condition'
    );
    const selectedConditions = conditionSection ? 
        Array.from(conditionSection.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value) : [];
    
    // Get availability checkboxes
    const availabilitySection = Array.from(document.querySelectorAll('.filter-section')).find(section => 
        section.querySelector('h3')?.textContent === 'Availability'
    );
    const selectedAvailability = availabilitySection ? 
        Array.from(availabilitySection.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value) : [];
    
    currentItems = allItems.filter(item => {
        const priceMatch = item.price <= maxPrice;
        const conditionMatch = selectedConditions.length === 0 || 
            selectedConditions.includes(item.condition.toLowerCase().replace(' ', '-'));
        const categoryMatch = currentCategory === 'all' || item.category === currentCategory;
        const availabilityMatch = selectedAvailability.length === 0 || 
            (item.availability && selectedAvailability.includes(item.availability));
        
        return priceMatch && conditionMatch && categoryMatch && availabilityMatch;
    });
    
    // Apply current sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect && sortSelect.value) {
        sortItems(sortSelect.value);
    } else {
        renderItems();
    }
}

// Load more items
async function loadMoreItems() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (!loadMoreBtn) return;
    
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
    
    // Reload items from API to get any new items
    await loadItemsFromAPI();
    renderItems();
    
    loadMoreBtn.textContent = 'Load More Items';
    loadMoreBtn.disabled = false;
}

// Add filter change listeners
document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox' || e.target.classList.contains('location-select') || e.target.classList.contains('sort-select')) {
        filterItems();
    }
});

