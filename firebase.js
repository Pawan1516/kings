// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase Configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyCJUtkYO1HwzjkIb_A0k1tTSAymdsie-rI",
  authDomain: "balaji-5a803.firebaseapp.com",
  projectId: "balaji-5a803",
  storageBucket: "balaji-5a803.appspot.com",
  messagingSenderId: "453221155673",
  appId: "1:453221155673:web:60178468c7500d3720c248",
  measurementId: "G-FSX5EPG5XN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Make Firebase functions available globally
window.firebase = {
  db,
  storage,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  ref,
  uploadBytes,
  getDownloadURL
};

console.log('Firebase initialized successfully');