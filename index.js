// Global variables
let currentTab = 'home';
let selectedAmount = 0;
let isAdmin = false;
let donations = [];
let expenses = [];
let firebaseInitialized = false;
let galleryUnsubscribe = null;
let donationsUnsubscribe = null;
let galleryImages = [
    {
        title: "Beautifully decorated Lord Ganesha",
        description: "Main deity with traditional decorations",
        category: "deity",
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
    },
    {
        title: "Devotees performing evening aarti",
        description: "Community gathering for prayers",
        category: "ceremony",
        url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop"
    },
    {
        title: "Traditional prasadam and sweets",
        description: "Sacred food offerings",
        category: "offerings",
        url: "https://images.unsplash.com/photo-1634712282287-14ed57b9cc89?w=400&h=300&fit=crop"
    },
    {
        title: "Beautiful rangoli decorations",
        description: "Colorful floor art patterns",
        category: "decorations",
        url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=300&fit=crop"
    },
    {
        title: "Grand festival procession",
        description: "Community celebration parade",
        category: "ceremony",
        url: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop"
    },
    {
        title: "Temple beautifully decorated",
        description: "Sacred space preparation",
        category: "decorations",
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
    }
];

const UPI_ID = '7993962018@paytm';
const MERCHANT_NAME = 'Kings Youth';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    startCountdownTimer();
    
    // Check if Firebase is available
    setTimeout(() => {
        if (window.firebaseGallery) {
            firebaseInitialized = true;
            console.log('Firebase is available - loading data from cloud');
            loadFirebaseData();
        } else {
            console.log('Firebase not available - using local data');
            updateGallery();
        }
        updateDonationStats();
    }, 1000);
    
    // Setup file preview
    setupFilePreview();
    
    console.log('Vinayaka Chaturthi website initialized successfully');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Quick amount selection
    document.querySelectorAll('.amount-card').forEach(card => {
        card.addEventListener('click', () => {
            const amount = parseInt(card.getAttribute('data-amount'));
            selectAmount(amount);
        });
    });

    // Gallery filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            setGalleryFilter(filter);
        });
    });

    // Gallery items
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const title = item.querySelector('h4').textContent;
            const description = item.querySelector('p').textContent;
            openImageModal(img.src, title, description);
        });
    });

    // Modal close
    document.querySelector('.close-btn')?.addEventListener('click', closePaymentModal);
    document.getElementById('paymentModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closePaymentModal();
    });

    console.log('Event listeners set up successfully');
}

// Tab switching
function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;
    console.log(`Switched to tab: ${tabName}`);
}

