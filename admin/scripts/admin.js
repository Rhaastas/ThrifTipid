// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.transactionPage = 1;
        this.charts = {};
        this.apiUrl = 'http://localhost:3001/api';
        
        // Data will be loaded from database
        this.data = {
            items: [],
            users: [],
            categories: [],
            stats: null
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDashboard();
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
        document.getElementById('addItem')?.addEventListener('click', () => {
            this.openModal('addItemModal');
        });
        
        document.getElementById('deleteSelectedItems')?.addEventListener('click', () => {
            this.deleteSelectedItems();
        });
        
        document.getElementById('addUser')?.addEventListener('click', () => {
            this.resetUserModal(); // Reset form before opening
            this.openModal('addUserModal');
        });
        
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.openModal('addCategoryModal');
        });
        
        // User filters
        document.getElementById('userRoleFilter')?.addEventListener('change', () => {
            this.loadUsers();
        });
        
        document.getElementById('userSearch')?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.loadUsers();
            }, 500);
        });
        
        // Form submissions
        document.getElementById('addItemForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddItem();
        });
        
        document.getElementById('addUserForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUser();
        });
        
        document.getElementById('addCategoryForm')?.addEventListener('submit', (e) => {
            this.handleAddCategory(e);
        });
        
        // Cancel buttons
        document.getElementById('cancelAddItem')?.addEventListener('click', () => {
            this.closeModals();
        });
        
        document.getElementById('cancelAddCategory')?.addEventListener('click', () => {
            this.closeModals();
        });
        
        document.getElementById('cancelAddUser')?.addEventListener('click', () => {
            this.closeModals();
        });
        
        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSettingsTab(btn.dataset.tab);
            });
        });
        
        // Select all items checkbox
        document.getElementById('selectAllItems')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.item-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
        
        // Filters
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.currentPage = 1; // Reset to page 1 when applying filters
            this.loadItems();
        });
        
        // Also reload on filter change
        document.getElementById('itemStatusFilter')?.addEventListener('change', () => {
            this.currentPage = 1;
            this.loadItems();
        });
        
        document.getElementById('itemCategoryFilter')?.addEventListener('change', () => {
            this.currentPage = 1;
            this.loadItems();
        });
        
        // Pagination
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadItems();
            }
        });
        
        document.getElementById('nextPage')?.addEventListener('click', () => {
            this.currentPage++;
            this.loadItems();
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
                this.loadCategories();
                this.loadItems();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'categories':
                this.loadCategories();
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
            transactions: 'Transaction History',
            categories: 'Categories',
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
        this.fetchStats();
        this.loadRecentActivity();
    }
    
    async fetchStats() {
        try {
            const response = await fetch(`${this.apiUrl}/stats`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            
            const stats = await response.json();
            this.data.stats = stats;
            this.updateStats(stats);
            this.setupCharts(stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
            this.showMessage('Failed to load dashboard statistics', 'error');
        }
    }
    
    updateStats(stats = {}) {
        document.getElementById('totalItems').textContent = (stats.totalProducts || 0).toLocaleString();
        document.getElementById('totalUsers').textContent = (stats.totalUsers || 0).toLocaleString();
        document.getElementById('totalTransactions').textContent = (stats.totalTransactions || 0).toLocaleString();
    }
    
    setupCharts(stats = {}) {
        this.setupTransactionsChart(stats.salesData);
        this.setupCategoryChart(stats.categoryData);
    }
    
    setupTransactionsChart(salesData = null) {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;
        
        if (this.charts.sales) {
            this.charts.sales.destroy();
        }
        
        // If no data provided, show empty chart
        if (!salesData || !salesData.labels || !salesData.values) {
            salesData = {
                labels: [],
                values: []
            };
        }
        
        this.charts.sales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Transactions',
                    data: salesData.values,
                    backgroundColor: '#ff6b35',
                    borderColor: '#ff6b35',
                    borderWidth: 0,
                    borderRadius: 6
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
                        ticks: {
                            stepSize: 1
                        },
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
    
    setupCategoryChart(categoryData = null) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        // If no data provided, show empty chart
        if (!categoryData || categoryData.length === 0) {
            categoryData = [];
        }
        
        this.charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoryData.map(cat => cat.name),
                datasets: [{
                    label: 'Items',
                    data: categoryData.map(cat => cat.count),
                    backgroundColor: categoryData.map(cat => cat.color),
                    borderWidth: 0,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y', // This makes it horizontal
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    async loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/stats/recent-activity`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch recent activity');
            }
            
            const result = await response.json();
            const activities = result.activities || [];
            
            if (activities.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">No recent activity</div>';
                return;
            }
            
            container.innerHTML = activities.map(activity => `
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
        } catch (error) {
            console.error('Error loading recent activity:', error);
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">No recent activity</div>';
        }
    }
    
    async loadItems() {
        const tbody = document.getElementById('itemsTableBody');
        if (!tbody) return;
        
        try {
            // Get filter values
            const status = document.getElementById('itemStatusFilter')?.value || 'all';
            const category = document.getElementById('itemCategoryFilter')?.value || 'all';
            const dateFrom = document.getElementById('itemDateFrom')?.value || '';
            const dateTo = document.getElementById('itemDateTo')?.value || '';
            
            // Build query parameters
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage
            });
            
            if (status && status !== 'all') params.append('status', status);
            if (category && category !== 'all') params.append('category', category);
            
            const response = await fetch(`${this.apiUrl}/products?${params.toString()}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            
            const result = await response.json();
            this.data.items = result.products || [];
            
            if (this.data.items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">No items found</td></tr>';
                this.updatePagination(1, 1);
                return;
            }
            
            tbody.innerHTML = this.data.items.map(item => `
                <tr>
                    <td><input type="checkbox" class="item-checkbox" data-id="${item.id}"></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 6px; background: #e2e8f0; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-box" style="color: #94a3b8;"></i>
                            </div>
                            <div>
                                <div style="font-weight: 500;">${item.title}</div>
                                <div style="font-size: 12px; color: #64748b;">${item.category || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${item.seller_name || item.seller_username || 'N/A'}</td>
                    <td>${this.capitalize(item.category || 'N/A')}</td>
                    <td>₱${(item.price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td><span class="status-badge ${item.status}">${this.capitalize(item.status || 'pending')}</span></td>
                    <td>${item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-outline" onclick="adminDashboard.viewItem(${item.id})" style="padding: 4px 8px; font-size: 12px;">View</button>
                            ${item.status !== 'sold' ? `<button class="btn-outline" onclick="adminDashboard.deleteItem(${item.id})" style="padding: 4px 8px; font-size: 12px; color: #ef4444; border-color: #ef4444;">Remove</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
            
            this.updatePagination(result.totalPages || 1, result.currentPage || 1);
        } catch (error) {
            console.error('Error loading items:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;">Failed to load items</td></tr>';
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch(`${this.apiUrl}/products/categories/list`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            
            const result = await response.json();
            const categories = result.categories || [];
            
            // Populate category filter dropdown
            const categoryFilter = document.getElementById('itemCategoryFilter');
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
                    categories.map(cat => `<option value="${cat}">${this.capitalize(cat)}</option>`).join('');
            }
            
            // Populate add item modal category dropdown
            const newItemCategory = document.getElementById('newItemCategory');
            if (newItemCategory) {
                newItemCategory.innerHTML = '<option value="">Select a category</option>' +
                    categories.map(cat => `<option value="${cat}">${this.capitalize(cat)}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
    
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    viewItem(id) {
        this.showMessage(`Viewing item #${id}`, 'info');
        // TODO: Open modal with item details
    }
    
    async loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        try {
            // Get filter values
            const role = document.getElementById('userRoleFilter')?.value || 'all';
            const search = document.getElementById('userSearch')?.value || '';
            
            // Build query parameters
            const params = new URLSearchParams({
                page: 1,
                limit: 100
            });
            
            if (role && role !== 'all') params.append('role', role);
            if (search) params.append('search', search);
            
            const response = await fetch(`${this.apiUrl}/users?${params.toString()}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const result = await response.json();
            this.data.users = result.users || [];
            
            if (this.data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">No users found</td></tr>';
                return;
            }
            
            tbody.innerHTML = this.data.users.map(user => `
                <tr>
                    <td><input type="checkbox" class="user-checkbox" data-id="${user.id}"></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="admin-avatar" style="width: 32px; height: 32px; font-size: 12px;">
                                ${(user.name || user.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="font-weight: 500;">${user.name || 'Unknown'}</div>
                                <div style="font-size: 12px; color: #64748b;">@${user.username || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.email || 'N/A'}</td>
                    <td><span class="status-badge ${user.role}">${this.capitalize(user.role)}</span></td>
                    <td>${user.items_count || 0}</td>
                    <td><span class="status-badge active">Active</span></td>
                    <td>${user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-outline" onclick="adminDashboard.editUser(${user.id})" style="padding: 4px 8px; font-size: 12px;">Edit</button>
                            <button class="btn-outline" onclick="adminDashboard.deleteUser(${user.id})" style="padding: 4px 8px; font-size: 12px; color: #ef4444; border-color: #ef4444;">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading users:', error);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;">Failed to load users</td></tr>';
        }
    }
    
    async loadTransactions() {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/reports/transactions?page=${this.transactionPage}&limit=20`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            
            const result = await response.json();
            const transactions = result.transactions || [];
            
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">No transactions found</td></tr>';
                this.updateTransactionPagination(1, 1);
                return;
            }
            
            tbody.innerHTML = transactions.map(transaction => `
                <tr>
                    <td>#${transaction.transaction_id}</td>
                    <td>
                        <div style="font-weight: 500;">${transaction.item_name}</div>
                        <div style="font-size: 12px; color: #64748b;">ID: ${transaction.product_id}</div>
                    </td>
                    <td>
                        <div>${transaction.seller_name}</div>
                        <div style="font-size: 12px; color: #64748b;">@${transaction.seller_username}</div>
                    </td>
                    <td>
                        <div>${transaction.buyer_name}</div>
                        <div style="font-size: 12px; color: #64748b;">@${transaction.buyer_username}</div>
                    </td>
                    <td>₱${(transaction.price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${new Date(transaction.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                        <button class="btn-outline" onclick="adminDashboard.viewTransaction(${transaction.transaction_id})" style="padding: 4px 8px; font-size: 12px;">View Details</button>
                    </td>
                </tr>
            `).join('');
            
            this.updateTransactionPagination(result.totalPages || 1, result.currentPage || 1);
        } catch (error) {
            console.error('Error loading transactions:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #ef4444;">Failed to load transactions</td></tr>';
        }
    }
    
    updateTransactionPagination(totalPages = 1, currentPage = 1) {
        const pageInfo = document.getElementById('transactionPageInfo');
        const prevBtn = document.getElementById('prevTransactionPage');
        const nextBtn = document.getElementById('nextTransactionPage');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
            prevBtn.onclick = () => {
                if (this.transactionPage > 1) {
                    this.transactionPage--;
                    this.loadTransactions();
                }
            };
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
            nextBtn.onclick = () => {
                if (this.transactionPage < totalPages) {
                    this.transactionPage++;
                    this.loadTransactions();
                }
            };
        }
    }
    
    viewTransaction(id) {
        this.showMessage(`Viewing transaction #${id}`, 'info');
        // TODO: Open modal with transaction details
    }
    
    async loadCategoriesSection() {
        // This section has been replaced by transactions
        console.log('Categories section deprecated');
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
        
        // Empty notifications for now
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">No notifications</div>';
        
        // Hide badge
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.style.display = 'none';
        }
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
        
        // Reset user modal when closing
        this.resetUserModal();
    }
    
    handleAddItem() {
        // This will be implemented when connecting to database
        this.showMessage('Add item functionality will be connected to database', 'info');
        this.closeModals();
    }
    
    async handleAddUser() {
        const name = document.getElementById('newUserName')?.value;
        const email = document.getElementById('newUserEmail')?.value;
        const role = document.getElementById('newUserRole')?.value;
        const password = document.getElementById('newUserPassword')?.value;
        
        // Check if we're editing or creating
        const isEditing = this.editingUserId !== null && this.editingUserId !== undefined;
        
        if (!name || !email) {
            this.showMessage('Please fill in name and email', 'error');
            return;
        }
        
        if (!isEditing && !password) {
            this.showMessage('Password is required for new users', 'error');
            return;
        }
        
        try {
            const userData = {
                name,
                email,
                role: role || 'user'
            };
            
            if (!isEditing) {
                // Generate username from email for new users
                userData.username = email.split('@')[0] + Math.floor(Math.random() * 1000);
                userData.password = password;
            } else if (password) {
                // Only include password if provided during edit
                userData.password = password;
            }
            
            const url = isEditing ? `${this.apiUrl}/users/${this.editingUserId}` : `${this.apiUrl}/users`;
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} user`);
            }
            
            this.showMessage(`User ${isEditing ? 'updated' : 'created'} successfully`, 'success');
            this.closeModals();
            this.resetUserModal();
            
            // Reload users if on users page
            if (this.currentSection === 'users') {
                this.loadUsers();
            }
        } catch (error) {
            console.error('Error saving user:', error);
            this.showMessage(error.message || 'Failed to save user', 'error');
        }
    }
    
    resetUserModal() {
        this.editingUserId = null;
        document.getElementById('addUserForm')?.reset();
        const passwordField = document.getElementById('newUserPassword');
        if (passwordField) passwordField.placeholder = 'Enter password';
        
        const modalTitle = document.querySelector('#addUserModal .modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Add New User';
        
        const submitBtn = document.querySelector('#addUserForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Add User';
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
    
    updatePagination(totalPages = 1, currentPage = 1) {
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
    }
    
    handleSearch(query) {
        // Search logic will be implemented with database connection
        console.log('Searching for:', query);
    }
    
    async deleteItem(id) {
        if (!confirm('Are you sure you want to remove this item?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/products/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete item');
            }
            
            this.showMessage('Item removed successfully', 'success');
            this.loadItems(); // Reload the items list
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showMessage('Failed to remove item', 'error');
        }
    }
    
    async deleteSelectedItems() {
        const checkboxes = document.querySelectorAll('.item-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
        
        if (selectedIds.length === 0) {
            this.showMessage('Please select at least one item to delete', 'warning');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} item(s)? This action cannot be undone.`)) {
            return;
        }
        
        try {
            let successCount = 0;
            let failCount = 0;
            
            // Delete each selected item
            for (const id of selectedIds) {
                try {
                    const response = await fetch(`${this.apiUrl}/products/${id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    failCount++;
                    console.error(`Failed to delete item ${id}:`, error);
                }
            }
            
            // Show result message
            if (successCount > 0) {
                this.showMessage(`Successfully deleted ${successCount} item(s)`, 'success');
            }
            if (failCount > 0) {
                this.showMessage(`Failed to delete ${failCount} item(s)`, 'error');
            }
            
            // Uncheck the select all checkbox
            const selectAllCheckbox = document.getElementById('selectAllItems');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
            
            // Reload the items list
            this.loadItems();
        } catch (error) {
            console.error('Error in bulk delete:', error);
            this.showMessage('An error occurred during deletion', 'error');
        }
    }
    
    editUser(id) {
        const user = this.data.users.find(u => u.id === id);
        if (!user) return;
        
        // Populate the edit form
        document.getElementById('newUserName').value = user.name || '';
        document.getElementById('newUserEmail').value = user.email || '';
        document.getElementById('newUserRole').value = user.role || 'user';
        document.getElementById('newUserPassword').value = '';
        document.getElementById('newUserPassword').placeholder = 'Leave blank to keep current password';
        
        // Store the user ID for update
        this.editingUserId = id;
        
        // Change modal title and button text
        const modalTitle = document.querySelector('#addUserModal .modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Edit User';
        
        const submitBtn = document.querySelector('#addUserForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update User';
        
        this.openModal('addUserModal');
    }
    
    async deleteUser(id) {
        const user = this.data.users.find(u => u.id === id);
        if (!user) return;
        
        if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete user');
            }
            
            this.showMessage('User deleted successfully', 'success');
            this.loadUsers(); // Reload the users list
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showMessage(error.message || 'Failed to delete user', 'error');
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch(`${this.apiUrl}/categories`, {
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to load categories');
            }
            
            this.data.categories = result.data || [];
            this.renderCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showMessage(error.message || 'Failed to load categories', 'error');
        }
    }
    
    renderCategories() {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;
        
        if (this.data.categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No categories found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.data.categories.map(category => `
            <tr>
                <td><strong>${category.name}</strong></td>
                <td>${category.product_count || 0}</td>
                <td>${category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="btn-danger btn-sm" onclick="adminDashboard.deleteCategory(${category.id})"
                        ${category.product_count > 0 ? 'disabled title="Cannot delete category in use"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    async handleAddCategory(e) {
        e.preventDefault();
        
        try {
            const name = document.getElementById('newCategoryName').value.trim();
            
            if (!name) {
                throw new Error('Category name is required');
            }
            
            const categoryData = { name };
            
            const response = await fetch(`${this.apiUrl}/categories`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoryData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create category');
            }
            
            this.showMessage('Category created successfully', 'success');
            this.closeModals();
            document.getElementById('addCategoryForm').reset();
            
            // Reload categories if on categories page
            if (this.currentSection === 'categories') {
                this.loadCategories();
            }
        } catch (error) {
            console.error('Error creating category:', error);
            this.showMessage(error.message || 'Failed to create category', 'error');
        }
    }
    
    async deleteCategory(id) {
        const category = this.data.categories.find(c => c.id === id);
        if (!category) return;
        
        if (!confirm(`Are you sure you want to delete category "${category.name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/categories/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete category');
            }
            
            this.showMessage('Category deleted successfully', 'success');
            this.loadCategories(); // Reload the categories list
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showMessage(error.message || 'Failed to delete category', 'error');
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
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Call logout API
                const response = await fetch('http://localhost/api/routes/auth.php?action=logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Clear session cookie
                document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                
                // Redirect to login page
                window.location.href = 'http://localhost/public/pages/login.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Error logging out. Please try again.');
            }
        });
    }
    
    // Setup back to site button
    const backToSiteBtn = document.querySelector('.back-to-site');
    if (backToSiteBtn) {
        backToSiteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'http://localhost/public/pages/index.html';
        });
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}
