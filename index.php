<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ThrifTipid - Buy, Sell, Trade in Your Community</title>
    <link rel="stylesheet" href="/public/assets/css/main.css">
    <link rel="stylesheet" href="/public/assets/css/home.css">
    <link rel="stylesheet" href="/public/assets/css/icons.css">
</head>
<body>
    <!-- Redirect to pages/index.html -->
    <script>
        // Check if logged in via API
        async function checkAuth() {
            try {
                const response = await fetch('/api/routes/auth.php?action=profile', {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    // User is logged in, show home
                    window.location.href = '/public/pages/index.html';
                } else {
                    // Not logged in, show login
                    window.location.href = '/public/pages/login.html';
                }
            } catch (error) {
                // Default to home page
                window.location.href = '/public/pages/index.html';
            }
        }
        
        checkAuth();
    </script>
    <p>Loading...</p>
</body>
</html>