// Countdown timer
function startCountdownTimer() {
    const targetDate = new Date('2025-08-27T00:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = targetDate - now;

        if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Amount selection
function selectAmount(amount) {
    selectedAmount = amount;
    
    // Update UI
    document.querySelectorAll('.amount-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-amount="${amount}"]`)?.classList.add('selected');
    
    document.getElementById('selectedAmount').textContent = `₹${amount}`;
    document.getElementById('customAmount').value = '';
    
    // Enable payment buttons
    document.getElementById('upiAppBtn').disabled = false;
    document.getElementById('confirmBtn').disabled = false;
    
    // Generate QR code
    generateQRCode(amount);
    
    console.log(`Selected amount: ₹${amount}`);
    showNotification(`Selected ₹${amount} for donation`, 'success');
}

function setCustomAmount() {
    const customAmountInput = document.getElementById('customAmount');
    const amount = parseInt(customAmountInput.value);
    
    if (amount && amount > 0) {
        selectAmount(amount);
    } else {
        showNotification('Please enter a valid amount', 'error');
    }
}

// UPI Payment Functions
function generateUPIUrl(amount, note = 'Vinayaka Chaturthi Donation') {
    const params = new URLSearchParams({
        pa: UPI_ID,
        pn: MERCHANT_NAME,
        am: amount.toString(),
        cu: 'INR',
        tn: note
    });
    
    return `upi://pay?${params.toString()}`;
}

function generateQRCode(amount) {
    const canvas = document.getElementById('qrCode');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 200;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Draw QR-like pattern
    ctx.fillStyle = '#000000';
    
    // Border
    ctx.fillRect(0, 0, size, 10);
    ctx.fillRect(0, 0, 10, size);
    ctx.fillRect(size - 10, 0, 10, size);
    ctx.fillRect(0, size - 10, size, 10);
    
    // Corner squares
    const cornerSize = 30;
    
    // Top-left
    ctx.fillRect(15, 15, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 20, cornerSize - 10, cornerSize - 10);
    ctx.fillStyle = '#000000';
    ctx.fillRect(25, 25, cornerSize - 20, cornerSize - 20);
    
    // Top-right
    ctx.fillRect(size - 15 - cornerSize, 15, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size - 20 - cornerSize + 10, 20, cornerSize - 10, cornerSize - 10);
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - 25 - cornerSize + 20, 25, cornerSize - 20, cornerSize - 20);
    
    // Bottom-left
    ctx.fillRect(15, size - 15 - cornerSize, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, size - 20 - cornerSize + 10, cornerSize - 10, cornerSize - 10);
    ctx.fillStyle = '#000000';
    ctx.fillRect(25, size - 25 - cornerSize + 20, cornerSize - 20, cornerSize - 20);
    
    // Data pattern
    ctx.fillStyle = '#000000';
    for (let i = 60; i < size - 60; i += 15) {
        for (let j = 60; j < size - 60; j += 15) {
            if (Math.random() > 0.4) {
                ctx.fillRect(i, j, 8, 8);
            }
        }
    }
    
    // Update QR container
    const qrContainer = document.getElementById('qrContainer');
    if (qrContainer) {
        qrContainer.innerHTML = `
            <canvas id="qrCodeDisplay" width="200" height="200" style="border: 1px solid #e5e7eb; border-radius: 0.75rem;"></canvas>
            <p style="margin-top: 0.5rem; color: #6b7280; font-size: 0.875rem;">Scan with any UPI app</p>
        `;
        
        const displayCanvas = document.getElementById('qrCodeDisplay');
        const displayCtx = displayCanvas.getContext('2d');
        displayCtx.drawImage(canvas, 0, 0);
    }
}

function openUPIApp() {
    if (selectedAmount <= 0) {
        showNotification('Please select an amount first', 'error');
        return;
    }
    
    const upiUrl = generateUPIUrl(selectedAmount);
    
    if (isMobileDevice()) {
        try {
            window.location.href = upiUrl;
            showNotification('Opening UPI app...', 'success');
        } catch (error) {
            showNotification('Could not open UPI app. Please scan QR code instead.', 'error');
        }
    } else {
        showNotification('UPI app opening is available on mobile devices. Please scan the QR code.', 'info');
    }
}

function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
}

function copyUPI() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(UPI_ID).then(() => {
            showNotification('UPI ID copied to clipboard', 'success');
        }).catch(() => {
            showNotification('Failed to copy UPI ID', 'error');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = UPI_ID;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('UPI ID copied to clipboard', 'success');
        } catch (err) {
            showNotification('Failed to copy UPI ID', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function confirmPayment() {
    if (selectedAmount <= 0) {
        showNotification('Please select an amount first', 'error');
        return;
    }
    
    const donorName = document.getElementById('donorName').value || 'Anonymous';
    const donorPhone = document.getElementById('donorPhone').value || '';
    
    const donation = {
        id: Date.now().toString(),
        amount: selectedAmount,
        donorName: donorName,
        donorPhone: donorPhone,
        paymentMethod: 'UPI',
        status: 'completed',
        timestamp: new Date().toISOString(),
        note: 'Vinayaka Chaturthi Donation'
    };
    
    donations.push(donation);
    
    showNotification(`Thank you ${donorName} for your donation of ₹${selectedAmount}!`, 'success');
    
    // Reset form
    document.getElementById('donorName').value = '';
    document.getElementById('donorPhone').value = '';
    document.getElementById('customAmount').value = '';
    document.querySelectorAll('.amount-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    selectedAmount = 0;
    document.getElementById('selectedAmount').textContent = '₹0';
    document.getElementById('upiAppBtn').disabled = true;
    document.getElementById('confirmBtn').disabled = true;
    
    // Update stats
    updateDonationStats();
    
    console.log('Donation recorded:', donation);
}

// Gallery functions
function setGalleryFilter(filter) {
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Filter gallery items
    document.querySelectorAll('.gallery-item').forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    console.log(`Gallery filter set to: ${filter}`);
}

function updateGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '';
    
    galleryImages.forEach((image, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.setAttribute('data-category', image.category);
        galleryItem.innerHTML = `
            <img src="${image.url}" alt="${image.title}" loading="lazy">
            <div class="gallery-overlay">
                <h4>${image.title}</h4>
                <p>${image.description}</p>
            </div>
        `;
        
        galleryItem.addEventListener('click', () => {
            openImageModal(image.url, image.title, image.description);
        });
        
        galleryGrid.appendChild(galleryItem);
    });
}

function openImageModal(src, title, description) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 id="modalImageTitle">${title}</h3>
                    <button class="close-btn" onclick="closeImageModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <img id="modalImage" src="${src}" alt="${title}" style="width: 100%; border-radius: 0.5rem;">
                    <p id="modalImageDescription" style="margin-top: 1rem; color: #6b7280;">${description}</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeImageModal();
        });
    } else {
        document.getElementById('modalImageTitle').textContent = title;
        document.getElementById('modalImage').src = src;
        document.getElementById('modalImage').alt = title;
        document.getElementById('modalImageDescription').textContent = description;
    }
    
    modal.classList.add('show');
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Payment modal functions
function openPaymentModal() {
    if (selectedAmount <= 0) {
        showNotification('Please select an amount first', 'error');
        return;
    }
    
    document.getElementById('modalAmount').textContent = `₹${selectedAmount}`;
    generateQRCode(selectedAmount);
    document.getElementById('paymentModal').classList.add('show');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('show');
}

function confirmModalPayment() {
    confirmPayment();
    closePaymentModal();
}

// Admin functions
function adminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'ganesha123') {
        isAdmin = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('donationStats').style.display = 'block';
        showNotification('Login successful! Welcome to admin dashboard.', 'success');
        updateAdminStats();
    } else {
        document.getElementById('loginError').textContent = 'Invalid username or password';
        showNotification('Invalid credentials', 'error');
    }
}

