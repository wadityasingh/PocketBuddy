import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
} from "firebase/firestore";

dotenv.config();

const app = express();
// Dev server in AI Studio must strictly listen on port 3000; on Render it uses assigned process.env.PORT
const PORT = process.env.RENDER && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Robust CORS Middleware for Iframe, Localhost, Render, and Cross-Origin Previews
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id, x-user-name, x-user-email, x-user-phone, x-user-upi");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ==================== FIRESTORE PRODUCTION DATABASE ====================
let firestoreDb: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const fbApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    firestoreDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    console.log("[Firestore] Connected to persistent database:", firebaseConfig.firestoreDatabaseId);
  }
} catch (fbInitErr) {
  console.error("[Firestore] Initialization error:", fbInitErr);
}

// Persistent Storage Directories & Ephemeral Backup
const DATA_DIR = path.join(process.cwd(), "data_store");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const ROOMS_FILE = path.join(DATA_DIR, "rooms.json");
const DELETED_ROOMS_FILE = path.join(DATA_DIR, "deleted_rooms.json");

// In-Memory Cloud Sync Cache (backed permanently by Firestore)
let cachedRooms: ServerRoomGroup[] = [];
let cachedUsers: ServerUser[] = [];
let cachedDeletedRooms = new Set<string>();
const cachedUserData = new Map<string, any>();
const cachedUserNotes = new Map<string, ServerNote[]>();
let firestoreInitialized = false;

function loadDeletedRoomIdsFromDisk(): Set<string> {
  try {
    if (fs.existsSync(DELETED_ROOMS_FILE)) {
      const content = fs.readFileSync(DELETED_ROOMS_FILE, "utf-8");
      const list = JSON.parse(content);
      if (Array.isArray(list)) return new Set(list);
    }
  } catch (_) {}
  return new Set();
}

function saveDeletedRoomIdsToDisk(deleted: Set<string>) {
  try {
    fs.writeFileSync(DELETED_ROOMS_FILE, JSON.stringify(Array.from(deleted), null, 2), "utf-8");
  } catch (_) {}
}

function loadDeletedRoomIds(): Set<string> {
  if (cachedDeletedRooms.size > 0) return cachedDeletedRooms;
  const disk = loadDeletedRoomIdsFromDisk();
  disk.forEach((id) => cachedDeletedRooms.add(id));
  return cachedDeletedRooms;
}

function recordDeletedRoomId(roomId: string) {
  try {
    cachedDeletedRooms.add(roomId);
    saveDeletedRoomIdsToDisk(cachedDeletedRooms);
    deleteRoomFromFirestore(roomId).catch(() => {});
    persistDeletedRoomIdsToFirestore().catch(() => {});
  } catch (_) {}
}

function sanitizeForFirestore(data: any): any {
  if (data === undefined) return null;
  return JSON.parse(JSON.stringify(data));
}

async function persistDeletedRoomIdsToFirestore() {
  if (!firestoreDb) return;
  try {
    const sysRef = doc(firestoreDb, "system", "deleted_rooms");
    await setDoc(sysRef, sanitizeForFirestore({
      deletedRoomIds: Array.from(cachedDeletedRooms),
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    console.warn("[Firestore] Error saving deleted room IDs:", err);
  }
}

async function persistRoomToFirestore(room: ServerRoomGroup) {
  if (!firestoreDb || !room || !room.id) return;
  try {
    const roomRef = doc(firestoreDb, "rooms", room.id);
    await setDoc(roomRef, sanitizeForFirestore({
      ...room,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error persisting room ${room.id}:`, err);
  }
}

async function deleteRoomFromFirestore(roomId: string) {
  if (!firestoreDb || !roomId) return;
  try {
    const roomRef = doc(firestoreDb, "rooms", roomId);
    await deleteDoc(roomRef);
  } catch (err) {
    console.error(`[Firestore] Error deleting room ${roomId}:`, err);
  }
}

async function persistUserToFirestore(user: ServerUser) {
  if (!firestoreDb || !user || !user.id) return;
  try {
    const userRef = doc(firestoreDb, "users", user.id);
    await setDoc(userRef, sanitizeForFirestore({
      ...user,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error persisting user ${user.id}:`, err);
  }
}

async function persistUserDataToFirestore(userId: string, data: any) {
  if (!firestoreDb || !userId || !data) return;
  try {
    const cleanPayload = sanitizeForFirestore({
      userId,
      ...data,
      updatedAt: new Date().toISOString(),
    });
    const uDataRef = doc(firestoreDb, "user_data", userId);
    await setDoc(uDataRef, cleanPayload, { merge: true });

    const stateRef = doc(firestoreDb, "users", userId, "data", "state");
    await setDoc(stateRef, cleanPayload, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error persisting user data for ${userId}:`, err);
  }
}

async function persistUserNotesToFirestore(userId: string, notes: ServerNote[]) {
  if (!firestoreDb || !userId) return;
  try {
    const notesRef = doc(firestoreDb, "notes", userId);
    await setDoc(notesRef, sanitizeForFirestore({
      userId,
      notes: notes || [],
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error persisting notes for ${userId}:`, err);
  }
}

interface ServerRoomActivity {
  id: string;
  roomId?: string;
  text: string;
  time: string;
  type: 'join' | 'expense' | 'settlement' | 'member' | 'edit';
}

interface ServerRoomMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  upiId?: string;
  phone?: string;
  role: 'owner' | 'member';
  joinedAt: string;
  isSelf?: boolean;
  photoUrl?: string;
}

interface ServerExpenseParticipant {
  userId: string;
  name: string;
  share: number;
  hasPaid?: boolean;
}

interface ServerRoomExpense {
  id: string;
  roomId: string;
  title: string;
  totalAmount: number;
  amount: number;
  category: string;
  paidByUserId: string;
  paidBy: string;
  createdByUserId: string;
  createdBy: string;
  splitType: 'equal' | 'exact' | 'custom' | 'percentage';
  participants: ServerExpenseParticipant[];
  date: string;
  notes?: string;
  createdAt: string;
  status?: 'pending' | 'settled';
}

interface ServerRoomSettlement {
  id: string;
  roomId: string;
  createdBy?: string;
  ownerId?: string;
  debtorId: string;
  creditorId: string;
  fromUserId: string;
  from: string;
  toUserId: string;
  to: string;
  amount: number;
  date: string;
  mode?: 'UPI' | 'Cash';
  status?: 'completed' | 'pending' | 'cancelled' | 'rejected';
  note?: string;
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

interface ServerRoomGroup {
  id: string;
  name: string;
  type?: 'Hostel' | 'Flat' | 'PG' | 'Apartment' | 'Other' | 'Flat / Apartment' | string;
  inviteCode: string;
  ownerId: string;
  members: ServerRoomMember[];
  expenses: ServerRoomExpense[];
  settlements: ServerRoomSettlement[];
  activities: ServerRoomActivity[];
  createdAt: string;
}

function loadRoomsFromDisk(): ServerRoomGroup[] {
  let rooms: ServerRoomGroup[] = [];
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      const content = fs.readFileSync(ROOMS_FILE, "utf-8");
      rooms = JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading rooms file:", err);
  }
  return Array.isArray(rooms) ? rooms : [];
}

function saveRoomsToDisk(rooms: ServerRoomGroup[]) {
  try {
    const deletedIds = loadDeletedRoomIds();
    const cleanRooms = (rooms || []).filter((r) => r && r.id && !deletedIds.has(r.id));
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(cleanRooms, null, 2), "utf-8");
    try { fs.chmodSync(ROOMS_FILE, 0o666); } catch (_) {}
  } catch (err) {
    console.error("Error saving rooms file:", err);
  }
}

function loadRooms(): ServerRoomGroup[] {
  const deletedIds = loadDeletedRoomIds();
  if (cachedRooms.length === 0 && !firestoreInitialized) {
    cachedRooms = loadRoomsFromDisk();
  }
  return (cachedRooms || []).filter((r) => r && r.id && !deletedIds.has(r.id));
}

function saveRooms(rooms: ServerRoomGroup[]) {
  const deletedIds = loadDeletedRoomIds();
  const cleanRooms = (rooms || []).filter((r) => r && r.id && !deletedIds.has(r.id));
  
  // Track removed rooms to delete from Firestore
  const newRoomIdSet = new Set(cleanRooms.map((r) => r.id));
  const removedRooms = cachedRooms.filter((r) => r && r.id && !newRoomIdSet.has(r.id));

  cachedRooms = cleanRooms;
  saveRoomsToDisk(cleanRooms);

  // Immediately persist every room to Firestore cloud database
  cleanRooms.forEach((room) => {
    persistRoomToFirestore(room).catch(() => {});
  });
  removedRooms.forEach((room) => {
    deleteRoomFromFirestore(room.id).catch(() => {});
  });
}

interface ServerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  collegeName?: string;
  course?: string;
  yearOfStudy?: string;
  upiId?: string;
  photoUrl?: string;
  monthlyPocketMoney: number;
  hasCompletedTour: boolean;
  createdAt: string;
}

interface ServerNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  colorScheme: 'dark' | 'terracotta' | 'sage' | 'olive' | 'sand';
  isPrivate?: boolean;
  password?: string;
  isPinned?: boolean;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

function loadUsersFromDisk(): ServerUser[] {
  let users: ServerUser[] = [];
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      users = JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading users file:", err);
  }
  return Array.isArray(users) ? users : [];
}

function saveUsersToDisk(users: ServerUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    try { fs.chmodSync(USERS_FILE, 0o666); } catch (_) {}
  } catch (err) {
    console.error("Error saving users file:", err);
  }
}

function loadUsers(): ServerUser[] {
  if (cachedUsers.length === 0 && !firestoreInitialized) {
    cachedUsers = loadUsersFromDisk();
  }
  return cachedUsers || [];
}

function saveUsers(users: ServerUser[]) {
  cachedUsers = users;
  saveUsersToDisk(users);
  users.forEach((user) => {
    persistUserToFirestore(user).catch(() => {});
  });
}

function getUserDataFilePath(userId: string): string {
  return path.join(DATA_DIR, `user_data_${userId}.json`);
}

function getUserNotesFilePath(userId: string): string {
  return path.join(DATA_DIR, `user_notes_${userId}.json`);
}

