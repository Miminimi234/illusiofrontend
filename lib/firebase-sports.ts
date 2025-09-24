// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue, off } from "firebase/database";

// Your web app's Firebase configuration for sports
const firebaseConfig = {
  apiKey: "AIzaSyD9mq_hYTVUyHdpPD8j8Qphz2n5KATVZ6I",
  authDomain: "illusiosportserver.firebaseapp.com",
  databaseURL: "https://illusiosportserver-default-rtdb.firebaseio.com",
  projectId: "illusiosportserver",
  storageBucket: "illusiosportserver.firebasestorage.app",
  messagingSenderId: "501770245148",
  appId: "1:501770245148:web:f5c68211bfb74489ac7bd9",
  measurementId: "G-EMEP4KMGQF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, 'sports-app');
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { database, ref, onValue, off };
