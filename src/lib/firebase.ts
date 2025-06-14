// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCMjrgJ7un02OQJ6BjPhFHBi_fUIENO9bA",
  authDomain: "phienbannangcap-b3760.firebaseapp.com",
  projectId: "phienbannangcap-b3760",
  storageBucket: "phienbannangcap-b3760.firebasestorage.app", // Sửa lại đuôi cho đúng
  messagingSenderId: "998324321483",
  appId: "1:998324321483:web:9d699de4caa35132722f4e",
  measurementId: "G-WTD2CGMVMS",
  // Thêm databaseURL cho Realtime Database
  databaseURL: "https://phienbannangcap-b3760-default-rtdb.firebaseio.com"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getDatabase(app);

export { app as firebaseApp, db };
