// Global Notification System
// Works across all pages with dropdown functionality

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.dropdownOpen = false;
        this.init();
    }

    init() {
        // Check if bell button exists (user might not be logged in)
        const bellBtn = document.querySelector('.notification-bell-btn');
        if (!bellBtn) {
            console.log('Notification bell button not found - user may not be logged in');
            return;
        }
        
        // Create notification dropdown structure
        this.createDropdownHTML();
        // Attach event listeners
        this.attachEventListeners();
        // Load notifications
        this.loadNotifications();
        // Poll for new notifications every 30 seconds
        setInterval(() => this.loadNotifications(), 30000);
    }

    createDropdownHTML() {
        const bellBtn = document.querySelector('.notification-bell-btn');
        if (!bellBtn) return;

        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.id = 'notificationDropdown';
        dropdown.innerHTML = `
            <div class="notification-dropdown-header">
                <h3>Notifications</h3>
                <button class="mark-all-read-btn" onclick="notificationSystem.markAllAsRead()">Mark all as read</button>
            </div>
            <div class="notification-dropdown-body" id="notificationDropdownBody">
                <div class="notification-loading">Loading...</div>
            </div>
            <div class="notification-dropdown-footer">
                <a href="/public/pages/profile.html?tab=notifications">View All</a>
            </div>
        `;
        
        bellBtn.parentElement.style.position = 'relative';
        bellBtn.parentElement.appendChild(dropdown);
    }

    attachEventListeners() {
        const bellBtn = document.querySelector('.notification-bell-btn');
        if (!bellBtn) return;

        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications/get_notifications.php', {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // User not logged in, clear notifications
                    this.notifications = [];
                    this.updateBadge(0);
                    return;
                }
                throw new Error('Failed to load notifications');
            }

            const data = await response.json();
            if (data.success && data.data && data.data.notifications) {
                this.notifications = data.data.notifications;
                this.unreadCount = this.notifications.filter(n => !n.is_read).length;
                this.updateBadge(this.unreadCount);
                if (this.dropdownOpen) {
                    this.renderNotifications();
                }
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    updateBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) return;

        if (this.dropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) return;

        dropdown.classList.add('active');
        this.dropdownOpen = true;
        this.renderNotifications();
    }

    closeDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) return;

        dropdown.classList.remove('active');
        this.dropdownOpen = false;
    }

    renderNotifications() {
        const body = document.getElementById('notificationDropdownBody');
        if (!body) return;

        if (this.notifications.length === 0) {
            body.innerHTML = `
                <div class="notification-empty">
                    <div class="empty-icon">🔔</div>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        // Show only last 10 notifications in dropdown
        const recentNotifications = this.notifications.slice(0, 10);
        
        body.innerHTML = recentNotifications.map(notif => `
            <div class="notification-item ${notif.is_read ? 'read' : 'unread'}" 
                 onclick="notificationSystem.markAsRead(${notif.id})">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notif.message)}
                </div>
                <div class="notification-content">
                    <p>${this.escapeHtml(notif.message)}</p>
                    <span class="notification-time">${this.formatTime(notif.created_at)}</span>
                </div>
                ${!notif.is_read ? '<div class="unread-dot"></div>' : ''}
            </div>
        `).join('');
    }

    getNotificationIcon(message) {
        if (message.includes('offer')) return '💰';
        if (message.includes('purchase') || message.includes('bought')) return '🛍️';
        if (message.includes('bid')) return '🎯';
        if (message.includes('message')) return '💬';
        return '🔔';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch('/api/notifications/mark_read.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ notification_id: notificationId })
            });

            if (response.ok) {
                // Update local state
                const notif = this.notifications.find(n => n.id === notificationId);
                if (notif) {
                    notif.is_read = true;
                    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
                    this.updateBadge(this.unreadCount);
                    this.renderNotifications();
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        const unreadIds = this.notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        for (const id of unreadIds) {
            await this.markAsRead(id);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize notification system when DOM is ready
let notificationSystem;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize if not already done
        if (!notificationSystem) {
            notificationSystem = new NotificationSystem();
        }
    });
} else {
    // Only initialize if not already done
    if (!notificationSystem) {
        notificationSystem = new NotificationSystem();
    }
}
