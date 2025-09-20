import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDEmuRrX9CTaviTW2LBLJgZ_7pIoa1z3fI",
  authDomain: "illusio-317d3.firebaseapp.com",
  databaseURL: "https://illusio-317d3-default-rtdb.firebaseio.com",
  projectId: "illusio-317d3",
  storageBucket: "illusio-317d3.firebasestorage.app",
  messagingSenderId: "854608020221",
  appId: "1:854608020221:web:67b93ab4285f6026e93494",
  measurementId: "G-CLPB2GXJFZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = getAnalytics(app);

// Initialize Realtime Database
export const database = getDatabase(app);

export { app, analytics };
export default app;
