// Simple client-side auth utility based on presence of session_token cookie
// Exposes: window.auth.isLoggedIn(), requireAuthRedirect(url), and toggles [data-auth-visible]

(function () {
	function getCookie(name) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop().split(';').shift();
		return undefined;
	}

	function isLoggedIn() {
		const token = getCookie('session_token');
		// Debug log (remove in production)
		// console.log('Auth check - cookie found:', Boolean(token), 'cookie value:', token ? token.substring(0, 10) + '...' : 'none');
		return Boolean(token);
	}

	function updateAuthVisibility() {
		const loggedIn = isLoggedIn();
		console.log('Auth visibility update - loggedIn:', loggedIn); // Debug
		console.log('Cookie value:', document.cookie); // Debug
		
		document.querySelectorAll('[data-auth-visible]')
			.forEach(function (el) {
				var mode = el.getAttribute('data-auth-visible');
				var shouldShow = (mode === 'logged-in') ? loggedIn : !loggedIn;
				
				if (shouldShow) {
					// Determine the correct display value based on element type
					var displayValue = '';
					if (el.tagName === 'A' || el.tagName === 'BUTTON') {
						displayValue = 'flex'; // For action buttons that use flexbox
					} else {
						displayValue = 'block'; // Default for other elements
					}
					el.style.setProperty('display', displayValue, 'important');
					console.log('Showing element:', el.className || el.tagName, 'mode:', mode, 'display:', displayValue); // Debug
				} else {
					el.style.setProperty('display', 'none', 'important');
					console.log('Hiding element:', el.className || el.tagName, 'mode:', mode); // Debug
				}
			});
	}

	function requireAuthRedirect(targetUrl) {
		if (!isLoggedIn()) {
			window.location.href = 'login.html?next=' + encodeURIComponent(targetUrl || window.location.pathname + window.location.search);
			return false;
		}
		return true;
	}

	// Bind helpers
	window.auth = {
		isLoggedIn: isLoggedIn,
		requireAuthRedirect: requireAuthRedirect,
		refresh: updateAuthVisibility
	};

	// Run immediately if DOM is already ready, otherwise wait for DOMContentLoaded
	if (document.readyState !== 'loading') {
		updateAuthVisibility();
	}

	function installGlobalClickGuard() {
		document.addEventListener('click', function (e) {
			var target = e.target;
			while (target && target !== document) {
				if (target.hasAttribute && target.hasAttribute('data-requires-auth')) {
					if (!isLoggedIn()) {
						e.preventDefault();
						requireAuthRedirect(window.location.pathname + window.location.search);
						return;
					}
					break;
				}
				target = target.parentNode;
			}
		});
	}

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function(){
			updateAuthVisibility();
			installGlobalClickGuard();
			// Update again after a delay to catch cookies set right before redirect
			setTimeout(updateAuthVisibility, 300);
			// Additional delay for slower cookie propagation
			setTimeout(updateAuthVisibility, 800);
		});
	} else {
		updateAuthVisibility();
		installGlobalClickGuard();
		// Update again after a delay to catch cookies set right before redirect
		setTimeout(updateAuthVisibility, 300);
		// Additional delay for slower cookie propagation
		setTimeout(updateAuthVisibility, 800);
	}
	
	// Also update when page becomes visible (e.g., tab switch or after navigation)
	document.addEventListener('visibilitychange', function() {
		if (!document.hidden) {
			setTimeout(updateAuthVisibility, 100);
		}
	});
	
	// Update on page load event (fires after all resources are loaded)
	window.addEventListener('load', function() {
		setTimeout(updateAuthVisibility, 200);
		setTimeout(updateAuthVisibility, 500);
	});
	
	// Update when page gains focus (e.g., when navigating back)
	window.addEventListener('focus', function() {
		setTimeout(updateAuthVisibility, 100);
	});
	
	// Update when page is shown (e.g., browser back button)
	window.addEventListener('pageshow', function(event) {
		// event.persisted is true when page is loaded from cache (back button)
		if (event.persisted) {
			setTimeout(updateAuthVisibility, 100);
		}
	});
})();


