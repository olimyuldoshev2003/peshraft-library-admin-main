import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAZrHLLG2RxxoIqkOdwz79bVHCXM0GhJIw",
  authDomain: "peshraft-6084a.firebaseapp.com",
  projectId: "peshraft-6084a",
  storageBucket: "peshraft-6084a.firebasestorage.app",
  messagingSenderId: "6990579301",
  appId: "1:6990579301:web:eb44fb2e604771bbf9288c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;