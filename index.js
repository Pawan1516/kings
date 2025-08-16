// Global variables
let isAdmin = false;
let currentGalleryFilter = 'all';
let donationTotal = 0;
let expenseTotal = 0;
let isMobileDevice = false;
let selectedFiles = [];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be ready
    setTimeout(() => {
        initializeApp();
    }, 1000);
});

function initializeApp() {
    // Hide loading spinner
    setTimeout(() => {
        document.getElementById('loading-spinner').style.display = 'none';
    }, 1000);

    // Initialize device detection
    detectDeviceType();

    // Initialize event listeners
    setupEventListeners();
    
    // Start countdown timer
    startCountdown();
    
    // Load initial data
    loadPoojaSchedule();
    loadGalleryImages();
    loadDonationData();

    console.log('App initialized successfully');
}

function detectDeviceType() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    isMobileDevice = isMobileDevice || hasTouch;
    console.log('Device detected as:', isMobileDevice ? 'Mobile' : 'Desktop');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.id === 'upi-payment-link') {
                window.open('payment.html', '_blank');
            } else {
                switchTab(link.dataset.tab);
            }
        });
    });

    // Floating donate button
    document.getElementById('floating-donate-btn').addEventListener('click', () => {
        if (isMobileDevice) {
            window.open('payment.html', '_blank');
        } else {
            switchTab('donation');
        }
    });

    // Learn more button
    document.getElementById('learn-more-btn').addEventListener('click', () => {
        switchTab('pooja-schedule');
    });

    // Admin login
    document.getElementById('login-form').addEventListener('submit', handleAdminLogin);
    document.getElementById('admin-logout').addEventListener('click', handleAdminLogout);

    // Pooja schedule editing
    document.getElementById('pooja-edit-btn').addEventListener('click', togglePoojaEdit);
    document.getElementById('pooja-cancel-btn').addEventListener('click', cancelPoojaEdit);
    document.getElementById('pooja-save-btn').addEventListener('click', savePoojaSchedule);

    // Donation forms
    document.getElementById('add-donation-form').addEventListener('submit', addDonation);
    document.getElementById('add-expense-form').addEventListener('submit', addExpense);
    document.getElementById('donate-btn').addEventListener('click', handlePublicDonation);
    document.getElementById('upi-pay-btn').addEventListener('click', () => window.open('payment.html', '_blank'));
    document.getElementById('quick-donate-home').addEventListener('click', () => window.open('payment.html', '_blank'));

    // Quick donate buttons
    document.querySelectorAll('.quick-donate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('public-donation-amount').value = btn.dataset.amount;
        });
    });

    // Gallery
    document.getElementById('gallery-upload-btn').addEventListener('click', toggleGalleryUpload);
    document.getElementById('cancel-upload').addEventListener('click', toggleGalleryUpload);
    document.getElementById('image-upload-form').addEventListener('submit', uploadImages);

    // Gallery filters
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setGalleryFilter(btn.dataset.category);
        });
    });

    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('image-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Location functionality
    document.getElementById('get-directions-btn').addEventListener('click', openGoogleMaps);
    document.getElementById('view-full-map-btn').addEventListener('click', openGoogleMaps);
    document.getElementById('open-google-maps').addEventListener('click', openGoogleMaps);
    document.getElementById('share-location').addEventListener('click', shareLocation);
    document.getElementById('call-venue').addEventListener('click', callVenue);

    // File upload handlers
    setupFileUploadHandlers();
}

function setupFileUploadHandlers() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('image-files');
    const selectBtn = document.getElementById('select-files-btn');

    if (!uploadArea || !fileInput || !selectBtn) return;

    // Click to select files
    selectBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleFileSelection);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            handleFiles(files);
        }
    });
}

function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    selectedFiles = files;
    displayImagePreviews(files);
    updateUploadButton();
}

