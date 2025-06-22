import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

function initializeAdminApp() {
  // If the app is already initialized, return it.
  if (getApps().length > 0) {
    return admin.app();
  }

  // Otherwise, initialize it.
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountString) {
    // We throw an error here which will be caught in the API route.
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountString);
  } catch (e) {
    // This helps debug malformed JSON.
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON string.');
  }
  
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://phienbannangcap-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

// These functions will now ensure the app is initialized before returning the service.
export const getAdminDb = () => {
  initializeAdminApp();
  return admin.database();
};

export const getAdminAuth = () => {
  initializeAdminApp();
  return admin.auth();
};
