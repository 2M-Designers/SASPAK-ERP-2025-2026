import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCwnRPL5_hpb5YW3AMIYATa0O_XRpI3oAs",
  authDomain: "al-emad-vehicle-cleaning-app.firebaseapp.com",
  projectId: "al-emad-vehicle-cleaning-app",
  storageBucket: "al-emad-vehicle-cleaning-app.firebasestorage.app",
  messagingSenderId: "483682841982",
  appId: "1:483682841982:web:d95764bd56dbb61d26ef2f",
  measurementId: "G-4JKJPVFQT8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

export { app, messaging };
