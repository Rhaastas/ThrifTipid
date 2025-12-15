// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.charts = {};
        
        // Sample data
        this.sampleData = {
            items: [
                {
                    id: 1,
                    title: "iPhone 13 Pro Max 256GB",
                    seller: "Steven Suarez",
                    category: "electronics",
                    price: 899,
                    status: "active",
                    date: "2024-01-15",
                    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=200&fit=crop"
                },
                {
                    id: 2,
                    title: "Nike Air Jordan 1 Retro",
                    seller: "James Dimino",
                    category: "fashion",
                    price: 120,
                    status: "sold",
                    date: "2024-01-14",
                    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop"
                },
                {
                    id: 3,
                    title: "MacBook Pro 13-inch M1",
                    seller: "Zhak Carreon",
                    category: "electronics",
                    price: 1299,
                    status: "pending",
                    date: "2024-01-13",
                    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop"
                },
                {
                    id: 4,
                    title: "Vintage Leather Jacket",
                    seller: "Christian Camba",
                    category: "fashion",
                    price: 85,
                    status: "active",
                    date: "2024-01-12",
                    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=200&fit=crop"
                },
                {
                    id: 5,
                    title: "Gaming Chair Ergonomic",
                    seller: "Makaveli Manaois",
                    category: "home",
                    price: 150,
                    status: "rejected",
                    date: "2024-01-11",
                    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop"
                }
            ],
            users: [
                {
                    id: 1,
                    name: "Steven Suarez",
                    email: "steven@example.com",
                    role: "seller",
                    itemsCount: 12,
                    status: "active",
                    joined: "2023-06-15"
                },
                {
                    id: 2,
                    name: "James Dimino",
                    email: "james@example.com",
                    role: "buyer",
                    itemsCount: 0,
                    status: "active",
                    joined: "2023-08-22"
                },
                {
                    id: 3,
                    name: "Zhak Carreon",
                    email: "zhak@example.com",
                    role: "seller",
                    itemsCount: 8,
                    status: "active",
                    joined: "2023-07-10"
                },
                {
                    id: 4,
                    name: "Christian Camba",
                    email: "christian@example.com",
                    role: "seller",
                    itemsCount: 15,
                    status: "inactive",
                    joined: "2023-05-03"
                },
                {
                    id: 5,
                    name: "Makaveli Manaois",
                    email: "makaveli@example.com",
                    role: "admin",
                    itemsCount: 3,
                    status: "active",
                    joined: "2023-04-18"
                }
            ],
            categories: [
                {
                    id: 1,
                    name: "Electronics",
                    icon: "fas fa-mobile-alt",
                    itemsCount: 245,
                    color: "#3b82f6"
                },
                {
                    id: 2,
                    name: "Fashion",
                    icon: "fas fa-tshirt",
                    itemsCount: 189,
                    color: "#10b981"
                },
                {
                    id: 3,
                    name: "Home & Garden",
                    icon: "fas fa-home",
                    itemsCount: 156,
                    color: "#f59e0b"
                },
                {
                    id: 4,
                    name: "Sports",
                    icon: "fas fa-futbol",
                    itemsCount: 98,
                    color: "#8b5cf6"
                },
                {
                    id: 5,
                    name: "Books",
                    icon: "fas fa-book",
                    itemsCount: 67,
                    color: "#ef4444"
                },
                {
                    id: 6,
                    name: "Automotive",
                    icon: "fas fa-car",
                    itemsCount: 134,
                    color: "#06b6d4"
                }
            ],
            notifications: [
                {
                    id: 1,
                    title: "New Item Pending Approval",
                    text: "MacBook Pro 13-inch M1 needs admin review",
                    time: "2 minutes ago",
                    type: "warning"
                },
                {
                    id: 2,
                    title: "User Report",
                    text: "Report submitted for item #1234",
                    time: "15 minutes ago",
                    type: "error"
                },
                {
                    id: 3,
                    title: "High Sales Volume",
                    text: "Electronics category exceeded daily target",
                    time: "1 hour ago",
                    type: "success"
                },
                {
                    id: 4,
                    title: "System Update",
                    text: "Scheduled maintenance completed successfully",
                    time: "2 hours ago",
                    type: "info"
                },
                {
                    id: 5,
                    title: "New User Registration",
                    text: "25 new users registered today",
                    time: "3 hours ago",
                    type: "info"
                }
            ],
            recentActivity: [
                {
                    id: 1,
                    icon: "fas fa-plus",
                    iconColor: "#10b981",
                    text: "New item 'iPhone 13 Pro Max' added by Steven Suarez",
                    time: "5 minutes ago"
                },
                {
                    id: 2,
                    icon: "fas fa-check",
                    iconColor: "#3b82f6",
                    text: "Item 'Nike Air Jordan 1' approved and published",
                    time: "12 minutes ago"
                },
                {
                    id: 3,
                    icon: "fas fa-user",
                    iconColor: "#8b5cf6",
                    text: "New user 'John Doe' registered",
                    time: "18 minutes ago"
                },
                {
                    id: 4,
                    icon: "fas fa-ban",
                    iconColor: "#ef4444",
                    text: "Item 'Gaming Chair' rejected due to policy violation",
                    time: "25 minutes ago"
                },
                {
                    id: 5,
                    icon: "fas fa-handshake",
                    iconColor: "#f59e0b",
                    text: "Transaction completed for 'MacBook Pro'",
                    time: "32 minutes ago"
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.setupCharts();
        this.loadNotifications();
        this.loadRecentActivity();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Search functionality
        document.getElementById('adminSearch').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Notifications
        document.getElementById('notificationsBtn').addEventListener('click', () => {
            this.toggleNotifications();
        });
        
        document.querySelector('.close-notifications').addEventListener('click', () => {
            this.closeNotifications();
        });
        
        // Modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModals();
            });
        });
        
        // Add buttons
        document.getElementById('addItem').addEventListener('click', () => {
            this.openModal('addItemModal');
        });
        
        document.getElementById('addUser').addEventListener('click', () => {
            this.openModal('addUserModal');
        });
        
        document.getElementById('addCategory').addEventListener('click', () => {
            this.openModal('addCategoryModal');
        });
        
        // Form submissions
        document.getElementById('addItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddItem();
        });
        
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUser();
        });
        
        document.getElementById('addCategoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddCategory();
        });
        
        // Cancel buttons
        document.getElementById('cancelAddItem').addEventListener('click', () => {
            this.closeModals();
        });
        
        document.getElementById('cancelAddUser').addEventListener('click', () => {
            this.closeModals();
        });
        
        document.getElementById('cancelAddCategory').addEventListener('click', () => {
            this.closeModals();
        });
        
        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSettingsTab(btn.dataset.tab);
            });
        });
        
        // Filters
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyItemFilters();
        });
        
        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            this.previousPage();
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            this.nextPage();
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }
    
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.content-section').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');
        
        // Update page title
        document.getElementById('pageTitle').textContent = this.getSectionTitle(section);
        
        this.currentSection = section;
        
        // Load section-specific data
        switch(section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'items':
                this.loadItems();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    getSectionTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            items: 'Items Management',
            users: 'User Management',
            categories: 'Category Management',
            reports: 'Reports & Analytics',
            settings: 'System Settings'
        };
        return titles[section] || 'Dashboard';
    }
    
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('expanded');
    }
    
    loadDashboard() {
        this.updateStats();
        this.setupCharts();
        this.loadRecentActivity();
    }
    
    updateStats() {
        const stats = {
            totalItems: this.sampleData.items.length,
            totalUsers: this.sampleData.users.length,
            totalTransactions: Math.floor(Math.random() * 1000) + 500,
            totalRevenue: Math.floor(Math.random() * 100000) + 20000
        };
        
        document.getElementById('totalItems').textContent = stats.totalItems.toLocaleString();
        document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('totalTransactions').textContent = stats.totalTransactions.toLocaleString();
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
    }
    
    setupCharts() {
        this.setupSalesChart();
        this.setupCategoryChart();
    }
    
    setupSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;
        
        if (this.charts.sales) {
            this.charts.sales.destroy();
        }
        
        const salesData = this.generateSalesData();
        
        this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Sales',
                    data: salesData.values,
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    setupCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        const categoryData = this.sampleData.categories.map(cat => ({
            label: cat.name,
            value: cat.itemsCount,
            color: cat.color
        }));
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(cat => cat.label),
                datasets: [{
                    data: categoryData.map(cat => cat.value),
                    backgroundColor: categoryData.map(cat => cat.color),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    generateSalesData() {
        const labels = [];
        const values = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            values.push(Math.floor(Math.random() * 1000) + 200);
        }
        
        return { labels, values };
    }
    
    loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        container.innerHTML = this.sampleData.recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.iconColor}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }
    
    loadItems() {
        const tbody = document.getElementById('itemsTableBody');
        if (!tbody) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const items = this.sampleData.items.slice(startIndex, endIndex);
        
        tbody.innerHTML = items.map(item => `
            <tr>
                <td><input type="checkbox" class="item-checkbox" data-id="${item.id}"></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${item.image}" alt="${item.title}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
                        <span>${item.title}</span>
                    </div>
                </td>
                <td>${item.seller}</td>
                <td>${item.category}</td>
                <td>$${item.price}</td>
                <td><span class="status-badge ${item.status}">${item.status}</span></td>
                <td>${item.date}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-outline" onclick="adminDashboard.editItem(${item.id})" style="padding: 4px 8px; font-size: 12px;">Edit</button>
                        <button class="btn-outline" onclick="adminDashboard.deleteItem(${item.id})" style="padding: 4px 8px; font-size: 12px; color: #ef4444; border-color: #ef4444;">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        this.updatePagination();
    }
    
    loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = this.sampleData.users.map(user => `
            <tr>
                <td><input type="checkbox" class="user-checkbox" data-id="${user.id}"></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="admin-avatar" style="width: 32px; height: 32px; font-size: 12px;">
                            ${user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>${user.name}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.role}">${user.role}</span></td>
                <td>${user.itemsCount}</td>
                <td><span class="status-badge ${user.status}">${user.status}</span></td>
                <td>${user.joined}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-outline" onclick="adminDashboard.editUser(${user.id})" style="padding: 4px 8px; font-size: 12px;">Edit</button>
                        <button class="btn-outline" onclick="adminDashboard.deleteUser(${user.id})" style="padding: 4px 8px; font-size: 12px; color: #ef4444; border-color: #ef4444;">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    loadCategories() {
        const container = document.getElementById('categoriesGrid');
        if (!container) return;
        
        container.innerHTML = this.sampleData.categories.map(category => `
            <div class="category-card">
                <div class="category-header">
                    <div class="category-icon" style="background: ${category.color}">
                        <i class="${category.icon}"></i>
                    </div>
                    <div class="category-name">${category.name}</div>
                </div>
                <div class="category-stats">
                    <div class="category-stat">
                        <div class="category-stat-value">${category.itemsCount}</div>
                        <div class="category-stat-label">Items</div>
                    </div>
                    <div class="category-stat">
                        <div class="category-stat-value">${Math.floor(Math.random() * 50) + 10}</div>
                        <div class="category-stat-label">Active</div>
                    </div>
                    <div class="category-stat">
                        <div class="category-stat-value">${Math.floor(Math.random() * 20) + 5}</div>
                        <div class="category-stat-label">Pending</div>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn-outline" onclick="adminDashboard.editCategory(${category.id})" style="flex: 1;">Edit</button>
                    <button class="btn-outline" onclick="adminDashboard.deleteCategory(${category.id})" style="flex: 1; color: #ef4444; border-color: #ef4444;">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    loadReports() {
        // Reports are static for now
        console.log('Loading reports...');
    }
    
    loadSettings() {
        // Settings are static for now
        console.log('Loading settings...');
    }
    
    loadNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;
        
        container.innerHTML = this.sampleData.notifications.map(notification => `
            <div class="notification-item">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-text">${notification.text}</div>
                <div class="notification-time">${notification.time}</div>
            </div>
        `).join('');
        
        // Update badge
        document.getElementById('notificationBadge').textContent = this.sampleData.notifications.length;
    }
    
    toggleNotifications() {
        const panel = document.getElementById('notificationPanel');
        panel.classList.toggle('open');
    }
    
    closeNotifications() {
        const panel = document.getElementById('notificationPanel');
        panel.classList.remove('open');
    }
    
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }
    
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    handleAddItem() {
        const formData = {
            title: document.getElementById('newItemTitle').value,
            description: document.getElementById('newItemDescription').value,
            price: document.getElementById('newItemPrice').value,
            category: document.getElementById('newItemCategory').value,
            seller: document.getElementById('newItemSeller').value
        };
        
        // Add to sample data
        const newItem = {
            id: this.sampleData.items.length + 1,
            ...formData,
            status: 'active',
            date: new Date().toISOString().split('T')[0],
            image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop'
        };
        
        this.sampleData.items.unshift(newItem);
        
        // Reset form
        document.getElementById('addItemForm').reset();
        
        // Close modal
        this.closeModals();
        
        // Reload items if on items page
        if (this.currentSection === 'items') {
            this.loadItems();
        }
        
        this.showMessage('Item added successfully!', 'success');
    }
    
    handleAddUser() {
        const formData = {
            name: document.getElementById('newUserName').value,
            email: document.getElementById('newUserEmail').value,
            role: document.getElementById('newUserRole').value,
            password: document.getElementById('newUserPassword').value
        };
        
        // Add to sample data
        const newUser = {
            id: this.sampleData.users.length + 1,
            ...formData,
            itemsCount: 0,
            status: 'active',
            joined: new Date().toISOString().split('T')[0]
        };
        
        this.sampleData.users.push(newUser);
        
        // Reset form
        document.getElementById('addUserForm').reset();
        
        // Close modal
        this.closeModals();
        
        // Reload users if on users page
        if (this.currentSection === 'users') {
            this.loadUsers();
        }
        
        this.showMessage('User added successfully!', 'success');
    }
    
    handleAddCategory() {
        const formData = {
            name: document.getElementById('newCategoryName').value,
            description: document.getElementById('newCategoryDescription').value,
            icon: document.getElementById('newCategoryIcon').value
        };
        
        // Add to sample data
        const newCategory = {
            id: this.sampleData.categories.length + 1,
            ...formData,
            itemsCount: 0,
            color: this.getRandomColor()
        };
        
        this.sampleData.categories.push(newCategory);
        
        // Reset form
        document.getElementById('addCategoryForm').reset();
        
        // Close modal
        this.closeModals();
        
        // Reload categories if on categories page
        if (this.currentSection === 'categories') {
            this.loadCategories();
        }
        
        this.showMessage('Category added successfully!', 'success');
    }
    
    getRandomColor() {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    switchSettingsTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');
    }
    
    applyItemFilters() {
        // Filter logic would go here
        this.loadItems();
        this.showMessage('Filters applied successfully!', 'info');
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadItems();
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.sampleData.items.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.loadItems();
        }
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.sampleData.items.length / this.itemsPerPage);
        document.getElementById('pageInfo').textContent = `Page ${this.currentPage} of ${totalPages}`;
        
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    }
    
    handleSearch(query) {
        // Search logic would go here
        console.log('Searching for:', query);
    }
    
    editItem(id) {
        const item = this.sampleData.items.find(i => i.id === id);
        if (item) {
            this.showMessage(`Editing item: ${item.title}`, 'info');
        }
    }
    
    deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.sampleData.items = this.sampleData.items.filter(i => i.id !== id);
            this.loadItems();
            this.showMessage('Item deleted successfully!', 'success');
        }
    }
    
    editUser(id) {
        const user = this.sampleData.users.find(u => u.id === id);
        if (user) {
            this.showMessage(`Editing user: ${user.name}`, 'info');
        }
    }
    
    deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.sampleData.users = this.sampleData.users.filter(u => u.id !== id);
            this.loadUsers();
            this.showMessage('User deleted successfully!', 'success');
        }
    }
    
    editCategory(id) {
        const category = this.sampleData.categories.find(c => c.id === id);
        if (category) {
            this.showMessage(`Editing category: ${category.name}`, 'info');
        }
    }
    
    deleteCategory(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            this.sampleData.categories = this.sampleData.categories.filter(c => c.id !== id);
            this.loadCategories();
            this.showMessage('Category deleted successfully!', 'success');
        }
    }
    
    showMessage(text, type = 'info') {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());
        
        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        // Insert at top of content
        const contentWrapper = document.querySelector('.content-wrapper');
        contentWrapper.insertBefore(message, contentWrapper.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}

// Initialize the admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}
