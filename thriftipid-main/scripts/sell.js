// Sell page functionality
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupCharCounters();
});

// Setup event listeners
function setupEventListeners() {
    const imageInput = document.getElementById('imageInput');
    const uploadArea = document.getElementById('uploadArea');
    const sellForm = document.getElementById('sellForm');
    
    // Image upload
    if (uploadArea && imageInput) {
        uploadArea.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageUpload);
    }
    
    // Form submission
    if (sellForm) {
        sellForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Character counters
    const titleInput = document.getElementById('itemTitle');
    const descInput = document.getElementById('itemDescription');
    
    if (titleInput) {
        titleInput.addEventListener('input', () => updateCharCount('titleCharCount', titleInput));
    }
    if (descInput) {
        descInput.addEventListener('input', () => updateCharCount('descCharCount', descInput));
    }
}

// Setup character counters
function setupCharCounters() {
    const titleInput = document.getElementById('itemTitle');
    const descInput = document.getElementById('itemDescription');
    
    if (titleInput) {
        updateCharCount('titleCharCount', titleInput);
    }
    if (descInput) {
        updateCharCount('descCharCount', descInput);
    }
}

// Update character count
function updateCharCount(countId, input) {
    const countElement = document.getElementById(countId);
    if (countElement) {
        countElement.textContent = input.value.length;
    }
}

// Store uploaded files for form submission
let uploadedFiles = [];

// Handle image upload
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const uploadedImages = document.getElementById('uploadedImages');
    
    if (!uploadedImages) return;
    
    // Limit to 10 images
    const currentCount = uploadedImages.querySelectorAll('.uploaded-image').length;
    if (currentCount + files.length > 10) {
        customAlert('You can upload a maximum of 10 images.', 'Upload Limit');
        files.splice(10 - currentCount);
        return;
    }
    
    files.forEach((file) => {
        if (file.type.startsWith('image/')) {
            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                customAlert(`File "${file.name}" is too large. Maximum size is 5MB.`, 'File Too Large');
                return;
            }
            
            // Store the file object
            uploadedFiles.push(file);
            const fileIndex = uploadedFiles.length - 1;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'uploaded-image';
                imageContainer.dataset.fileIndex = fileIndex;
                imageContainer.innerHTML = `
                    <img src="${e.target.result}" alt="Uploaded image">
                    <button type="button" class="remove-image" onclick="removeImage(this)">×</button>
                `;
                uploadedImages.appendChild(imageContainer);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
}

// Remove uploaded image
function removeImage(button) {
    if (button && button.parentElement) {
        const imageContainer = button.parentElement;
        const fileIndex = parseInt(imageContainer.dataset.fileIndex);
        
        // Remove from uploadedFiles array
        if (!isNaN(fileIndex) && uploadedFiles[fileIndex]) {
            uploadedFiles.splice(fileIndex, 1);
        }
        
        // Remove the container
        imageContainer.remove();
        
        // Rebuild indices for all remaining containers
        const allContainers = document.querySelectorAll('#uploadedImages .uploaded-image');
        allContainers.forEach((container, idx) => {
            container.dataset.fileIndex = idx;
        });
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    
    // Disable submit button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Listing Item...';
    }
    
    // Get form values
    const title = document.getElementById('itemTitle').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    const category = document.getElementById('itemCategory').value;
    const condition = document.getElementById('itemCondition').value;
    const price = document.getElementById('itemPrice').value;
    const location = document.getElementById('itemLocation').value.trim();
    
    // Validation
    if (!title || !description || !category || !condition || !price || !location) {
        await customAlert('Please fill in all required fields.', 'Validation Error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
        return;
    }
    
    if (uploadedFiles.length === 0) {
        await customAlert('Please upload at least one photo of your item.', 'Photo Required');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
        return;
    }
    
    // Create FormData for API submission
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('condition', condition);
    formData.append('price', price);
    formData.append('location', location);
    
    // Append images as files
    uploadedFiles.forEach((file) => {
        formData.append('images[]', file);
    });
    
    try {
        // Submit to API
        const response = await fetch('api/add_product.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const data = await response.json();
        
        console.log('API Response:', data); // Debug log
        
        if (data.success && data.product_id) {
            // Success - redirect to product page immediately
            console.log('Redirecting to product:', data.product_id); // Debug log
            window.location.replace(`product.html?id=${data.product_id}`);
        } else {
            // Error from API
            await customAlert(data.error || 'Failed to list item. Please try again.', 'Error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        await customAlert('Network error. Please check your connection and try again.', 'Network Error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}


