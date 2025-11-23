// src/services/cloudSave.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import {
  EmojiFighter,
  PlayerUpgrades,
  Difficulty,
  Artifact,
} from '../types';

// ------------------
// Firebase INIT
// ------------------

// Šeit izmanto savus Firebase credentials!
// Vite projektam liec .env failā:
//
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_STORAGE_BUCKET=...
// VITE_FIREBASE_MESSAGING_SENDER_ID=...
// VITE_FIREBASE_APP_ID=...
//
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
});

// ------------------
// SAVE DATA TYPE
// ------------------

export interface CloudSaveData {
  gold: number;
  upgrades: PlayerUpgrades;
  inventory: Artifact[];
  equippedArtifactIds: string[];
  unlockedZoneIds: string[];
  currentZoneId: string;
  selectedFighterId: string;
  fighters: EmojiFighter[];
  difficulty: Difficulty;
  referralClaimed: boolean;
}

// ------------------
// AUTH HELPERS
// ------------------

export function signInWithGoogle(): Promise<User> {
  return signInWithPopup(auth, provider).then((result) => {
    const user = result.user;
    return user;
  });
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export function onAuthChanged(
  callback: (user: User | null) => void,
): () => void {
  // atgriež unsubscribe funkciju
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// ------------------
// CLOUD SAVE
// ------------------

// Saglabā datus Firestore kolekcijā "saves"
// dokuments = user.uid
export async function saveGameToCloud(
  userId: string,
  data: CloudSaveData,
): Promise<void> {
  const ref = doc(db, 'saves', userId);
  await setDoc(ref, data, { merge: true });
}

// Nolasīt saglabāto spēli
export async function loadGameFromCloud(
  userId: string,
): Promise<CloudSaveData | null> {
  const ref = doc(db, 'saves', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as CloudSaveData;
  return data;
}