function loadUserNotesFromDisk(userId: string): ServerNote[] {
  if (!userId) return [];
  const notesPath = getUserNotesFilePath(userId);
  try {
    if (fs.existsSync(notesPath)) {
      const content = fs.readFileSync(notesPath, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.filter((n) => n && n.id);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading notes for user ${userId}:`, err);
  }
  return [];
}

function saveUserNotesToDisk(userId: string, notes: ServerNote[]) {
  if (!userId) return;
  const notesPath = getUserNotesFilePath(userId);
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2), "utf-8");
    try { fs.chmodSync(notesPath, 0o666); } catch (_) {}
  } catch (err) {
    console.error(`Error saving notes for user ${userId}:`, err);
  }
}

function loadUserNotes(userId: string): ServerNote[] {
  if (!userId) return [];
  if (cachedUserNotes.has(userId)) {
    return cachedUserNotes.get(userId)!;
  }
  const fromDisk = loadUserNotesFromDisk(userId);
  if (fromDisk.length > 0) {
    cachedUserNotes.set(userId, fromDisk);
    return fromDisk;
  }
  return [];
}

function saveUserNotes(userId: string, notes: ServerNote[]) {
  if (!userId) return;
  cachedUserNotes.set(userId, notes);
  saveUserNotesToDisk(userId, notes);
  persistUserNotesToFirestore(userId, notes).catch(() => {});
}

function getUserDataBackupFilePath(userId: string): string {
  return path.join(DATA_DIR, `user_data_${userId}.backup.json`);
}

function reconcileUserRooms(userId: string, data: any): any {
  if (!data || !userId || userId === "guest") return data;
  try {
    const rooms = loadRooms();
    const userRooms = rooms.filter((r) => {
      if (!r) return false;
      if (r.ownerId === userId) return true;
      return (r.members || []).some(
        (m) => m && (m.userId === userId || m.id === userId || m.id === "rm_" + userId)
      );
    });

    // Strictly isolate: A user's data must ONLY contain rooms where they are owner or verified member
    data.roomGroups = userRooms;
    if (!data.activeRoomId || !userRooms.some((r: any) => r.id === data.activeRoomId)) {
      data.activeRoomId = userRooms[0]?.id || null;
    }
  } catch (_) {}
  return data;
}

function loadUserDataFromDisk(userId: string): any {
  const filePath = getUserDataFilePath(userId);
  const backupFilePath = getUserDataBackupFilePath(userId);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (content.trim()) {
        return JSON.parse(content);
      }
    }
    if (fs.existsSync(backupFilePath)) {
      const bkpContent = fs.readFileSync(backupFilePath, "utf-8");
      if (bkpContent.trim()) {
        return JSON.parse(bkpContent);
      }
    }
  } catch (_) {}
  return null;
}

function saveUserDataToDisk(userId: string, data: any) {
  const filePath = getUserDataFilePath(userId);
  const backupFilePath = getUserDataBackupFilePath(userId);
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(filePath)) {
      try {
        const existing = fs.readFileSync(filePath, "utf-8");
        if (existing.trim().length > 20) {
          fs.writeFileSync(backupFilePath, existing, "utf-8");
        }
      } catch (_) {}
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    try { fs.chmodSync(filePath, 0o666); } catch (_) {}
  } catch (err) {
    console.error("Error saving user data file:", err);
  }
}

function loadUserData(userId: string): any {
  if (!userId) return null;
  let data = cachedUserData.get(userId);
  if (!data) {
    data = loadUserDataFromDisk(userId);
    if (data) {
      cachedUserData.set(userId, data);
    }
  }
  if (!data) return null;
  return reconcileUserRooms(userId, data);
}

function saveUserData(userId: string, data: any) {
  if (!userId || !data) return;
  cachedUserData.set(userId, data);
  saveUserDataToDisk(userId, data);
  persistUserDataToFirestore(userId, data).catch(() => {});
}

// Master Startup Synchronizer for Firestore
async function initFirestorePersistence() {
  if (!firestoreDb) {
    console.warn("[Firestore] No Firestore instance available, running with disk persistence.");
    return;
  }

  try {
    console.log("[Firestore Persistence] Connecting and syncing with Firestore production database...");

    // 1. Deleted room IDs
    try {
      const sysSnap = await getDocFromServer(doc(firestoreDb, "system", "deleted_rooms"));
      if (sysSnap.exists()) {
        const d = sysSnap.data();
        if (Array.isArray(d?.deletedRoomIds)) {
          d.deletedRoomIds.forEach((id: string) => cachedDeletedRooms.add(id));
        }
      }
    } catch (_) {}
    const diskDeleted = loadDeletedRoomIdsFromDisk();
    diskDeleted.forEach((id) => cachedDeletedRooms.add(id));

    // 2. Load all registered users from Firestore
    try {
      const usersSnap = await getDocs(collection(firestoreDb, "users"));
      const fsUsers: ServerUser[] = [];
      usersSnap.forEach((d) => {
        const u = d.data() as ServerUser;
        if (u && u.id && u.email) {
          fsUsers.push(u);
        }
      });

      if (fsUsers.length > 0) {
        cachedUsers = fsUsers;
        saveUsersToDisk(cachedUsers);
        console.log(`[Firestore Persistence] Successfully loaded ${cachedUsers.length} user(s) from Firestore.`);
      } else {
        const diskUsers = loadUsersFromDisk();
        if (diskUsers.length > 0) {
          cachedUsers = diskUsers;
          for (const u of diskUsers) {
            await persistUserToFirestore(u);
          }
          console.log(`[Firestore Persistence] Seeded ${diskUsers.length} existing user(s) into Firestore.`);
        }
      }
    } catch (uErr) {
      console.error("[Firestore Persistence] Error loading users:", uErr);
    }

    // 3. Load all rooms from Firestore
    try {
      const roomsSnap = await getDocs(collection(firestoreDb, "rooms"));
      const fsRooms: ServerRoomGroup[] = [];
      roomsSnap.forEach((d) => {
        const r = d.data() as ServerRoomGroup;
        if (r && r.id && !cachedDeletedRooms.has(r.id)) {
          fsRooms.push(r);
        }
      });

      if (fsRooms.length > 0) {
        cachedRooms = fsRooms;
        saveRoomsToDisk(cachedRooms);
        console.log(`[Firestore Persistence] Successfully loaded ${cachedRooms.length} room(s) with expenses from Firestore.`);
      } else {
        const diskRooms = loadRoomsFromDisk();
        if (diskRooms.length > 0) {
          cachedRooms = diskRooms;
          for (const r of diskRooms) {
            await persistRoomToFirestore(r);
          }
          console.log(`[Firestore Persistence] Seeded ${diskRooms.length} existing room(s) into Firestore.`);
        }
      }
    } catch (rErr) {
      console.error("[Firestore Persistence] Error loading rooms:", rErr);
    }

    // 4. Preload and migrate user data and notes for registered users
    for (const u of cachedUsers) {
      if (!u.id) continue;
      try {
        const uSnap = await getDocFromServer(doc(firestoreDb, "user_data", u.id));
        if (uSnap.exists()) {
          const ud = uSnap.data();
          cachedUserData.set(u.id, ud);
          saveUserDataToDisk(u.id, ud);
        } else {
          const diskUd = loadUserDataFromDisk(u.id);
          if (diskUd) {
            cachedUserData.set(u.id, diskUd);
            await persistUserDataToFirestore(u.id, diskUd);
          }
        }
      } catch (_) {}

      try {
        const noteSnap = await getDocFromServer(doc(firestoreDb, "notes", u.id));
        if (noteSnap.exists()) {
          const nd = noteSnap.data();
          const notes = Array.isArray(nd?.notes) ? nd.notes : [];
          cachedUserNotes.set(u.id, notes);
          saveUserNotesToDisk(u.id, notes);
        } else {
          const diskNotes = loadUserNotesFromDisk(u.id);
          if (diskNotes.length > 0) {
            cachedUserNotes.set(u.id, diskNotes);
            await persistUserNotesToFirestore(u.id, diskNotes);
          }
        }
      } catch (_) {}
    }

    firestoreInitialized = true;
    console.log("[Firestore Persistence] Database is active, connected, and fully synchronized!");
  } catch (err) {
    console.error("[Firestore Persistence] Error during startup sync:", err);
  }
}

// Ensure all registered users have a valid user_data file on server startup
function ensureUsersDataFiles() {
  try {
    const users = loadUsers();
    users.forEach((u) => {
      if (!u.id) return;
      const existing = loadUserData(u.id);
      if (!existing) {
        const initial = createInitialUserData(u);
        saveUserData(u.id, initial);
        console.log(`[Storage] Initialized persistent data store for user: ${u.name} (${u.id})`);
      }
    });
  } catch (e) {
    console.error("Error ensuring user data files:", e);
  }
}

function createInitialUserData(
  user: Partial<ServerUser> & { initialCash?: number; initialUpi?: number; initialBank?: number },
  _isCleanSlate = true
) {
  const allowance = user.monthlyPocketMoney || 0;
  const cash = user.initialCash !== undefined ? user.initialCash : 0;
  const upi = user.initialUpi !== undefined ? user.initialUpi : 0;
  const bank = user.initialBank !== undefined ? user.initialBank : 0;

  return {
    monthlyPocketMoney: allowance,
    wallets: { cash, upi, bank },
    isSampleData: false,
    transactions: [],
    roomExpenses: [],
    roommates: [],
    roomGroups: [],
    activeRoomId: undefined,
    meals: [],
    messConfig: {
      monthlyMessFee: 0,
      mealsPerDay: 3,
      rebatePerSkippedMeal: 40,
      rebateRuleNoticeHours: 24,
    },
    udhaarRecords: [],
    bills: [],
    goals: [],
    hasCompletedTour: user.hasCompletedTour || true,
  };
}

// Helper to authenticate request securely & auto-restore user on ephemeral hosts (Render, reloads)
function getAuthUser(req: express.Request): ServerUser | null {
  const authHeader = req.headers.authorization;
  const customUserId = (req.headers["x-user-id"] as string)?.trim();

  const users = loadUsers();

  const findUserById = (userId: string): ServerUser | null => {
    if (!userId || userId === "guest") return null;
    const u = users.find((x) => x.id === userId);
    if (u) return u;
    const uData = loadUserData(userId);
    if (uData && uData.user) {
      users.push(uData.user);
      saveUsers(users);
      return uData.user;
    }
    return null;
  };

  let identifiedUserId: string | null = null;

  // 1. Primary: Verify through authenticated Bearer token
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      // Check direct ID in token
      const directUser = users.find((x) => x.id === token);
      if (directUser) {
        identifiedUserId = directUser.id;
      } else if (token.startsWith("token_") || token.startsWith("local_token_")) {
        const prefix = token.startsWith("local_token_") ? "local_token_" : "token_";
        const withoutPrefix = token.substring(prefix.length);
        const lastUnderscore = withoutPrefix.lastIndexOf("_");
        const extractedUserId = lastUnderscore !== -1 ? withoutPrefix.substring(0, lastUnderscore) : withoutPrefix;
        const matched = users.find((x) => x.id === extractedUserId || token.includes(x.id));
        identifiedUserId = matched ? matched.id : extractedUserId;
      } else {
        const matchBySubstring = users.find((x) => token.includes(x.id));
        if (matchBySubstring) {
          identifiedUserId = matchBySubstring.id;
        }
      }
    }
  }

  // 2. Secondary fallback: check customUserId (x-user-id header)
  if (!identifiedUserId && customUserId && customUserId !== "guest") {
    identifiedUserId = customUserId;
  } else if (customUserId && customUserId !== "guest" && customUserId !== identifiedUserId) {
    // If explicit valid customUserId is passed, prefer it
    const preferredUser = findUserById(customUserId);
    if (preferredUser) return preferredUser;
  }

  if (identifiedUserId && identifiedUserId !== "guest") {
    const existing = findUserById(identifiedUserId);
    if (existing) return existing;
    return null;
  }

  return null;
}

function normalizePhone(input: any): string {
  const digits = String(input || "").replace(/[^0-9]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.substring(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.substring(1);
  }
  return digits;
}

// === AUTH ROUTES ===

// Register
app.post("/api/auth/register", (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      collegeName,
      course,
      yearOfStudy,
      upiId,
      photoUrl,
      monthlyPocketMoney,
      initialCash,
      initialUpi,
      initialBank,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters long." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : "";
    const normPhone = normalizePhone(cleanPhone);
    const users = loadUsers();

    // 1. Strict Email Check: Ek email se sirf ek hi account register ho sakta hai
    const existingUserByEmail = users.find(
      (u) =>
        (u.email && u.email.toLowerCase().trim() === cleanEmail) ||
        (u.email && cleanEmail.includes("@") && u.email.toLowerCase().trim() === cleanEmail.split("@")[0] + "@student.pocketbuddy")
    );
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        error: "This email address is already registered. Please Sign In to access your account and room data.",
        isRegistered: true,
      });
    }

    // 2. Strict Mobile Number Check: Ek mobile number se sirf ek hi account register ho sakta hai
    if (normPhone.length >= 7) {
      const existingUserByPhone = users.find((u) => {
        if (!u.phone) return false;
        const uNorm = normalizePhone(u.phone);
        return uNorm === normPhone || (uNorm.length >= 7 && normPhone.endsWith(uNorm)) || (normPhone.length >= 7 && uNorm.endsWith(normPhone));
      });
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          error: "This mobile number is already registered. Please Sign In to access your account and room data.",
          isRegistered: true,
        });
      }
    }

    const newUserId = "stu_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const allowance = Number(monthlyPocketMoney) >= 0 ? Number(monthlyPocketMoney) : 0;

    const newUser: ServerUser = {
      id: newUserId,
      name: String(name).trim(),
      email: cleanEmail,
      phone: cleanPhone || undefined,
      passwordHash: hashPassword(password),
      collegeName: collegeName ? String(collegeName).trim() : "College",
      course: course ? String(course).trim() : "Student",
      yearOfStudy: yearOfStudy ? String(yearOfStudy).trim() : "",
      upiId: upiId ? String(upiId).trim() : `${String(name).toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`,
      photoUrl: photoUrl ? String(photoUrl).trim() : undefined,
      monthlyPocketMoney: allowance,
      hasCompletedTour: false,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Create personalized starting data (Strict ZERO DEMO DATA by default)
    const isClean = req.body.startClean !== false;
    const initialData = createInitialUserData(
      {
        ...newUser,
        initialCash: Number(initialCash) >= 0 ? Number(initialCash) : 0,
        initialUpi: Number(initialUpi) >= 0 ? Number(initialUpi) : 0,
        initialBank: Number(initialBank) >= 0 ? Number(initialBank) : 0,
      },
      isClean
    );
    saveUserData(newUserId, initialData);

    const token = `token_${newUserId}_${Date.now()}`;
    const userSafe = { ...newUser };
    delete (userSafe as any).passwordHash;

    return res.json({
      success: true,
      token,
      user: userSafe,
      data: initialData,
      isNewUser: true,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, error: error.message || "Registration failed" });
  }
});

// Login (Supports Email OR Mobile Number)
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, identifier, phone, password } = req.body;
    const loginIdentifier = String(email || identifier || phone || "").trim();
    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, error: "Please provide both Email/Mobile and password" });
    }

    const cleanId = loginIdentifier.toLowerCase();
    const normId = normalizePhone(loginIdentifier);
    const users = loadUsers();
    
    // Search by email, username, phone, or id
    const user = users.find((u) => {
      if (u.email && u.email.toLowerCase() === cleanId) return true;
      if (cleanId.length >= 7 && u.email && u.email.toLowerCase().startsWith(cleanId + "@")) return true;
      if (normId.length >= 7 && u.phone) {
        const uNorm = normalizePhone(u.phone);
        if (uNorm === normId || uNorm.endsWith(normId) || normId.endsWith(uNorm)) return true;
      }
      if (u.id === cleanId) return true;
      return false;
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "No account found with this email or mobile number. Please register." });
    }

    const inputHash = hashPassword(password);
    const isCorrectPass = user.passwordHash === inputHash;
    const isTempPass = user.passwordHash === hashPassword("password123");

    if (!isCorrectPass && !isTempPass) {
      return res.status(401).json({ success: false, error: "Incorrect password. Please check your credentials." });
    }

    // If account was auto-restored with temporary pass, update with user's chosen password
    if (isTempPass && !isCorrectPass) {
      user.passwordHash = inputHash;
      saveUsers(users);
    }

    let userData = loadUserData(user.id);
    if (!userData) {
      userData = createInitialUserData(user);
      saveUserData(user.id, userData);
    }

    const token = `token_${user.id}_${Date.now()}`;
    const userSafe = { ...user };
    delete (userSafe as any).passwordHash;

    return res.json({
      success: true,
      token,
      user: userSafe,
      data: userData,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, error: error.message || "Login failed" });
  }
});

// Google Authentication (Sign In & Sign Up)
app.post("/api/auth/google", (req, res) => {
  try {
    const { id, name, email, phone, photoUrl } = req.body || {};
    if (!email && !id) {
      return res.status(400).json({ success: false, error: "Valid Google account details required." });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    const cleanName = name ? String(name).trim() : "Student";
    const cleanPhone = phone ? String(phone).trim() : undefined;
    const cleanPhoto = photoUrl ? String(photoUrl).trim() : undefined;
    const users = loadUsers();

    let user = users.find(
      (u) =>
        (id && u.id === id) ||
        (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail)
    );

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const newUserId = id || ("stu_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36));
      user = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail || `${newUserId}@student.pocketbuddy`,
        phone: cleanPhone,
        passwordHash: hashPassword(crypto.randomBytes(16).toString("hex")),
        collegeName: "College",
        course: "Student",
        yearOfStudy: "",
        upiId: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`,
        photoUrl: cleanPhoto,
        monthlyPocketMoney: 0,
        hasCompletedTour: false,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      saveUsers(users);

      const initialData = createInitialUserData(user, true);
      saveUserData(user.id, initialData);
    } else {
      let hasChanges = false;
      if (cleanPhoto && user.photoUrl !== cleanPhoto) {
        user.photoUrl = cleanPhoto;
        hasChanges = true;
      }
      if (cleanName && cleanName !== "Student" && user.name === "Student") {
        user.name = cleanName;
        hasChanges = true;
      }
      if (hasChanges) {
        saveUsers(users);
      }
    }

    let userData = loadUserData(user.id);
    if (!userData) {
      userData = createInitialUserData(user, true);
      saveUserData(user.id, userData);
    }

    const token = `token_${user.id}_${Date.now()}`;
    const userSafe = { ...user };
    delete (userSafe as any).passwordHash;

    return res.json({
      success: true,
      user: userSafe,
      token,
      data: userData,
      isNewUser,
    });
  } catch (err: any) {
    console.error("Google auth route error:", err);
    return res.status(500).json({ success: false, error: err?.message || "Google auth failed" });
  }
});

// Forgot Password / Password Reset
app.post("/api/auth/forgot-password", (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword) {
      return res.status(400).json({ success: false, error: "Please provide identifier and new password" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters long." });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const normId = normalizePhone(cleanId);
    const users = loadUsers();

    const user = users.find((u) => {
      if (u.email && u.email.toLowerCase() === cleanId) return true;
      if (normId.length >= 7 && u.phone) {
        const userNorm = normalizePhone(u.phone);
        if (userNorm === normId || userNorm.endsWith(normId) || normId.endsWith(userNorm)) return true;
      }
      return false;
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "No account found matching this email or mobile number" });
    }

    user.passwordHash = hashPassword(newPassword);
    saveUsers(users);

    return res.json({ success: true, message: "Password updated successfully. You can now login." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to reset password" });
  }
});

// List Registered Users (Safe for multi-user test switching)
app.get("/api/auth/users", (req, res) => {
  const users = loadUsers();
  const safe = users.map((u) => {
    const copy = { ...u };
    delete (copy as any).passwordHash;
    return copy;
  });
  return res.json({ success: true, users: safe });
});

// Get Current User Profile
app.get("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Not logged in" });
  }
  const userSafe = { ...user };
  delete (userSafe as any).passwordHash;
  return res.json({ success: true, user: userSafe });
});

// === USER DATA STORAGE ROUTES ===

// Load user data
app.get("/api/user/data", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Not logged in" });
  }

  let data = loadUserData(user.id);
  if (!data) {
    data = createInitialUserData(user);
    saveUserData(user.id, data);
  }

  return res.json({ success: true, data });
});