function displayImagePreviews(files) {
    const container = document.getElementById('image-previews');
    if (!container) return;

    container.innerHTML = '';

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button type="button" class="remove-btn" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    displayImagePreviews(selectedFiles);
    updateUploadButton();
}

function updateUploadButton() {
    const uploadBtn = document.getElementById('upload-submit-btn');
    const title = document.getElementById('image-title')?.value || '';
    const category = document.getElementById('image-category')?.value || '';

    if (uploadBtn) {
        uploadBtn.disabled = selectedFiles.length === 0 || !title || !category;
    }
}

// Monitor form inputs
document.addEventListener('input', (e) => {
    if (e.target.id === 'image-title' || e.target.id === 'image-category') {
        updateUploadButton();
    }
});

// Tab switching
function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active-tab');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active-tab');

    // Update content
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.add('hidden');
    });
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');

    // Load tab-specific data
    if (tabName === 'gallery') {
        loadGalleryImages();
    } else if (tabName === 'donation') {
        loadDonationData();
    } else if (tabName === 'admin' && isAdmin) {
        loadAdminStats();
    }
}

// Countdown timer
function startCountdown() {
    const targetDate = new Date('2025-08-27T00:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const timeLeft = targetDate - now;

        if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            document.getElementById('countdown-days').textContent = days.toString().padStart(2, '0');
            document.getElementById('countdown-hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('countdown-minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('countdown-seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            document.getElementById('countdown-days').textContent = '00';
            document.getElementById('countdown-hours').textContent = '00';
            document.getElementById('countdown-minutes').textContent = '00';
            document.getElementById('countdown-seconds').textContent = '00';
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Admin functions
function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    if (username === 'admin' && password === 'ganesha123') {
        isAdmin = true;
        document.getElementById('admin-login-form').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        
        // Show admin-only elements
        document.getElementById('pooja-edit-btn').classList.remove('hidden');
        document.getElementById('donation-status-section').classList.remove('hidden');
        document.getElementById('gallery-upload-btn').classList.remove('hidden');
        
        loadAdminStats();
        showNotification('Login successful!', 'success');
    } else {
        document.getElementById('login-error').classList.remove('hidden');
        document.getElementById('login-error').textContent = 'Invalid username or password';
    }
}

function handleAdminLogout() {
    isAdmin = false;
    document.getElementById('admin-login-form').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-password').value = '';
    document.getElementById('login-error').classList.add('hidden');
    
    // Hide admin-only elements
    document.getElementById('pooja-edit-btn').classList.add('hidden');
    document.getElementById('donation-status-section').classList.add('hidden');
    document.getElementById('gallery-upload-btn').classList.add('hidden');
    document.getElementById('pooja-edit-section').classList.add('hidden');
    document.getElementById('gallery-upload-form').classList.add('hidden');
    
    showNotification('Logged out successfully', 'info');
}

function loadAdminStats() {
    if (!window.firebase) return;

    // Load gallery images count
    const { db, collection, getDocs } = window.firebase;
    
    getDocs(collection(db, 'gallery_images')).then((snapshot) => {
        document.getElementById('stats-images').textContent = snapshot.size;
    });

    // Load donation total
    document.getElementById('stats-donations').textContent = `₹${donationTotal.toLocaleString()}`;

    // Load schedule count (default 5 items)
    document.getElementById('stats-schedule').textContent = '5';

    // Load recent activity
    const activityContainer = document.getElementById('recent-activity');
    activityContainer.innerHTML = `
        <div>New gallery upload</div>
        <div>Schedule updated</div>
        <div>Donation received: ₹501</div>
    `;
}

// Pooja Schedule functions
function loadPoojaSchedule() {
    if (!window.firebase) {
        loadDefaultSchedule();
        return;
    }

    const { db, doc, getDoc } = window.firebase;
    
    getDoc(doc(db, 'settings', 'pooja_schedule')).then((docSnap) => {
        if (docSnap.exists()) {
            const schedule = docSnap.data().items || [];
            displayPoojaSchedule(schedule);
            displayHomePoojaSchedule(schedule);
        } else {
            loadDefaultSchedule();
        }
    }).catch((error) => {
        console.error('Error loading pooja schedule:', error);
        loadDefaultSchedule();
    });
}

function loadDefaultSchedule() {
    const defaultSchedule = [
        '6:00 AM - Mangal Aarti',
        '8:00 AM - Abhishek',
        '12:00 PM - Madhyanha Aarti',
        '6:00 PM - Sandhya Aarti',
        '8:00 PM - Shayan Aarti'
    ];
    displayPoojaSchedule(defaultSchedule);
    displayHomePoojaSchedule(defaultSchedule);
}

function displayPoojaSchedule(schedule) {
    const list = document.getElementById('pooja-schedule-list');
    if (schedule.length === 0) {
        list.innerHTML = '<div class="text-gray-500 text-center py-4">No schedule available</div>';
        return;
    }

    list.innerHTML = schedule.map(item => 
        `<li class="pooja-item">
            <div class="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <span class="text-amber-800 font-medium">${item}</span>
            </div>
        </li>`
    ).join('');
}

function displayHomePoojaSchedule(schedule) {
    const list = document.getElementById('home-pooja-list');
    const todaySchedule = schedule.slice(0, 3);
    
    if (todaySchedule.length === 0) {
        list.innerHTML = '<div class="text-gray-500 text-center py-4">No schedule for today</div>';
        return;
    }

    list.innerHTML = todaySchedule.map(item => 
        `<div class="flex items-center p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <i class="fas fa-clock text-amber-600 mr-3"></i>
            <span class="text-amber-800">${item}</span>
        </div>`
    ).join('');
}

function togglePoojaEdit() {
    const editSection = document.getElementById('pooja-edit-section');
    const isHidden = editSection.classList.contains('hidden');
    
    if (isHidden) {
        if (window.firebase) {
            const { db, doc, getDoc } = window.firebase;
            getDoc(doc(db, 'settings', 'pooja_schedule')).then((docSnap) => {
                if (docSnap.exists()) {
                    const schedule = docSnap.data().items || [];
                    document.getElementById('pooja-schedule-textarea').value = schedule.join('\n');
                }
            });
        }
        editSection.classList.remove('hidden');
    } else {
        editSection.classList.add('hidden');
    }
}

function cancelPoojaEdit() {
    document.getElementById('pooja-edit-section').classList.add('hidden');
    document.getElementById('pooja-schedule-textarea').value = '';
}

function savePoojaSchedule() {
    const textarea = document.getElementById('pooja-schedule-textarea');
    const schedule = textarea.value.split('\n').filter(item => item.trim() !== '');
    
    if (!window.firebase) {
        showNotification('Firebase not connected. Changes saved locally.', 'warning');
        displayPoojaSchedule(schedule);
        displayHomePoojaSchedule(schedule);
        cancelPoojaEdit();
        return;
    }

    const { db, doc, setDoc, serverTimestamp } = window.firebase;

    setDoc(doc(db, 'settings', 'pooja_schedule'), {
        items: schedule,
        lastUpdated: serverTimestamp()
    }).then(() => {
        showNotification('Schedule updated successfully!', 'success');
        displayPoojaSchedule(schedule);
        displayHomePoojaSchedule(schedule);
        cancelPoojaEdit();
    }).catch((error) => {
        console.error('Error saving schedule:', error);
        showNotification('Error saving schedule', 'error');
    });
}

// Donation functions
function loadDonationData() {
    if (!window.firebase) {
        updateDonationSummary(0, 0);
        displayDonationHistory([]);
        return;
    }

    const { db, doc, onSnapshot, collection, query, orderBy, limit } = window.firebase;

    // Load donation totals
    onSnapshot(doc(db, 'settings', 'donation_totals'), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            donationTotal = data.total_donation || 0;
            expenseTotal = data.total_spent || 0;
            updateDonationSummary(donationTotal, expenseTotal);
        }
    });

    // Load recent donations
    const donationsQuery = query(collection(db, 'donations'), orderBy('timestamp', 'desc'), limit(10));
    onSnapshot(donationsQuery, (snapshot) => {
        const donations = [];
        snapshot.forEach((doc) => {
            donations.push({id: doc.id, ...doc.data()});
        });
        displayDonationHistory(donations);
    });
}

function updateDonationSummary(donations, expenses) {
    document.getElementById('donation-total').textContent = `₹${donations.toLocaleString()}`;
    document.getElementById('expense-total').textContent = `₹${expenses.toLocaleString()}`;
    document.getElementById('net-balance').textContent = `₹${(donations - expenses).toLocaleString()}`;
}

function displayDonationHistory(transactions) {
    const list = document.getElementById('donation-history-list');
    
    if (transactions.length === 0) {
        list.innerHTML = '<div class="text-gray-500 text-center py-4">No transactions yet</div>';
        return;
    }

    list.innerHTML = transactions.map(transaction => {
        const date = transaction.timestamp ? 
            new Date(transaction.timestamp.seconds * 1000).toLocaleDateString() : 
            new Date().toLocaleDateString();
        
        return `
            <div class="transaction-item ${transaction.type || 'donation'}">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium text-gray-800">
                            ${transaction.name || transaction.description || 'Anonymous'}
                        </div>
                        <div class="text-sm text-gray-600">${date}</div>
                        ${transaction.note ? `<div class="text-sm text-gray-500">${transaction.note}</div>` : ''}
                    </div>
                    <div class="font-bold text-${transaction.type === 'expense' ? 'red' : 'green'}-600">
                        ${transaction.type === 'expense' ? '-' : '+'}₹${transaction.amount?.toLocaleString() || 0}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addDonation(e) {
    e.preventDefault();
    
    const name = document.getElementById('donation-name').value;
    const amount = parseFloat(document.getElementById('donation-amount').value);
    const note = document.getElementById('donation-note').value;

    if (!name || !amount || amount <= 0) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (!window.firebase) {
        showNotification('Firebase not connected. Donation recorded locally.', 'warning');
        e.target.reset();
        return;
    }

    const { db, collection, addDoc, doc, getDoc, setDoc, serverTimestamp } = window.firebase;

    const donation = {
        name: name,
        amount: amount,
        note: note,
        type: 'donation',
        timestamp: serverTimestamp()
    };

    addDoc(collection(db, 'donations'), donation).then(() => {
        return getDoc(doc(db, 'settings', 'donation_totals'));
    }).then((docSnap) => {
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentTotal = currentData.total_donation || 0;
        const newTotal = currentTotal + amount;
        
        return setDoc(doc(db, 'settings', 'donation_totals'), {
            ...currentData,
            total_donation: newTotal,
            last_updated: serverTimestamp()
        });
    }).then(() => {
        showNotification('Donation added successfully!', 'success');
        e.target.reset();
    }).catch((error) => {
        console.error('Error adding donation:', error);
        showNotification('Error adding donation', 'error');
    });
}

function addExpense(e) {
    e.preventDefault();
    
    const description = document.getElementById('expense-description').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const note = document.getElementById('expense-note').value;

    if (!description || !amount || amount <= 0) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (!window.firebase) {
        showNotification('Firebase not connected. Expense recorded locally.', 'warning');
        e.target.reset();
        return;
    }

    const { db, collection, addDoc, doc, getDoc, setDoc, serverTimestamp } = window.firebase;

    const expense = {
        description: description,
        amount: amount,
        note: note,
        type: 'expense',
        timestamp: serverTimestamp()
    };

    addDoc(collection(db, 'expenses'), expense).then(() => {
        return getDoc(doc(db, 'settings', 'donation_totals'));
    }).then((docSnap) => {
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentTotal = currentData.total_spent || 0;
        const newTotal = currentTotal + amount;
        
        return setDoc(doc(db, 'settings', 'donation_totals'), {
            ...currentData,
            total_spent: newTotal,
            last_updated: serverTimestamp()
        });
    }).then(() => {
        showNotification('Expense added successfully!', 'success');
        e.target.reset();
    }).catch((error) => {
        console.error('Error adding expense:', error);
        showNotification('Error adding expense', 'error');
    });
}

function handlePublicDonation() {
    const amount = document.getElementById('public-donation-amount').value;
    const name = document.getElementById('public-donor-name').value || 'Anonymous';

    if (!amount || amount <= 0) {
        showNotification('Please enter a valid donation amount', 'error');
        return;
    }

    if (isMobileDevice) {
        const upiUrl = `upi://pay?pa=7993962018@ybl&pn=Kings Youth&am=${amount}&cu=INR&tn=Vinayaka Chaturthi Donation`;
        
        try {
            window.location.href = upiUrl;
            
            setTimeout(() => {
                if (confirm('Did you complete the payment? Click OK to record this donation.')) {
                    recordDonation(name, parseFloat(amount), 'UPI Payment');
                }
            }, 3000);
        } catch (error) {
            showNotification('UPI app not found. Please use manual payment method.', 'warning');
        }
    } else {
        alert(`UPI Payment not available on desktop.\n\nPlease scan QR code or use:\nUPI ID: 7993962018@ybl\nMerchant: Kings Youth\nAmount: ₹${amount}\nNote: Vinayaka Chaturthi Donation`);
    }
}

function recordDonation(name, amount, note) {
    if (!window.firebase) return;

    const { db, collection, addDoc, doc, getDoc, setDoc, serverTimestamp } = window.firebase;

    const donation = {
        name: name,
        amount: amount,
        note: note,
        type: 'donation',
        timestamp: serverTimestamp()
    };

    addDoc(collection(db, 'donations'), donation).then(() => {
        return getDoc(doc(db, 'settings', 'donation_totals'));
    }).then((docSnap) => {
        const currentData = docSnap.exists() ? docSnap.data() : {};
        const currentTotal = currentData.total_donation || 0;
        const newTotal = currentTotal + amount;
        
        return setDoc(doc(db, 'settings', 'donation_totals'), {
            ...currentData,
            total_donation: newTotal,
            last_updated: serverTimestamp()
        });
    }).then(() => {
        showNotification('Thank you for your donation!', 'success');
        document.getElementById('public-donation-amount').value = '';
        document.getElementById('public-donor-name').value = '';
    }).catch((error) => {
        console.error('Error recording donation:', error);
        showNotification('Payment successful, but failed to record. Please contact admin.', 'warning');
    });
}

// Gallery functions
function loadGalleryImages() {
    if (!window.firebase) {
        displayGalleryImages([]);
        return;
    }

    const { db, collection, query, orderBy, onSnapshot } = window.firebase;

    const imagesQuery = query(collection(db, 'gallery_images'), orderBy('timestamp', 'desc'));
    onSnapshot(imagesQuery, (snapshot) => {
        const images = [];
        snapshot.forEach((doc) => {
            images.push({id: doc.id, ...doc.data()});
        });
        displayGalleryImages(images);
    });
}

function displayGalleryImages(images) {
    const grid = document.getElementById('gallery-grid');
    
    const filteredImages = currentGalleryFilter === 'all' ? 
        images : 
        images.filter(img => img.category === currentGalleryFilter);

    if (filteredImages.length === 0) {
        grid.innerHTML = '<div class="text-gray-500 text-center py-8 col-span-full">No images in this category</div>';
        return;
    }

    grid.innerHTML = filteredImages.map(image => `
        <div class="gallery-item" onclick="openImageModal('${image.url}', '${image.title}', '${image.description || ''}', '${image.category}')">
            <img src="${image.url}" alt="${image.title}" class="gallery-img w-full h-48 object-cover">
            <div class="gallery-overlay">
                <h4 class="font-semibold text-sm">${image.title}</h4>
                <p class="text-xs opacity-75">${image.description || ''}</p>
            </div>
        </div>
    `).join('');
}

function setGalleryFilter(category) {
    currentGalleryFilter = category;
    
    // Update button states
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    loadGalleryImages();
}

function toggleGalleryUpload() {
    const form = document.getElementById('gallery-upload-form');
    form.classList.toggle('hidden');
    
    if (!form.classList.contains('hidden')) {
        selectedFiles = [];
        document.getElementById('image-previews').innerHTML = '';
        document.getElementById('image-title').value = '';
        document.getElementById('image-category').value = '';
        document.getElementById('image-description').value = '';
        updateUploadButton();
    }
}

async function uploadImages(e) {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
        showNotification('Please select images to upload', 'error');
        return;
    }

    if (!window.firebase) {
        showNotification('Firebase not configured. Cannot upload images.', 'error');
        return;
    }

    const title = document.getElementById('image-title').value;
    const category = document.getElementById('image-category').value;
    const description = document.getElementById('image-description').value;

    const { storage, ref, uploadBytes, getDownloadURL, db, collection, addDoc, serverTimestamp } = window.firebase;

    const progressContainer = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('upload-percentage');
    
    progressContainer.classList.remove('hidden');
    document.getElementById('upload-submit-btn').disabled = true;

    try {
        const totalFiles = selectedFiles.length;
        let uploadedFiles = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const fileName = `gallery/${Date.now()}_${i}_${file.name}`;
            const storageRef = ref(storage, fileName);

            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Save to Firestore
            await addDoc(collection(db, 'gallery_images'), {
                title: `${title} ${totalFiles > 1 ? `(${i + 1})` : ''}`,
                description: description,
                category: category,
                url: downloadURL,
                fileName: fileName,
                timestamp: serverTimestamp()
            });

            uploadedFiles++;
            const progress = (uploadedFiles / totalFiles) * 100;
            progressFill.style.width = `${progress}%`;
            progressPercentage.textContent = `${Math.round(progress)}%`;
        }

        showNotification(`Successfully uploaded ${totalFiles} image(s)!`, 'success');
        toggleGalleryUpload();
        
    } catch (error) {
        console.error('Error uploading images:', error);
        showNotification('Error uploading images. Please try again.', 'error');
    } finally {
        progressContainer.classList.add('hidden');
        document.getElementById('upload-submit-btn').disabled = false;
        progressFill.style.width = '0%';
        progressPercentage.textContent = '0%';
    }
}

