import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDKbonx3y3F8VCS8_Ng7Yzr7OQb4rB4_W4",
  authDomain: "musicapp-b45de.firebaseapp.com",
  projectId: "musicapp-b45de",
  storageBucket: "musicapp-b45de.firebasestorage.app",
  messagingSenderId: "850336723933",
  appId: "1:850336723933:web:c838595394b5b15be37c34",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export default app;