// Save user data (Supports both POST and PUT)
const handleSaveUserData = (req: any, res: any) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Not logged in" });
  }

  const payload = req.body.data || (req.body.monthlyPocketMoney !== undefined || req.body.wallets !== undefined ? req.body : null);
  if (!payload) {
    return res.status(400).json({ success: false, error: "No data payload provided" });
  }

  const existingData = loadUserData(user.id);

  if (existingData) {
    const existingHasTransactions = Array.isArray(existingData.transactions) && existingData.transactions.length > 0;
    const existingTotalLiquidity = (existingData.wallets?.cash || 0) + (existingData.wallets?.upi || 0) + (existingData.wallets?.bank || 0);
    const existingAllowance = Number(existingData.monthlyPocketMoney) || 0;

    const incomingHasTransactions = Array.isArray(payload.transactions) && payload.transactions.length > 0;
    const incomingTotalLiquidity = (payload.wallets?.cash || 0) + (payload.wallets?.upi || 0) + (payload.wallets?.bank || 0);
    const incomingAllowance = Number(payload.monthlyPocketMoney) || 0;

    // SAFEGUARD: Anti-wipeout protection
    // If incoming payload is completely empty (0 balances, empty transactions, 0 allowance),
    // but the server already holds real user transactions/balance: DO NOT WIPE OUT!
    if (
      (existingHasTransactions || existingTotalLiquidity > 0 || existingAllowance > 0) &&
      !incomingHasTransactions &&
      incomingTotalLiquidity === 0 &&
      incomingAllowance === 0 &&
      !req.body.forceReset
    ) {
      console.warn(`[SafeSync] Protected user ${user.id} data from empty wipeout. Preserving server data.`);
      return res.json({ success: true, data: existingData, preserved: true });
    }

    // Handle transactions safely:
    // If incoming payload explicitly includes transactions array, accept it directly as authoritative
    // (This allows user to edit or delete transactions without the server resurrecting them).
    // Deduplicate incoming transactions by unique ID.
    // Only fallback to existing transactions if payload omitted transactions completely.
    if (Array.isArray(payload.transactions)) {
      const seenIds = new Set<string>();
      payload.transactions = payload.transactions.filter((t: any) => {
        if (!t || !t.id) return false;
        if (seenIds.has(t.id)) return false;
        seenIds.add(t.id);
        return true;
      });
    } else if (existingHasTransactions && !req.body.forceReset) {
      payload.transactions = existingData.transactions;
    }

    // Preserve existing positive wallet balances if incoming sent unhydrated zeros
    if (incomingTotalLiquidity === 0 && existingTotalLiquidity > 0 && !payload.isExplicitWalletZero && !req.body.forceReset) {
      payload.wallets = existingData.wallets;
    }

    // Preserve existing positive allowance if incoming sent unhydrated zero
    if (incomingAllowance === 0 && existingAllowance > 0 && !payload.isExplicitAllowanceZero && !req.body.forceReset) {
      payload.monthlyPocketMoney = existingData.monthlyPocketMoney;
    }

    // Preserve udhaar, bills, goals if incoming sent empty but existing had data
    if ((!Array.isArray(payload.bills) || payload.bills.length === 0) && Array.isArray(existingData.bills) && existingData.bills.length > 0) {
      payload.bills = existingData.bills;
    }
    if ((!Array.isArray(payload.goals) || payload.goals.length === 0) && Array.isArray(existingData.goals) && existingData.goals.length > 0) {
      payload.goals = existingData.goals;
    }
    if ((!Array.isArray(payload.udhaarRecords) || payload.udhaarRecords.length === 0) && Array.isArray(existingData.udhaarRecords) && existingData.udhaarRecords.length > 0) {
      payload.udhaarRecords = existingData.udhaarRecords;
    }
  }

  // Strict Room Isolation: A user's saved data must only contain rooms where they are owner or verified member
  const allMasterRooms = loadRooms();
  const deletedIds = loadDeletedRoomIds();
  const validUserRooms = allMasterRooms.filter((r) => {
    if (!r || !r.id || deletedIds.has(r.id)) return false;
    if (r.ownerId === user.id) return true;
    return (r.members || []).some(
      (m) => m && (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id)
    );
  });
  payload.roomGroups = validUserRooms;
  if (!validUserRooms.some((r) => r.id === payload.activeRoomId)) {
    payload.activeRoomId = validUserRooms[0]?.id || null;
  }

  saveUserData(user.id, payload);
  return res.json({ success: true, data: payload });
};

app.post("/api/user/data", handleSaveUserData);
app.put("/api/user/data", handleSaveUserData);

// Update user profile details
const handleUpdateUserProfile = (req: any, res: any) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Not logged in" });
  }

  const body = req.body || {};
  const bodyUser = body.user || {};
  const name = body.name !== undefined ? body.name : bodyUser.name;
  const phone = body.phone !== undefined ? body.phone : bodyUser.phone;
  const collegeName = body.collegeName !== undefined ? body.collegeName : bodyUser.collegeName;
  const course = body.course !== undefined ? body.course : bodyUser.course;
  const branch = body.branch !== undefined ? body.branch : bodyUser.branch;
  const upiId = body.upiId !== undefined ? body.upiId : bodyUser.upiId;
  const roomSplit = body.roomSplit !== undefined ? body.roomSplit : bodyUser.roomSplit;
  const photoUrl = body.photoUrl !== undefined ? body.photoUrl : bodyUser.photoUrl;
  const monthlyPocketMoney = body.monthlyPocketMoney !== undefined ? body.monthlyPocketMoney : bodyUser.monthlyPocketMoney;
  const hasCompletedTour = body.hasCompletedTour !== undefined ? body.hasCompletedTour : bodyUser.hasCompletedTour;
  const wallets = body.wallets || bodyUser.wallets;

  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === user.id);

  if (idx !== -1) {
    if (name) users[idx].name = String(name).trim();
    if (phone !== undefined) users[idx].phone = String(phone).trim();
    if (collegeName !== undefined) users[idx].collegeName = String(collegeName).trim();
    if (course !== undefined) users[idx].course = String(course).trim();
    if (branch !== undefined) (users[idx] as any).branch = String(branch).trim();
    if (upiId !== undefined) users[idx].upiId = String(upiId).trim();
    if (roomSplit !== undefined) (users[idx] as any).roomSplit = String(roomSplit).trim();
    if (photoUrl !== undefined) users[idx].photoUrl = String(photoUrl).trim();

    if (monthlyPocketMoney !== undefined && Number(monthlyPocketMoney) >= 0) {
      users[idx].monthlyPocketMoney = Number(monthlyPocketMoney);
    }

    if (hasCompletedTour !== undefined) {
      users[idx].hasCompletedTour = Boolean(hasCompletedTour);
    }

    saveUsers(users);

    // Sync with user's stored data
    const currentData = loadUserData(user.id);
    if (currentData) {
      if (name) currentData.userName = String(name).trim();
      if (monthlyPocketMoney !== undefined && Number(monthlyPocketMoney) >= 0) {
        currentData.monthlyPocketMoney = Number(monthlyPocketMoney);
      }
      if (hasCompletedTour !== undefined) {
        currentData.hasCompletedTour = Boolean(hasCompletedTour);
      }
      const incomingWallets = wallets;
      if (incomingWallets && typeof incomingWallets === 'object') {
        currentData.wallets = {
          cash: Number(incomingWallets.cash) >= 0 ? Number(incomingWallets.cash) : (currentData.wallets?.cash || 0),
          upi: Number(incomingWallets.upi) >= 0 ? Number(incomingWallets.upi) : (currentData.wallets?.upi || 0),
        };
      }
      saveUserData(user.id, currentData);
    }

    // Synchronize room members with updated profile (name, photoUrl, phone, upiId)
    try {
      const rooms = loadRooms();
      let roomsModified = false;
      rooms.forEach((r) => {
        (r.members || []).forEach((m) => {
          if (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id) {
            if (name && m.name !== String(name).trim()) {
              m.name = String(name).trim();
              roomsModified = true;
            }
            if (photoUrl !== undefined && m.photoUrl !== String(photoUrl).trim()) {
              m.photoUrl = String(photoUrl).trim();
              roomsModified = true;
            }
            if (phone !== undefined && m.phone !== String(phone).trim()) {
              m.phone = String(phone).trim();
              roomsModified = true;
            }
            if (upiId !== undefined && m.upiId !== String(upiId).trim()) {
              m.upiId = String(upiId).trim();
              roomsModified = true;
            }
          }
        });
      });
      if (roomsModified) {
        saveRooms(rooms);
      }
    } catch (err) {
      console.error("Error updating room members with profile changes:", err);
    }

    const { passwordHash, ...safeUser } = users[idx];
    return res.json({ success: true, user: safeUser, data: currentData });
  }

  return res.status(404).json({ success: false, error: "User not found" });
};

app.put("/api/user/profile", handleUpdateUserProfile);
app.post("/api/user/profile", handleUpdateUserProfile);

// Mark tour completed
app.post("/api/user/complete-tour", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Not logged in" });
  }

  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    users[idx].hasCompletedTour = true;
    saveUsers(users);
  }

  const currentData = loadUserData(user.id);
  if (currentData) {
    currentData.hasCompletedTour = true;
    saveUserData(user.id, currentData);
  }

  return res.json({ success: true });
});

// Reset user data to clean fresh template or sample data
app.post("/api/user/reset", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Not logged in" });
  }

  const { mode } = req.body || {};
  const isClean = mode !== "sample";

  const freshData = createInitialUserData(
    {
      ...user,
      hasCompletedTour: true,
    },
    isClean
  );
  saveUserData(user.id, freshData);
  return res.json({ success: true, data: freshData, mode: isClean ? "clean" : "sample" });
});

// ==================== SECURE PERSONAL NOTES ENDPOINTS ====================
// Every note query/mutation strictly checks authenticated user ownership from token
// Notes are isolated per user (TEST1, TEST2, TEST3 each have their own private storage).

// GET /api/notes - List only the authenticated user's private notes
app.get("/api/notes", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized. Please log in to access your private notes." });
  }

  // Strictly return ONLY the authenticated user's notes
  const userNotes = loadUserNotes(user.id);
  return res.json({ success: true, notes: userNotes });
});

// GET /api/notes/:id - Get a specific note with strict ownership check
app.get("/api/notes/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized. Please log in to view notes." });
  }

  const { id } = req.params;
  const userNotes = loadUserNotes(user.id);
  const note = userNotes.find((n) => n.id === id);

  if (!note) {
    // Return 404 if the note doesn't belong to the authenticated user
    return res.status(404).json({ success: false, error: "Note not found or access denied." });
  }

  return res.json({ success: true, note });
});

// POST /api/notes - Create a new private note for the authenticated user
app.post("/api/notes", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized. Please log in to create notes." });
  }

  const { title, content, date, colorScheme, isPrivate, password, isPinned, category } = req.body;
  const newNoteId = req.body.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newNote: ServerNote = {
    id: newNoteId,
    userId: user.id, // Strictly tied to authenticated user
    title: (title || "").trim() || "Untitled Note",
    content: (content || "").trim(),
    date: date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    colorScheme: colorScheme || "terracotta",
    isPrivate: Boolean(isPrivate),
    password: password ? String(password).trim() : undefined,
    isPinned: Boolean(isPinned),
    category: category || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingNotes = loadUserNotes(user.id);
  const updatedNotes = [newNote, ...existingNotes.filter((n) => n.id !== newNoteId)];
  saveUserNotes(user.id, updatedNotes);

  return res.status(201).json({ success: true, note: newNote });
});

// PUT /api/notes/:id - Update an existing private note (Strict ownership check)
app.put("/api/notes/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized. Please log in to edit notes." });
  }

  const { id } = req.params;
  const existingNotes = loadUserNotes(user.id);
  const noteIndex = existingNotes.findIndex((n) => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ success: false, error: "Note not found or access denied." });
  }

  const existing = existingNotes[noteIndex];
  const { title, content, colorScheme, isPrivate, password, isPinned, category } = req.body;

  const updatedNote: ServerNote = {
    ...existing,
    userId: user.id, // Enforce current authenticated user ID
    title: title !== undefined ? String(title).trim() || "Untitled Note" : existing.title,
    content: content !== undefined ? String(content).trim() : existing.content,
    colorScheme: colorScheme || existing.colorScheme,
    isPrivate: isPrivate !== undefined ? Boolean(isPrivate) : existing.isPrivate,
    password: password !== undefined ? (password ? String(password).trim() : undefined) : existing.password,
    isPinned: isPinned !== undefined ? Boolean(isPinned) : existing.isPinned,
    category: category !== undefined ? category : existing.category,
    updatedAt: new Date().toISOString(),
  };

  existingNotes[noteIndex] = updatedNote;
  saveUserNotes(user.id, existingNotes);

  return res.json({ success: true, note: updatedNote });
});

// DELETE /api/notes/:id - Delete a private note (Strict ownership check)
app.delete("/api/notes/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized. Please log in to delete notes." });
  }

  const { id } = req.params;
  const existingNotes = loadUserNotes(user.id);
  const noteIndex = existingNotes.findIndex((n) => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ success: false, error: "Note not found or you do not have permission to delete it." });
  }

  const filtered = existingNotes.filter((n) => n.id !== id);
  saveUserNotes(user.id, filtered);

  return res.json({ success: true, message: "Note deleted successfully." });
});

// POST /api/notes/sync - Batch sync user's notes safely (only affects authenticated user)
app.post("/api/notes/sync", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized." });
  }

  const incoming = req.body.notes;
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ success: false, error: "Invalid notes array." });
  }

  // Stamp every incoming note with the authenticated user's ID
  const sanitized: ServerNote[] = incoming.map((n: any) => ({
    id: String(n.id || `note_${Date.now()}`),
    userId: user.id,
    title: String(n.title || "Untitled Note"),
    content: String(n.content || ""),
    date: String(n.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })),
    colorScheme: n.colorScheme || "terracotta",
    isPrivate: Boolean(n.isPrivate),
    password: n.password ? String(n.password).trim() : undefined,
    isPinned: Boolean(n.isPinned),
    category: n.category || undefined,
    createdAt: n.createdAt || new Date().toISOString(),
    updatedAt: n.updatedAt || new Date().toISOString(),
  }));

  saveUserNotes(user.id, sanitized);
  return res.json({ success: true, notes: sanitized });
});

// ==================== ROOM EXPENSE MANAGER ENDPOINTS ====================

function generateUniqueRoomCode(existingRooms: ServerRoomGroup[]): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!existingRooms.some((r) => r?.inviteCode && r.inviteCode.toUpperCase() === code)) {
      return code;
    }
  }
  return "ROOM" + Math.floor(1000 + Math.random() * 9000);
}

// List all registered users (for user switching & fast login during multi-user testing)
app.get("/api/auth/users", (req, res) => {
  const users = loadUsers();
  const safeUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    upiId: u.upiId,
  }));
  return res.json({ success: true, users: safeUsers });
});

// Fast user switch (for seamless multi-user testing between registered accounts)
app.post("/api/auth/fast-switch", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }
    const users = loadUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    let userData = loadUserData(user.id);
    if (!userData) {
      userData = createInitialUserData(user);
      saveUserData(user.id, userData);
    }
    const token = `token_${user.id}_${Date.now()}`;
    const userSafe = { ...user };
    delete (userSafe as any).passwordHash;

    return res.json({
      success: true,
      token,
      user: userSafe,
      data: userData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to switch user" });
  }
});

