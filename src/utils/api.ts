import { StudentUser, UserAppData, PersonalNote } from '../types';
import { getCleanUserData } from '../data/initialData';

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isStaticHtml?: boolean;
}

/**
 * Robust JSON fetcher that will NEVER crash on static hosts like Netlify
 * where missing backend routes return index.html (<!DOCTYPE...) or empty responses.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 5000
): Promise<SafeFetchResult<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';

    // If server responded with HTML (e.g. Netlify fallback to index.html)
    if (contentType.includes('text/html')) {
      return {
        ok: false,
        status: res.status,
        isStaticHtml: true,
        error: 'Static server returned HTML instead of JSON API.',
      };
    }

    // If not JSON content type
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        status: res.status,
        isStaticHtml: text.trim().startsWith('<'),
        error: text || 'Non-JSON response from server.',
      };
    }

    // Parse JSON safely
    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
      isStaticHtml: false,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      isStaticHtml: false,
      error: err?.message || 'Network error',
    };
  }
}

// ---------------------------------------------------------------------------
// Client-side Local Auth & User Storage for Netlify / Offline Mode
// ---------------------------------------------------------------------------

interface RegisteredAccount {
  user: StudentUser;
  passwordHash: string;
}

const REGISTERED_USERS_KEY = 'smm_registered_users';

export function getLocalRegisteredUsers(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading registered users from localStorage:', e);
  }
  return [];
}

export function saveLocalRegisteredUsers(users: RegisteredAccount[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving registered users to localStorage:', e);
  }
}

// Simple deterministic hash for local credential checking
function simpleLocalHash(pwd: string): string {
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    const char = pwd.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'lh_' + Math.abs(hash).toString(36) + '_' + pwd.length;
}

/**
 * Normalizes phone numbers (e.g. +91 7307273515, 07307273515, 7307273515 -> 7307273515)
 */
export function normalizePhone(input: string | undefined | null): string {
  if (!input) return '';
  const digits = String(input).replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.substring(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.substring(1);
  }
  return digits;
}

/**
 * Loads the user's persistent data from localStorage
 */
