// Firebase Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPFOaJWe1d-QzjSSUbYbs0wmnU11L2QH8",
  authDomain: "creative-solutions101.firebaseapp.com",
  projectId: "creative-solutions101",
  storageBucket: "creative-solutions101.firebasestorage.app",
  messagingSenderId: "966039196755",
  appId: "1:966039196755:web:bbbecdabdd264ee2e662a6",
  measurementId: "G-HZ3R18LQCZ"
};

try {
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  console.log("Firebase initialized successfully");
} catch (e) {
  console.error("Firebase initialization failed:", e);
}