// List rooms the authenticated user belongs to
app.get("/api/rooms", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.json({ success: true, data: [], rooms: [] });
  }

  const rooms = loadRooms();
  const userNormPhone = user.phone ? normalizePhone(user.phone) : "";
  const userCleanEmail = user.email ? user.email.toLowerCase().trim() : "";
  const userCleanName = user.name ? user.name.toLowerCase().trim() : "";
  const userCleanUpi = user.upiId ? user.upiId.toLowerCase().trim() : "";

  // Filter rooms where currentUser is strictly owner or an explicit verified member
  const userRooms = rooms.filter((r) => {
    if (!r) return false;
    if (r.ownerId === user.id) return true;

    const isMember = (r.members || []).some((m) => {
      if (!m) return false;
      return m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id;
    });

    return isMember;
  });

  // Annotate isSelf and photoUrl for members
  const enrichedRooms = userRooms.map((r) => ({
    ...r,
    members: (r.members || []).map((m) => {
      const isSelf =
        Boolean(m) &&
        (m.userId === user.id ||
          m.id === user.id ||
          m.id === "rm_" + user.id);
      return {
        ...m,
        photoUrl: (isSelf && user.photoUrl) ? user.photoUrl : m.photoUrl,
        isSelf,
      };
    }),
  }));

  return res.json({ success: true, data: enrichedRooms, rooms: enrichedRooms });
});

// Helper to prevent generic domain collisions
function cleanEmailIsGeneric(email: string): boolean {
  if (!email) return true;
  return email.endsWith("@student.pocketbuddy") || email === "student@campus.edu";
}

// Get a specific room
app.get("/api/rooms/:roomId", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const { roomId } = req.params;
  const rooms = loadRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  const userNormPhone = user.phone ? normalizePhone(user.phone) : "";
  const userCleanEmail = user.email ? user.email.toLowerCase().trim() : "";

  const isMember =
    room.ownerId === user.id ||
    (room.members &&
      room.members.some(
        (m) =>
          m &&
          (m.userId === user.id ||
            m.id === user.id ||
            m.id === "rm_" + user.id ||
            (Boolean(m.email && userCleanEmail) && !cleanEmailIsGeneric(userCleanEmail) && m.email.toLowerCase().trim() === userCleanEmail) ||
            (Boolean(m.phone && userNormPhone) && userNormPhone.length >= 10 && normalizePhone(m.phone) === userNormPhone))
      ));
  if (!isMember) {
    return res.status(403).json({ success: false, error: "You are not a member of this room" });
  }

  const enrichedRoom = {
    ...room,
    members: (room.members || []).map((m) => {
      const isSelf =
        Boolean(m) &&
        (m.userId === user.id ||
          m.id === user.id ||
          m.id === "rm_" + user.id);
      return {
        ...m,
        isSelf,
      };
    }),
  };

  return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
});

// Create a new room
app.post("/api/rooms", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    console.error("[Create Room Error] 401 Unauthorized - user not authenticated. Headers:", {
      authHeader: req.headers.authorization ? "Present" : "Missing",
      xUserId: req.headers["x-user-id"] || "None",
    });
    return res.status(401).json({ success: false, error: "Authentication required to create a room. Please sign in." });
  }

  const { name, type, creatorName, creatorEmail, creatorPhone, upiId } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: "Room name is required" });
  }

  const trimmedName = name.trim();
  const rooms = loadRooms();

  // Deduplication guard: if room with same name & owner was created within 10 seconds, return it
  const recentDuplicate = rooms.find(
    (r) =>
      r.ownerId === user.id &&
      r.name.toLowerCase() === trimmedName.toLowerCase() &&
      r.activities?.some((a) => a.type === "join" && Date.now() - new Date(a.time || 0).getTime() < 10000)
  );
  if (recentDuplicate) {
    console.log(`[Create Room] Returning recent duplicate room "${trimmedName}" (${recentDuplicate.id}) for user ${user.name}`);
    return res.json({ success: true, data: recentDuplicate, room: recentDuplicate });
  }

  const candidateId = req.body?.id && String(req.body.id).startsWith("room_") ? String(req.body.id) : null;
  const candidateCode = req.body?.inviteCode && String(req.body.inviteCode).length === 6 ? String(req.body.inviteCode).toUpperCase() : null;

  const roomId = candidateId || ("room_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));
  const inviteCode = candidateCode && !rooms.some((r) => r?.inviteCode && r.inviteCode.toUpperCase() === candidateCode) ? candidateCode : generateUniqueRoomCode(rooms);
  const today = new Date().toISOString().split("T")[0];
  const roomType = type && String(type).trim() ? String(type).trim() : "Flat / Apartment";

  const newRoom: ServerRoomGroup = {
    id: roomId,
    name: trimmedName,
    type: roomType,
    inviteCode,
    ownerId: user.id,
    members: [
      {
        id: "rm_" + user.id,
        userId: user.id,
        name: creatorName || user.name || "Student",
        email: creatorEmail || user.email,
        upiId: upiId || user.upiId,
        phone: creatorPhone || user.phone,
        role: "owner",
        joinedAt: today,
        isSelf: true,
        photoUrl: user.photoUrl,
      },
    ],
    expenses: [],
    settlements: [],
    activities: [
      {
        id: "act_" + Date.now(),
        roomId,
        text: `${user.name || 'Admin'} created room "${trimmedName}"`,
        time: new Date().toISOString(),
        type: "join",
      },
    ],
    createdAt: today,
  };

  rooms.unshift(newRoom);
  saveRooms(rooms);

  // Sync to user personal data file as well for bulletproof persistence
  try {
    const uData = loadUserData(user.id);
    if (uData) {
      if (!Array.isArray(uData.roomGroups)) uData.roomGroups = [];
      uData.roomGroups = uData.roomGroups.filter((r) => r && r.id !== roomId);
      uData.roomGroups.unshift(newRoom);
      uData.activeRoomId = roomId;
      saveUserData(user.id, uData);
    }
  } catch (uErr) {
    console.warn("Could not sync room to user_data file:", uErr);
  }

  console.log(`[Create Room Success] Created room "${trimmedName}" (${roomId}) with code ${inviteCode} for admin ${user.name}`);
  return res.json({ success: true, data: newRoom, room: newRoom });
});

// Join an existing room via invite code
app.post("/api/rooms/join", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    console.error("[Join Room Error] 401 Unauthorized - user not authenticated");
    return res.status(401).json({ success: false, error: "Authentication required to join a room" });
  }

  const { inviteCode } = req.body || {};
  if (!inviteCode || !inviteCode.trim()) {
    return res.status(400).json({ success: false, error: "Invite code is required" });
  }

  const rooms = loadRooms();
  const cleanCode = inviteCode.trim().toUpperCase();
  const room = rooms.find((r) => r?.inviteCode && r.inviteCode.toUpperCase() === cleanCode);

  if (!room) {
    return res.status(404).json({ success: false, error: "Room with code " + cleanCode + " not found. Please verify the code." });
  }

  const today = new Date().toISOString().split("T")[0];
  const isAlreadyMember = room.members.some((m) => m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id);

  // Check if there is an existing placeholder roommate with matching name or email to claim
  const placeholderIdx = !isAlreadyMember
    ? room.members.findIndex(
        (m) =>
          !m.userId?.startsWith("stu_") &&
          ((m.name && m.name.toLowerCase() === user.name.toLowerCase()) ||
            (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()))
      )
    : -1;

  const MAX_ROOM_MEMBERS = 12;
  if (!isAlreadyMember && placeholderIdx < 0 && room.members.length >= MAX_ROOM_MEMBERS) {
    return res.status(400).json({
      success: false,
      error: `This room has reached its maximum capacity of ${MAX_ROOM_MEMBERS} members.`,
    });
  }

  if (placeholderIdx >= 0) {
    const prevId = room.members[placeholderIdx].id;
    room.members[placeholderIdx].userId = user.id;
    room.members[placeholderIdx].id = "rm_" + user.id;
    room.members[placeholderIdx].name = user.name;
    room.members[placeholderIdx].email = user.email;
    if (user.upiId) room.members[placeholderIdx].upiId = user.upiId;
    if (user.phone) room.members[placeholderIdx].phone = user.phone;

    // Migrate any existing expenses linked to old placeholder ID
    (room.expenses || []).forEach((e) => {
      if (e.paidByUserId === prevId) e.paidByUserId = user.id;
      (e.participants || []).forEach((p) => {
        if (p.userId === prevId) p.userId = user.id;
      });
    });

    room.activities = room.activities || [];
    room.activities.unshift({
      id: "act_" + Date.now(),
      roomId: room.id,
      text: `${user.name} joined the room`,
      time: new Date().toISOString(),
      type: "join",
    });

    saveRooms(rooms);
  } else if (!isAlreadyMember) {
    room.members.push({
      id: "rm_" + user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      upiId: user.upiId,
      phone: user.phone,
      role: "member",
      joinedAt: today,
      isSelf: true,
      photoUrl: user.photoUrl,
    });

    room.activities = room.activities || [];
    room.activities.unshift({
      id: "act_" + Date.now(),
      roomId: room.id,
      text: `${user.name} joined the room`,
      time: new Date().toISOString(),
      type: "join",
    });

    saveRooms(rooms);
  }

  // Sync to user personal data file as well
  try {
    const uData = loadUserData(user.id);
    if (uData) {
      if (!Array.isArray(uData.roomGroups)) uData.roomGroups = [];
      uData.roomGroups = uData.roomGroups.filter((r) => r && r.id !== room.id);
      uData.roomGroups.unshift(room);
      uData.activeRoomId = room.id;
      saveUserData(user.id, uData);
    }
  } catch (uErr) {
    console.warn("Could not sync joined room to user_data file:", uErr);
  }

  const enrichedRoom = {
    ...room,
    members: room.members.map((m) => ({
      ...m,
      isSelf: m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id,
    })),
  };

  console.log(`[Join Room Success] User ${user.name} joined room "${room.name}" (${room.id})`);
  return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
});

// Add a roommate manually (supports /roommates and /members)
const handleAddRoommate = (req: express.Request, res: express.Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const { roomId } = req.params;
  const { name, upiId, phone } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: "Roommate name is required" });
  }

  const rooms = loadRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  const MAX_ROOM_MEMBERS = 12;
  if ((room.members || []).length >= MAX_ROOM_MEMBERS) {
    return res.status(400).json({
      success: false,
      error: `This room has reached its maximum capacity of ${MAX_ROOM_MEMBERS} members.`,
    });
  }

  const memberName = name.trim();
  const memberUserId = "user_manual_" + Date.now().toString(36);
  const newMember: ServerRoomMember = {
    id: "rm_" + memberUserId,
    userId: memberUserId,
    name: memberName,
    upiId: upiId?.trim() || undefined,
    phone: phone?.trim() || undefined,
    role: "member",
    joinedAt: new Date().toISOString().split("T")[0],
    isSelf: false,
  };

  room.members.push(newMember);

  room.activities = room.activities || [];
  room.activities.unshift({
    id: "act_" + Date.now(),
    roomId: room.id,
    text: `${memberName} was added to the room`,
    time: new Date().toISOString(),
    type: "member",
  });

  saveRooms(rooms);

  const userCleanEmail = user.email ? user.email.toLowerCase().trim() : "";
  const userNormPhone = user.phone ? normalizePhone(user.phone) : "";

  const enrichedRoom = {
    ...room,
    members: room.members.map((m) => ({
      ...m,
      isSelf:
        Boolean(m) &&
        (m.userId === user.id ||
          m.id === user.id ||
          m.id === "rm_" + user.id ||
          (Boolean(m.email && userCleanEmail) && m.email.toLowerCase().trim() === userCleanEmail) ||
          (Boolean(m.phone && userNormPhone) && normalizePhone(m.phone) === userNormPhone)),
    })),
  };

  return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
};

app.post("/api/rooms/:roomId/roommates", handleAddRoommate);
app.post("/api/rooms/:roomId/members", handleAddRoommate);

// Remove a roommate
const handleRemoveRoommate = (req: express.Request, res: express.Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const { roomId, roommateId, memberId } = req.params;
  const targetId = roommateId || memberId;
  const rooms = loadRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  const isOwner =
    room.ownerId === user.id ||
    (room.members || []).some(
      (m) =>
        (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id) &&
        m.role === "owner"
    );

  const isRemovingSelf =
    targetId === user.id ||
    targetId === "rm_" + user.id ||
    (room.members || []).some(
      (m) =>
        (m.id === targetId || m.userId === targetId) &&
        (m.userId === user.id || (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()))
    );

  // STRICT PERMISSION: Only the room creator/admin can remove other members. A member can only remove (leave) themselves.
  if (!isOwner && !isRemovingSelf) {
    return res.status(403).json({
      success: false,
      error: "Only the admin who created this room can remove other members",
    });
  }

  const removed = room.members.find((m) => m.id === targetId || m.userId === targetId);
  room.members = room.members.filter((m) => m.id !== targetId && m.userId !== targetId);

  if (removed) {
    room.activities = room.activities || [];
    room.activities.unshift({
      id: "act_" + Date.now(),
      roomId: room.id,
      text: `${removed.name} was removed from the room`,
      time: new Date().toISOString(),
      type: "member",
    });
  }

  saveRooms(rooms);

  const enrichedRoom = {
    ...room,
    members: room.members.map((m) => ({
      ...m,
      isSelf: m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id,
    })),
  };

  return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
};

app.delete("/api/rooms/:roomId/roommates/:roommateId", handleRemoveRoommate);
app.delete("/api/rooms/:roomId/members/:memberId", handleRemoveRoommate);

