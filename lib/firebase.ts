// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Initialize Analytics only on client-side
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((error) => {
    console.log('Analytics not supported:', error);
  });
}

// Initialize Realtime Database
export const database = getDatabase(app);

export { app, analytics };
export default app;
