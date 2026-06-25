import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCjBceVBc1XkHgtwJ9CDQQV7MJ-YSmeYqQ',
  authDomain: 'marketplace-e57cf.firebaseapp.com',
  projectId: 'marketplace-e57cf',
  storageBucket: 'marketplace-e57cf.firebasestorage.app',
  messagingSenderId: '1056529005666',
  appId: '1:1056529005666:web:9e9d59ac2f21bd1a38a53b',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth;
try {
  auth = initializeAuth(app, {
    persistence:
      Platform.OS === 'web'
        ? browserLocalPersistence
        : getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}
export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
