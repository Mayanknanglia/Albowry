// Firebase SDK Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCrFHbw0-YRuo_LddyFXOUwdgCT9C6fJX4",
  authDomain: "albowry-attendance.firebaseapp.com",
  projectId: "albowry-attendance",
  storageBucket: "albowry-attendance.firebasestorage.app",
  messagingSenderId: "498788768411",
  appId: "1:498788768411:web:f5b0c2f1b09c7eefa2c43e",
  measurementId: "G-MT75T052XJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Make Firebase available globally for app.js
window.fbDB = db;
window.fbCollection = collection;
window.fbDoc = doc;
window.fbSetDoc = setDoc;
window.fbGetDoc = getDoc;
window.fbGetDocs = getDocs;
window.fbUpdateDoc = updateDoc;
window.fbDeleteDoc = deleteDoc;
window.fbOnSnapshot = onSnapshot;
window.fbQuery = query;
window.fbWhere = where;
window.fbBatch = writeBatch;
window.fbReady = true;

console.log('🔥 Firebase Initialized Successfully!');
console.log('📊 Project: albowry-attendance');

// Trigger event when Firebase is ready
window.dispatchEvent(new Event('firebase-ready'));