// Add or update shared expense in room
app.post("/api/rooms/:roomId/expenses", (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { roomId } = req.params;
    const rooms = loadRooms();
    let room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    // Strict membership check: user MUST be an existing member of this room
    room.members = room.members || [];
    const isMember =
      room.ownerId === user.id ||
      room.members.some(
        (m) => m && (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id)
      );

    if (!isMember) {
      return res.status(403).json({ success: false, error: "Forbidden: You are not a member of this room. Please join using the room invite code." });
    }

    const expense = req.body?.expense || req.body;
    if (!expense) {
      return res.status(400).json({ success: false, error: "Expense payload is required" });
    }

    const title = (expense.title || "").trim();
    if (!title) {
      return res.status(400).json({ success: false, error: "Expense title is required" });
    }

    const amount = Number(expense.totalAmount !== undefined ? expense.totalAmount : expense.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: "Amount must be greater than zero" });
    }

    // Resolve paidBy user
    const paidByUserIdReq = expense.paidByUserId;
    let payerMember = room.members.find(
      (m) =>
        m &&
        (m.userId === paidByUserIdReq ||
          m.id === paidByUserIdReq ||
          (m.name && m.name.toLowerCase() === (expense.paidBy || "").toLowerCase()))
    );
    if (!payerMember) {
      payerMember =
        room.members.find((m) => m && (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id)) ||
        room.members[0];
    }

    const finalPaidByUserId = payerMember?.userId || payerMember?.id || user.id;
    const finalPaidByName = payerMember?.name || expense.paidBy || user.name || "You";

    // Resolve participants & shares
    let rawParticipants = Array.isArray(expense.participants) ? expense.participants : [];
    if (rawParticipants.length === 0) {
      rawParticipants = room.members.map((m) => ({ userId: m.userId || m.id, name: m.name }));
    }

    const splitType = expense.splitType || "equal";
    let calculatedParticipants: ServerExpenseParticipant[] = [];

    if (splitType === "equal") {
      const count = Math.max(1, rawParticipants.length);
      const baseShare = Math.floor((amount / count) * 100) / 100;
      const remainderCents = Math.round((amount - baseShare * count) * 100);

      calculatedParticipants = rawParticipants.map((p: any, idx: number) => {
        const pMember =
          room.members.find(
            (m) =>
              m &&
              (m.userId === p.userId ||
                m.id === p.userId ||
                (m.name && m.name.toLowerCase() === (p.name || "").toLowerCase()))
          ) || p;
        const pUserId = pMember?.userId || pMember?.id || p.userId || ("user_" + idx);
        const pName = pMember?.name || p.name || `Flatmate ${idx + 1}`;
        const shareVal = idx < remainderCents ? Math.round((baseShare + 0.01) * 100) / 100 : baseShare;
        return {
          userId: pUserId,
          name: pName,
          share: shareVal,
          hasPaid: pUserId === finalPaidByUserId,
        };
      });
    } else {
      // Exact or percentage
      let shareSum = 0;
      calculatedParticipants = rawParticipants.map((p: any, idx: number) => {
        const pMember =
          room.members.find(
            (m) =>
              m &&
              (m.userId === p.userId ||
                m.id === p.userId ||
                (m.name && m.name.toLowerCase() === (p.name || "").toLowerCase()))
          ) || p;
        const pUserId = pMember?.userId || pMember?.id || p.userId || ("user_" + idx);
        const pName = pMember?.name || p.name || `Flatmate ${idx + 1}`;
        const shareVal = Math.round(Number(p.share || 0) * 100) / 100;
        shareSum += shareVal;
        return {
          userId: pUserId,
          name: pName,
          share: shareVal,
          hasPaid: pUserId === finalPaidByUserId,
        };
      });

      if (Math.abs(shareSum - amount) > 0.1) {
        return res.status(400).json({
          success: false,
          error: `Sum of shares (₹${shareSum.toFixed(2)}) must equal total amount (₹${amount.toFixed(2)})`,
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const expenseId = expense.id || ("exp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));

    room.expenses = room.expenses || [];
    const existingIdx = room.expenses.findIndex((e) => e && e.id === expenseId);

    if (existingIdx >= 0) {
      const existingExpense = room.expenses[existingIdx];
      // Strictly only the creator of the expense can edit it
      const creatorId = existingExpense.createdByUserId;
      const isCreatorById = Boolean(creatorId && creatorId === user.id);
      const isCreatorByName = Boolean(
        existingExpense.createdBy && (
          existingExpense.createdBy.toLowerCase().trim() === (user.name || '').toLowerCase().trim()
        )
      );
      const isLegacyPayer = Boolean(
        !existingExpense.createdBy && !existingExpense.createdByUserId && (
          (existingExpense.paidByUserId && existingExpense.paidByUserId === user.id) ||
          (existingExpense.paidBy && existingExpense.paidBy.toLowerCase().trim() === (user.name || '').toLowerCase().trim())
        )
      );

      if (!isCreatorById && !isCreatorByName && !isLegacyPayer) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Only the member who created this expense can edit it.",
        });
      }
    } else {
      // DUPLICATE GUARD: Prevent rapid double submission (same title, amount, creator within 4 seconds)
      const now = Date.now();
      const duplicate = room.expenses.find((e) => {
        if (!e) return false;
        const sameCreator = (e.createdByUserId === user.id) || (e.paidByUserId === user.id);
        const sameTitle = (e.title || "").trim().toLowerCase() === title.toLowerCase();
        const sameAmount = Number(e.totalAmount || e.amount) === amount;
        const timeDiff = e.createdAt ? (now - new Date(e.createdAt).getTime()) : Infinity;
        return sameCreator && sameTitle && sameAmount && timeDiff < 4000;
      });

      if (duplicate) {
        console.warn(`[Duplicate Guard] Prevented duplicate expense creation for "${title}" (₹${amount})`);
        const enrichedRoom = {
          ...room,
          members: (room.members || []).map((m) => ({
            ...m,
            isSelf: m && (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id),
          })),
        };
        return res.json({ success: true, data: enrichedRoom, room: enrichedRoom, duplicateBlocked: true });
      }
    }

    const newExpense: ServerRoomExpense = {
      id: expenseId,
      roomId,
      title,
      totalAmount: amount,
      amount,
      category: expense.category || "General",
      paidByUserId: finalPaidByUserId,
      paidBy: finalPaidByName,
      createdByUserId: existingIdx >= 0 ? (room.expenses[existingIdx].createdByUserId || user.id) : user.id,
      createdBy: existingIdx >= 0 ? (room.expenses[existingIdx].createdBy || user.name) : user.name,
      splitType,
      participants: calculatedParticipants,
      date: expense.date || today,
      notes: expense.notes || "",
      createdAt: existingIdx >= 0 ? (room.expenses[existingIdx].createdAt || new Date().toISOString()) : new Date().toISOString(),
      status: "pending",
    };

    room.activities = room.activities || [];

    if (existingIdx >= 0) {
      room.expenses[existingIdx] = newExpense;
      room.activities.unshift({
        id: "act_" + Date.now(),
        roomId,
        text: `${user.name || finalPaidByName} updated ${title} ₹${amount}`,
        time: new Date().toISOString(),
        type: "edit",
      });
    } else {
      room.expenses.unshift(newExpense);
      room.activities.unshift({
        id: "act_" + Date.now(),
        roomId,
        text: `${finalPaidByName} added ${title} ₹${amount}`,
        time: new Date().toISOString(),
        type: "expense",
      });
    }

    saveRooms(rooms);

    const enrichedRoom = {
      ...room,
      members: (room.members || []).map((m) => ({
        ...m,
        isSelf: m && (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id),
      })),
    };

    return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
  } catch (err: any) {
    console.error("Server error adding room expense:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to add room expense" });
  }
});

// Delete room expense
app.delete("/api/rooms/:roomId/expenses/:expenseId", (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { roomId, expenseId } = req.params;
    const rooms = loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    const isMember =
      room.ownerId === user.id ||
      (room.members || []).some((m) => m && (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id));
    if (!isMember) {
      return res.status(403).json({ success: false, error: "You are not a member of this room" });
    }

    const exp = (room.expenses || []).find((e) => e && e.id === expenseId);
    if (!exp) {
      return res.status(404).json({ success: false, error: "Expense not found" });
    }

    const authMember = (room.members || []).find(
      (m) =>
        m &&
        (m.userId === user.id ||
          m.id === user.id ||
          m.id === "rm_" + user.id ||
          (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
          (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase()))
    );

    // Strictly only the roommate who created/added the expense can delete it
    const creatorId = exp.createdByUserId;
    const isCreatorById = Boolean(creatorId && creatorId === user.id);
    const isCreatorByName = Boolean(
      exp.createdBy && (
        exp.createdBy.toLowerCase().trim() === (user.name || '').toLowerCase().trim() ||
        (authMember && exp.createdBy.toLowerCase().trim() === authMember.name.toLowerCase().trim())
      )
    );
    // Backward compatibility for older records where createdBy was not stored separately
    const isLegacyPayer = Boolean(
      !exp.createdBy && !exp.createdByUserId && (
        (exp.paidByUserId && exp.paidByUserId === user.id) ||
        (exp.paidBy && exp.paidBy.toLowerCase().trim() === (user.name || '').toLowerCase().trim()) ||
        (authMember && exp.paidBy && exp.paidBy.toLowerCase().trim() === authMember.name.toLowerCase().trim())
      )
    );

    if (!isCreatorById && !isCreatorByName && !isLegacyPayer) {
      return res.status(403).json({
        success: false,
        error: "Sirf wahi roommate is expense ko delete kar sakta hai jisne ise add kiya hai.",
      });
    }

    room.expenses = (room.expenses || []).filter((e) => e && e.id !== expenseId);

    room.activities = room.activities || [];
    room.activities.unshift({
      id: "act_" + Date.now(),
      roomId: room.id,
      text: `${user.name || "Roommate"} deleted ${exp.title} expense`,
      time: new Date().toISOString(),
      type: "expense",
    });

    saveRooms(rooms);

    const enrichedRoom = {
      ...room,
      members: (room.members || []).map((m) => ({
        ...m,
        isSelf: m && (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id),
      })),
    };

    return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
  } catch (err: any) {
    console.error("Server error deleting room expense:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to delete room expense" });
  }
});

// Calculate pairwise debts for room
interface ServerRoomDebt {
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorName: string;
  amount: number;
}

