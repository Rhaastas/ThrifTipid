// Admin Role Checker - Shows admin dashboard button if user is admin
(function() {
    async function checkAdminRole() {
        try {
            // Check if user is logged in first
            const sessionToken = document.cookie.split('; ').find(row => row.startsWith('session_token='));
            if (!sessionToken) {
                return; // Not logged in
            }

            // Fetch user profile to get role
            const response = await fetch('/api/get_profile.php', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                return; // Failed to get profile
            }

            const data = await response.json();
            
            // Check if user has admin role
            if (data.user && data.user.role === 'admin') {
                const adminBtn = document.getElementById('adminDashboardBtn');
                if (adminBtn) {
                    adminBtn.style.setProperty('display', 'flex', 'important');
                }
                
                // Hide profile button for admin users - run multiple times to ensure it sticks
                function hideProfileButton() {
                    const profileBtn = document.querySelector('.action-btn.profile');
                    if (profileBtn) {
                        profileBtn.style.setProperty('display', 'none', 'important');
                        profileBtn.setAttribute('data-admin-hidden', 'true');
                    }
                }
                
                hideProfileButton();
                // Run again after a short delay to override any late-running scripts
                setTimeout(hideProfileButton, 500);
                setTimeout(hideProfileButton, 1500);
            }
        } catch (error) {
            console.error('Admin role check error:', error);
        }
    }

    // Run on page load with multiple attempts
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkAdminRole();
            setTimeout(checkAdminRole, 800);
        });
    } else {
        checkAdminRole();
        setTimeout(checkAdminRole, 800);
    }
})();
