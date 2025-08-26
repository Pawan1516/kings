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
    const RAZORPAY_KEY_ID = "rzp_test_PyMc3GcRSQQ6x2";
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Nav Tabs
    const navLinks = document.querySelectorAll(".nav-link");
    const tabs = document.querySelectorAll(".content-tab");
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove("active-tab"));
        tabs.forEach(t => t.classList.add("hidden"));
        link.classList.add("active-tab");
        document.getElementById(link.dataset.tab + "-tab").classList.remove("hidden");
        
        // Ensure donation status stays hidden for non-admins
        if (link.dataset.tab === 'donation' && !isAdmin) {
          document.getElementById('donation-status-section').classList.add('hidden');
        }
      });
    });
    window.onload = () => { navLinks[0].click(); };

    // Countdown to August 27, 2025
    function updateCountdown() {
      const now = new Date();
      const festivalDate = new Date("Aug 27, 2025 00:00:00");
      const diff = festivalDate - now;

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
    setInterval(updateCountdown, 1000);
    updateCountdown();

    // Default schedule
    const defaultSchedule = [
      "Morning Pooja: 8:00 AM - 9:00 AM",
      "Sankalpam: 9:00 AM - 9:30 AM",
      "Ashtavinayak Pooja: 9:30 AM - 11:30 AM",
      "Prasadam Distribution: 11:30 AM - 12:00 PM",
      "Evening Aarti: 6:30 PM - 7:00 PM"
    ];

    // --- Pooja Schedule ---
    function renderPoojaList(list) {
      const listEl = document.getElementById("pooja-schedule-list");
      listEl.innerHTML = "";
      list.forEach(item => {
        const li = document.createElement("li");
        li.className = "pooja-item";
        li.textContent = item;
        listEl.appendChild(li);
      });

      // Home tab preview
      const homeList = document.getElementById("home-pooja-list");
      homeList.innerHTML = "";
      list.forEach(item => {
        const div = document.createElement("div");
        div.className = "flex items-start";
        div.innerHTML = `<span class="text-amber-600 mr-2 mt-1">•</span> ${item}`;
        homeList.appendChild(div);
      });
    }

    function loadPoojaSchedule() {
      db.collection("settings").doc("pooja_schedule").get().then(doc => {
        const list = doc.exists && Array.isArray(doc.data().list) ? doc.data().list : defaultSchedule;
        renderPoojaList(list);
      });
    }
    loadPoojaSchedule();

    // Editable schedule (admin)
    const poojaEditBtn = document.getElementById("pooja-edit-btn");
    const poojaEditSection = document.getElementById("pooja-edit-section");
    const poojaScheduleTextarea = document.getElementById("pooja-schedule-textarea");
    const poojaSaveBtn = document.getElementById("pooja-save-btn");
    const poojaCancelBtn = document.getElementById("pooja-cancel-btn");

    poojaEditBtn.addEventListener("click", () => {
      poojaEditSection.classList.remove("hidden");
      db.collection("settings").doc("pooja_schedule").get().then(doc => {
        poojaScheduleTextarea.value = (doc.exists && Array.isArray(doc.data().list) ? doc.data().list : defaultSchedule).join("\n");
      });
    });

    poojaCancelBtn.addEventListener("click", () => poojaEditSection.classList.add("hidden"));

    poojaSaveBtn.addEventListener("click", () => {
      const newList = poojaScheduleTextarea.value.split("\n").map(l => l.trim()).filter(l => l);
      db.collection("settings").doc("pooja_schedule").set({ list: newList });
      renderPoojaList(newList);
      poojaEditSection.classList.add("hidden");
    });

    // --- Donations ---
    function formatINR(n) {
      return "₹" + Number(n).toLocaleString("en-IN", {
        maximumFractionDigits: 0
      });
    }

    // Load donation summary data
    function loadDonationSummary() {
      // Real-time listener for donation total
      db.collection("settings").doc("total_donation").onSnapshot(doc => {
        const donation = doc.exists ? doc.data().amount : 0;
        document.getElementById("donation-total").textContent = formatINR(donation);
        
        // Get expense total
        db.collection("settings").doc("total_spent").onSnapshot(spentDoc => {
          const spent = spentDoc.exists ? spentDoc.data().amount : 0;
          document.getElementById("expense-total").textContent = formatINR(spent);
          document.getElementById("net-balance").textContent = formatINR(donation - spent);
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
            <span class="font-bold text-green-700">${formatINR(d.amount)}</span>`;
          ul.appendChild(li);
        });
      });
    }
      db.collection("settings").doc("total_donation").onSnapshot(doc => {
        const donation = doc.exists ? doc.data().amount : 0;
        document.getElementById("donation-total").textContent = formatINR(donation);
        
        db.collection("settings").doc("total_spent").get().then(spentDoc => {
          const spent = spentDoc.exists ? spentDoc.data().amount : 0;
          document.getElementById("expense-total").textContent = formatINR(spent);
          document.getElementById("net-balance").textContent = formatINR(donation - spent);
        });
      });

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
            <span class="font-bold text-green-700">${formatINR(d.amount)}</span>`;
          ul.appendChild(li);
        });
      });
    // Donation data will be loaded when admin logs in via toggleAdminUI()

    // Razorpay integration
    document.getElementById('donate-now-btn').onclick = function() {
      const amt = document.getElementById('donate-amount').value;
      if (!amt || isNaN(amt) || amt <= 0) {
        document.getElementById('razorpay-status').textContent = "Please enter a valid amount.";
        return;
      }

      const options = {
        "key": RAZORPAY_KEY_ID,
        "amount": amt * 100,
        "currency": "INR",
        "name": "Vinayaka Chaturthi",
        "description": "Festival Donation",
        "image": "https://cdn-icons-png.flaticon.com/512/210/210545.png",
        "handler": function(response) {
          document.getElementById('razorpay-status').innerHTML =
            `<i class="fas fa-check-circle mr-1"></i> Thank you for your donation of ${formatINR(amt)}!`;
          // Add transaction record
          const batch = db.batch();
          
          const donationRef = db.collection("donations").doc();
          batch.set(donationRef, {
            desc: "Online Donation",
            amount: Number(amt),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });

          const transactionRef = db.collection("transactions").doc();
          batch.set(transactionRef, {
            type: 'donation',
            desc: 'Online Donation',
            amount: Number(amt),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });

          const totalRef = db.collection("settings").doc("total_donation");
          batch.set(totalRef, {
            amount: firebase.firestore.FieldValue.increment(Number(amt))
          }, { merge: true });

          batch.commit();
        },
        "prefill": {
          "name": "",
          "email": "",
          "contact": ""
        },
        "theme": {
          "color": "#d97706"
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    };

    // Quick donate buttons
    document.getElementById('floating-donate-btn').addEventListener('click', () => {
      navLinks[2].click(); // Switch to donation tab
    });

    // Admin state and UI toggles
    let isAdmin = false;
    function toggleAdminUI() {
      // Show/hide admin-only UI elements
      document.getElementById('donation-status-section').classList.toggle('hidden', !isAdmin);
      document.getElementById('pooja-edit-btn').classList.toggle('hidden', !isAdmin);
      
      // Load admin-specific data when logged in
      if (isAdmin) {
        loadDonationSummary();
        db.collection("settings").doc("pooja_schedule").get().then(doc => {
          adminPoojaTextarea.value = (doc.exists && Array.isArray(doc.data().list) ? doc.data().list : defaultSchedule).join("\n");
        });
      }
    }

    // Load donation summary data
    function loadDonationSummary() {
      // Real-time listener for donation total
      db.collection("settings").doc("total_donation").onSnapshot(doc => {
        const donation = doc.exists ? doc.data().amount : 0;
        document.getElementById("donation-total").textContent = formatINR(donation);
        
        // Get expense total
        db.collection("settings").doc("total_spent").onSnapshot(spentDoc => {
          const spent = spentDoc.exists ? spentDoc.data().amount : 0;
          document.getElementById("expense-total").textContent = formatINR(spent);
          document.getElementById("net-balance").textContent = formatINR(donation - spent);
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
            <span class="font-bold text-green-700">${formatINR(d.amount)}</span>`;
          ul.appendChild(li);
        });
      });

      // Load transaction history (for admin panel)
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
                ${isExpense ? '-' : ''}${formatINR(t.amount)}
              </span>`;
            ul.appendChild(li);
          });
        });
    }

    // --- Gallery ---
    const currentYearGallery = document.getElementById("current-year-gallery");
    const previousYearsGallery = document.getElementById("previous-years-gallery");
    const ritualsGallery = document.getElementById("rituals-gallery");

    db.collection("gallery_images").orderBy("uploadedAt", "desc").onSnapshot((snapshot) => {
      currentYearGallery.innerHTML = "";
      previousYearsGallery.innerHTML = "";
      ritualsGallery.innerHTML = "";

      snapshot.docs.forEach(doc => {
        const { url, description, category } = doc.data();
        const container = document.createElement("div");
        container.className = "gallery-img relative group rounded-lg overflow-hidden shadow-md";
        container.innerHTML = `
          <img src="${url}" alt="${description}" class="w-full h-full object-cover cursor-pointer"/>
          <div class="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 flex justify-center items-center text-white p-3 transition">
            <p class="text-center text-sm md:text-base">${description || "Ganesh Chaturthi Celebration"}</p>
          </div>`;
        container.onclick = () => openModal(url, description);

        if (category === "current") currentYearGallery.appendChild(container);
        else if (category === "previous") previousYearsGallery.appendChild(container);
        else if (category === "rituals") ritualsGallery.appendChild(container);
      });
    });

    // Modal functionality
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");
    const modalCaption = document.getElementById("modal-caption");
    const closeBtn = document.querySelector(".close");

    function openModal(src, alt) {
      modal.style.display = "block";
      modalImg.src = src;
      modalCaption.textContent = alt || "Ganesh Chaturthi Celebration";
      document.body.style.overflow = "hidden";
    }

    closeBtn.onclick = () => {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    };

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    };

    // --- Admin Auth and Controls ---
    const loginSection = document.getElementById("login-section");
    const adminControls = document.getElementById("admin-controls");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const loginError = document.getElementById("login-error");
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "ganesha123";

    loginBtn.addEventListener("click", () => {
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isAdmin = true;
        loginError.classList.add("hidden");
        loginSection.classList.add("hidden");
        adminControls.classList.remove("hidden");
        toggleAdminUI();
        document.querySelector('[data-tab="admin"]').click();

        // Load admin-specific data
        db.collection("settings").doc("pooja_schedule").get().then(doc => {
          adminPoojaTextarea.value = (doc.exists && Array.isArray(doc.data().list) ? doc.data().list : defaultSchedule).join("\n");
        });
      } else if (username && password) {
        isAdmin = false;
        loginError.classList.add("hidden");
        loginSection.classList.add("hidden");
        adminControls.classList.add("hidden");
        // Redirect to home page after successful login for regular users
        document.querySelector('[data-tab="home"]').click();
      
      }else {
        loginError.classList.remove("hidden");
      }
    });

    logoutBtn.addEventListener("click", () => {
      isAdmin = false;
      loginSection.classList.remove("hidden");
      adminControls.classList.add("hidden");
      document.getElementById("pooja-edit-btn").classList.add("hidden");
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
      document.querySelector('[data-tab="admin"]').click();
    });

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
      renderPoojaList(newList);
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
              ${isExpense ? '-' : ''}${formatINR(t.amount)}
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