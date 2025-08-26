// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, onSnapshot, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase Configuration - Replace with your actual config
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