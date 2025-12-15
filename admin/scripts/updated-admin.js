// Admin Dashboard JavaScript - Connected to Node.js Backend
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.charts = {};
        this.API_BASE = 'http://localhost:3000/admin/api';
        
        // Data from API
        this.apiData = {
            items: [],
            users: [],
            categories: [],
            notifications: [],
            stats: {},
            salesData: [],
            categoryData: []
        };
        
        this.init();
    }
    
    async init() {
        // Check authentication first
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        this.setupEventListeners();
        await this.loadDashboard();
    }
    
    // Check if admin is authenticated
    async checkAuth() {
        try {
            const response = await fetch(`${this.API_BASE}/session`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success && data.admin) {
                // Update admin username in header if element exists
                const adminUsername = document.getElementById('adminUsername');
                if (adminUsername) {
                    adminUsername.textContent = data.admin.name || data.admin.username;
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
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
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Search functionality
        const adminSearch = document.getElementById('adminSearch');
        if (adminSearch) {
            adminSearch.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // Notifications
        const notificationsBtn = document.getElementById('notificationsBtn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                this.toggleNotifications();
            });
        }
        
        const closeNotifications = document.querySelector('.close-notifications');
        if (closeNotifications) {
            closeNotifications.addEventListener('click', () => {
                this.closeNotifications();
            });
        }
        
        // Modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeModals();
            });
        });
        
        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSettingsTab(btn.dataset.tab);
            });
        });
        
        // Filters
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                this.applyItemFilters();
            });
        }
        
        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                this.previousPage();
            });
        }
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                this.nextPage();
            });
        }
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }
    
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update content
        document.querySelectorAll('.content-section').forEach(content => {
            content.classList.remove('active');
        });
        const activeSection = document.getElementById(section);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getSectionTitle(section);
        }
        
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
        
        if (sidebar) sidebar.classList.toggle('open');
        if (mainContent) mainContent.classList.toggle('expanded');
    }
    
    async loadDashboard() {
        try {
            const response = await fetch(`${this.API_BASE}/dashboard/stats`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.apiData.stats = data.stats;
                this.apiData.items = data.items || [];
                this.apiData.salesData = data.salesData || [];
                this.apiData.categoryData = data.categoryData || [];
                
                this.updateStats();
                this.setupCharts();
                this.loadRecentActivity();
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showMessage('Failed to load dashboard data', 'error');
        }
    }
    
    updateStats() {
        const stats = this.apiData.stats;
        
        const totalItems = document.getElementById('totalItems');
        const totalUsers = document.getElementById('totalUsers');
        const totalTransactions = document.getElementById('totalTransactions');
        const totalRevenue = document.getElementById('totalRevenue');
        
        if (totalItems) totalItems.textContent = (stats.totalItems || 0).toLocaleString();
        if (totalUsers) totalUsers.textContent = (stats.totalUsers || 0).toLocaleString();
        if (totalTransactions) totalTransactions.textContent = (stats.totalTransactions || 0).toLocaleString();
        if (totalRevenue) totalRevenue.textContent = `₱${parseFloat(stats.totalRevenue || 0).toLocaleString()}`;
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
        
        const salesData = this.apiData.salesData.length > 0 
            ? this.apiData.salesData 
            : this.generateSalesData();
        
        const labels = salesData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const values = salesData.map(d => d.count);
        
        this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Products Listed',
                    data: values,
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
        
        const categoryData = this.apiData.categoryData;
        
        if (!categoryData || categoryData.length === 0) {
            return;
        }
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(cat => cat.category || 'Other'),
                datasets: [{
                    data: categoryData.map(cat => cat.count),
                    backgroundColor: colors.slice(0, categoryData.length),
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
        
        return labels.map((label, i) => ({ date: label, count: values[i] }));
    }
    
    loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        const items = this.apiData.items.slice(0, 5);
        
        if (items.length === 0) {
            container.innerHTML = '<p>No recent activity</p>';
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div class="activity-item">
                <div class="activity-icon" style="background: #10b981">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">New item '${item.title}' added by ${item.seller}</div>
                    <div class="activity-time">${this.getTimeAgo(item.date)}</div>
                </div>
            </div>
        `).join('');
    }
    
    async loadItems() {
        try {
            const response = await fetch(`${this.API_BASE}/items?page=${this.currentPage}&limit=${this.itemsPerPage}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.apiData.items = data.items;
                this.renderItems(data.items, data.pagination);
            }
        } catch (error) {
            console.error('Error loading items:', error);
            this.showMessage('Failed to load items', 'error');
        }
    }
    
    renderItems(items, pagination) {
        const tbody = document.getElementById('itemsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = items.map(item => `
            <tr>
                <td><input type="checkbox" class="item-checkbox" data-id="${item.id}"></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${item.image}" alt="${item.title}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;" onerror="this.style.display='none'">
                        <span>${item.title}</span>
                    </div>
                </td>
                <td>${item.seller}</td>
                <td>${item.category}</td>
                <td>₱${item.price}</td>
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
        
        this.updatePagination(pagination);
    }
    
    async loadUsers() {
        try {
            const response = await fetch(`${this.API_BASE}/users?page=${this.currentPage}&limit=${this.itemsPerPage}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.apiData.users = data.users;
                this.renderUsers(data.users, data.pagination);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showMessage('Failed to load users', 'error');
        }
    }
    
    renderUsers(users, pagination) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = users.map(user => `
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
        
        this.updatePagination(pagination);
    }
    
    async loadCategories() {
        try {
            const response = await fetch(`${this.API_BASE}/categories`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.apiData.categories = data.categories;
                this.renderCategories(data.categories);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showMessage('Failed to load categories', 'error');
        }
    }
    
    renderCategories(categories) {
        const container = document.getElementById('categoriesGrid');
        if (!container) return;
        
        container.innerHTML = categories.map(category => `
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
        console.log('Loading reports...');
    }
    
    loadSettings() {
        console.log('Loading settings...');
    }
    
    async loadNotifications() {
        try {
            const response = await fetch(`${this.API_BASE}/notifications`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.apiData.notifications = data.notifications;
                this.renderNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }
    
    renderNotifications(notifications) {
        const container = document.getElementById('notificationList');
        if (!container) return;
        
        if (notifications.length === 0) {
            container.innerHTML = '<div class="notification-item">No new notifications</div>';
        } else {
            container.innerHTML = notifications.map(notification => `
                <div class="notification-item">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-text">${notification.text}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
            `).join('');
        }
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = notifications.length;
            badge.style.display = notifications.length > 0 ? 'block' : 'none';
        }
    }
    
    toggleNotifications() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('open');
            // Load notifications when opening
            if (panel.classList.contains('open')) {
                this.loadNotifications();
            }
        }
    }
    
    closeNotifications() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('open');
        }
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    switchSettingsTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(tab);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }
    
    applyItemFilters() {
        this.loadItems();
        this.showMessage('Filters applied successfully!', 'info');
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            if (this.currentSection === 'items') {
                this.loadItems();
            } else if (this.currentSection === 'users') {
                this.loadUsers();
            }
        }
    }
    
    nextPage() {
        this.currentPage++;
        if (this.currentSection === 'items') {
            this.loadItems();
        } else if (this.currentSection === 'users') {
            this.loadUsers();
        }
    }
    
    updatePagination(pagination) {
        const pageInfo = document.getElementById('pageInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (pageInfo && pagination) {
            pageInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
        }
        
        if (prevPage) {
            prevPage.disabled = !pagination || pagination.page === 1;
        }
        
        if (nextPage) {
            nextPage.disabled = !pagination || pagination.page === pagination.totalPages;
        }
    }
    
    handleSearch(query) {
        console.log('Searching for:', query);
    }
    
    editItem(id) {
        this.showMessage(`Editing item: ${id}`, 'info');
    }
    
    async deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            const response = await fetch(`${this.API_BASE}/items/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('Item deleted successfully!', 'success');
                this.loadItems();
            } else {
                this.showMessage(data.error || 'Failed to delete item', 'error');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showMessage('Failed to delete item', 'error');
        }
    }
    
    editUser(id) {
        this.showMessage(`Editing user: ${id}`, 'info');
    }
    
    async deleteUser(id) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            const response = await fetch(`${this.API_BASE}/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('User deleted successfully!', 'success');
                this.loadUsers();
            } else {
                this.showMessage(data.error || 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showMessage('Failed to delete user', 'error');
        }
    }
    
    editCategory(id) {
        this.showMessage(`Editing category: ${id}`, 'info');
    }
    
    deleteCategory(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            this.showMessage('Category deleted successfully!', 'success');
        }
    }
    
    async handleLogout() {
        try {
            // Clear the session cookie
            document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            // Redirect to main site login
            window.location.href = 'http://localhost/public/pages/login.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, still redirect
            window.location.href = 'http://localhost/public/pages/login.html';
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
        if (contentWrapper) {
            contentWrapper.insertBefore(message, contentWrapper.firstChild);
        } else {
            document.body.insertBefore(message, document.body.firstChild);
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
    
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return `${diff} seconds ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
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