export function getUserStoredData(userId: string): UserAppData {
  const fallbackClean = getCleanUserData(0, { cash: 0, upi: 0 }, 'Student') as UserAppData;
  if (!userId) return fallbackClean;

  try {
    const rawUserData = localStorage.getItem(`smm_user_data_${userId}`);
    if (rawUserData) {
      const parsed = JSON.parse(rawUserData);
      if (parsed && typeof parsed === 'object') {
        return {
          monthlyPocketMoney: typeof parsed.monthlyPocketMoney === 'number' ? parsed.monthlyPocketMoney : 0,
          wallets: parsed.wallets || { cash: 0, upi: 0 },
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          roomExpenses: Array.isArray(parsed.roomExpenses) ? parsed.roomExpenses : [],
          roommates: Array.isArray(parsed.roommates) ? parsed.roommates : [],
          roomGroups: Array.isArray(parsed.roomGroups) ? parsed.roomGroups : [],
          activeRoomId: parsed.activeRoomId,
          meals: Array.isArray(parsed.meals) ? parsed.meals : [],
          messConfig: parsed.messConfig || fallbackClean.messConfig,
          udhaarRecords: Array.isArray(parsed.udhaarRecords) ? parsed.udhaarRecords : [],
          bills: Array.isArray(parsed.bills) ? parsed.bills : [],
          goals: Array.isArray(parsed.goals) ? parsed.goals : [],
          hasCompletedTour: Boolean(parsed.hasCompletedTour),
        };
      }
    }

    // Fallback 1: check individual prefixed keys
    const userPrefix = `smm_${userId}_`;
    const txRaw = localStorage.getItem(`${userPrefix}transactions`);
    const walletsRaw = localStorage.getItem(`${userPrefix}wallets`);
    const pocketMoneyRaw = localStorage.getItem(`${userPrefix}pocket_money`);
    const roomGroupsRaw = localStorage.getItem(`${userPrefix}room_groups`);
    const activeRoomIdRaw = localStorage.getItem(`${userPrefix}active_room_id`);
    const mealsRaw = localStorage.getItem(`${userPrefix}meals`);
    const messConfigRaw = localStorage.getItem(`${userPrefix}mess_config`);
    const udhaarRaw = localStorage.getItem(`${userPrefix}udhaar`);
    const billsRaw = localStorage.getItem(`${userPrefix}bills`);
    const goalsRaw = localStorage.getItem(`${userPrefix}goals`);

    if (txRaw || walletsRaw || pocketMoneyRaw) {
      return {
        monthlyPocketMoney: pocketMoneyRaw ? Number(JSON.parse(pocketMoneyRaw)) : 0,
        wallets: walletsRaw ? JSON.parse(walletsRaw) : { cash: 0, upi: 0 },
        transactions: txRaw ? JSON.parse(txRaw) : [],
        roomExpenses: [],
        roommates: [],
        roomGroups: roomGroupsRaw ? JSON.parse(roomGroupsRaw) : [],
        activeRoomId: activeRoomIdRaw || undefined,
        meals: mealsRaw ? JSON.parse(mealsRaw) : [],
        messConfig: messConfigRaw ? JSON.parse(messConfigRaw) : fallbackClean.messConfig,
        udhaarRecords: udhaarRaw ? JSON.parse(udhaarRaw) : [],
        bills: billsRaw ? JSON.parse(billsRaw) : [],
        goals: goalsRaw ? JSON.parse(goalsRaw) : [],
        hasCompletedTour: true,
      };
    }

    // Fallback 2: check generic device keys if user-scoped data was not yet partitioned
    const globalTxRaw = localStorage.getItem('smm_transactions');
    const globalWalletsRaw = localStorage.getItem('smm_wallets');
    const globalPocketMoneyRaw = localStorage.getItem('smm_pocket_money');
    if (globalTxRaw || globalWalletsRaw || globalPocketMoneyRaw) {
      try {
        const parsedTx = globalTxRaw ? JSON.parse(globalTxRaw) : [];
        const parsedWallets = globalWalletsRaw ? JSON.parse(globalWalletsRaw) : { cash: 0, upi: 0 };
        const parsedPM = globalPocketMoneyRaw ? Number(JSON.parse(globalPocketMoneyRaw)) : 0;
        if (parsedTx.length > 0 || parsedWallets.cash > 0 || parsedWallets.upi > 0 || parsedPM > 0) {
          return {
            ...fallbackClean,
            monthlyPocketMoney: parsedPM,
            wallets: parsedWallets,
            transactions: parsedTx,
          };
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Error reading stored user data:', err);
  }

  return fallbackClean;
}

/**
 * Saves complete user persistent data to localStorage with anti-wipeout merging
 */
export function saveUserStoredData(userId: string, data: Partial<UserAppData> & { forceReset?: boolean }): void {
  if (!userId) return;
  try {
    const existing = getUserStoredData(userId);

    // Merge transactions safely so a momentary empty state never wipes past transactions
    let mergedTransactions = existing.transactions || [];
    if (Array.isArray(data.transactions)) {
      if (data.transactions.length > 0) {
        const txMap = new Map<string, any>();
        existing.transactions.forEach((tx) => {
          if (tx && tx.id) txMap.set(tx.id, tx);
        });
        data.transactions.forEach((tx) => {
          if (tx && tx.id) txMap.set(tx.id, tx);
        });
        mergedTransactions = Array.from(txMap.values()).sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA;
        });
      } else if (data.forceReset) {
        mergedTransactions = [];
      }
    }

    // Preserve wallets if unhydrated zeros are passed and existing has positive balance
    let mergedWallets = { ...existing.wallets, ...(data.wallets || {}) };
    const existingLiquidity = (existing.wallets?.cash || 0) + (existing.wallets?.upi || 0);
    const incomingLiquidity = data.wallets ? (data.wallets.cash || 0) + (data.wallets.upi || 0) : 0;
    if (data.wallets && incomingLiquidity === 0 && existingLiquidity > 0 && !data.forceReset) {
      mergedWallets = existing.wallets;
    }

    // Preserve allowance if unhydrated zero is passed and existing had positive allowance
    let mergedAllowance = data.monthlyPocketMoney !== undefined ? data.monthlyPocketMoney : existing.monthlyPocketMoney;
    if (data.monthlyPocketMoney === 0 && existing.monthlyPocketMoney > 0 && !data.forceReset) {
      mergedAllowance = existing.monthlyPocketMoney;
    }

    const updated: UserAppData = {
      ...existing,
      ...data,
      monthlyPocketMoney: mergedAllowance,
      wallets: mergedWallets,
      transactions: mergedTransactions,
    };

    localStorage.setItem(`smm_user_data_${userId}`, JSON.stringify(updated));

    // Also update prefixed keys for fast individual lookups
    const userPrefix = `smm_${userId}_`;
    localStorage.setItem(`${userPrefix}pocket_money`, JSON.stringify(updated.monthlyPocketMoney));
    localStorage.setItem(`${userPrefix}wallets`, JSON.stringify(updated.wallets));
    localStorage.setItem(`${userPrefix}transactions`, JSON.stringify(updated.transactions));
    if (updated.roomGroups) {
      localStorage.setItem(`${userPrefix}room_groups`, JSON.stringify(updated.roomGroups));
    }
    if (updated.activeRoomId) {
      localStorage.setItem(`${userPrefix}active_room_id`, updated.activeRoomId);
    }
    if (updated.meals) {
      localStorage.setItem(`${userPrefix}meals`, JSON.stringify(updated.meals));
    }
    if (updated.messConfig) {
      localStorage.setItem(`${userPrefix}mess_config`, JSON.stringify(updated.messConfig));
    }
    if (updated.udhaarRecords) {
      localStorage.setItem(`${userPrefix}udhaar`, JSON.stringify(updated.udhaarRecords));
    }
    if (updated.bills) {
      localStorage.setItem(`${userPrefix}bills`, JSON.stringify(updated.bills));
    }
    if (updated.goals) {
      localStorage.setItem(`${userPrefix}goals`, JSON.stringify(updated.goals));
    }

    // Keep active session global fallback keys in sync
    localStorage.setItem('smm_pocket_money', JSON.stringify(updated.monthlyPocketMoney));
    localStorage.setItem('smm_wallets', JSON.stringify(updated.wallets));
    localStorage.setItem('smm_transactions', JSON.stringify(updated.transactions));
  } catch (err) {
    console.warn('Error saving user data locally:', err);
  }
}

/**
 * Loads private personal notes strictly scoped to the specific user ID.
 * Prevents cross-contamination between different user accounts.
 */
export function getUserNotes(userId: string): PersonalNote[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`smm_notes_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    }
  } catch (err) {
    console.warn('Error reading user notes locally:', err);
  }
  return [];
}

/**
 * Saves private personal notes strictly scoped to the specific user ID.
 */
export function saveUserNotes(userId: string, notes: PersonalNote[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(`smm_notes_${userId}`, JSON.stringify(notes));
  } catch (err) {
    console.warn('Error saving user notes locally:', err);
  }
}

/**
 * Synchronizes an account into local registry for offline/hybrid persistence
 */
export function syncAccountToLocal(user: StudentUser, password?: string): void {
  if (!user || !user.id) return;
  try {
    const registered = getLocalRegisteredUsers();
    const existingIndex = registered.findIndex(
      (r) =>
        r.user.id === user.id ||
        (user.email && r.user.email?.toLowerCase() === user.email.toLowerCase()) ||
        (user.phone && normalizePhone(r.user.phone) === normalizePhone(user.phone))
    );

    if (existingIndex >= 0) {
      registered[existingIndex].user = { ...registered[existingIndex].user, ...user };
      if (password) {
        registered[existingIndex].passwordHash = simpleLocalHash(password);
      }
    } else {
      registered.push({
        user,
        passwordHash: password ? simpleLocalHash(password) : simpleLocalHash('PocketBuddy@123'),
      });
    }
    saveLocalRegisteredUsers(registered);
  } catch (err) {
    console.warn('Error syncing account locally:', err);
  }
}

/**
 * Register a user locally when backend is unreachable or on static hosts (Netlify)
 */
export function localRegisterUser(params: {
  name: string;
  email: string;
  phone: string;
  password: string;
  collegeName?: string;
}): { success: boolean; user?: StudentUser; token?: string; data?: UserAppData; error?: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  const rawPhone = params.phone.trim();
  const cleanPhone = normalizePhone(rawPhone);
  const cleanName = params.name.trim();

  const registered = getLocalRegisteredUsers();

  // Check duplicate
  const duplicate = registered.find((a) => {
    if (a.user.email && a.user.email.toLowerCase() === cleanEmail) return true;
    if (cleanPhone.length >= 7 && a.user.phone) {
      const uPhone = normalizePhone(a.user.phone);
      if (uPhone === cleanPhone || uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone)) return true;
    }
    return false;
  });

  if (duplicate) {
    return {
      success: false,
      error: 'An account with this email or mobile number already exists. Please Sign In.',
    };
  }

  const newUserId = 'stu_local_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const upiId = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@upi`;

  const newUser: StudentUser = {
    id: newUserId,
    name: cleanName,
    email: cleanEmail,
    phone: rawPhone || undefined,
    collegeName: params.collegeName?.trim() || 'College',
    course: 'Student',
    yearOfStudy: '',
    upiId,
    monthlyPocketMoney: 0,
    hasCompletedTour: false,
    createdAt: new Date().toISOString(),
  };

  registered.push({
    user: newUser,
    passwordHash: simpleLocalHash(params.password),
  });

  saveLocalRegisteredUsers(registered);

  const token = `local_token_${newUserId}_${Date.now()}`;
  const initialUserData = getCleanUserData(0, { cash: 0, upi: 0 }, cleanName, upiId) as any;
  saveUserStoredData(newUserId, initialUserData);

  return {
    success: true,
    user: newUser,
    token,
    data: initialUserData,
  };
}

/**
 * Login a user locally when backend is unreachable or on static hosts (Netlify)
 */
export function localLoginUser(
  identifier: string,
  password: string
): { success: boolean; user?: StudentUser; token?: string; data?: UserAppData; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const normId = normalizePhone(identifier);

  const registered = getLocalRegisteredUsers();

  // Search by email or normalized phone
  let match = registered.find((a) => {
    if (a.user.email && a.user.email.toLowerCase() === cleanId) return true;
    if (normId.length >= 7 && a.user.phone) {
      const uNorm = normalizePhone(a.user.phone);
      if (uNorm === normId || uNorm.endsWith(normId) || normId.endsWith(uNorm)) return true;
    }
    return false;
  });

  // If user matches in local registry
  if (match) {
    if (match.passwordHash !== simpleLocalHash(password)) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your password or use Forgot Password.',
      };
    }

    const token = `local_token_${match.user.id}_${Date.now()}`;
    const userData = getUserStoredData(match.user.id);

    return {
      success: true,
      user: match.user,
      token,
      data: userData,
    };
  }

  // Fallback: check if user had previously logged into this device
  try {
    const savedUserRaw = localStorage.getItem('smm_current_user');
    if (savedUserRaw) {
      const savedUser: StudentUser = JSON.parse(savedUserRaw);
      const isEmailMatch = savedUser.email && savedUser.email.toLowerCase() === cleanId;
      const isPhoneMatch = normId.length >= 7 && savedUser.phone && normalizePhone(savedUser.phone) === normId;

      if (isEmailMatch || isPhoneMatch) {
        // Automatically link this user into local registry
        registered.push({
          user: savedUser,
          passwordHash: simpleLocalHash(password),
        });
        saveLocalRegisteredUsers(registered);

        const userData = getUserStoredData(savedUser.id);

        return {
          success: true,
          user: savedUser,
          token: `local_token_${savedUser.id}_${Date.now()}`,
          data: userData,
        };
      }
    }
  } catch {
    // ignore
  }

  // If completely new on this static instance, provide friendly instruction
  return {
    success: false,
    error: 'No account found with this email or mobile number. Please click "Sign Up" below to create your account.',
  };
}

/**
 * Reset password locally for static Netlify mode
 */
export function localResetPassword(
  identifier: string,
  newPassword: string
): { success: boolean; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const normId = normalizePhone(identifier);

  const registered = getLocalRegisteredUsers();
  const target = registered.find((a) => {
    if (a.user.email && a.user.email.toLowerCase() === cleanId) return true;
    if (normId.length >= 7 && a.user.phone) {
      const uNorm = normalizePhone(a.user.phone);
      if (uNorm === normId || uNorm.endsWith(normId) || normId.endsWith(uNorm)) return true;
    }
    return false;
  });

  if (!target) {
    return {
      success: false,
      error: 'No registered account found with this email or mobile number.',
    };
  }

  target.passwordHash = simpleLocalHash(newPassword);
  saveLocalRegisteredUsers(registered);
  return { success: true };
}
