const firebaseConfig = {
      apiKey: "AIzaSyD8gX8-HleDASGiCW83-sMt7prRwbePto8",
      authDomain: "ganesh-donations.firebaseapp.com",
      databaseURL: "https://ganesh-donations-default-rtdb.firebaseio.com",
      projectId: "ganesh-donations",
      storageBucket: "ganesh-donations.firebasestorage.app",
      messagingSenderId: "685028500807",
      appId: "1:685028500807:web:7b8c4878edf8a1e57e5862",
      measurementId: "G-7DD2HWVG8C"
    };
    const CLOUDINARY_CLOUD_NAME = "db2s9ftfm";
    const CLOUDINARY_UNSIGNED_UPLOAD_PRESET = "pawan1516";
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const ui = {
      showPaymentStatus(message, type) {
        const statusEl = document.getElementById('payment-status');
        statusEl.textContent = message;
        statusEl.className = `payment-status ${type}`;
        statusEl.classList.remove('hidden');
      },

      toggleAdminUI() {
        // Show/hide admin-only UI elements
        document.getElementById('donation-status-section').classList.toggle('hidden', !auth.isAdmin);
        document.getElementById('pooja-edit-btn').classList.toggle('hidden', !auth.isAdmin);
        
        // Load admin-specific data when logged in
        if (auth.isAdmin) {
          donation.loadSummary();
          pooja.loadSchedule();
        }
      }
    };

    const donation = {
      formatINR(n) {
        return "₹" + Number(n).toLocaleString("en-IN", {
          maximumFractionDigits: 0
        });
      },

      loadSummary() {
        // Real-time listener for donation total
        db.collection("settings").doc("total_donation").onSnapshot(doc => {
          const donation = doc.exists ? doc.data().amount : 0;
          document.getElementById("donation-total").textContent = this.formatINR(donation);
          
          // Get expense total
          db.collection("settings").doc("total_spent").onSnapshot(spentDoc => {
            const spent = spentDoc.exists ? spentDoc.data().amount : 0;
            document.getElementById("expense-total").textContent = this.formatINR(spent);
            document.getElementById("net-balance").textContent = this.formatINR(donation - spent);
          });
        });

        // Load donation history
        db.collection("donations").orderBy("timestamp", "desc").limit(10).onSnapshot(snapshot => {
          const ul = document.getElementById("donation-history");
          ul.innerHTML = "";
          snapshot.docs.forEach(doc => {
            const d = doc.data();
            const li = document.createElement("li");
            li.className = "flex justify-between items-center py-2 border-b border-gray-200 last:border-0";
            li.innerHTML = `
              <div>
                <span class="font-medium">${d.desc || "Anonymous"}</span>
                <span class="text-xs text-gray-500 block">${d.timestamp && d.timestamp.toDate ?
                  d.timestamp.toDate().toLocaleDateString('en-IN', {day: 'numeric', month: 'short'}) : ""}</span>
              </div>
              <span class="font-bold text-green-700">${this.formatINR(d.amount)}</span>`;
            ul.appendChild(li);
          });
        });
      },

      addRecord(amount, donor, note) {
        if (!auth.isAdmin) return;
        
        const newDonation = {
            id: Date.now(),
            amount: amount,
            donor: donor || 'Anonymous',
            date: new Date().toISOString().split('T')[0],
            note: note || 'General donation'
        };
        
        this.saveToFirebase(newDonation);
      },

      saveToFirebase(newDonation) {
        db.collection("donations").add(newDonation);
      },

      payWithUPI() {
        const amountInput = document.getElementById('donation-amount');
        const noteInput = document.getElementById('donation-note');

        const amount = parseFloat(amountInput.value);
        const note = noteInput.value || 'Vinayaka Chaturthi Donation';

        // Validation
        if (!amount || amount <= 0) {
            ui.showPaymentStatus('Please enter a valid amount', 'error');
            return;
        }
        
        const upiId = '7993962018-2@ybl';
        const merchantName = 'Kings Youth';
        
        // Create UPI payment link
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
        
        // Check if device is mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Mobile device - open UPI app
            window.open(upiLink, '_blank');
            ui.showPaymentStatus('Redirecting to UPI app...', 'success');
            
            // Add to donation history (in real app, this would happen after successful payment)
            setTimeout(() => {
                this.addRecord(amount, 'Anonymous', note);
            }, 3000);
            
        } else {
            // Desktop - show message
            ui.showPaymentStatus('UPI payments work best on mobile devices. Please scan the QR code below or use a mobile device.', 'info');
            generateQRCode(upiLink);
        }
        
        // Clear form after 3 seconds
        setTimeout(() => {
            amountInput.value = '';
            noteInput.value = '';
            donation.addRecord(amount, 'User', note); // Removed auth.isAdmin check
          }, 3000);
      }
    };

    const pooja = {
      listEl: document.getElementById("pooja-schedule-list"),
      homeList: document.getElementById("home-pooja-list"),
      editBtn: document.getElementById("pooja-edit-btn"),
      editSection: document.getElementById("pooja-edit-section"),
      textarea: document.getElementById("pooja-schedule-textarea"),
      saveBtn: document.getElementById("pooja-save-btn"),
      cancelBtn: document.getElementById("pooja-cancel-btn"),
      defaultSchedule: [
        "Morning Pooja: 8:00 AM - 9:00 AM",
        "Sankalpam: 9:00 AM - 9:30 AM",
        "Ashtavinayak Pooja: 9:30 AM - 11:30 AM",
        "Prasadam Distribution: 11:30 AM - 12:00 PM",
        "Evening Aarti: 6:30 PM - 7:00 PM"
      ],

      init() {
        this.loadSchedule();
        this.editBtn.addEventListener("click", () => this.showEdit());
        this.cancelBtn.addEventListener("click", () => this.hideEdit());
        this.saveBtn.addEventListener("click", () => this.save());
      },

      render(list) {
        this.listEl.innerHTML = "";
        list.forEach(item => {
          const li = document.createElement("li");
          li.className = "pooja-item";
          li.textContent = item;
          this.listEl.appendChild(li);
        });

        // Home tab preview
        this.homeList.innerHTML = "";
        list.forEach(item => {
          const div = document.createElement("div");
          div.className = "flex items-start";
          div.innerHTML = `<span class="text-amber-600 mr-2 mt-1">•</span> ${item}`;
          this.homeList.appendChild(div);
        });
      },

      loadSchedule() {
        db.collection("settings").doc("pooja_schedule").get().then(doc => {
          const list = doc.exists && Array.isArray(doc.data().list) ? doc.data().list : this.defaultSchedule;
          this.render(list);
        });
      },

      showEdit() {
        this.editSection.classList.remove("hidden");
        db.collection("settings").doc("pooja_schedule").get().then(doc => {
          this.textarea.value = (doc.exists && Array.isArray(doc.data().list) ? doc.data().list : this.defaultSchedule).join("\n");
        });
      },

      hideEdit() {
        this.editSection.classList.add("hidden");
      },

      save() {
        const newList = this.textarea.value.split("\n").map(l => l.trim()).filter(l => l);
        db.collection("settings").doc("pooja_schedule").set({ list: newList });
        this.render(newList);
        this.hideEdit();
      }
    };

    const gallery = {
      currentYear: document.getElementById("current-year-gallery"),
      previousYears: document.getElementById("previous-years-gallery"),
      rituals: document.getElementById("rituals-gallery"),
      modal: document.getElementById("image-modal"),
      modalImg: document.getElementById("modal-image"),
      modalCaption: document.getElementById("modal-caption"),
      closeBtn: document.querySelector(".close"),

      init() {
        this.loadImages();
        this.closeBtn.onclick = () => this.closeModal();
        window.onclick = (event) => {
          if (event.target == this.modal) {
            this.closeModal();
          }
        };
      },

      loadImages() {
        db.collection("gallery_images").orderBy("uploadedAt", "desc").onSnapshot((snapshot) => {
          this.currentYear.innerHTML = "";
          this.previousYears.innerHTML = "";
          this.rituals.innerHTML = "";

          snapshot.docs.forEach(doc => {
            const { url, description, category } = doc.data();
            const container = document.createElement("div");
            container.className = "gallery-img relative group rounded-lg overflow-hidden shadow-md";
            container.innerHTML = `
              <img src="${url}" alt="${description}" class="w-full h-full object-cover cursor-pointer"/>
              <div class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 flex justify-center items-center text-white p-3 transition">
                <p class="text-center text-sm md:text-base">${description || "Ganesh Chaturthi Celebration"}</p>
              </div>`;
            container.onclick = () => this.openModal(url, description);

            if (category === "current") this.currentYear.appendChild(container);
            else if (category === "previous") this.previousYears.appendChild(container);
            else if (category === "rituals") this.rituals.appendChild(container);
          });
        });
      },

      openModal(src, alt) {
        this.modal.style.display = "block";
        this.modalImg.src = src;
        this.modalCaption.textContent = alt || "Ganesh Chaturthi Celebration";
        document.body.style.overflow = "hidden";
      },

      closeModal() {
        this.modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    };

    const auth = {
      loginBtn: document.getElementById("login-btn"),
      logoutBtn: document.getElementById("logout-btn"),
      loginError: document.getElementById("login-error"),
      loginSection: document.getElementById("login-section"),
      adminControls: document.getElementById("admin-controls"),
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "ganesha123",
      isAdmin: false,

      init() {
        this.loginBtn.addEventListener("click", () => this.login());
        this.logoutBtn.addEventListener("click", () => this.logout());
      },

      login() {
        const username = prompt("Enter admin username:");
        const password = prompt("Enter admin password:");

        if (username === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD) {
          this.isAdmin = true;
          this.loginError.classList.add("hidden");
          this.loginSection.classList.add("hidden");
          this.adminControls.classList.remove("hidden");
          ui.toggleAdminUI();
          document.querySelector('[data-tab="admin"]').click();

          // Load admin-specific data
          pooja.loadSchedule();
        } else {
          this.loginError.classList.remove("hidden");
        }
      },

      logout() {
        this.isAdmin = false;
        this.loginSection.classList.remove("hidden");
        this.adminControls.classList.add("hidden");
        document.getElementById("pooja-edit-btn").classList.add("hidden");
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
      }
    };

    const countdown = {
      festivalDate: new Date("Aug 27, 2025 00:00:00"),

      init() {
        this.update();
        setInterval(() => this.update(), 1000);
      },

      update() {
        const now = new Date();
        const diff = this.festivalDate - now;

        if (diff <= 0) {
          document.getElementById("countdown-days").textContent = "00";
          document.getElementById("countdown-hours").textContent = "00";
          document.getElementById("countdown-minutes").textContent = "00";
          document.getElementById("countdown-seconds").textContent = "00";
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById("countdown-days").textContent = days.toString().padStart(2, "0");
        document.getElementById("countdown-hours").textContent = hours.toString().padStart(2, "0");
        document.getElementById("countdown-minutes").textContent = minutes.toString().padStart(2, "0");
        document.getElementById("countdown-seconds").textContent = seconds.toString().padStart(2, "0");
      }
    };

    const nav = {
      navLinks: document.querySelectorAll(".nav-link"),
      tabs: document.querySelectorAll(".content-tab"),

      init() {
        this.navLinks.forEach(link => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            this.navLinks.forEach(l => l.classList.remove("active-tab"));
            this.tabs.forEach(t => t.classList.add("hidden"));
            link.classList.add("active-tab");
            document.getElementById(link.dataset.tab + "-tab").classList.remove("hidden");
            
            // Ensure donation status stays hidden for non-admins
            if (link.dataset.tab === 'donation' && !auth.isAdmin) {
              document.getElementById('donation-status-section').classList.add('hidden');
            }
          });
        });
        window.onload = () => { this.navLinks[0].click(); };
      }
    };

    document.getElementById('pay-now-btn').addEventListener('click', () => {
      donation.payWithUPI();
    });

    document.getElementById('floating-donate-btn').addEventListener('click', () => {
      nav.navLinks[2].click(); // Switch to donation tab
    });

    auth.init();
    pooja.init();
    gallery.init();
    countdown.init();
    nav.init();

    // Admin: Image Upload
    const uploadForm = document.getElementById("upload-image-form");
    const uploadStatus = document.getElementById("upload-status");

    uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
      uploadStatus.textContent = "";

      const category = document.getElementById("image-category").value;
      const description = document.getElementById("image-description").value.trim() || "Ganesh Chaturthi Celebration";
      const fileInput = document.getElementById("image-upload");
      const file = fileInput.files[0];

      if (!file) {
        uploadStatus.textContent = "Please select an image file.";
    return;
  }

      if (file.size > 5 * 1024 * 1024) {
        uploadStatus.textContent = "Image size should be less than 5MB.";
        return;
      }

      uploadStatus.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Uploading image...`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UNSIGNED_UPLOAD_PRESET);

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : "Upload failed");

        await db.collection("gallery_images").add({
          url: data.secure_url,
          description,
          category,
          uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        uploadStatus.innerHTML = `<i class="fas fa-check-circle mr-1 text-green-600"></i> Image uploaded successfully!`;
        uploadForm.reset();
      } catch (error) {
        uploadStatus.innerHTML = `<i class="fas fa-times-circle mr-1 text-red-600"></i> Upload failed: ${error.message}`;
      }
    });

    // Admin: Edit Pooja Schedule
    const adminPoojaTextarea = document.getElementById("admin-pooja-textarea");
    const adminPoojaSaveBtn = document.getElementById("admin-pooja-save-btn");

    adminPoojaSaveBtn.addEventListener("click", () => {
      const newList = adminPoojaTextarea.value.split("\n").map(l => l.trim()).filter(l => l);
      db.collection("settings").doc("pooja_schedule").set({ list: newList });
      pooja.render(newList);
      alert("Pooja schedule updated successfully!");
  });

    // Admin: Load transaction history
    db.collection("transactions")
      .orderBy("timestamp", "desc")
      .limit(20)
      .onSnapshot(snapshot => {
        const ul = document.getElementById("admin-transaction-history");
    ul.innerHTML = "";
    snapshot.docs.forEach(doc => {
          const t = doc.data();
      const li = document.createElement("li");
      li.className = "flex justify-between items-center py-2 border-b border-gray-200 last:border-0";
          
          const isExpense = t.type === 'expense';
          const icon = isExpense ? 'fa-arrow-up text-red-600' : 'fa-arrow-down text-green-600';
          
      li.innerHTML = `
            <div class="flex items-center">
              <i class="fas ${icon} mr-2"></i>
        <div>
                <span class="font-medium">${t.desc}</span>
                <span class="text-xs text-gray-500 block">${t.timestamp.toDate().toLocaleString('en-IN')}</span>
        </div>
            </div>
            <span class="font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}">
              ${isExpense ? '-' : ''}${donation.formatINR(t.amount)}
            </span>`;
      ul.appendChild(li);
    });
  });

    // Admin: Add Donation Entry
    const adminDonationDesc = document.getElementById("admin-donation-desc");
    const adminDonationAmount = document.getElementById("admin-donation-amount");
    const adminDonationAddBtn = document.getElementById("admin-donation-add-btn");

    adminDonationAddBtn.addEventListener("click", () => {
      const desc = adminDonationDesc.value.trim();
      const amt = Number(adminDonationAmount.value);

      if (!desc || isNaN(amt) || amt <= 0) {
        return alert("Please fill all donation details with valid values.");
      }

      const batch = db.batch();
      
      // Add transaction record
      const transactionRef = db.collection("transactions").doc();
      batch.set(transactionRef, {
        type: 'donation',
        desc,
        amount: amt,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Add to donations collection
      const donationRef = db.collection("donations").doc();
      batch.set(donationRef, {
        desc,
        amount: amt,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update total donations
      const totalRef = db.collection("settings").doc("total_donation");
      batch.set(totalRef, {
        amount: firebase.firestore.FieldValue.increment(amt)
      }, { merge: true });

      batch.commit().then(() => {
        adminDonationDesc.value = "";
        adminDonationAmount.value = "";
        alert("Donation entry added successfully!");
      }).catch(error => {
        alert("Error adding donation: " + error.message);
      });
    });

    // Admin: Add Expense Entry
    const adminExpenseDesc = document.getElementById("admin-expense-desc");
    const adminExpenseAmount = document.getElementById("admin-expense-amount");
    const adminExpenseAddBtn = document.getElementById("admin-expense-add-btn");

    adminExpenseAddBtn.addEventListener("click", () => {
      const desc = adminExpenseDesc.value.trim();
      const amt = Number(adminExpenseAmount.value);

      if (!desc || isNaN(amt) || amt <= 0) {
        return alert("Please fill all expense details with valid values.");
}

      const batch = db.batch();
      
      // Add transaction record
      const transactionRef = db.collection("transactions").doc();
      batch.set(transactionRef, {
        type: 'expense',
        desc,
        amount: amt,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update total spent
      const spentRef = db.collection("settings").doc("total_spent");
      batch.set(spentRef, {
        amount: firebase.firestore.FieldValue.increment(amt)
      }, { merge: true });
      
      // Update net balance display immediately
      

      batch.commit().then(() => {
        adminExpenseDesc.value = "";
        adminExpenseAmount.value = "";
        alert("Expense entry added successfully!");
      }).catch(error => {
        alert("Error adding expense: " + error.message);
});
    });