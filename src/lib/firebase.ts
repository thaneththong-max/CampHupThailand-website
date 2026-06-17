/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocs, collection, setDoc, query, limit, updateDoc } from 'firebase/firestore';

// Credentials retrieved from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0582382898",
  appId: "1:126996742236:web:6e92bd175f8f114504e699",
  apiKey: "AIzaSyAGqpXB9EPZKdasXaKuzPUTfq7zk8nU6Vw",
  authDomain: "gen-lang-client-0582382898.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-d638aae0-e287-4cf6-a47c-a4a58acc2dc2",
  storageBucket: "gen-lang-client-0582382898.firebasestorage.app",
  messagingSenderId: "126996742236"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Facebook Auth Provider
export const facebookProvider = new FacebookAuthProvider();

export async function registerOrFetchUser(uid: string, email: string, displayName: string, photoURL?: string) {
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userDocRef);
  
  if (userSnapshot.exists()) {
    return userSnapshot.data();
  } else {
    // Check if there are any users in the users collection to determine the first user
    const usersQuery = query(collection(db, "users"), limit(1));
    const querySnapshot = await getDocs(usersQuery);
    const isFirstUser = querySnapshot.empty;
    
    // Assign role
    const role = isFirstUser ? "admin" : "user";
    const userData = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || '',
      role,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(userDocRef, userData);
    
    // Also update auth profile if displayName is provided
    if (auth.currentUser && !auth.currentUser.displayName && userData.displayName) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: userData.displayName,
          photoURL: userData.photoURL
        });
      } catch (err) {
        console.error('Error updating auth profile:', err);
      }
    }
    
    return userData;
  }
}

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
};
export type { User };
