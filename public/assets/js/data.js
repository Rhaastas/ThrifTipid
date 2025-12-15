// Shared data for items across all pages
const sampleItems = [
    {
        id: 1,
        title: "iPhone 13 Pro Max 256GB",
        price: 899,
        originalPrice: 1099,
        condition: "Like New",
        location: "Manila, Philippines",
        time: "2 hours ago",
        dateListed: "2024-01-15",
        category: "electronics",
        availability: "available",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=200&fit=crop"
        ],
        description: "Excellent condition iPhone 13 Pro Max with original box and accessories. Battery health 98%. No scratches or dents.",
        seller: {
            name: "Steven Suarez",
            avatar: "placeholder",
            rating: 4.8,
            reviews: 127,
            activeListings: 12,
            soldListings: 45
        },
        likes: 23,
        badge: "new"
    },
    {
        id: 2,
        title: "Nike Air Jordan 1 Retro",
        price: 120,
        originalPrice: 160,
        condition: "Good",
        location: "Quezon City, Philippines",
        time: "5 hours ago",
        dateListed: "2024-01-15",
        category: "fashion",
        availability: "pending",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop"
        ],
        description: "Classic Air Jordan 1 in excellent condition. Size 9.5. Worn a few times, very clean.",
        seller: {
            name: "James Dimino",
            avatar: "placeholder",
            rating: 4.6,
            reviews: 89,
            activeListings: 8,
            soldListings: 32
        },
        likes: 45,
        badge: "hot"
    },
    {
        id: 3,
        title: "MacBook Pro 13-inch M1",
        price: 1299,
        originalPrice: 1499,
        condition: "Like New",
        location: "Makati, Philippines",
        time: "1 day ago",
        dateListed: "2024-01-14",
        category: "electronics",
        availability: "available",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop"
        ],
        description: "MacBook Pro 13-inch with M1 chip, 8GB RAM, 256GB SSD. Perfect for work and creative projects.",
        seller: {
            name: "Zhak Carreon",
            avatar: "placeholder",
            rating: 4.9,
            reviews: 203,
            activeListings: 15,
            soldListings: 67
        },
        likes: 67,
        badge: "new"
    },
    {
        id: 4,
        title: "Vintage Leather Jacket",
        price: 85,
        originalPrice: 120,
        condition: "Good",
        location: "Cebu City, Philippines",
        time: "2 days ago",
        dateListed: "2024-01-13",
        category: "fashion",
        availability: "available",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=200&fit=crop"
        ],
        description: "Authentic vintage leather jacket from the 80s. Size M. Great condition with character.",
        seller: {
            name: "Christian Camba",
            avatar: "placeholder",
            rating: 4.7,
            reviews: 156,
            activeListings: 10,
            soldListings: 54
        },
        likes: 34,
        badge: null
    },
    {
        id: 5,
        title: "Gaming Chair Ergonomic",
        price: 150,
        originalPrice: 200,
        condition: "Like New",
        location: "Davao City, Philippines",
        time: "3 days ago",
        dateListed: "2024-01-12",
        category: "home",
        availability: "sold",
        image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop"
        ],
        description: "High-quality ergonomic gaming chair with lumbar support. Perfect for long gaming sessions or work from home.",
        seller: {
            name: "Makaveli Manaois",
            avatar: "placeholder",
            rating: 4.5,
            reviews: 78,
            activeListings: 6,
            soldListings: 23
        },
        likes: 28,
        badge: null
    },
    {
        id: 6,
        title: "Canon EOS R5 Camera",
        price: 2899,
        originalPrice: 3299,
        condition: "New",
        location: "Taguig, Philippines",
        time: "4 days ago",
        dateListed: "2024-01-11",
        category: "electronics",
        availability: "available",
        image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop"
        ],
        description: "Professional mirrorless camera with 45MP sensor. Includes 24-70mm lens. Perfect for professional photography.",
        seller: {
            name: "Pat Verzosa",
            avatar: "placeholder",
            rating: 4.9,
            reviews: 234,
            activeListings: 20,
            soldListings: 89
        },
        likes: 89,
        badge: "hot"
    }
];

// Categories data
const categories = [
    { id: 'electronics', name: 'Electronics', icon: '📱', count: 45 },
    { id: 'fashion', name: 'Fashion', icon: '👗', count: 128 },
    { id: 'home', name: 'Home & Garden', icon: '🪑', count: 92 },
    { id: 'sports', name: 'Sports', icon: '⚽', count: 67 },
    { id: 'books', name: 'Books', icon: '📚', count: 34 },
    { id: 'automotive', name: 'Automotive', icon: '🚗', count: 56 }
];

