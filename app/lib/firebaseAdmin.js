import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function getAdminConfig() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const missing = [
    ["FIREBASE_ADMIN_PROJECT_ID", projectId],
    ["FIREBASE_ADMIN_CLIENT_EMAIL", clientEmail],
    ["FIREBASE_ADMIN_PRIVATE_KEY", privateKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Firebase Admin configuration is missing: ${missing.join(", ")}`);
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

export function getFirebaseAdminApp() {
  if (getApps().length > 0) return getApp();
  return initializeApp({ credential: cert(getAdminConfig()) });
}

export function getFirebaseAdminMessaging() {
  return getMessaging(getFirebaseAdminApp());
}
