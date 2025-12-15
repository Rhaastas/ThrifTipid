// Chat System - Facebook-style messaging
class ChatSystem {
    constructor() {
        this.activeChats = new Map(); // conversationId -> window element
        this.conversations = [];
        this.currentUserId = null;
        this.pollingInterval = null;
        this.init();
    }

    async init() {
        // Create chat container
        this.createChatContainer();
        this.createChatListModal();
        
        // Get current user - MUST complete before anything else
        await this.getCurrentUser();
        
        console.log('Chat system initialized with user ID:', this.currentUserId);
        
        // Start polling for new messages
        this.startPolling();
    }

    async getCurrentUser() {
        try {
            const response = await fetch('/api/get_profile.php', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.error('Failed to fetch profile, status:', response.status);
                return;
            }
            
            const data = await response.json();
            console.log('Profile API response:', data);
            
            // Check different possible structures
            if (data.data?.user?.id) {
                this.currentUserId = parseInt(data.data.user.id);
            } else if (data.user?.id) {
                this.currentUserId = parseInt(data.user.id);
            } else if (data.id) {
                this.currentUserId = parseInt(data.id);
            }
            
            console.log('Chat System - Current User ID set to:', this.currentUserId);
        } catch (error) {
            console.error('Failed to get current user:', error);
        }
    }

    createChatContainer() {
        const container = document.createElement('div');
        container.className = 'chat-container';
        container.id = 'chatContainer';
        document.body.appendChild(container);
    }

    createChatListModal() {
        const modal = document.createElement('div');
        modal.className = 'chat-list-modal';
        modal.id = 'chatListModal';
        modal.innerHTML = `
            <div class="chat-list-header">
                <h3>Messages</h3>
                <button class="chat-list-close" onclick="chatSystem.closeChatList()">×</button>
            </div>
            <div class="chat-list-body" id="chatListBody">
                <div class="chat-list-empty">No conversations yet</div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    toggleChatList() {
        const modal = document.getElementById('chatListModal');
        modal.classList.toggle('active');
        
        if (modal.classList.contains('active')) {
            this.loadConversations();
        }
    }

    closeChatList() {
        document.getElementById('chatListModal').classList.remove('active');
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/messages/list_conversations.php', {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to load conversations');
            
            const data = await response.json();
            this.conversations = data.data?.conversations || [];
            this.renderConversationList();
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    renderConversationList() {
        const listBody = document.getElementById('chatListBody');
        
        if (this.conversations.length === 0) {
            listBody.innerHTML = '<div class="chat-list-empty">No conversations yet</div>';
            return;
        }

        listBody.innerHTML = this.conversations.map(conv => {
            const initial = conv.other_user_name ? conv.other_user_name[0].toUpperCase() : '?';
            const timeAgo = this.formatTimeAgo(conv.last_message_time);
            
            return `
                <button class="chat-list-item ${conv.unread_count > 0 ? 'unread' : ''}" 
                        onclick="chatSystem.openChat(${conv.other_user_id}, '${conv.other_user_name}')">
                    <div class="chat-list-avatar">${initial}</div>
                    <div class="chat-list-info">
                        <div class="chat-list-name">${conv.other_user_name || 'User'}</div>
                        <div class="chat-list-preview">${conv.last_message || 'No messages yet'}</div>
                    </div>
                    <div class="chat-list-time">${timeAgo}</div>
                </button>
            `;
        }).join('');
    }

    async openChat(recipientId, recipientName) {
        this.closeChatList();
        
        // Make sure we have current user ID
        if (!this.currentUserId || isNaN(this.currentUserId)) {
            console.warn('Current user ID not set, fetching...');
            await this.getCurrentUser();
        }
        
        const conversationId = this.createConversationId(this.currentUserId, recipientId);
        
        console.log(`Opening chat: recipientId=${recipientId}, currentUserId=${this.currentUserId}, conversationId=${conversationId}`);
        
        // Check if chat is already open
        if (this.activeChats.has(conversationId)) {
            const existingChat = this.activeChats.get(conversationId);
            existingChat.classList.remove('minimized');
            return;
        }

        // Create new chat window
        const chatWindow = this.createChatWindow(conversationId, recipientId, recipientName);
        this.activeChats.set(conversationId, chatWindow);
        
        // Load messages
        this.loadMessages(conversationId, recipientId);
    }

    createConversationId(userA, userB) {
        const min = Math.min(userA, userB);
        const max = Math.max(userA, userB);
        return `${min}_${max}`;
    }

    createChatWindow(conversationId, recipientId, recipientName) {
        const container = document.getElementById('chatContainer');
        const initial = recipientName ? recipientName[0].toUpperCase() : '?';
        
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.setAttribute('data-conversation', conversationId);
        chatWindow.innerHTML = `
            <div class="chat-header" onclick="chatSystem.toggleMinimize('${conversationId}')">
                <div class="chat-header-info">
                    <div class="chat-avatar">${initial}</div>
                    <div class="chat-user-name">${recipientName || 'User'}</div>
                </div>
                <div class="chat-header-actions">
                    <button class="chat-header-btn" onclick="event.stopPropagation(); chatSystem.closeChat('${conversationId}')" title="Close">×</button>
                </div>
            </div>
            <div class="chat-messages" id="messages-${conversationId}">
                <div class="messages-empty">Loading messages...</div>
            </div>
            <div class="chat-input-area">
                <textarea class="chat-input" 
                          id="input-${conversationId}" 
                          placeholder="Type a message..."
                          rows="1"
                          onkeypress="chatSystem.handleKeyPress(event, '${conversationId}', ${recipientId})"></textarea>
                <button class="chat-send-btn" onclick="chatSystem.sendMessage('${conversationId}', ${recipientId})">
                    <span>➤</span>
                </button>
            </div>
        `;
        
        container.appendChild(chatWindow);
        return chatWindow;
    }

    toggleMinimize(conversationId) {
        const chatWindow = this.activeChats.get(conversationId);
        if (chatWindow) {
            chatWindow.classList.toggle('minimized');
        }
    }

    closeChat(conversationId) {
        const chatWindow = this.activeChats.get(conversationId);
        if (chatWindow) {
            chatWindow.remove();
            this.activeChats.delete(conversationId);
        }
    }

    async loadMessages(conversationId, recipientId) {
        try {
            const response = await fetch(`/api/messages/conversation.php?with=${recipientId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to load messages');
            
            const data = await response.json();
            const messages = data.data?.messages || [];
            
            this.renderMessages(conversationId, messages.reverse());
        } catch (error) {
            console.error('Error loading messages:', error);
            const messagesDiv = document.getElementById(`messages-${conversationId}`);
            if (messagesDiv) {
                messagesDiv.innerHTML = '<div class="messages-empty">Failed to load messages</div>';
            }
        }
    }