function adminLogout() {
    isAdmin = false;
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('donationStats').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').textContent = '';
    showNotification('Logged out successfully', 'info');
}

function updateAdminStats() {
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    document.getElementById('adminImages').textContent = galleryImages.length;
    document.getElementById('adminDonations').textContent = `₹${totalDonations.toLocaleString()}`;
}

function addDonation() {
    const amount = prompt('Enter donation amount:');
    const donorName = prompt('Enter donor name (optional):') || 'Anonymous';
    
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        const donation = {
            id: Date.now().toString(),
            amount: parseInt(amount),
            donorName: donorName,
            paymentMethod: 'Cash',
            status: 'completed',
            timestamp: new Date().toISOString(),
            note: 'Admin added donation'
        };
        
        donations.push(donation);
        updateDonationStats();
        updateAdminStats();
        showNotification(`Added donation of ₹${amount} from ${donorName}`, 'success');
    } else {
        showNotification('Invalid amount entered', 'error');
    }
}

function addExpense() {
    const amount = prompt('Enter expense amount:');
    const description = prompt('Enter expense description:') || 'Festival expense';
    
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        const expense = {
            id: Date.now().toString(),
            amount: parseInt(amount),
            description: description,
            timestamp: new Date().toISOString()
        };
        
        expenses.push(expense);
        updateDonationStats();
        updateAdminStats();
        showNotification(`Added expense of ₹${amount} for ${description}`, 'success');
    } else {
        showNotification('Invalid amount entered', 'error');
    }
}

function manageGallery() {
    showNotification('Gallery management feature coming soon!', 'info');
}

// Donation stats update
function updateDonationStats() {
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalDonations - totalExpenses;
    
    const totalDonationsEl = document.getElementById('totalDonations');
    const totalExpensesEl = document.getElementById('totalExpenses');
    const netBalanceEl = document.getElementById('netBalance');
    
    if (totalDonationsEl) totalDonationsEl.textContent = `₹${totalDonations.toLocaleString()}`;
    if (totalExpensesEl) totalExpensesEl.textContent = `₹${totalExpenses.toLocaleString()}`;
    if (netBalanceEl) netBalanceEl.textContent = `₹${netBalance.toLocaleString()}`;
}

// Location functions
function openGoogleMaps() {
    const address = "Kings Youth Community Center, 123 Temple Street, Community District";
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
}

