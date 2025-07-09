// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCaR5s0vD_t3ZOXUsXJfX7bBneYXgkGmaw",
  authDomain: "meu-app-de-viagens.firebaseapp.com",
  projectId: "meu-app-de-viagens",
  storageBucket: "meu-app-de-viagens.firebasestorage.app",
  messagingSenderId: "166110967251",
  appId: "1:166110967251:web:775f5caa0e59aad6adab26",
  measurementId: "G-D4X0EK5BQ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);