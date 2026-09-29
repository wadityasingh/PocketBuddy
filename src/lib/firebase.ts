import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StudentUser } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.warn('Firebase connection: client appears offline, check network.');
    }
    return false;
  }
}

// Auto-test connection on module load
testConnection().catch(() => {});

/**
 * Sign in with Google Popup and returns the user object
 */
export async function signInWithGoogle(): Promise<{
  firebaseUser: FirebaseUser;
  studentUser: StudentUser;
}> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;

    const studentUser: StudentUser = {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Student',
      email: fbUser.email || '',
      phone: fbUser.phoneNumber || undefined,
      photoUrl: fbUser.photoURL || undefined,
      monthlyPocketMoney: 0,
      hasCompletedTour: false,
      createdAt: new Date().toISOString(),
    };

    // Save profile to Firestore
    await saveUserProfileToFirestore(studentUser);

    return { firebaseUser: fbUser, studentUser };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFromFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Error signing out from Firebase:', e);
  }
}

/**
 * Save user profile document to /users/{userId}
 */
export async function saveUserProfileToFirestore(user: StudentUser): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== user.id) {
    return;
  }
  const path = `users/${user.id}`;
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        collegeName: user.collegeName || null,
        upiId: user.upiId || null,
        photoUrl: user.photoUrl || null,
        monthlyPocketMoney: user.monthlyPocketMoney || 0,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user profile document from /users/{userId}
 */
export async function loadUserProfileFromFirestore(userId: string): Promise<StudentUser | null> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return null;
  }
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as StudentUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save user financial state to /users/{userId}/data/state
 */
export async function saveUserDataToFirestore(userId: string, data: any): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    // Only attempt Firestore write if the client is authenticated via Firebase Auth for this user ID
    return;
  }
  const path = `users/${userId}/data/state`;
  try {
    const stateRef = doc(db, 'users', userId, 'data', 'state');
    await setDoc(
      stateRef,
      {
        userId,
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user financial state from /users/{userId}/data/state
 */
export async function loadUserDataFromFirestore(userId: string): Promise<any | null> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return null;
  }
  const path = `users/${userId}/data/state`;
  try {
    const stateRef = doc(db, 'users', userId, 'data', 'state');
    const snap = await getDoc(stateRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export { onAuthStateChanged };