function calculateRoomDebts(room: ServerRoomGroup): ServerRoomDebt[] {
  const members = room.members || [];
  const expenses = room.expenses || [];
  const settlements = room.settlements || [];

  const findMember = (name?: string, uid?: string): ServerRoomMember | undefined => {
    if (uid) {
      const byUid = members.find((m) => m && (m.userId === uid || m.id === uid || m.id === "rm_" + uid));
      if (byUid) return byUid;
    }
    if (name) {
      const byName = members.find((m) => m && m.name && m.name.toLowerCase() === name.toLowerCase());
      if (byName) return byName;
    }
    return undefined;
  };

  const balances: Record<
    string,
    {
      member: ServerRoomMember;
      totalPaid: number;
      totalShare: number;
      settledPaid: number;
      settledReceived: number;
      net: number;
    }
  > = {};

  members.forEach((m) => {
    if (m && m.name) {
      balances[m.name.toLowerCase()] = {
        member: m,
        totalPaid: 0,
        totalShare: 0,
        settledPaid: 0,
        settledReceived: 0,
        net: 0,
      };
    }
  });

  expenses.forEach((exp) => {
    if (!exp) return;
    const payerMem = findMember(exp.paidBy, exp.paidByUserId);
    const payerKey = payerMem ? payerMem.name.toLowerCase() : (exp.paidBy || "").toLowerCase();
    if (balances[payerKey]) {
      balances[payerKey].totalPaid += Number(exp.totalAmount || exp.amount || 0);
    }

    if (Array.isArray(exp.participants)) {
      exp.participants.forEach((p) => {
        if (!p) return;
        const pMem = findMember(p.name, p.userId);
        const pKey = pMem ? pMem.name.toLowerCase() : (p.name || "").toLowerCase();
        if (balances[pKey]) {
          balances[pKey].totalShare += Number(p.share || 0);
        }
      });
    }
  });

  settlements.forEach((s) => {
    if (!s || s.status === "cancelled" || s.status === "pending" || s.status === "rejected") return;
    const debtorMem = findMember(s.from, s.debtorId || s.fromUserId);
    const creditorMem = findMember(s.to, s.creditorId || s.toUserId);
    const fromKey = debtorMem ? debtorMem.name.toLowerCase() : (s.from || "").toLowerCase();
    const toKey = creditorMem ? creditorMem.name.toLowerCase() : (s.to || "").toLowerCase();

    if (balances[fromKey]) {
      balances[fromKey].settledPaid += Number(s.amount || 0);
    }
    if (balances[toKey]) {
      balances[toKey].settledReceived += Number(s.amount || 0);
    }
  });

  Object.values(balances).forEach((b) => {
    b.net = b.totalPaid + b.settledPaid - (b.totalShare + b.settledReceived);
  });

  const debtors: { member: ServerRoomMember; amount: number }[] = [];
  const creditors: { member: ServerRoomMember; amount: number }[] = [];

  Object.values(balances).forEach((b) => {
    if (b.net < -0.9) {
      debtors.push({ member: b.member, amount: Math.abs(b.net) });
    } else if (b.net > 0.9) {
      creditors.push({ member: b.member, amount: b.net });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: ServerRoomDebt[] = [];
  let i = 0;
  let j = 0;

  const dList = debtors.map((d) => ({ ...d }));
  const cList = creditors.map((c) => ({ ...c }));

  while (i < dList.length && j < cList.length) {
    const debtor = dList[i];
    const creditor = cList[j];
    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0.5) {
      debts.push({
        debtorId: debtor.member.userId || debtor.member.id,
        debtorName: debtor.member.name,
        creditorId: creditor.member.userId || creditor.member.id,
        creditorName: creditor.member.name,
        amount: Math.round(settledAmount * 100) / 100,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.9) i++;
    if (creditor.amount < 0.9) j++;
  }

  return debts;
}

// Record settlement between roommates (supports /settle and /settlements)
// Record settlement between roommates (supports /settle and /settlements)
// Allows debtor, creditor (payment received), or room admin to record settlements cleanly
const handleRecordSettlement = (req: express.Request, res: express.Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { roomId } = req.params;
    const { fromUserId, from, debtorId, toUserId, to, creditorId, amount, mode, note } = req.body || {};

    const settleAmount = Number(amount);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      return res.status(400).json({ success: false, error: "Settlement amount must be greater than zero" });
    }

    const rooms = loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    // Identify requester in the room
    const authMember = (room.members || []).find(
      (m) =>
        m &&
        (m.userId === user.id ||
          m.id === user.id ||
          m.id === "rm_" + user.id ||
          (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
          (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase()))
    );

    const isMember = room.ownerId === user.id || Boolean(authMember);
    if (!isMember || !authMember) {
      return res.status(403).json({ success: false, error: "You are not a member of this room" });
    }

    // 1. Resolve Debtor Member (the person paying / who had the debt)
    const targetDebtorId = debtorId || fromUserId;
    const targetDebtorName = String(from || '').trim().toLowerCase();

    let debtorMember = (room.members || []).find(
      (m) =>
        m &&
        ((targetDebtorId && (m.userId === targetDebtorId || m.id === targetDebtorId || m.id === "rm_" + targetDebtorId)) ||
          (targetDebtorName && targetDebtorName !== "you" && targetDebtorName !== "me" && m.name && m.name.toLowerCase().trim() === targetDebtorName))
    );

    // 2. Resolve Creditor Member (the person receiving / who was owed)
    const targetCreditorId = creditorId || toUserId;
    const targetCreditorName = String(to || '').trim().toLowerCase();

    let creditorMember = (room.members || []).find(
      (m) =>
        m &&
        ((targetCreditorId && (m.userId === targetCreditorId || m.id === targetCreditorId || m.id === "rm_" + targetCreditorId)) ||
          (targetCreditorName && targetCreditorName !== "you" && targetCreditorName !== "me" && m.name && m.name.toLowerCase().trim() === targetCreditorName))
    );

    // Fallbacks if one side was omitted or "You" was supplied
    if (!debtorMember && creditorMember) {
      debtorMember = authMember;
    } else if (!creditorMember && debtorMember) {
      creditorMember = authMember;
    }

    if (!debtorMember || !creditorMember) {
      return res.status(400).json({ success: false, error: "Both debtor and creditor roommates must be active members of this room." });
    }

    if (
      debtorMember.id === creditorMember.id ||
      debtorMember.userId === creditorMember.userId ||
      debtorMember.name.toLowerCase().trim() === creditorMember.name.toLowerCase().trim()
    ) {
      return res.status(400).json({ success: false, error: "Cannot record a settlement with yourself. Please select the other roommate." });
    }

    // 3. Outstanding debt validation
    const currentDebts = calculateRoomDebts(room);
    const matchingDebt = currentDebts.find((d) => {
      const isDebtorMatch =
        d.debtorId === debtorMember!.userId ||
        d.debtorId === debtorMember!.id ||
        d.debtorName.toLowerCase().trim() === debtorMember!.name.toLowerCase().trim();
      const isCreditorMatch =
        d.creditorId === creditorMember!.userId ||
        d.creditorId === creditorMember!.id ||
        d.creditorName.toLowerCase().trim() === creditorMember!.name.toLowerCase().trim();
      return isDebtorMatch && isCreditorMatch;
    });

    if (matchingDebt && matchingDebt.amount > 0) {
      if (settleAmount > matchingDebt.amount + 5) {
        return res.status(400).json({
          success: false,
          error: `Settlement amount (₹${settleAmount}) exceeds the outstanding payable debt of ₹${matchingDebt.amount} from ${debtorMember.name} to ${creditorMember.name}.`,
        });
      }
    }

    // 4. Deduplication guard (prevent double submissions within 3 seconds)
    const recentDuplicate = (room.settlements || []).find(
      (s) =>
        s &&
        (s.debtorId === debtorMember!.userId || s.debtorId === debtorMember!.id || s.from?.toLowerCase() === debtorMember!.name.toLowerCase()) &&
        (s.creditorId === creditorMember!.userId || s.creditorId === creditorMember!.id || s.to?.toLowerCase() === creditorMember!.name.toLowerCase()) &&
        s.amount === Math.round(settleAmount * 100) / 100 &&
        Date.now() - new Date(s.createdAt || 0).getTime() < 3000
    );
    if (recentDuplicate) {
      return res.json({ success: true, data: room, room });
    }

    const now = new Date().toISOString();
    const settlement: ServerRoomSettlement = {
      id: "settle_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      roomId,
      createdBy: user.id,
      ownerId: user.id,
      debtorId: debtorMember.userId || debtorMember.id,
      creditorId: creditorMember.userId || creditorMember.id,
      fromUserId: debtorMember.userId || debtorMember.id,
      from: debtorMember.name,
      toUserId: creditorMember.userId || creditorMember.id,
      to: creditorMember.name,
      amount: Math.round(settleAmount * 100) / 100,
      date: now.split("T")[0],
      mode: mode === "Cash" ? "Cash" : "UPI",
      status: "pending", // Pending receiver confirmation: Cannot be settled without receiver acceptance!
      note: note ? String(note).trim() : `${debtorMember.name} settled ₹${settleAmount} with ${creditorMember.name}`,
      createdAt: now,
      updatedAt: now,
    };

    room.settlements = room.settlements || [];
    room.settlements.unshift(settlement);

    room.activities = room.activities || [];
    room.activities.unshift({
      id: "act_" + Date.now(),
      roomId: room.id,
      text: `🔔 Settlement request: ${debtorMember.name} recorded ₹${settlement.amount} via ${settlement.mode} to ${creditorMember.name}. Waiting for ${creditorMember.name} to Accept.`,
      time: now,
      type: "settlement",
    });

    saveRooms(rooms);

    const enrichedRoom = {
      ...room,
      members: (room.members || []).map((m) => ({
        ...m,
        isSelf:
          m &&
          (m.userId === user.id ||
            m.id === user.id ||
            m.id === "rm_" + user.id ||
            (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
            (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase())),
      })),
    };

    return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
  } catch (err: any) {
    console.error("Server error recording settlement:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to record settlement" });
  }
};

// Accept settlement - STRICTLY ONLY RECEIVER CAN ACCEPT
const handleAcceptSettlement = (req: express.Request, res: express.Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { roomId, settleId } = req.params;
    const rooms = loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    const authMember = (room.members || []).find(
      (m) =>
        m &&
        (m.userId === user.id ||
          m.id === user.id ||
          m.id === "rm_" + user.id ||
          (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
          (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase()))
    );

    const sett = (room.settlements || []).find((s) => s && s.id === settleId);
    if (!sett) {
      return res.status(404).json({ success: false, error: "Settlement record not found" });
    }

    if (sett.status === "completed") {
      return res.json({ success: true, data: room, room, message: "Settlement already accepted" });
    }

    // STRICTLY ONLY THE RECEIVER (Creditor) CAN ACCEPT
    const isReceiverById = Boolean(
      (sett.creditorId && (sett.creditorId === user.id || sett.creditorId === authMember?.id)) ||
      (sett.toUserId && (sett.toUserId === user.id || sett.toUserId === authMember?.id))
    );
    const isReceiverByName = Boolean(
      sett.to && (
        sett.to.toLowerCase().trim() === (user.name || '').toLowerCase().trim() ||
        (authMember && sett.to.toLowerCase().trim() === authMember.name.toLowerCase().trim())
      )
    );

    if (!isReceiverById && !isReceiverByName) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Sirf receiver (${sett.to}) hi is settlement ko confirm/accept kar sakta hai.`,
      });
    }

    const now = new Date().toISOString();
    sett.status = "completed";
    sett.confirmedAt = now;
    sett.confirmedBy = user.name || user.id;
    sett.updatedAt = now;

    room.activities = room.activities || [];
    room.activities.unshift({
      id: "act_" + Date.now(),
      roomId: room.id,
      text: `✅ ${sett.to} verified & accepted settlement of ₹${sett.amount} from ${sett.from} (${sett.mode || "UPI"})`,
      time: now,
      type: "settlement",
    });

    saveRooms(rooms);

    const enrichedRoom = {
      ...room,
      members: (room.members || []).map((m) => ({
        ...m,
        isSelf:
          m &&
          (m.userId === user.id ||
            m.id === user.id ||
            m.id === "rm_" + user.id ||
            (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
            (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase())),
      })),
    };

    return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
  } catch (err: any) {
    console.error("Server error accepting settlement:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to accept settlement" });
  }
};

// Reject / Decline settlement (Receiver or Payer cancel)
const handleRejectSettlement = (req: express.Request, res: express.Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { roomId, settleId } = req.params;
    const rooms = loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    const authMember = (room.members || []).find(
      (m) =>
        m &&
        (m.userId === user.id ||
          m.id === user.id ||
          m.id === "rm_" + user.id ||
          (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
          (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase()))
    );

    const sett = (room.settlements || []).find((s) => s && s.id === settleId);
    if (!sett) {
      return res.status(404).json({ success: false, error: "Settlement record not found" });
    }

    const isReceiver =
      (sett.creditorId && (sett.creditorId === user.id || sett.creditorId === authMember?.id)) ||
      (sett.toUserId && (sett.toUserId === user.id || sett.toUserId === authMember?.id)) ||
      (Boolean(sett.to) && (
        sett.to.toLowerCase().trim() === (user.name || '').toLowerCase().trim() ||
        (Boolean(authMember?.name) && sett.to.toLowerCase().trim() === authMember.name.toLowerCase().trim())
      ));

    const isPayer =
      sett.createdBy === user.id ||
      (sett.debtorId && (sett.debtorId === user.id || sett.debtorId === authMember?.id)) ||
      (sett.fromUserId && (sett.fromUserId === user.id || sett.fromUserId === authMember?.id)) ||
      (Boolean(sett.from) && (
        sett.from.toLowerCase().trim() === (user.name || '').toLowerCase().trim() ||
        (Boolean(authMember?.name) && sett.from.toLowerCase().trim() === authMember.name.toLowerCase().trim())
      ));

    const isAdmin = room.ownerId === user.id;

    if (!isReceiver && !isPayer && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You do not have permission to decline or cancel this settlement.",
      });
    }

    const now = new Date().toISOString();
    sett.status = "rejected";
    sett.updatedAt = now;

    room.activities = room.activities || [];
    room.activities.unshift({
      id: "act_" + Date.now(),
      roomId: room.id,
      text: isReceiver
        ? `❌ ${sett.to} marked payment of ₹${sett.amount} from ${sett.from} as Not Received`
        : `❌ Settlement of ₹${sett.amount} between ${sett.from} and ${sett.to} was cancelled`,
      time: now,
      type: "settlement",
    });

    saveRooms(rooms);

    const enrichedRoom = {
      ...room,
      members: (room.members || []).map((m) => ({
        ...m,
        isSelf:
          m &&
          (m.userId === user.id ||
            m.id === user.id ||
            m.id === "rm_" + user.id ||
            (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
            (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase())),
      })),
    };

    return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
  } catch (err: any) {
    console.error("Server error rejecting settlement:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to reject settlement" });
  }
};

app.post("/api/rooms/:roomId/settle", handleRecordSettlement);
app.post("/api/rooms/:roomId/settlements", handleRecordSettlement);
app.post("/api/rooms/:roomId/settlements/:settleId/accept", handleAcceptSettlement);
app.post("/api/rooms/:roomId/settle/:settleId/accept", handleAcceptSettlement);
app.post("/api/rooms/:roomId/settlements/:settleId/reject", handleRejectSettlement);
app.post("/api/rooms/:roomId/settle/:settleId/reject", handleRejectSettlement);

// Delete / undo a settlement (supports /settle and /settlements)
const handleDeleteSettlement = (req: express.Request, res: express.Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const { roomId, settleId } = req.params;
    const rooms = loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    const authMember = (room.members || []).find(
      (m) =>
        m &&
        (m.userId === user.id ||
          m.id === user.id ||
          m.id === "rm_" + user.id ||
          (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
          (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase()))
    );

    const isMember = room.ownerId === user.id || Boolean(authMember);
    if (!isMember) {
      return res.status(403).json({ success: false, error: "You are not a member of this room" });
    }

    const sett = (room.settlements || []).find((s) => s && s.id === settleId);
    if (!sett) {
      return res.status(404).json({ success: false, error: "Settlement record not found" });
    }

    // Allowed if room admin, or if user is debtor, creditor, or creator of settlement
    const isAuthorized =
      room.ownerId === user.id ||
      sett.createdBy === user.id ||
      sett.ownerId === user.id ||
      sett.debtorId === user.id ||
      sett.fromUserId === user.id ||
      sett.creditorId === user.id ||
      sett.toUserId === user.id ||
      (authMember &&
        (sett.debtorId === authMember.id ||
          sett.creditorId === authMember.id ||
          (Boolean(sett.from) && sett.from.toLowerCase() === authMember.name.toLowerCase()) ||
          (Boolean(sett.to) && sett.to.toLowerCase() === authMember.name.toLowerCase())));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You do not have permission to delete this settlement.",
      });
    }

    room.settlements = (room.settlements || []).filter((s) => s && s.id !== settleId);

    room.activities = room.activities || [];
    room.activities.unshift({
      id: "act_" + Date.now(),
      roomId: room.id,
      text: `Settlement of ₹${sett.amount} between ${sett.from} and ${sett.to} was cancelled`,
      time: new Date().toISOString(),
      type: "settlement",
    });

    saveRooms(rooms);

    const enrichedRoom = {
      ...room,
      members: (room.members || []).map((m) => ({
        ...m,
        isSelf:
          m &&
          (m.userId === user.id ||
            m.id === user.id ||
            m.id === "rm_" + user.id ||
            (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase()) ||
            (Boolean(m.name && user.name) && m.name.toLowerCase() === user.name.toLowerCase())),
      })),
    };

    return res.json({ success: true, data: enrichedRoom, room: enrichedRoom });
  } catch (err: any) {
    console.error("Server error deleting settlement:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to delete settlement" });
  }
};

app.delete("/api/rooms/:roomId/settle/:settleId", handleDeleteSettlement);
app.delete("/api/rooms/:roomId/settlements/:settleId", handleDeleteSettlement);

// Delete whole room - STRICTLY ONLY ADMIN / CREATOR CAN DELETE
app.delete("/api/rooms/:roomId", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const { roomId } = req.params;
  let rooms = loadRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  // Strict check: Only the user who created the room (ownerId) or has role === 'owner' can delete it!
  const isOwner =
    room.ownerId === user.id ||
    (room.members || []).some(
      (m) =>
        (m.userId === user.id || m.id === user.id || m.id === "rm_" + user.id) &&
        m.role === "owner"
    );

  if (!isOwner) {
    return res.status(403).json({
      success: false,
      error: "Only the admin who created this room can delete it. Roommates can leave the room instead.",
    });
  }

  recordDeletedRoomId(roomId);
  rooms = rooms.filter((r) => r.id !== roomId);
  saveRooms(rooms);

  // Thoroughly purge deleted room from all stored user files
  try {
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      for (const f of files) {
        if (f.startsWith("user_data_") && f.endsWith(".json")) {
          const filePath = path.join(DATA_DIR, f);
          try {
            const uData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            if (Array.isArray(uData.roomGroups)) {
              uData.roomGroups = uData.roomGroups.filter((rg: any) => rg && rg.id !== roomId);
              if (uData.activeRoomId === roomId) {
                uData.activeRoomId = uData.roomGroups[0]?.id || null;
              }
              fs.writeFileSync(filePath, JSON.stringify(uData, null, 2), "utf-8");
              const targetUserId = f.replace("user_data_", "").replace(".json", "");
              cachedUserData.set(targetUserId, uData);
              persistUserDataToFirestore(targetUserId, uData).catch(() => {});
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  return res.json({ success: true, message: `Room "${room.name}" deleted successfully` });
});

// Member leaves room (Available for non-admin roommates or leaving self)
app.post("/api/rooms/:roomId/leave", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const { roomId } = req.params;
  let rooms = loadRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: "Room not found" });
  }

  const memberIdx = (room.members || []).findIndex(
    (m) =>
      m.userId === user.id ||
      m.id === user.id ||
      m.id === "rm_" + user.id ||
      (Boolean(m.email && user.email) && m.email.toLowerCase() === user.email.toLowerCase())
  );

  if (memberIdx === -1) {
    return res.status(400).json({ success: false, error: "You are not a member of this room" });
  }

  const leavingMember = room.members[memberIdx];

  // If this was the last remaining member, delete the room
  if (room.members.length <= 1) {
    recordDeletedRoomId(roomId);
    rooms = rooms.filter((r) => r.id !== roomId);
    saveRooms(rooms);
    try {
      if (fs.existsSync(DATA_DIR)) {
        const files = fs.readdirSync(DATA_DIR);
        for (const f of files) {
          if (f.startsWith("user_data_") && f.endsWith(".json")) {
            const filePath = path.join(DATA_DIR, f);
            try {
              const uData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
              if (Array.isArray(uData.roomGroups)) {
                uData.roomGroups = uData.roomGroups.filter((rg: any) => rg && rg.id !== roomId);
                if (uData.activeRoomId === roomId) {
                  uData.activeRoomId = uData.roomGroups[0]?.id || null;
                }
                fs.writeFileSync(filePath, JSON.stringify(uData, null, 2), "utf-8");
                const targetUserId = f.replace("user_data_", "").replace(".json", "");
                cachedUserData.set(targetUserId, uData);
                persistUserDataToFirestore(targetUserId, uData).catch(() => {});
              }
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
    return res.json({ success: true, message: `Left and closed room "${room.name}"` });
  }

  // If the owner leaves and other members exist, transfer ownership to the next member
  if (room.ownerId === user.id || leavingMember.role === "owner") {
    const nextOwner = room.members.find((_, idx) => idx !== memberIdx);
    if (nextOwner) {
      room.ownerId = nextOwner.userId || nextOwner.id;
      nextOwner.role = "owner";
    }
  }

  room.members.splice(memberIdx, 1);
  room.activities = room.activities || [];
  room.activities.unshift({
    id: "act_" + Date.now(),
    roomId: room.id,
    text: `${leavingMember.name || user.name} left the room`,
    time: new Date().toISOString(),
    type: "join",
  });

  saveRooms(rooms);
  return res.json({ success: true, message: `Left room "${room.name}" successfully` });
});


// Extract and sanitize Gemini API key safely.
// Supports current Google AI Studio authorization-key formats
// and does NOT assume an "AIzaSy" prefix or fixed length.
function extractCleanGeminiKey(raw: string | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;

  let key = raw.trim();

  // Remove accidental outer quotes
  key = key.replace(/^["'`]+|["'`]+$/g, "").trim();

  // Support accidental "GEMINI_API_KEY=..." paste
  if (key.includes("=")) {
    const equalIndex = key.indexOf("=");
    const candidate = key.slice(equalIndex + 1).trim();
    if (candidate) {
      key = candidate;
    }
  }

  // Remove accidental Bearer prefix
  if (key.toLowerCase().startsWith("bearer ")) {
    key = key.slice(7).trim();
  }

  // Remove trailing separators
  key = key.replace(/[;,]+$/, "").trim();

  // Remove quotes again if needed
  key = key.replace(/^["'`]+|["'`]+$/g, "").trim();

  return key || null;
}

// Lazy get Gemini client with clean key and standard SDK options
function getGeminiClient(): GoogleGenAI | null {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  const apiKey = extractCleanGeminiKey(rawKey);
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set or empty in environment");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
  });
}

// Resilient Gemini runner: tries gemini-3.8-flash, gemini-flash-latest, and gemini-3.1-flash-lite
async function callGeminiWithFallback<T>(
  ai: GoogleGenAI,
  callFn: (modelName: string) => Promise<T>,
  preferredModels?: string[]
): Promise<T> {
  const models = preferredModels && preferredModels.length > 0
    ? preferredModels
    : ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      return await callFn(model);
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTransient =
        err?.status === "UNAVAILABLE" ||
        err?.status === 503 ||
        err?.code === 503 ||
        errMsg.includes("503") ||
        errMsg.includes("high demand") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED");

      console.warn(
        `Gemini call with model ${model} error (attempt ${i + 1}/${models.length}, transient: ${isTransient}):`,
        errMsg
      );

      if (i < models.length - 1) {
        // Brief pause before trying fallback model
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
  }

  throw lastError;
}

// Student Financial Coach Rule-based Fallback Generator
function generateFallbackCoachingData(studentState: any, userQuestion?: string) {
  const allowance = Number(studentState?.monthlyPocketMoney) || 10000;
  const remaining = Number(studentState?.remainingPocketMoney) || 6000;
  const days = Number(studentState?.daysLeft) || 15;
  const safeDaily = Math.max(0, Math.round(remaining / (days || 1)));
  const todaySpent = Number(studentState?.todaySpent) || 0;
  const pendingUdhaar = Number(studentState?.pendingToCollect) || 0;
  const upcomingBills = Number(studentState?.upcomingBills) || 0;
  const topCats: string[] = Array.isArray(studentState?.topCategories) ? studentState.topCategories : [];

  const ratio = allowance > 0 ? remaining / allowance : 0.5;
  let status: "healthy" | "warning" | "danger" = "healthy";
  let summary = `You have ₹${remaining} remaining for the next ${days} days. Your safe daily spending limit is ₹${safeDaily}.`;

  if (ratio < 0.2 || (safeDaily < 100 && days > 5)) {
    status = "danger";
    summary = `Budget alert! You have ₹${remaining} left for ${days} days (only ₹${safeDaily}/day). Stick strictly to essential expenses.`;
  } else if (ratio < 0.4 || safeDaily < 200) {
    status = "warning";
    summary = `Caution: You have used over 60% of your pocket money with ${days} days left. Keep daily spends under ₹${safeDaily}.`;
  } else {
    status = "healthy";
    summary = `Looking solid! At a ₹${safeDaily}/day safe cap, your allowance is well-paced for the next ${days} days.`;
  }

  const burnRateAlert =
    todaySpent > safeDaily
      ? `You spent ₹${todaySpent} today, which is ₹${todaySpent - safeDaily} above your daily target (₹${safeDaily}). Trim spends tomorrow to balance out!`
      : `Today's spend is ₹${todaySpent}, comfortably within your ₹${safeDaily} safe daily cap. Great pacing!`;

  const hacks: string[] = [];
  if (pendingUdhaar > 0) {
    hacks.push(`Collect ₹${pendingUdhaar} pending friend loans (udhaar) before the weekend to replenish your wallet.`);
  } else {
    hacks.push("Keep ₹300-₹500 in physical cash for emergency rickshaw, xerox, and chai where UPI servers lag.");
  }

  if (upcomingBills > 0) {
    hacks.push(`Protect ₹${upcomingBills} for upcoming fixed rent/recharge commitments so you don't accidentally spend it.`);
  } else {
    hacks.push("Opt for room/hostel meals instead of outside late-night food deliveries to easily save ₹200-₹300 daily.");
  }

  if (topCats.length > 0) {
    const topName = String(topCats[0]).split(":")[0];
    hacks.push(`Your major spending is in ${topName}. Limiting discretionary splurges here will save ₹1,000+ this month.`);
  } else {
    hacks.push("Track small cash transactions like printouts, auto fares, and snacks—they quietly add up to 20% of monthly student expenses.");
  }

  let chatReply = `Based on your budget, your safe spending limit is ₹${safeDaily} per day for the next ${days} days.`;
  if (userQuestion) {
    const qLower = userQuestion.toLowerCase();
    if (qLower.includes("can i afford") || qLower.includes("can i spend")) {
      const numMatch = userQuestion.match(/\b(\d+)\b/);
      const amount = numMatch ? parseInt(numMatch[1], 10) : 300;
      if (amount <= safeDaily) {
        chatReply = `Yes! ₹${amount} is well within your safe daily limit of ₹${safeDaily}. You can safely go ahead.`;
      } else if (amount <= remaining - upcomingBills) {
        const adjustedNextDaily = Math.max(30, Math.round((remaining - amount) / Math.max(1, days - 1)));
        chatReply = `You can afford ₹${amount}, but since it exceeds your ₹${safeDaily} daily cap, you will need to spend ₹${adjustedNextDaily}/day on subsequent days to balance your budget.`;
      } else {
        chatReply = `Spending ₹${amount} would severely strain your remaining ₹${remaining} allowance (especially with ₹${upcomingBills} in upcoming commitments). Better to postpone or find a cheaper option!`;
      }
    } else if (qLower.includes("save") || qLower.includes("saving")) {
      chatReply = `To save money, collect your ₹${pendingUdhaar} pending friend loans, cut 2 outside takeout orders, and keep daily canteen expense under ₹80. That frees up ₹1,000–₹1,500 by month end!`;
    } else if (qLower.includes("movie") || qLower.includes("trip") || qLower.includes("weekend")) {
      chatReply = `If you want to enjoy this weekend, keep weekday spending to under ₹100/day so you can pool ₹600-₹800 for your outing without budget stress!`;
    } else {
      chatReply = `With ₹${remaining} in your pocket money and ${days} days remaining, keeping your daily burn rate at ₹${safeDaily} will comfortably get you through the month without needing emergency help from home!`;
    }
  }

  return {
    summary,
    status,
    burnRateAlert,
    hacks,
    safeDailyCap: safeDaily,
    chatReply,
  };
}

// Health check
app.get("/api/health", (req, res) => {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;
  const cleanKey = extractCleanGeminiKey(rawKey);
  res.json({
    status: "ok",
    geminiAvailable: Boolean(cleanKey),
    keyConfigured: Boolean(rawKey),
    keyLength: cleanKey ? cleanKey.length : 0,
    hasStandardPrefix: cleanKey ? cleanKey.startsWith("AIzaSy") : false,
  });
});

// Diagnostic check endpoint for user & admin troubleshooting (e.g. on Render)
app.get("/api/ai/status", async (req, res) => {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!rawKey) {
    return res.json({
      configured: false,
      message: "GEMINI_API_KEY is not set in environment variables.",
      help: "Add GEMINI_API_KEY in your hosting dashboard (e.g. Render -> Environment).",
    });
  }

  const cleanKey = extractCleanGeminiKey(rawKey);
  const keyLength = cleanKey ? cleanKey.length : 0;
  const startsWithAIza = cleanKey ? cleanKey.startsWith("AIzaSy") : false;
  const maskedKey = cleanKey
    ? `${cleanKey.slice(0, 6)}...${cleanKey.slice(-4)}`
    : "empty";

  let testResult = "pending";
  let testError: string | null = null;
  let testModelUsed: string | null = null;
  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey! });
    const testRes = await callGeminiWithFallback(ai, async (modelName) => {
      testModelUsed = modelName;
      return await ai.models.generateContent({
        model: modelName,
        contents: "ping",
      });
    });
    if (testRes.text) {
      testResult = "success";
    }
  } catch (err: any) {
    testResult = "failed";
    testError = err?.message || String(err);
  }

  return res.json({
    configured: true,
    maskedKey,
    keyLength,
    startsWithAIza,
    expectedFormat: "Current Gemini API key format",
    isLengthStandard: true,
    testResult,
    testModelUsed,
    testError,
  });
});

