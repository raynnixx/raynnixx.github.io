import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEL_BjaLebZSHYRrTF60jqMROs4ufDcn4",
  authDomain: "project-a3b05.firebaseapp.com",
  projectId: "project-a3b05",
  storageBucket: "project-a3b05.firebasestorage.app",
  messagingSenderId: "948206231026",
  appId: "1:948206231026:web:5e594891c9c23a3ec59f6b",
  measurementId: "G-NFEVYXCBPR"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);