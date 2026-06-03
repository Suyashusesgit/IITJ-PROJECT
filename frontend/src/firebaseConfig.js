import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase configuration using Vite environment variables with fallback instructions
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyApiKeyPlaceholder123456",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "iitj-health-project.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://iitj-health-project-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "iitj-health-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "iitj-health-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:abcdef0123456789"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and export Realtime Database reference
export const db = getDatabase(app);