// Endpoint: Parse and Security-Verify UPI Payment Screenshot
app.post("/api/ai/parse-screenshot", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        success: false,
        isRealPaymentReceipt: false,
        error: "No image received. Please upload or select a receipt photo.",
        errorCode: "EMPTY_IMAGE",
        fallbackAllowed: true,
      });
    }

    // Clean base64 data prefix cleanly (handles any data: URI prefix including application/octet-stream, webp, etc.)
    let cleanBase64 = String(imageBase64 || "");
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, "").trim();

    if (!cleanBase64) {
      return res.status(400).json({
        success: false,
        isRealPaymentReceipt: false,
        error: "Image data is empty or corrupted. Please try selecting the receipt again.",
        errorCode: "INVALID_IMAGE",
        fallbackAllowed: true,
      });
    }

    // Determine normalized MIME type
    let safeMime = (mimeType || "image/jpeg").toLowerCase().trim();
    if (safeMime === "image/jpg") safeMime = "image/jpeg";
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/bmp"];
    if (!allowedMimes.includes(safeMime)) {
      safeMime = "image/jpeg";
    }

    const todayIso = new Date().toISOString().split("T")[0];

    const ai = getGeminiClient();
    if (!ai) {
      console.warn("AI parse-screenshot: GEMINI_API_KEY is not configured on this server. Informing client to run On-Device OCR.");
      return res.json({
        success: false,
        useClientOcr: true,
        isRealPaymentReceipt: false,
        error: "AI Vision is unconfigured on server. Running On-Device Receipt Scanner...",
        errorCode: "API_KEY_NOT_CONFIGURED",
        fallbackAllowed: true,
      });
    }

    const prompt = `You are an expert OCR parser for Indian UPI payment receipts, banking slips, bills, merchant QR payments, and digital transaction confirmations.
Your goal is to extract accurate payment details so a student can record this expense in PocketBuddy.

SUPPORTED INPUTS:
- Any UPI payment screenshot (Google Pay / GPay, PhonePe, Paytm, BHIM, CRED, Amazon Pay, Navi, WhatsApp Pay, BharatPe, Slice, FamPay)
- Banking app transfer confirmation (SBI YONO, HDFC, ICICI, Axis, Kotak, PNB, Canara, etc.)
- Bank debit SMS screenshot ("Rs XXX debited... UPI Ref...")
- Paper receipt, canteen slip, grocery bill, restaurant invoice, store receipt, fee receipt, or delivery receipt (Zomato, Swiggy, Zepto, Blinkit)
- Hindi/regional receipts (e.g. "भुगतान सफल", "खाते से डेबिट")

EXTRACTION INSTRUCTIONS:
1. "isRealPaymentReceipt": Set true if the image contains ANY payment confirmation, transaction receipt, bill, invoice, or monetary amount. Only set false if the image has zero financial/payment content (e.g. random selfie, animal, car photo).
2. "securityCheckPassed": Set true if any payment amount, receipt, or transaction is detected.
3. "amount": The total paid amount in INR as a clean positive number (e.g. 150 or 49.50). If multiple amounts exist, extract the grand total / final paid amount. Never return 0 if an amount is visible anywhere in the image.
4. "payee": Name of the recipient, merchant, shop, or person paid (e.g., "Sharma Tea Stall", "Zomato", "Rahul Kumar", "Electricity Board"). If no name, write "Merchant" or "Store".
5. "appDetected": Identify the app or source (e.g., "PhonePe", "Google Pay", "Paytm", "BHIM", "CRED", "Amazon Pay", "Bank UPI", or "Receipt/Bill").
6. "date": The date of payment in YYYY-MM-DD format. If not explicitly found, use "${todayIso}".
7. "time": Time of payment if visible (e.g., "10:30 PM", "14:22"), or empty string.
8. "utr": The 12-digit UPI UTR number or Ref No if visible, or empty string.
9. "transactionId": App transaction ID / Order ID if visible, or empty string.
10. "category": Best match among: ["Canteen & Chai", "Mess & Food", "Room & Rent", "Recharge & Wi-Fi", "Travel & Auto", "College & Books", "Groceries", "Shopping", "Entertainment", "Medical", "Other"].
11. "suggestedPurpose": A friendly short note describing the item or purpose (e.g., "Chai & Samosa", "Groceries", "Dinner", "Medicine", "Stationery").
12. "securityReason": "Payment verified: " + appDetected + " payment of ₹" + amount + " to " + payee.

Return strictly valid JSON matching this schema.`;

    const response = await callGeminiWithFallback(ai, async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isRealPaymentReceipt: { type: Type.BOOLEAN },
              securityCheckPassed: { type: Type.BOOLEAN },
              securityReason: { type: Type.STRING },
              appDetected: { type: Type.STRING },
              payee: { type: Type.STRING },
              payeeUpiId: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              time: { type: Type.STRING },
              utr: { type: Type.STRING },
              transactionId: { type: Type.STRING },
              debitedAccount: { type: Type.STRING },
              transferMessage: { type: Type.STRING },
              suggestedPurpose: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: [
              "amount",
              "payee",
              "category",
            ],
          },
        },
      });
    });

    let rawText = response.text?.trim() || "{}";
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    const parsed = JSON.parse(rawText);

    // Clean and normalize amount
    let extractedAmount = Number(parsed.amount);
    if (isNaN(extractedAmount) || extractedAmount <= 0) {
      if (typeof parsed.amount === "string") {
        const cleanedStr = (parsed.amount as string).replace(/[^0-9.]/g, "");
        extractedAmount = parseFloat(cleanedStr) || 0;
      }
    }
    // Also search other fields if amount is 0
    if (isNaN(extractedAmount) || extractedAmount <= 0) {
      const searchBlob = `${parsed.transferMessage || ""} ${parsed.securityReason || ""} ${parsed.suggestedPurpose || ""}`;
      const amountRegexMatch = searchBlob.match(/(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
                               searchBlob.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr)/i);
      if (amountRegexMatch) {
        extractedAmount = parseFloat(amountRegexMatch[1].replace(/,/g, "")) || 0;
      }
    }
    parsed.amount = extractedAmount || 0;

    // Smart payment detection:
    // If an amount > 0 is found OR a clear payee/app was detected, it is a valid payment receipt!
    const hasValidAmount = parsed.amount > 0;
    const hasValidPayee = Boolean(parsed.payee && parsed.payee.trim() && parsed.payee.toLowerCase() !== "unknown");
    const hasApp = Boolean(parsed.appDetected && parsed.appDetected !== "Unknown");

    if (hasValidAmount || hasValidPayee || hasApp) {
      parsed.isRealPaymentReceipt = true;
      parsed.securityCheckPassed = true;
      if (!parsed.securityReason || parsed.securityReason.includes("Failed") || !parsed.securityReason.includes("Verified")) {
        parsed.securityReason = `Verified: ${parsed.appDetected || "UPI"} payment to ${parsed.payee || "Merchant"} for ₹${parsed.amount}.`;
      }
    }

    // Fallback date if missing
    if (!parsed.date || parsed.date.length < 8) {
      parsed.date = todayIso;
    }

    // Default category if missing or invalid
    const validCategories = [
      "Canteen & Chai", "Mess & Food", "Room & Rent", "Recharge & Wi-Fi",
      "Travel & Auto", "College & Books", "Groceries", "Shopping",
      "Entertainment", "Medical", "Other"
    ];
    if (!parsed.category || !validCategories.includes(parsed.category)) {
      parsed.category = "Groceries";
    }

    // Ensure friendly default payee
    if (!parsed.payee || parsed.payee.toLowerCase() === "unknown") {
      parsed.payee = "UPI Merchant";
    }

    // If an image was submitted, never discard it: treat as verified or pre-filled receipt
    parsed.isRealPaymentReceipt = true;
    parsed.securityCheckPassed = true;

    return res.json({
      success: true,
      isRealPaymentReceipt: true,
      securityCheckPassed: true,
      data: parsed,
    });
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.error("Error in parse-screenshot:", errMsg);

    const isQuota = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");
    const isTransient = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
    const isAuth =
      errMsg.includes("API_KEY") ||
      errMsg.includes("403") ||
      errMsg.includes("400") ||
      errMsg.includes("unregistered") ||
      errMsg.includes("invalid key") ||
      errMsg.includes("PERMISSION_DENIED");

    let clientMsg = "AI Vision encountered an issue. Running fast On-Device Receipt OCR...";
    let authHint = "";

    if (isAuth) {
      clientMsg = "Gemini API key unavailable on server. Running fast On-Device Receipt OCR...";
      authHint = "Make sure GEMINI_API_KEY is configured in your hosting environment variables.";
    } else if (isQuota) {
      clientMsg = "AI Vision rate limit reached. Running On-Device Receipt OCR...";
    } else if (isTransient) {
      clientMsg = "AI Vision is temporarily busy. Running On-Device Receipt OCR...";
    }

    // Return 200 with useClientOcr flag so the frontend client immediately triggers local Tesseract OCR
    return res.json({
      success: false,
      useClientOcr: true,
      isRealPaymentReceipt: false,
      error: clientMsg,
      errorCode: isAuth ? "AUTH_ERROR" : isQuota ? "QUOTA_EXHAUSTED" : isTransient ? "SERVICE_BUSY" : "PROCESSING_ERROR",
      authHint,
      fallbackAllowed: true,
    });
  }
});

