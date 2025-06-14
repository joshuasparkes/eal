import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC7scG4AAZo5jgAjbImNLoZu9_gGg3WiTA",
  authDomain: "eal-project.firebaseapp.com",
  projectId: "eal-project",
  storageBucket: "eal-project.firebasestorage.app",
  messagingSenderId: "111755517967",
  appId: "1:111755517967:web:c60e3bd57c99b5b12fc37a",
  measurementId: "G-KQRZCD0P4Q",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

let analytics: any;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
