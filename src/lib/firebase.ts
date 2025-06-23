
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; // Thêm dòng này
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyATAeYnOkIHFS1diM35ZMvnObIEng5gGnw",
  authDomain: "phienbannangcap.firebaseapp.com",
  databaseURL: "https://phienbannangcap-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "phienbannangcap",
  storageBucket: "phienbannangcap.appspot.com",
  messagingSenderId: "931462285955",
  appId: "1:931462285955:web:ac19c5675db6f14bff69b6"
  // measurementId is optional, so it can be removed if not provided or needed
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getDatabase(app);
const auth = getAuth(app); 
const storage = getStorage(app);

export const uploadImageAndGetURL = async (file: File, path: string): Promise<string> => {
    if (!file) {
        throw new Error("No file provided for upload.");
    }
    const fileRef = storageRef(storage, `${path}/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
};


export { app as firebaseApp, db, auth, storage };