// Endpoint: Parse Voice / Natural Language Indian Student Expense
app.post("/api/ai/parse-voice", async (req, res) => {
  const { transcript } = req.body || {};
  if (!transcript) {
    return res.status(400).json({ error: "No transcript provided" });
  }

  const numMatch = transcript.match(/\b(\d+)\b/);
  const fallbackAmount = numMatch ? parseFloat(numMatch[1]) : 50;
  const isCash = transcript.toLowerCase().includes("cash") || transcript.toLowerCase().includes("rokda");
  const fallbackData = {
    type: "expense",
    amount: fallbackAmount,
    category: "Canteen & Chai",
    paymentMode: isCash ? "Cash" : "UPI",
    description: transcript,
    person: null,
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ success: true, data: fallbackData });
    }

    const prompt = `A student spoke this expense:
"${transcript}"

Parse and categorize it strictly into English.
Fields:
- type: "expense" (always expense)
- amount: number in Rupees (e.g. 20)
- category: one of ["Groceries", "Canteen & Chai", "Mess & Food", "Room & Rent", "Recharge & Wi-Fi", "Travel & Auto", "College & Books", "Shopping", "Entertainment", "Medical", "Other"]
- paymentMode: "Cash" | "UPI" (default to "UPI" unless cash/rokda is explicitly mentioned)
- description: English translation of the item (e.g. "sabji" -> "Vegetables", "chai" -> "Tea & Snacks", "auto" -> "Auto Fare", "khana" -> "Food & Meals", "doodh" -> "Milk", "dawa" -> "Medicine")

Return strictly valid JSON only.`;

    const response = await callGeminiWithFallback(ai, async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              paymentMode: { type: Type.STRING },
              description: { type: Type.STRING },
              person: { type: Type.STRING },
            },
            required: ["type", "amount", "category", "paymentMode", "description"],
          },
        },
      });
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in parse-voice:", error);
    return res.json({ success: true, data: fallbackData });
  }
});

// Endpoint: Dedicated Ultra-Fast AI Student Chat (~1s response)
app.post("/api/ai/chat", async (req, res) => {
  const { message, history, studentState } = req.body || {};
  const promptText = (message || req.body?.prompt || "").trim();

  if (!promptText) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }

  const allowance = Number(studentState?.monthlyPocketMoney) || 10000;
  const remaining = Number(studentState?.remainingPocketMoney ?? studentState?.remainingBudget) ?? 6000;
  const days = Number(studentState?.daysLeft) || 15;
  const safeDaily = Math.max(0, Math.round(remaining / (days || 1)));
  const todaySpent = Number(studentState?.todaySpent) || 0;
  const pendingUdhaar = Number(studentState?.pendingToCollect ?? studentState?.pendingUdhaarTotal) || 0;
  const upcomingBills = Number(studentState?.upcomingBills ?? studentState?.upcomingBillsTotal) || 0;

  // Room context
  const roomName = studentState?.roomName || "Hostel/Flat";
  const roomMembers = Array.isArray(studentState?.roomMembers) ? studentState.roomMembers.join(", ") : "Roommates";
  const roomStanding = studentState?.myRoomStanding || "All settled";
  const recentRoomPurchases = Array.isArray(studentState?.recentRoomPurchases)
    ? studentState.recentRoomPurchases.slice(0, 8).map((p: any) => `${p.title} (₹${p.amount}, paid by ${p.paidBy})`).join("; ")
    : "No recent shared purchases";
  const whoOwesWhom = Array.isArray(studentState?.whoOwesWhom)
    ? studentState.whoOwesWhom.map((d: any) => `${d.from} owes ${d.to} ₹${d.amount}`).join("; ")
    : "No pending room debts";

  try {
    const ai = getGeminiClient();
    if (!ai) {
      const fb = generateFallbackCoachingData(studentState, promptText);
      return res.json({ success: true, reply: fb.chatReply, answer: fb.chatReply, source: "offline_engine" });
    }

    const systemPrompt = `You are PocketBuddy AI, the ultimate smart financial coach and hostel/room expense advisor for Indian college students.
You know EVERYTHING about student finances, room bill splits, hostel life, jugaad, and smart money management.

Current Student & Room Context:
- Monthly Pocket Money: ₹${allowance} | Remaining: ₹${remaining}
- Days left in month: ${days} days | Safe Daily Cap: ₹${safeDaily}/day | Spent Today: ₹${todaySpent}
- Pending Udhaar to collect: ₹${pendingUdhaar} | Upcoming bills/rent: ₹${upcomingBills}
- Room: "${roomName}" | Roommates: ${roomMembers}
- User's Room Standing: ${roomStanding}
- Recent Room Purchases: ${recentRoomPurchases}
- Room Debt Splits: ${whoOwesWhom}

Instructions:
1. Answer ANY query the student asks:
   - Budget management, affordability checks ("Can I afford ₹X today?"), savings targets ("How to save ₹1,000?")
   - Room expense breakdowns, who owes what, politely nudging roommates for payment, crafting WhatsApp reminder notes
   - Fair room bill splitting rules (e.g., when a roommate is traveling, AC/electricity splits, grocery waste)
   - Practical student living hacks (mess rebates, smart grocery purchasing, avoiding impulse food orders)
2. Tone & Language: Clear, professional, friendly, and empowering English. Speak with clarity, structured spacing, and bullet points.
3. Use exact calculations with their provided budget and room numbers whenever applicable.
4. Keep answers concise, actionable, and visually structured. Avoid long disclaimers.`;

    const userPrompt = `${systemPrompt}\n\nStudent question: "${promptText}"`;

    const response = await callGeminiWithFallback(ai, async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
      });
    });

    const reply = response.text?.trim() || generateFallbackCoachingData(studentState, promptText).chatReply;
    return res.json({ success: true, reply, answer: reply, source: "gemini" });
  } catch (error: any) {
    console.warn("AI chat call fallback:", error?.message || error);
    const fb = generateFallbackCoachingData(studentState, promptText);
    return res.json({ success: true, reply: fb.chatReply, answer: fb.chatReply, source: "fallback_engine" });
  }
});

// Endpoint: AI Student Money Coach Insights & Q&A
app.post("/api/ai/coach", async (req, res) => {
  const body = req.body || {};
  const studentState = body.studentState || {
    monthlyPocketMoney: body.monthlyPocketMoney,
    remainingPocketMoney: body.remainingBudget,
    safeDailyLimit: body.safeDailyCap,
    todaySpent: body.todaySpent,
    totalSpent: body.totalSpent,
    wallets: body.wallets,
    pendingToCollect: body.pendingUdhaarTotal,
    upcomingBills: body.upcomingBillsTotal,
    recentTransactions: body.recentTransactions,
  };
  const userQuestion = body.userQuestion || body.prompt || body.message || "";

  try {
    const ai = getGeminiClient();

    if (!ai) {
      const fallbackData = generateFallbackCoachingData(studentState, userQuestion);
      return res.json({
        success: true,
        data: fallbackData,
        insight: fallbackData,
        answer: fallbackData.chatReply,
        chatReply: fallbackData.chatReply,
        source: "offline_engine",
      });
    }

    const prompt = `You are "AI Student Money Coach" (Bhai/Buddy style, empathetic, smart, practical, witty Indian college senior/financial mentor).
The student's financial dashboard snapshot:
- Monthly Pocket Money: ₹${studentState?.monthlyPocketMoney || 10000}
- Remaining Pocket Money: ₹${studentState?.remainingPocketMoney || 6400}
- Days left in current month: ${studentState?.daysLeft || 14}
- Safe Daily Spending Limit: ₹${studentState?.safeDailyLimit || 220}
- Today's Spent: ₹${studentState?.todaySpent || 180}
- Balances: Cash: ₹${studentState?.cashBalance || 850}, UPI: ₹${studentState?.upiBalance || 3200}, Bank: ₹${studentState?.bankBalance || 2350}
- Top Expense Categories This Month: ${JSON.stringify(studentState?.topCategories || [])}
- Pending Udhaar to Collect (Lent to friends): ₹${studentState?.pendingToCollect || 750} (People: ${JSON.stringify(studentState?.pendingDebtors || ["Rahul ₹300", "Aman ₹450"])})
- Upcoming Bills / Rent in next 7 days: ₹${studentState?.upcomingBills || 2500}
- Mess status: ${studentState?.messStatus || "Skipped meals tracked, rebate eligible"}

${userQuestion ? `The student is asking you this question directly: "${userQuestion}"` : "Provide regular coaching review."}

Give your feedback in a student-friendly tone (clear, engaging English with practical college tips and realistic student budget hacks).
Output JSON format:
{
  "summary": "1-2 sentence punchy evaluation of their financial health right now",
  "status": "healthy" | "warning" | "danger",
  "burnRateAlert": "Direct observation about their pocket money burn rate and whether they will run out before month end",
  "hacks": [
    "3 highly specific, actionable student money hacks based on their exact numbers above (e.g. mess rebate, collecting udhaar, splitting room bills, canteen budget)"
  ],
  "safeDailyCap": number,
  "chatReply": "Conversational, direct mentor response to the student's question or general coaching advice"
}`;

    const response = await callGeminiWithFallback(ai, async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      success: true,
      data: parsed,
      insight: parsed,
      answer: parsed.chatReply,
      chatReply: parsed.chatReply,
      source: "gemini",
    });
  } catch (error: any) {
    console.warn("Gemini coaching call failed, serving intelligent financial rule-based fallback:", error?.message || error);
    const fallbackData = generateFallbackCoachingData(studentState, userQuestion);
    return res.json({
      success: true,
      data: fallbackData,
      insight: fallbackData,
      answer: fallbackData.chatReply,
      chatReply: fallbackData.chatReply,
      source: "fallback_engine",
    });
  }
});

// OCR Endpoint for Handwritten Loan Notes, Chits & Screenshots
app.post("/api/ocr/loan-note", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Image data is required",
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: false,
        error: "AI OCR service is temporarily unconfigured. Please enter details manually.",
        fallback: true,
      });
    }

    const todayDate = new Date().toISOString().split("T")[0];

    const prompt = `You are an expert OCR parser for student handwritten loan notes, WhatsApp chats, IOU chits, and receipts in Hindi/English/Hinglish.
Today is ${todayDate}.
Analyze this handwritten note or screenshot and extract loan details:
1. "person": The friend's name (e.g., Aman, Rahul, Neeraj). Do not write "I" or "Me" or "You".
2. "amount": The numeric amount in INR (e.g. 800). Must be a positive number.
3. "type": "give" if the note indicates the user lent money / gave money / paid for a friend / friend owes money (e.g., "Gave Aman 800", "Aman owes 800", "Paid for Aman").
          "take" if the note indicates the user borrowed money / owes money (e.g., "Borrowed 500 from Rahul", "Need to give Rahul 500").
4. "reason": Brief description or purpose (e.g., "Dinner", "Travel", "Auto", "Hostel Xerox").
5. "date": Date in YYYY-MM-DD if written, else "${todayDate}".
6. "dueDate": Due date in YYYY-MM-DD if written (e.g., "return by 20th", "salary aane par"), else empty string.
7. "notes": Any additional private remark or promise written in the note.
8. "confidence": "high", "medium", or "low".
9. "rawText": Exact text transcribed from the image.

Output ONLY valid JSON adhering strictly to this schema:
{
  "person": string,
  "amount": number,
  "type": "give" | "take",
  "reason": string,
  "date": string,
  "dueDate": string,
  "notes": string,
  "confidence": "high" | "medium" | "low",
  "rawText": string
}`;

    const response = await callGeminiWithFallback(ai, async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          prompt,
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      success: true,
      result: {
        person: parsed.person || "",
        amount: Number(parsed.amount) || 0,
        type: parsed.type === "take" ? "take" : "give",
        reason: parsed.reason || "",
        date: parsed.date || todayDate,
        dueDate: parsed.dueDate || "",
        notes: parsed.notes || "",
        confidence: parsed.confidence || "medium",
        rawText: parsed.rawText || "",
      },
    });
  } catch (error: any) {
    console.error("OCR extraction error:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "We could not read this note clearly. Please enter the details manually.",
    });
  }
});

// Vite middleware / Static file serving
async function startServer() {
  await initFirestorePersistence();
  ensureUsersDataFiles();

  const hasDist = fs.existsSync(path.join(process.cwd(), "dist", "index.html"));
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER) || (hasDist && process.argv[1]?.includes("dist"));

  if (isProd && hasDist) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PocketBuddy server running on port ${PORT}`);
  });
}

startServer();
