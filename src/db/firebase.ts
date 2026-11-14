// src/db/firebase.ts: Инициализация и синхронизация Google Firebase Firestore

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore, Firestore, doc, setDoc, getDoc, onSnapshot
} from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'sklad_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConfig | null {
  // 1. Проверяем переменные окружения
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }

  // 2. Проверяем сохраненный в браузере конфиг
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Игнорируем
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function initFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, db: null };
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    dbInstance = getFirestore(appInstance);
    return { app: appInstance, db: dbInstance };
  } catch (err) {
    console.warn('Ошибка инициализации Firebase:', err);
    return { app: null, db: null };
  }
}

export const { app, db } = initFirebase();