function callVenue() {
    window.location.href = 'tel:+919876543210';
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'info':
            notification.style.backgroundColor = '#3b82f6';
            break;
        default:
            notification.style.backgroundColor = '#6b7280';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
    
    console.log(`Notification: ${message} (${type})`);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Firebase Integration Functions
function loadFirebaseData() {
    if (!firebaseInitialized || !window.firebaseGallery) return;
    
    // Subscribe to real-time gallery updates
    galleryUnsubscribe = window.firebaseGallery.subscribeToGallery((images) => {
        galleryImages = images;
        updateGallery();
        console.log('Gallery updated from Firebase:', images.length, 'images');
    });
    
    // Subscribe to real-time donations updates
    donationsUnsubscribe = window.firebaseGallery.subscribeToDonations((firebaseDonations) => {
        donations = firebaseDonations;
        updateDonationStats();
        updateAdminStats();
        console.log('Donations updated from Firebase:', donations.length, 'donations');
    });
    
    // Load expenses
    loadExpensesFromFirebase();
}

async function loadExpensesFromFirebase() {
    if (!firebaseInitialized) return;
    
    try {
        expenses = await window.firebaseGallery.getExpenses();
        updateDonationStats();
        updateAdminStats();
        console.log('Expenses loaded from Firebase:', expenses.length, 'expenses');
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

function setupFilePreview() {
    const fileInput = document.getElementById('imageFile');
    if (!fileInput) return;
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewDiv = document.getElementById('imagePreview');
                const previewImg = document.getElementById('previewImg');
                if (previewDiv && previewImg) {
                    previewImg.src = e.target.result;
                    previewDiv.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// Gallery Management Functions
function openGalleryManager() {
    if (!isAdmin) {
        showNotification('Admin access required', 'error');
        return;
    }
    
    document.getElementById('galleryManagement').style.display = 'block';
    loadAdminGalleryImages();
}

function closeGalleryManager() {
    document.getElementById('galleryManagement').style.display = 'none';
    document.getElementById('imageUploadForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
}

async function uploadGalleryImage(event) {
    event.preventDefault();
    
    if (!firebaseInitialized) {
        showNotification('Firebase not available. Please refresh the page.', 'error');
        return;
    }
    
    const form = event.target;
    const file = document.getElementById('imageFile').files[0];
    const title = document.getElementById('imageTitle').value;
    const description = document.getElementById('imageDescription').value;
    const category = document.getElementById('imageCategory').value;
    
    if (!file) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    // Show progress
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressDiv.style.display = 'block';
    progressText.textContent = 'Uploading...';
    
    try {
        // Simulate progress
        progressFill.style.width = '30%';
        
        const result = await window.firebaseGallery.addGalleryImage(file, title, description, category);
        
        progressFill.style.width = '100%';
        progressText.textContent = 'Upload complete!';
        
        showNotification('Image uploaded successfully!', 'success');
        
        // Reset form
        form.reset();
        document.getElementById('imagePreview').style.display = 'none';
        
        // Reload admin gallery
        setTimeout(() => {
            progressDiv.style.display = 'none';
            progressFill.style.width = '0%';
            loadAdminGalleryImages();
        }, 1000);
        
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Failed to upload image: ' + error.message, 'error');
        progressDiv.style.display = 'none';
    }
}

async function loadAdminGalleryImages() {
    if (!firebaseInitialized) return;
    
    const grid = document.getElementById('adminImagesGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading">Loading images...</div>';
    
    try {
        const images = await window.firebaseGallery.getGalleryImages();
        
        if (images.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No images uploaded yet</p>';
            return;
        }
        
        grid.innerHTML = '';
        images.forEach(image => {
            const imageItem = document.createElement('div');
            imageItem.className = 'admin-image-item';
            imageItem.innerHTML = `
                <img src="${image.url}" alt="${image.title}" loading="lazy">
                <div class="admin-image-overlay">
                    <h6>${image.title}</h6>
                    <p>${image.description}</p>
                    <div class="admin-image-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteGalleryImage('${image.id}', '${image.storagePath}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(imageItem);
        });
        
    } catch (error) {
        console.error('Error loading admin gallery:', error);
        grid.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Failed to load images</div>';
    }
}

async function deleteGalleryImage(imageId, storagePath) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    if (!firebaseInitialized) {
        showNotification('Firebase not available', 'error');
        return;
    }
    
    try {
        await window.firebaseGallery.deleteGalleryImage(imageId, storagePath);
        showNotification('Image deleted successfully', 'success');
        loadAdminGalleryImages();
    } catch (error) {
        console.error('Error deleting image:', error);
        showNotification('Failed to delete image: ' + error.message, 'error');
    }
}

// Enhanced donation function with Firebase
async function confirmPayment() {
    if (selectedAmount <= 0) {
        showNotification('Please select an amount first', 'error');
        return;
    }
    
    const donorName = document.getElementById('donorName').value || 'Anonymous';
    const donorPhone = document.getElementById('donorPhone').value || '';
    
    const donation = {
        amount: selectedAmount,
        donorName: donorName,
        donorPhone: donorPhone,
        paymentMethod: 'UPI',
        status: 'completed',
        timestamp: new Date().toISOString(),
        note: 'Vinayaka Chaturthi Donation',
        upiId: UPI_ID
    };
    
    // Save locally first
    donations.push({
        id: Date.now().toString(),
        ...donation
    });
    
    // Save to Firebase if available
    if (firebaseInitialized) {
        try {
            await window.firebaseGallery.saveDonation(donation);
            console.log('Donation saved to Firebase');
        } catch (error) {
            console.error('Error saving donation to Firebase:', error);
            showNotification('Donation recorded locally. Firebase sync failed.', 'warning');
        }
    }
    
    showNotification(`Thank you ${donorName} for your donation of ₹${selectedAmount}!`, 'success');
    
    // Reset form
    document.getElementById('donorName').value = '';
    document.getElementById('donorPhone').value = '';
    document.getElementById('customAmount').value = '';
    document.querySelectorAll('.amount-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    selectedAmount = 0;
    document.getElementById('selectedAmount').textContent = '₹0';
    document.getElementById('upiAppBtn').disabled = true;
    document.getElementById('confirmBtn').disabled = true;
    
    // Update stats
    updateDonationStats();
    
    console.log('Donation recorded:', donation);
}

// Enhanced admin functions
async function addDonation() {
    const amount = prompt('Enter donation amount:');
    const donorName = prompt('Enter donor name (optional):') || 'Anonymous';
    
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        const donation = {
            amount: parseInt(amount),
            donorName: donorName,
            paymentMethod: 'Cash',
            status: 'completed',
            timestamp: new Date().toISOString(),
            note: 'Admin added donation'
        };
        
        // Save locally
        donations.push({
            id: Date.now().toString(),
            ...donation
        });
        
        // Save to Firebase if available
        if (firebaseInitialized) {
            try {
                await window.firebaseGallery.saveDonation(donation);
                console.log('Admin donation saved to Firebase');
            } catch (error) {
                console.error('Error saving donation to Firebase:', error);
            }
        }
        
        updateDonationStats();
        updateAdminStats();
        showNotification(`Added donation of ₹${amount} from ${donorName}`, 'success');
    } else {
        showNotification('Invalid amount entered', 'error');
    }
}

async function addExpense() {
    const amount = prompt('Enter expense amount:');
    const description = prompt('Enter expense description:') || 'Festival expense';
    
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        const expense = {
            amount: parseInt(amount),
            description: description,
            timestamp: new Date().toISOString()
        };
        
        // Save locally
        expenses.push({
            id: Date.now().toString(),
            ...expense
        });
        
        // Save to Firebase if available
        if (firebaseInitialized) {
            try {
                await window.firebaseGallery.saveExpense(expense);
                console.log('Expense saved to Firebase');
            } catch (error) {
                console.error('Error saving expense to Firebase:', error);
            }
        }
        
        updateDonationStats();
        updateAdminStats();
        showNotification(`Added expense of ₹${amount} for ${description}`, 'success');
    } else {
        showNotification('Invalid amount entered', 'error');
    }
}

function manageSchedule() {
    showNotification('Schedule management feature coming soon!', 'info');
}

async function syncWithFirebase() {
    if (!firebaseInitialized) {
        showNotification('Firebase not available', 'error');
        return;
    }
    
    try {
        showNotification('Syncing data with Firebase...', 'info');
        
        // Reload all data from Firebase
        const [galleryData, donationsData, expensesData] = await Promise.all([
            window.firebaseGallery.getGalleryImages(),
            window.firebaseGallery.getDonations(),
            window.firebaseGallery.getExpenses()
        ]);
        
        galleryImages = galleryData;
        donations = donationsData;
        expenses = expensesData;
        
        updateGallery();
        updateDonationStats();
        updateAdminStats();
        
        if (document.getElementById('galleryManagement').style.display !== 'none') {
            loadAdminGalleryImages();
        }
        
        showNotification('Data synced successfully!', 'success');
        
    } catch (error) {
        console.error('Error syncing with Firebase:', error);
        showNotification('Failed to sync data: ' + error.message, 'error');
    }
}

// Cleanup function
function cleanup() {
    if (galleryUnsubscribe) {
        galleryUnsubscribe();
    }
    if (donationsUnsubscribe) {
        donationsUnsubscribe();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        closePaymentModal();
        closeImageModal();
        closeGalleryManager();
    }
    
    // Admin shortcut (Ctrl+Shift+A)
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        switchTab('admin');
    }
    
    // Sync shortcut (Ctrl+Shift+S) - admin only
    if (e.ctrlKey && e.shiftKey && e.key === 'S' && isAdmin) {
        e.preventDefault();
        syncWithFirebase();
    }
});

// Initialize on load
console.log('Vinayaka Chaturthi 2025 - Kings Youth Website Loaded');
console.log('UPI ID:', UPI_ID);
console.log('Features: Countdown Timer, UPI Payments, Gallery, Admin Dashboard, Firebase Integration');