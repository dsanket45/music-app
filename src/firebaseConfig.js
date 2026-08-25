import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const isCustomDomain = typeof window !== 'undefined' && window.location && window.location.hostname && (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('vercel.app'));

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDKbonx3y3F8VCS8_Ng7Yzr7OQb4rB4_W4",
  authDomain: isCustomDomain ? window.location.hostname : (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "musicapp-b45de.firebaseapp.com"),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "musicapp-b45de",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "musicapp-b45de.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "850336723933",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:850336723933:web:c838595394b5b15be37c34",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export default app;