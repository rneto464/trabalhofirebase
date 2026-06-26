// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjBceVBc1XkHgtwJ9CDQQV7MJ-YSmeYqQ",
  authDomain: "marketplace-e57cf.firebaseapp.com",
  projectId: "marketplace-e57cf",
  storageBucket: "marketplace-e57cf.firebasestorage.app",
  messagingSenderId: "1056529005666",
  appId: "1:1056529005666:web:9e9d59ac2f21bd1a38a53b",
  measurementId: "G-2VL8K1ZPDE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);