    renderMessages(conversationId, messages) {
        const messagesDiv = document.getElementById(`messages-${conversationId}`);
        if (!messagesDiv) return;

        if (messages.length === 0) {
            messagesDiv.innerHTML = '<div class="messages-empty">No messages yet. Say hi! 👋</div>';
            return;
        }

        console.log('Rendering messages. Current user:', this.currentUserId);
        
        messagesDiv.innerHTML = messages.map(msg => {
            const senderId = parseInt(msg.sender_id);
            const isOutgoing = senderId === this.currentUserId;
            const time = this.formatMessageTime(msg.created_at);
            const bubbleClass = isOutgoing ? 'message-outgoing' : 'message-incoming';
            
            console.log(`Message from ${senderId}, current user ${this.currentUserId}, outgoing: ${isOutgoing}`);
            
            return `
                <div class="message-bubble ${bubbleClass}">
                    ${this.escapeHtml(msg.body)}
                    <div class="message-time">${time}</div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    handleKeyPress(event, conversationId, recipientId) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage(conversationId, recipientId);
        }
    }

    async sendMessage(conversationId, recipientId) {
        const input = document.getElementById(`input-${conversationId}`);
        if (!input) return;

        const message = input.value.trim();
        if (!message) return;

        try {
            const response = await fetch('/api/messages/send.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    to: recipientId,
                    body: message
                })
            });

            if (!response.ok) throw new Error('Failed to send message');

            input.value = '';
            input.style.height = 'auto';
            
            // Reload messages
            this.loadMessages(conversationId, recipientId);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    startPolling() {
        // Poll every 5 seconds for new messages
        this.pollingInterval = setInterval(() => {
            this.activeChats.forEach((window, conversationId) => {
                const recipientId = this.getRecipientIdFromConversation(conversationId);
                if (recipientId) {
                    this.loadMessages(conversationId, recipientId);
                }
            });
        }, 5000);
    }

    getRecipientIdFromConversation(conversationId) {
        const [user1, user2] = conversationId.split('_').map(Number);
        return user1 === this.currentUserId ? user2 : user1;
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000); // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        
        return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    formatMessageTime(timestamp) {
        const time = new Date(timestamp);
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chat system globally
window.chatSystem = null;

// Initialize immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatSystem);
} else {
    // DOM already loaded
    initChatSystem();
}

function initChatSystem() {
    window.chatSystem = new ChatSystem();
}
