import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase configuration — all values loaded from .env (Vite env vars)
// For Vercel deployment, add these same keys in: Settings → Environment Variables
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guard: warn in console if any required variable is missing
const missingVars = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingVars.length > 0) {
  console.error(
    "[Firebase] Missing environment variables:",
    missingVars.join(", "),
    "\nCreate a frontend/.env file. See README for instructions."
  );
}

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
