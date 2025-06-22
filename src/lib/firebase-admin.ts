
import 'dotenv/config'; // Make sure to load environment variables
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// The service account key is expected to be in an environment variable.
// The platform running this code should handle setting this variable.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountString) {
  // This log helps in debugging but in a real production scenario,
  // the app might fail to start or API routes would fail, which is expected.
  console.warn('The Firebase Admin SDK service account key is not set in the FIREBASE_SERVICE_ACCOUNT_KEY environment variable. API routes requiring admin privileges will fail.');
}

let serviceAccount: admin.ServiceAccount | undefined;
try {
    if (serviceAccountString) {
        serviceAccount = JSON.parse(serviceAccountString);
    }
} catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e);
    serviceAccount = undefined;
}


if (!getApps().length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // This URL is taken from the existing src/lib/firebase.ts file
            databaseURL: "https://phienbannangcap-default-rtdb.asia-southeast1.firebasedatabase.app",
        });
    } else {
        // If no service account, we can't initialize.
        // This will cause adminDb and adminAuth to be undefined, and API routes will fail gracefully.
        console.error("Firebase Admin SDK could not be initialized. Service account key is missing or invalid.");
    }
}

// Export admin instances, which might be undefined if initialization failed.
// The API route must handle this case.
export const adminDb = getApps().length ? admin.database() : undefined;
export const adminAuth = getApps().length ? admin.auth() : undefined;