function openImageModal(url, title, description, category) {
    document.getElementById('modal-image').src = url;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-description').textContent = description;
    document.getElementById('modal-category').textContent = category;
    document.getElementById('image-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('image-modal').style.display = 'none';
}

// Location functions
function openGoogleMaps() {
    const address = "Kings Youth Community Center, 123 Temple Street, Community District";
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    window.open(googleMapsUrl, '_blank');
}

function shareLocation() {
    const locationText = "Kings Youth Community Center\n123 Temple Street, Community District\nVinayaka Chaturthi Celebrations";
    
    if (navigator.share && isMobileDevice) {
        navigator.share({
            title: 'Event Location',
            text: locationText
        }).catch(err => {
            copyToClipboard(locationText);
            showNotification('Location details copied to clipboard', 'success');
        });
    } else {
        copyToClipboard(locationText);
        showNotification('Location details copied to clipboard', 'success');
    }
}

function callVenue() {
    window.open('tel:+919876543210', '_self');
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    const styles = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${styles[type] || styles.info}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icons[type] || icons.info} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        return new Promise((resolve, reject) => {
            if (document.execCommand('copy')) {
                textArea.remove();
                resolve();
            } else {
                textArea.remove();
                reject();
            }
        });
    }
}

// Make functions globally available for inline event handlers
window.switchTab = switchTab;
window.removeFile = removeFile;