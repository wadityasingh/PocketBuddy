import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Camera,
  Mic,
  PlusCircle,
  Home,
  UtensilsCrossed,
  Handshake,
  BookOpen,
  Bell,
  Target,
  PieChart,
  Layers,
  GraduationCap,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  HelpCircle,
  User,
  ShieldCheck,
  LogOut,
  Users,
  Plus,
  UserCheck,
  History,
  Github,
  MessageCircle,
  Linkedin,
  Instagram,
  Facebook,
} from 'lucide-react';

import {
  Transaction,
  WalletBalances,
  RoomExpense,
  Roommate,
  RoomGroup,
  RoomSettlement,
  DailyMealEntry,
  MessConfig,
  UdhaarRecord,
  BillReminder,
  SavingsGoal,
  PaymentMode,
  ExpenseCategory,
  StudentUser,
  UserAppData,
  PersonalNote,
} from './types';

import {
  initialTransactions,
  initialWallets,
  initialRoomExpenses,
  initialRoommates,
  initialMealAttendance,
  initialMessConfig,
  initialUdhaarRecords,
  initialBillReminders,
  initialSavingsGoals,
  INITIAL_PERSONAL_NOTES,
  SAMPLE_PERSONAL_NOTES,
  getCleanUserData,
  getSampleUserData,
} from './data/initialData';

import { formatINR, generateId } from './utils/formatters';

// Components
import { TransactionsList } from './components/TransactionsList';
import { ScreenshotScannerModal } from './components/ScreenshotScannerModal';
import { VoiceInputModal } from './components/VoiceInputModal';
import { ManualExpenseModal } from './components/ManualExpenseModal';
import { RoomExpenseManager } from './components/RoomExpenseManager';
import { CoolNotepad } from './components/CoolNotepad';
import { BillRemindersTab } from './components/BillRemindersTab';
import { UnifiedHistoryTab } from './components/UnifiedHistoryTab';
import { AiCoachTab } from './components/AiCoachTab';
import { AuthScreen } from './components/AuthScreen';
import { StudentProfileModal } from './components/StudentProfileModal';
import { FirstTimeSetupModal } from './components/FirstTimeSetupModal';
import { SmartMoneyHub } from './components/SmartMoneyHub';
import { QuickAiModal } from './components/QuickAiModal';
import { BrandLogo } from './components/BrandLogo';
import { RadialLoader } from './components/RadialLoader';
import { safeFetchJson, getUserStoredData, saveUserStoredData, getUserNotes, saveUserNotes } from './utils/api';

type TabType = 'overview' | 'room' | 'udhaar' | 'history' | 'bills';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [isQuickAiOpen, setIsQuickAiOpen] = useState(false);
  const [initialAiPrompt, setInitialAiPrompt] = useState<string | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Loading state for authenticating and fetching persistent user data on boot (~1s real app feel)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Authenticated Student User State (Loads saved student or null)
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(() => {
    try {
      const saved = localStorage.getItem('smm_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Guard to avoid saving blank initial state to localStorage or backend before hydration completes
  const [isDataHydrated, setIsDataHydrated] = useState<boolean>(false);
  const isHydratedRef = useRef<boolean>(false);
  isHydratedRef.current = isDataHydrated;

  // Persistent State (Initialize from localStorage if available, else clean defaults)
  const [monthlyPocketMoney, setMonthlyPocketMoney] = useState<number>(() => {
    try {
      const savedUser = localStorage.getItem('smm_current_user');
      const u = savedUser ? JSON.parse(savedUser) : null;
      const userPrefix = u?.id ? `smm_${u.id}_` : '';
      const saved = (userPrefix && localStorage.getItem(`${userPrefix}pocket_money`)) || localStorage.getItem('smm_pocket_money');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return 0;
  });

  const [wallets, setWallets] = useState<WalletBalances>(() => {
    try {
      const savedUser = localStorage.getItem('smm_current_user');
      const u = savedUser ? JSON.parse(savedUser) : null;
      const userPrefix = u?.id ? `smm_${u.id}_` : '';
      const saved = (userPrefix && localStorage.getItem(`${userPrefix}wallets`)) || localStorage.getItem('smm_wallets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { cash: 0, upi: 0 };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedUser = localStorage.getItem('smm_current_user');
      const u = savedUser ? JSON.parse(savedUser) : null;
      const userPrefix = u?.id ? `smm_${u.id}_` : '';
      const saved = (userPrefix && localStorage.getItem(`${userPrefix}transactions`)) || localStorage.getItem('smm_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>(() => {
    try {
      const saved = localStorage.getItem('smm_room_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('smm_active_room_id') || null;
    } catch {}
    return null;
  });

  const [meals, setMeals] = useState<DailyMealEntry[]>(() => {
    try {
      const saved = localStorage.getItem('smm_meals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [messConfig, setMessConfig] = useState<MessConfig>(() => {
    try {
      const saved = localStorage.getItem('smm_mess_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialMessConfig;
  });

  const [udhaarRecords, setUdhaarRecords] = useState<UdhaarRecord[]>(() => {
    try {
      const saved = localStorage.getItem('smm_udhaar');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [bills, setBills] = useState<BillReminder[]>(() => {
    try {
      const saved = localStorage.getItem('smm_bills');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('smm_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isSampleMode, setIsSampleMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smm_is_sample_mode') === 'true';
    } catch {}
    return false;
  });

  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>(() => {
    try {
      const storedUser = localStorage.getItem('smm_current_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u?.id) {
          return getUserNotes(u.id);
        }
      }
    } catch {}
    return [];
  });

  // Professional Initial Session Verification & Data Hydration from Server
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      const startTime = Date.now();
      try {
        const storedUser = localStorage.getItem('smm_current_user');
        const token = localStorage.getItem('smm_auth_token');
        let parsedUser: StudentUser | null = null;
        if (storedUser) {
          try {
            parsedUser = JSON.parse(storedUser);
          } catch (e) {
            console.error('Stored user parse failed:', e);
          }
        }

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (parsedUser?.id) headers['x-user-id'] = parsedUser.id;

        if (token || parsedUser?.id) {
          const authRes = await safeFetchJson('/api/auth/me', { headers }, 3000);
          let targetUser: StudentUser | null = parsedUser;
          if (authRes.ok && authRes.data?.success && authRes.data.user) {
            targetUser = authRes.data.user;
          } else if (authRes.status === 401 || authRes.status === 404) {
            targetUser = null;
          }

          if (targetUser && isMounted) {
            setCurrentUser(targetUser);
            localStorage.setItem('smm_current_user', JSON.stringify(targetUser));

            // 1. Read stored local data
            const localData = getUserStoredData(targetUser.id);

            // 2. Fetch server data
            const dataRes = await safeFetchJson(
              '/api/user/data',
              { headers: { 'x-user-id': targetUser.id } },
              3000
            );
            const serverData = dataRes.ok && dataRes.data?.success && dataRes.data.data ? dataRes.data.data : null;

            // 3. Smart reconciliation (Authoritative server data, local fallback)
            let mergedTransactions: Transaction[] = [];
            if (serverData && Array.isArray(serverData.transactions)) {
              mergedTransactions = serverData.transactions;
            } else if (Array.isArray(localData?.transactions)) {
              mergedTransactions = localData.transactions;
            }

            const serverLiquidity = serverData?.wallets
              ? (serverData.wallets.cash || 0) + (serverData.wallets.upi || 0)
              : 0;
            const localLiquidity = (localData.wallets?.cash || 0) + (localData.wallets?.upi || 0);
            const mergedWallets =
              serverLiquidity > 0
                ? serverData.wallets
                : localLiquidity > 0
                ? localData.wallets
                : { cash: 0, upi: 0 };

            const serverAllowance = Number(serverData?.monthlyPocketMoney) || 0;
            const localAllowance = Number(localData?.monthlyPocketMoney) || 0;
            const mergedAllowance = serverAllowance > 0 ? serverAllowance : localAllowance;

            // Apply reconciled data to state
            setMonthlyPocketMoney(mergedAllowance);
            setWallets(mergedWallets);
            setTransactions(mergedTransactions);

            if (Array.isArray(serverData?.meals) && serverData.meals.length > 0) setMeals(serverData.meals);
            else if (Array.isArray(localData?.meals)) setMeals(localData.meals);

            if (serverData?.messConfig) setMessConfig(serverData.messConfig);
            else if (localData?.messConfig) setMessConfig(localData.messConfig);

            if (Array.isArray(serverData?.udhaarRecords) && serverData.udhaarRecords.length > 0) setUdhaarRecords(serverData.udhaarRecords);
            else if (Array.isArray(localData?.udhaarRecords)) setUdhaarRecords(localData.udhaarRecords);

            if (Array.isArray(serverData?.bills) && serverData.bills.length > 0) setBills(serverData.bills);
            else if (Array.isArray(localData?.bills)) setBills(localData.bills);

            if (Array.isArray(serverData?.goals) && serverData.goals.length > 0) setGoals(serverData.goals);
            else if (Array.isArray(localData?.goals)) setGoals(localData.goals);

            // Hydrate private user personal notes strictly for targetUser
            const localNotes = getUserNotes(targetUser.id);
            setPersonalNotes(localNotes);
            const noteHeaders: Record<string, string> = { 'x-user-id': targetUser.id };
            if (token) noteHeaders['Authorization'] = `Bearer ${token}`;
            safeFetchJson('/api/notes', { headers: noteHeaders }, 3000).then((noteRes) => {
              if (noteRes.ok && noteRes.data?.success && Array.isArray(noteRes.data.notes)) {
                setPersonalNotes(noteRes.data.notes);
                saveUserNotes(targetUser.id, noteRes.data.notes);
              }
            }).catch(() => {});

            // Save reconciled data back to local storage
            saveUserStoredData(targetUser.id, {
              monthlyPocketMoney: mergedAllowance,
              wallets: mergedWallets,
              transactions: mergedTransactions,
            });

            // If local had data but server had empty zeros, push reconciled data to server!
            if (
              (localLiquidity > 0 || localAllowance > 0 || (localData.transactions && localData.transactions.length > 0)) &&
              (!serverData || (serverLiquidity === 0 && serverAllowance === 0 && (!serverData.transactions || serverData.transactions.length === 0)))
            ) {
              fetch('/api/user/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': targetUser.id },
                body: JSON.stringify({
                  data: {
                    monthlyPocketMoney: mergedAllowance,
                    wallets: mergedWallets,
                    transactions: mergedTransactions,
                    meals: localData.meals,
                    messConfig: localData.messConfig,
                    udhaarRecords: localData.udhaarRecords,
                    bills: localData.bills,
                    goals: localData.goals,
                  },
                }),
                keepalive: true,
              }).catch(() => {});
            }

            isHydratedRef.current = true;
            setIsDataHydrated(true);
          } else if (isMounted) {
            setCurrentUser(null);
            localStorage.removeItem('smm_current_user');
            localStorage.removeItem('smm_auth_token');
            isHydratedRef.current = true;
            setIsDataHydrated(true);
          }
        } else {
          if (isMounted) {
            setCurrentUser(null);
            isHydratedRef.current = true;
            setIsDataHydrated(true);
          }
        }
      } catch (err) {
        console.warn('Initial session check error:', err);
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 150 - elapsed);
        setTimeout(() => {
          if (isMounted) {
            isHydratedRef.current = true;
            setIsDataHydrated(true);
            setIsInitialLoading(false);
          }
        }, remaining);
      }
    };

    initApp();

    // Fast fallback: dismiss loading screen within 1.5s under any network condition
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        isHydratedRef.current = true;
        setIsDataHydrated(true);
        setIsInitialLoading(false);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Save to LocalStorage (User-scoped and global) - only AFTER hydration completes
  useEffect(() => {
    if (!isDataHydrated || !currentUser?.id) return;

    const userPrefix = `smm_${currentUser.id}_`;
    localStorage.setItem('smm_pocket_money', JSON.stringify(monthlyPocketMoney));
    localStorage.setItem('smm_wallets', JSON.stringify(wallets));
    localStorage.setItem('smm_transactions', JSON.stringify(transactions));
    localStorage.setItem('smm_room_groups', JSON.stringify(roomGroups));
    if (activeRoomId) localStorage.setItem('smm_active_room_id', activeRoomId);
    localStorage.setItem('smm_meals', JSON.stringify(meals));
    localStorage.setItem('smm_mess_config', JSON.stringify(messConfig));
    localStorage.setItem('smm_udhaar', JSON.stringify(udhaarRecords));
    localStorage.setItem('smm_bills', JSON.stringify(bills));
    localStorage.setItem('smm_goals', JSON.stringify(goals));
    localStorage.setItem('smm_personal_notes', JSON.stringify(personalNotes));
    localStorage.setItem('smm_is_sample_mode', String(isSampleMode));

    localStorage.setItem(`${userPrefix}pocket_money`, JSON.stringify(monthlyPocketMoney));
    localStorage.setItem(`${userPrefix}wallets`, JSON.stringify(wallets));
    localStorage.setItem(`${userPrefix}transactions`, JSON.stringify(transactions));
    localStorage.setItem(`${userPrefix}personal_notes`, JSON.stringify(personalNotes));
  }, [
    isDataHydrated,
    currentUser?.id,
    monthlyPocketMoney,
    wallets,
    transactions,
    roomGroups,
    activeRoomId,
    meals,
    messConfig,
    udhaarRecords,
    bills,
    goals,
    personalNotes,
    isSampleMode,
  ]);

  // Fetch Rooms from Backend on Mount, Login, or Polling
  const fetchRooms = async (explicitUserId?: string) => {
    const uid = explicitUserId || currentUser?.id;
    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = {};
    if (uid) headers['x-user-id'] = uid;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const result = await safeFetchJson('/api/rooms', { headers });
      if (result.ok && result.data) {
        const roomsList = result.data.rooms || result.data.data;
        if (Array.isArray(roomsList)) {
          setRoomGroups(roomsList);
          localStorage.setItem('smm_room_groups', JSON.stringify(roomsList));
          setActiveRoomId((prevActive) => {
            if (prevActive && roomsList.some((r) => r.id === prevActive)) {
              return prevActive;
            }
            const fallback = roomsList[0]?.id || null;
            if (fallback) localStorage.setItem('smm_active_room_id', fallback);
            return fallback;
          });
        }
      }
    } catch (err) {
      console.warn('Backend rooms fetch warning:', err);
    }
  };

  // Real-time room synchronization & polling (Every 3.5 seconds)
  useEffect(() => {
    if (!currentUser?.id) return;

    // Immediately fetch rooms when user is identified
    fetchRooms(currentUser.id);

    // Auto-poll so roommates see new expenses, members, and settlements in real time
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchRooms(currentUser.id);
    }, 3500);

    const onFocus = () => fetchRooms(currentUser.id);
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);

    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    if (joinCode) {
      setCurrentTab('room');
      handleJoinRoom(joinCode.trim().toUpperCase());
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
    };
  }, [currentUser?.id]);

  // Synchronize state with persistent backend storage (only AFTER hydration)
  useEffect(() => {
    if (!isDataHydrated || !currentUser?.id) return;

    // Immediately update local persistent snapshot
    saveUserStoredData(currentUser.id, {
      monthlyPocketMoney,
      wallets,
      transactions,
      roomGroups,
      activeRoomId,
      meals,
      messConfig,
      udhaarRecords,
      bills,
      goals,
      hasCompletedTour: currentUser.hasCompletedTour,
    });

    const timeout = setTimeout(() => {
      fetch('/api/user/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          data: {
            monthlyPocketMoney,
            wallets,
            transactions,
            roomGroups,
            activeRoomId,
            meals,
            messConfig,
            udhaarRecords,
            bills,
            goals,
            hasCompletedTour: currentUser.hasCompletedTour,
          },
        }),
      }).catch((err) => console.warn('Server sync warning:', err));
    }, 1200);

    return () => clearTimeout(timeout);
  }, [
    isDataHydrated,
    currentUser?.id,
    monthlyPocketMoney,
    wallets,
    transactions,
    roomGroups,
    activeRoomId,
    meals,
    messConfig,
    udhaarRecords,
    bills,
    goals,
  ]);

  // Handle Authentication Success
  const handleAuthSuccess = (
    user: StudentUser,
    data: UserAppData,
    token: string,
    isNewUser?: boolean
  ) => {
    setCurrentUser(user);

    // Prioritize populated stored records if available
    const localStored = getUserStoredData(user.id);

    // Resolve transactions (prefer authoritative data from server)
    let mergedTransactions: Transaction[] = [];
    if (data && Array.isArray(data.transactions)) {
      mergedTransactions = data.transactions;
    } else if (Array.isArray(localStored?.transactions)) {
      mergedTransactions = localStored.transactions;
    }

    const serverLiquidity = data?.wallets ? (data.wallets.cash || 0) + (data.wallets.upi || 0) : 0;
    const localLiquidity = (localStored.wallets?.cash || 0) + (localStored.wallets?.upi || 0);
    const mergedWallets = serverLiquidity > 0 ? data.wallets : (localLiquidity > 0 ? localStored.wallets : (data?.wallets || { cash: 0, upi: 0 }));

    const serverAllowance = Number(data?.monthlyPocketMoney) || 0;
    const localAllowance = Number(localStored?.monthlyPocketMoney) || 0;
    const mergedAllowance = serverAllowance > 0 ? serverAllowance : localAllowance;

    setMonthlyPocketMoney(mergedAllowance);
    setWallets(mergedWallets);
    setTransactions(mergedTransactions);

    const mealsToUse = (Array.isArray(data?.meals) && data.meals.length > 0) ? data.meals : localStored.meals;
    if (mealsToUse) setMeals(mealsToUse);
    const messConfigToUse = data?.messConfig || localStored.messConfig;
    if (messConfigToUse) setMessConfig(messConfigToUse);
    const udhaarToUse = (Array.isArray(data?.udhaarRecords) && data.udhaarRecords.length > 0) ? data.udhaarRecords : localStored.udhaarRecords;
    if (udhaarToUse) setUdhaarRecords(udhaarToUse);
    const billsToUse = (Array.isArray(data?.bills) && data.bills.length > 0) ? data.bills : localStored.bills;
    if (billsToUse) setBills(billsToUse);
    const goalsToUse = (Array.isArray(data?.goals) && data.goals.length > 0) ? data.goals : localStored.goals;
    if (goalsToUse) setGoals(goalsToUse);
    if (data?.activeRoomId || localStored.activeRoomId) setActiveRoomId(data?.activeRoomId || localStored.activeRoomId);

    setIsSampleMode(false);
    localStorage.setItem('smm_is_sample_mode', 'false');

    // Mark hydration as done so auto-sync effects can safely run
    setIsDataHydrated(true);
    isHydratedRef.current = true;

    // Save snapshot
    saveUserStoredData(user.id, {
      monthlyPocketMoney: mergedAllowance,
      wallets: mergedWallets,
      transactions: mergedTransactions,
    });

    // Hydrate private notes strictly scoped to the logged-in user
    const localNotes = getUserNotes(user.id);
    setPersonalNotes(localNotes);
    const authHeaders: Record<string, string> = { 'x-user-id': user.id };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;
    safeFetchJson('/api/notes', { headers: authHeaders }, 3000).then((noteRes) => {
      if (noteRes.ok && noteRes.data?.success && Array.isArray(noteRes.data.notes)) {
        setPersonalNotes(noteRes.data.notes);
        saveUserNotes(user.id, noteRes.data.notes);
      }
    }).catch(() => {});

    fetchRooms(user.id);

    if (isNewUser) {
      setIsSetupWizardOpen(true);
    }
  };

  const handleCompleteFirstTimeSetup = async (setupData: {
    name: string;
    monthlyPocketMoney: number;
    wallets: { cash: number; upi: number; bank: number };
    livingSituation: 'alone' | 'roommates';
    roomAction?: 'create' | 'join';
    roomName?: string;
    inviteCode?: string;
    fixedExpenses?: { name: string; amount: number; category: string }[];
  }) => {
    setIsSetupWizardOpen(false);

    // Update user name if set
    if (setupData.name && currentUser) {
      const updatedUser = { ...currentUser, name: setupData.name, hasCompletedTour: true };
      setCurrentUser(updatedUser);
      localStorage.setItem('smm_current_user', JSON.stringify(updatedUser));
      fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ user: updatedUser }),
      }).catch((e) => console.warn('User profile sync notice:', e));
    }

    // Set financial numbers
    setMonthlyPocketMoney(setupData.monthlyPocketMoney);
    setWallets(setupData.wallets);
    persistMoneySnapshotImmediate(setupData.monthlyPocketMoney, setupData.wallets, transactions);

    // Setup room if living with roommates
    if (setupData.livingSituation === 'roommates') {
      if (setupData.roomAction === 'create' && setupData.roomName) {
        await handleCreateRoom(setupData.roomName);
      } else if (setupData.roomAction === 'join' && setupData.inviteCode) {
        await handleJoinRoom(setupData.inviteCode);
      }
    }

    // Setup fixed recurring bills (Room rent, Wi-Fi, electricity, etc.)
    if (setupData.fixedExpenses && setupData.fixedExpenses.length > 0) {
      const newBills: BillReminder[] = setupData.fixedExpenses.map((exp) => ({
        id: generateId(),
        title: exp.name,
        amount: exp.amount,
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        category: exp.category,
        isPaid: false,
        frequency: 'monthly',
        preferredMode: 'UPI' as PaymentMode,
      }));
      setBills((prev) => [...newBills, ...prev]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smm_auth_token');
    localStorage.removeItem('smm_current_user');
    localStorage.removeItem('smm_room_groups');
    localStorage.removeItem('smm_active_room_id');
    // Clean all user personal state so next user or empty state is clean
    setMonthlyPocketMoney(0);
    setWallets({ cash: 0, upi: 0 });
    setTransactions([]);
    setUdhaarRecords([]);
    setBills([]);
    setMeals([]);
    setGoals([]);
    setPersonalNotes([]);
    setRoomGroups([]);
    setActiveRoomId(null);
    setCurrentUser(null);
  };

  // Derived Values
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayStr = now.toISOString().split('T')[0];

  const totalDaysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemainingInMonth = Math.max(1, totalDaysInCurrentMonth - now.getDate() + 1);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const expenseTransactions = safeTransactions.filter((t) => t && t.type === 'expense');

  // Filter expenses belonging to the current calendar month
  const thisMonthExpenses = expenseTransactions.filter((t) => {
    if (!t || !t.date) return false;
    const parts = t.date.split('-');
    if (parts.length < 2) return true;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === currentYear && m === currentMonth;
  });

  const cashSpentThisMonth = thisMonthExpenses
    .filter((t) => t.paymentMode === 'Cash')
    .reduce((acc, t) => acc + (Number(t?.amount) || 0), 0);

  const upiSpentThisMonth = thisMonthExpenses
    .filter((t) => t.paymentMode === 'UPI' || t.paymentMode === 'Bank')
    .reduce((acc, t) => acc + (Number(t?.amount) || 0), 0);

  const totalSpentThisMonth = upiSpentThisMonth + cashSpentThisMonth;

  const todaySpent = expenseTransactions
    .filter((t) => t && t.date === todayStr)
    .reduce((acc, t) => acc + (Number(t?.amount) || 0), 0);

  const safeUdhaar = Array.isArray(udhaarRecords) ? udhaarRecords : [];
  const pendingUdhaarLenaHai = safeUdhaar
    .filter((r) => r && r.type === 'give' && r.status === 'pending')
    .reduce((acc, r) => acc + (Number(r?.amount) || 0), 0);

  const safeBills = Array.isArray(bills) ? bills : [];
  const pendingBillsTotal = safeBills
    .filter((b) => b && !b.isPaid)
    .reduce((acc, b) => acc + (Number(b?.amount) || 0), 0);

  const totalFixedCommitted = safeBills.reduce((acc, b) => acc + (Number(b?.amount) || 0), 0);
  
  // Fixed wallet original balances (Never reduced by expenses)
  const fixedCash = wallets?.cash ?? 0;
  const fixedUpi = wallets?.upi ?? 0;
  const totalOriginalMoney = fixedCash + fixedUpi;

  // Remaining available balances after expenses
  const availableCash = Math.max(0, fixedCash - cashSpentThisMonth);
  const availableUpi = Math.max(0, fixedUpi - upiSpentThisMonth);

  // Available In-Hand Balance: original wallet balance - total spent - pending bills
  const availableInHandBalance = Math.max(
    0,
    (totalOriginalMoney > 0 ? totalOriginalMoney : monthlyPocketMoney) - totalSpentThisMonth - pendingBillsTotal
  );

  const discretionaryRemaining = availableInHandBalance;
  const safeDailyCap = Math.max(0, Math.round(discretionaryRemaining / daysRemainingInMonth));

  // Active room selection
  const safeRoomGroups = Array.isArray(roomGroups) ? roomGroups.filter(Boolean) : [];
  const currentActiveRoom = safeRoomGroups.find((r) => r && r.id === activeRoomId) || safeRoomGroups[0] || null;

  // Helper to instantly persist money updates locally and remotely with keepalive
  const persistMoneySnapshotImmediate = (
    updatedAllowance: number,
    updatedWallets: WalletBalances,
    updatedTransactions: Transaction[]
  ) => {
    if (!currentUser?.id) return;
    saveUserStoredData(currentUser.id, {
      monthlyPocketMoney: updatedAllowance,
      wallets: updatedWallets,
      transactions: updatedTransactions,
    });
    fetch('/api/user/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      },
      body: JSON.stringify({
        data: {
          monthlyPocketMoney: updatedAllowance,
          wallets: updatedWallets,
          transactions: updatedTransactions,
          roomGroups,
          activeRoomId,
          meals,
          messConfig,
          udhaarRecords,
          bills,
          goals,
          hasCompletedTour: currentUser.hasCompletedTour,
        },
      }),
      keepalive: true,
    }).catch((err) => console.warn('Immediate money sync notice:', err));
  };

  // 1. Transaction Handlers
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>, skipUdhaarSync = false): boolean => {
    const amount = Number(newTxData.amount) || 0;
    const mode = newTxData.paymentMode || 'UPI';

    // Strict balance check: Expense or Lent cannot exceed remaining available balance
    if (newTxData.type === 'expense' || newTxData.type === 'lent') {
      const currentAvailable = mode === 'Cash' ? availableCash : availableUpi;

      if (amount > currentAvailable) {
        alert(
          `Insufficient ${mode} Balance!\n\nAvailable in ${mode}: ₹${currentAvailable.toLocaleString('en-IN')}\nAttempted Expense: ₹${amount.toLocaleString('en-IN')}\n\nYou cannot spend more than your available ${mode} balance. Please add money to your ${mode} balance or reduce the amount.`
        );
        return false;
      }
    }

    const newTx: Transaction = {
      ...newTxData,
      id: generateId(),
    };

    let nextWallets = { ...wallets };
    let nextAllowance = monthlyPocketMoney;
    const nextTransactions = [newTx, ...transactions];

    // UPI Money and Fixed Cash are FIXED wallet balances.
    // Money spent on expenses must NOT reduce these original wallet amounts!
    if (newTx.type === 'expense') {
      // Expenses do NOT reduce fixed wallet amounts.
    } else if (newTx.type === 'income') {
      if (mode === 'Cash') nextWallets.cash = nextWallets.cash + amount;
      if (mode === 'UPI') nextWallets.upi = nextWallets.upi + amount;
      // Pocket money income increments monthly available budget allowance
      if (newTx.category === 'Pocket Money') {
        nextAllowance = nextAllowance + amount;
        setMonthlyPocketMoney(nextAllowance);
      }
    } else if (newTx.type === 'lent') {
      if (!skipUdhaarSync && newTx.person) {
        setUdhaarRecords((prev) => [
          {
            id: generateId(),
            type: 'give',
            person: newTx.person!,
            amount,
            reason: newTx.title,
            date: newTx.date,
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            status: 'pending',
          },
          ...prev,
        ]);
      }
    } else if (newTx.type === 'borrowed') {
      if (mode === 'Cash') nextWallets.cash = nextWallets.cash + amount;
      if (mode === 'UPI') nextWallets.upi = nextWallets.upi + amount;

      if (!skipUdhaarSync && newTx.person) {
        setUdhaarRecords((prev) => [
          {
            id: generateId(),
            type: 'take',
            person: newTx.person!,
            amount,
            reason: newTx.title,
            date: newTx.date,
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            status: 'pending',
          },
          ...prev,
        ]);
      }
    } else if (newTx.type === 'transfer') {
      const from = mode;
      const to = mode === 'Cash' ? 'UPI' : 'Cash';
      const fromKey = from.toLowerCase() as keyof WalletBalances;
      const toKey = to.toLowerCase() as keyof WalletBalances;
      nextWallets[fromKey] = Math.max(0, (nextWallets[fromKey] || 0) - amount);
      nextWallets[toKey] = (nextWallets[toKey] || 0) + amount;
    }

    setWallets(nextWallets);
    setTransactions(nextTransactions);

    // Immediately persist updated financial snapshot
    persistMoneySnapshotImmediate(nextAllowance, nextWallets, nextTransactions);

    return true;
  };

  const handleUpdateTransaction = (updatedTx: Transaction): boolean => {
    const oldTx = transactions.find((t) => t.id === updatedTx.id);
    if (oldTx) {
      const oldAmount = Number(oldTx.amount) || 0;
      const newAmount = Number(updatedTx.amount) || 0;

      // Strict balance check when updating an expense or lent transaction
      if (updatedTx.type === 'expense' || updatedTx.type === 'lent') {
        const mode = updatedTx.paymentMode || 'UPI';
        const currentBal = mode === 'Cash' ? availableCash : availableUpi;
        const refundFromOld =
          (oldTx.type === 'expense' || oldTx.type === 'lent') && oldTx.paymentMode === mode
            ? oldAmount
            : 0;
        const effectiveAvailable = currentBal + refundFromOld;

        if (newAmount > effectiveAvailable) {
          alert(
            `Insufficient ${mode} Balance!\n\nAvailable in ${mode}: ₹${effectiveAvailable.toLocaleString('en-IN')}\nRequested Expense: ₹${newAmount.toLocaleString('en-IN')}\n\nYou cannot spend more than your available ${mode} balance. Please reduce the amount or add money to ${mode}.`
          );
          return false;
        }
      }

      let nextWallets = { ...wallets };
      // Only income, borrowed, or transfer modifies the fixed wallets
      if (oldTx.type === 'income' || oldTx.type === 'borrowed') {
        if (oldTx.paymentMode === 'Cash') nextWallets.cash = Math.max(0, nextWallets.cash - oldAmount);
        else if (oldTx.paymentMode === 'UPI') nextWallets.upi = Math.max(0, nextWallets.upi - oldAmount);
      } else if (oldTx.type === 'transfer') {
        const oldFromKey = (oldTx.paymentMode || 'Cash').toLowerCase() as keyof WalletBalances;
        const oldToKey = oldFromKey === 'cash' ? 'upi' : 'cash';
        nextWallets[oldFromKey] = (nextWallets[oldFromKey] || 0) + oldAmount;
        nextWallets[oldToKey] = Math.max(0, (nextWallets[oldToKey] || 0) - oldAmount);
      }

      if (updatedTx.type === 'income' || updatedTx.type === 'borrowed') {
        if (updatedTx.paymentMode === 'Cash') nextWallets.cash += newAmount;
        else if (updatedTx.paymentMode === 'UPI') nextWallets.upi += newAmount;
      } else if (updatedTx.type === 'transfer') {
        const newFromKey = (updatedTx.paymentMode || 'Cash').toLowerCase() as keyof WalletBalances;
        const newToKey = newFromKey === 'cash' ? 'upi' : 'cash';
        nextWallets[newFromKey] = Math.max(0, (nextWallets[newFromKey] || 0) - newAmount);
        nextWallets[newToKey] = (nextWallets[newToKey] || 0) + newAmount;
      }

      setWallets(nextWallets);

      // Keep monthly pocket money allowance synchronized if pocket money income was adjusted
      const wasPocketMoney = oldTx.type === 'income' && oldTx.category === 'Pocket Money';
      const isPocketMoney = updatedTx.type === 'income' && updatedTx.category === 'Pocket Money';

      let nextAllowance = monthlyPocketMoney;
      if (wasPocketMoney && isPocketMoney) {
        nextAllowance = Math.max(0, monthlyPocketMoney - oldAmount + newAmount);
      } else if (wasPocketMoney && !isPocketMoney) {
        nextAllowance = Math.max(0, monthlyPocketMoney - oldAmount);
      } else if (!wasPocketMoney && isPocketMoney) {
        nextAllowance = monthlyPocketMoney + newAmount;
      }
      setMonthlyPocketMoney(nextAllowance);

      const nextTransactions = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
      setTransactions(nextTransactions);
      persistMoneySnapshotImmediate(nextAllowance, nextWallets, nextTransactions);
    }

    setIsManualOpen(false);
    setEditingTransaction(null);
    return true;
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    let nextWallets = { ...wallets };
    let nextAllowance = monthlyPocketMoney;

    if (tx) {
      const amount = Number(tx.amount) || 0;
      // Because expenses do NOT reduce fixed wallet balances, deleting an expense does NOT add to fixed wallets!
      if (tx.type === 'income' || tx.type === 'borrowed') {
        // Reverse income from wallet
        if (tx.paymentMode === 'Cash') nextWallets.cash = Math.max(0, nextWallets.cash - amount);
        if (tx.paymentMode === 'UPI') nextWallets.upi = Math.max(0, nextWallets.upi - amount);
        // If it was pocket money income, reduce the monthly allowance accordingly
        if (tx.type === 'income' && tx.category === 'Pocket Money') {
          nextAllowance = Math.max(0, nextAllowance - amount);
          setMonthlyPocketMoney(nextAllowance);
        }
      } else if (tx.type === 'transfer') {
        // Reverse transfer: refund source, deduct from destination
        if (tx.paymentMode === 'Cash') {
          nextWallets.cash = nextWallets.cash + amount;
          nextWallets.upi = Math.max(0, nextWallets.upi - amount);
        } else {
          nextWallets.upi = nextWallets.upi + amount;
          nextWallets.cash = Math.max(0, nextWallets.cash - amount);
        }
      }
    }
    const nextTransactions = transactions.filter((t) => t.id !== id);
    setWallets(nextWallets);
    setTransactions(nextTransactions);
    persistMoneySnapshotImmediate(nextAllowance, nextWallets, nextTransactions);
  };

  // 2. Wallet Management Handlers
  const handleTransferWallets = (from: PaymentMode, to: PaymentMode, amount: number) => {
    if (from === to || amount <= 0) return;
    const currentAvailable = from === 'Cash' ? availableCash : availableUpi;
    if (currentAvailable < amount) {
      alert(
        `Insufficient available balance in ${from}!\n\nAvailable in ${from}: ₹${currentAvailable.toLocaleString('en-IN')}\nRequested Transfer: ₹${amount.toLocaleString('en-IN')}\n\nYou cannot transfer more than your available ${from} balance.`
      );
      return;
    }

    const fromKey = from.toLowerCase() as keyof WalletBalances;
    const toKey = to.toLowerCase() as keyof WalletBalances;

    const nextWallets: WalletBalances = {
      ...wallets,
      [fromKey]: Math.max(0, (wallets[fromKey] || 0) - amount),
      [toKey]: (wallets[toKey] || 0) + amount,
    };

    const newTx: Transaction = {
      id: generateId(),
      title: `Transfer from ${from} to ${to}`,
      amount,
      type: 'transfer',
      category: 'Transfer',
      paymentMode: from,
      date: todayStr,
      notes: `Transferred ₹${amount} from ${from} to ${to}`,
    };

    const nextTransactions = [newTx, ...transactions];

    setWallets(nextWallets);
    setTransactions(nextTransactions);
    persistMoneySnapshotImmediate(monthlyPocketMoney, nextWallets, nextTransactions);
  };

  const handleUpdateWalletsAndAllowance = (newWallets: WalletBalances, newAllowance?: number) => {
    const allowanceToUse = newAllowance !== undefined ? newAllowance : ((newWallets.cash || 0) + (newWallets.upi || 0));
    setWallets(newWallets);
    setMonthlyPocketMoney(allowanceToUse);
    persistMoneySnapshotImmediate(allowanceToUse, newWallets, transactions);
  };

  const handleUpdateWalletBalance = (mode: PaymentMode, newBalance: number) => {
    const key = mode.toLowerCase() as keyof WalletBalances;
    const nextWallets = {
      ...wallets,
      [key]: Math.max(0, newBalance),
    };
    setWallets(nextWallets);
    persistMoneySnapshotImmediate(monthlyPocketMoney, nextWallets, transactions);
  };

  const handleUpdateWalletKey = (walletKey: keyof WalletBalances, newAmount: number) => {
    const nextWallets = {
      ...wallets,
      [walletKey]: Math.max(0, newAmount),
    };
    setWallets(nextWallets);
    persistMoneySnapshotImmediate(monthlyPocketMoney, nextWallets, transactions);
  };

  const handleAddMoneyToWallet = (mode: PaymentMode, amount: number, addToAllowance: boolean = true) => {
    if (amount <= 0) return;

    handleAddTransaction({
      title: addToAllowance ? `Pocket Money added to ${mode}` : `Top-up added to ${mode}`,
      amount,
      type: 'income',
      category: addToAllowance ? 'Pocket Money' : 'Top-up',
      paymentMode: mode,
      date: todayStr,
      notes: addToAllowance
        ? `Added ₹${amount} to ${mode} & increased this month's budget allowance`
        : `Added ₹${amount} to ${mode} in-hand balance (monthly allowance unchanged)`,
    });
  };

  // 3. Room Group & Expense Handlers (Backend Integrated + Netlify Resilient)
  const handleCreateRoom = async (name: string, type?: string) => {
    if (!currentUser) return;
    try {
      const result = await safeFetchJson('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          name,
          type: type || 'Flat',
          creatorName: currentUser.name || 'You',
          upiId: currentUser.upiId,
          creatorPhone: currentUser.phone,
        }),
      });
      if (result.ok && result.data) {
        const createdRoom = result.data.room || result.data.data;
        if (createdRoom && createdRoom.id) {
          setRoomGroups((prev) => [...(prev || []), createdRoom]);
          setActiveRoomId(createdRoom.id);
          localStorage.setItem('smm_active_room_id', createdRoom.id);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend create room notice:', err);
    }

    // Local room creation fallback (e.g. Netlify)
    const localInviteCode = 'ROOM' + Math.floor(1000 + Math.random() * 9000);
    const newLocalRoom: RoomGroup = {
      id: 'room_' + Date.now(),
      name: name.trim(),
      type: (type as any) || 'Flat',
      inviteCode: localInviteCode,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: 'rm_' + Date.now(),
          userId: currentUser.id,
          name: currentUser.name || 'You',
          role: 'owner',
          upiId: currentUser.upiId,
          phone: currentUser.phone,
          joinedAt: new Date().toISOString(),
          isSelf: true,
        },
      ],
      expenses: [],
      settlements: [],
      activities: [
        {
          id: 'act_' + Date.now(),
          type: 'join',
          text: `${currentUser.name || 'You'} created room "${name}"`,
          time: new Date().toISOString(),
        },
      ],
    };
    setRoomGroups((prev) => {
      const next = [...(prev || []), newLocalRoom];
      localStorage.setItem('smm_room_groups', JSON.stringify(next));
      return next;
    });
    setActiveRoomId(newLocalRoom.id);
    localStorage.setItem('smm_active_room_id', newLocalRoom.id);
  };

  const handleJoinRoom = async (code: string) => {
    if (!currentUser) return;
    const cleanCode = code.trim().toUpperCase();
    try {
      const result = await safeFetchJson('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          inviteCode: cleanCode,
          memberName: currentUser.name || 'You',
          upiId: currentUser.upiId,
        }),
      });
      if (result.ok && result.data) {
        const joinedRoom = result.data.room || result.data.data;
        if (joinedRoom && joinedRoom.id) {
          setRoomGroups((prev) => {
            const list = prev || [];
            const idx = list.findIndex((r) => r && r.id === joinedRoom.id);
            if (idx >= 0) {
              const clone = [...list];
              clone[idx] = joinedRoom;
              return clone;
            }
            return [...list, joinedRoom];
          });
          setActiveRoomId(joinedRoom.id);
          localStorage.setItem('smm_active_room_id', joinedRoom.id);
          return;
        }
      }
      if (result.data && result.data.error && !result.isStaticHtml) {
        alert(result.data.error);
        return;
      }
    } catch (err) {
      console.warn('Backend join room notice:', err);
    }

    // Local room join fallback
    const localMatch = (roomGroups || []).find((r) => r && r.inviteCode?.toUpperCase() === cleanCode);
    if (localMatch) {
      const isAlreadyMember = (localMatch.members || []).some(
        (m) => m && (m.userId === currentUser.id || m.id === currentUser.id || m.id === 'rm_' + currentUser.id)
      );
      if (!isAlreadyMember && (localMatch.members || []).length >= 12) {
        alert('This room has reached its maximum capacity of 12 members.');
        return;
      }
      if (!isAlreadyMember) {
        setRoomGroups((prev) => {
          const next = (prev || []).map((r) => {
            if (r.id !== localMatch.id) return r;
            return {
              ...r,
              members: [
                ...(r.members || []),
                {
                  id: 'rm_' + currentUser.id,
                  userId: currentUser.id,
                  name: currentUser.name || 'You',
                  email: currentUser.email,
                  upiId: currentUser.upiId,
                  phone: currentUser.phone,
                  role: 'member' as const,
                  joinedAt: new Date().toISOString().split('T')[0],
                  isSelf: true,
                },
              ],
            };
          });
          localStorage.setItem('smm_room_groups', JSON.stringify(next));
          return next;
        });
      }
      setActiveRoomId(localMatch.id);
      localStorage.setItem('smm_active_room_id', localMatch.id);
      return;
    }

    alert('Could not find a room with code ' + cleanCode + '. Please check the invite code.');
  };

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    localStorage.setItem('smm_active_room_id', roomId);
  };

  const handleAddOrUpdateExpense = async (exp: RoomExpense) => {
    const targetRoomId = exp.roomId || activeRoomId;
    if (!targetRoomId) return;

    // Strict client-side ownership check if modifying an existing expense
    const currentRoom = roomGroups.find((r) => r.id === targetRoomId);
    const existing = (currentRoom?.expenses || []).find((e) => e && e.id === exp.id);
    if (existing) {
      const ownerId = existing.createdByUserId || existing.paidByUserId;
      if (ownerId && currentUser?.id && ownerId !== currentUser.id) {
        console.warn('Unauthorized edit attempt: User does not own this expense');
        alert('Only the member who created this expense can edit it.');
        return;
      }
    }

    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': currentUser?.id || 'guest',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let syncedWithBackend = false;

    try {
      const res = await fetch(`/api/rooms/${targetRoomId}/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expense: exp }),
      });

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'You do not have permission to edit this expense.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const updatedRoom = data.room || data.data;
        if (updatedRoom) {
          setRoomGroups((prev) => {
            const next = (prev || []).map((r) => (r && r.id === targetRoomId ? updatedRoom : r));
            localStorage.setItem('smm_room_groups', JSON.stringify(next));
            return next;
          });
          syncedWithBackend = true;
        }
      }
    } catch (err) {
      console.warn('Backend sync paused, preserving expense in local state:', err);
    }

    // Local resilient update if backend was unavailable or errored
    if (!syncedWithBackend) {
      setRoomGroups((prev) => {
        const next = (prev || []).map((r) => {
          if (!r || r.id !== targetRoomId) return r;
          const expenses = [...(r.expenses || [])];
          const existingIdx = expenses.findIndex((e) => e && e.id === exp.id);
          const isEdit = existingIdx >= 0;
          if (isEdit) {
            const target = expenses[existingIdx];
            const ownerId = target?.createdByUserId || target?.paidByUserId;
            if (ownerId && currentUser?.id && ownerId !== currentUser.id) {
              return r; // Block unauthorized local edit
            }
            expenses[existingIdx] = exp;
          } else {
            expenses.unshift(exp);
          }
          const activities = [...(r.activities || [])];
          activities.unshift({
            id: 'act_' + Date.now(),
            roomId: targetRoomId,
            text: isEdit
              ? `${currentUser?.name || exp.paidBy || 'Roommate'} updated "${exp.title}" (₹${exp.totalAmount})`
              : `${exp.paidBy || 'Roommate'} added "${exp.title}" for ₹${exp.totalAmount}`,
            time: new Date().toISOString(),
            type: isEdit ? 'edit' : 'expense',
          });
          return { ...r, expenses, activities };
        });
        localStorage.setItem('smm_room_groups', JSON.stringify(next));
        return next;
      });
    }

    // Note: My Money and My Room data are strictly separated.
    // Shared room expenses do not automatically populate personal My Money transactions.
  };

  const handleDeleteRoomExpense = async (expenseId: string) => {
    if (!activeRoomId) return;

    // Strict client-side ownership check before network request
    const room = roomGroups.find((r) => r.id === activeRoomId);
    const targetExp = (room?.expenses || []).find((e) => e && e.id === expenseId);
    if (targetExp) {
      const ownerId = targetExp.createdByUserId || targetExp.paidByUserId;
      if (ownerId && currentUser?.id && ownerId !== currentUser.id) {
        console.warn('Unauthorized delete attempt: User does not own this expense');
        alert('Only the member who created this expense can delete it.');
        return;
      }
    }

    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = { 'x-user-id': currentUser?.id || 'guest' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/rooms/${activeRoomId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers,
      });

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'You do not have permission to delete this expense.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const updatedRoom = data.room || data.data;
        if (updatedRoom) {
          setRoomGroups((prev) => {
            const next = (prev || []).map((r) => (r && r.id === activeRoomId ? updatedRoom : r));
            localStorage.setItem('smm_room_groups', JSON.stringify(next));
            return next;
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Network issue deleting room expense from server:', err);
    }

    // Local fallback only if authorized
    setRoomGroups((prev) => {
      const next = (prev || []).map((r) => {
        if (!r || r.id !== activeRoomId) return r;
        const expToDelete = (r.expenses || []).find((e) => e && e.id === expenseId);
        const ownerId = expToDelete?.createdByUserId || expToDelete?.paidByUserId;
        if (ownerId && currentUser?.id && ownerId !== currentUser.id) {
          return r; // Do NOT delete unowned expense
        }
        const updatedExpenses = (r.expenses || []).filter((e) => e && e.id !== expenseId);
        const activities = [...(r.activities || [])];
        if (expToDelete) {
          activities.unshift({
            id: 'act_' + Date.now(),
            roomId: activeRoomId,
            text: `${currentUser?.name || 'Member'} deleted expense "${expToDelete.title}" (₹${expToDelete.totalAmount})`,
            time: new Date().toISOString(),
            type: 'expense',
          });
        }
        return {
          ...r,
          expenses: updatedExpenses,
          activities,
        };
      });
      localStorage.setItem('smm_room_groups', JSON.stringify(next));
      return next;
    });
  };

  const handleAddRoommateToRoom = async (name: string, upiId?: string, phone?: string) => {
    if (!activeRoomId) return;

    const targetRoom = (roomGroups || []).find((r) => r && r.id === activeRoomId);
    if (targetRoom && (targetRoom.members || []).length >= 12) {
      alert('This room has reached its maximum capacity of 12 members.');
      return;
    }

    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': currentUser?.id || 'guest',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/rooms/${activeRoomId}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, upiId, phone }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedRoom = data.room || data.data;
        if (updatedRoom) {
          setRoomGroups((prev) => {
            const next = (prev || []).map((r) => (r && r.id === activeRoomId ? updatedRoom : r));
            localStorage.setItem('smm_room_groups', JSON.stringify(next));
            return next;
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Network issue adding roommate to server:', err);
    }

    // Local fallback
    const newMemberId = 'user_manual_' + Date.now().toString(36);
    setRoomGroups((prev) => {
      const next = (prev || []).map((r) => {
        if (!r || r.id !== activeRoomId) return r;
        return {
          ...r,
          members: [
            ...(r.members || []),
            {
              id: 'rm_' + newMemberId,
              userId: newMemberId,
              name: name.trim(),
              upiId: upiId?.trim() || undefined,
              phone: phone?.trim() || undefined,
              role: 'member' as const,
              joinedAt: new Date().toISOString().split('T')[0],
              isSelf: false,
            },
          ],
        };
      });
      localStorage.setItem('smm_room_groups', JSON.stringify(next));
      return next;
    });
  };

  const handleRemoveRoommateFromRoom = async (roommateId: string) => {
    if (!activeRoomId) return;
    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = { 'x-user-id': currentUser?.id || 'guest' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/rooms/${activeRoomId}/members/${roommateId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const updatedRoom = data.room || data.data;
        if (updatedRoom) {
          setRoomGroups((prev) => {
            const next = (prev || []).map((r) => (r && r.id === activeRoomId ? updatedRoom : r));
            localStorage.setItem('smm_room_groups', JSON.stringify(next));
            return next;
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Network issue removing roommate from server:', err);
    }

    // Local fallback
    setRoomGroups((prev) => {
      const next = (prev || []).map((r) => {
        if (!r || r.id !== activeRoomId) return r;
        return {
          ...r,
          members: (r.members || []).filter((m) => m && m.id !== roommateId && m.userId !== roommateId),
        };
      });
      localStorage.setItem('smm_room_groups', JSON.stringify(next));
      return next;
    });
  };

  const handleSettleRoomDebt = async (
    fromUserId: string,
    from: string,
    toUserId: string,
    to: string,
    amount: number,
    note?: string,
    mode: 'UPI' | 'Cash' = 'UPI'
  ) => {
    if (!activeRoomId) return;
    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': currentUser?.id || 'guest',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/rooms/${activeRoomId}/settlements`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        debtorId: currentUser?.id,
        fromUserId: currentUser?.id,
        from,
        toUserId,
        to,
        amount,
        note,
        mode,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || `Failed to record settlement (HTTP ${res.status})`;
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const updatedRoom = data.room || data.data;
    if (updatedRoom) {
      setRoomGroups((prev) => {
        const next = (prev || []).map((r) => (r && r.id === activeRoomId ? updatedRoom : r));
        localStorage.setItem('smm_room_groups', JSON.stringify(next));
        return next;
      });
      return;
    }
  };

  const handleDeleteRoomSettlement = async (settleId: string) => {
    if (!activeRoomId) return;
    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = { 'x-user-id': currentUser?.id || 'guest' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/rooms/${activeRoomId}/settlements/${settleId}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || `Failed to delete settlement (HTTP ${res.status})`;
      alert(errorMsg);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const updatedRoom = data.room || data.data;
    if (updatedRoom) {
      setRoomGroups((prev) => {
        const next = (prev || []).map((r) => (r && r.id === activeRoomId ? updatedRoom : r));
        localStorage.setItem('smm_room_groups', JSON.stringify(next));
        return next;
      });
    }
  };

  const handleDeleteRoomGroup = async (roomId: string): Promise<boolean> => {
    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = { 'x-user-id': currentUser?.id || 'guest' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Only the admin who created this room can delete it.');
        return false;
      }
    } catch (err) {
      console.warn('Network issue deleting room from server:', err);
    }

    setRoomGroups((prev) => {
      const remaining = (prev || []).filter((r) => r && r.id !== roomId);
      if (activeRoomId === roomId) {
        const nextId = remaining.length > 0 ? remaining[0].id : null;
        setActiveRoomId(nextId);
        if (nextId) localStorage.setItem('smm_active_room_id', nextId);
        else localStorage.removeItem('smm_active_room_id');
      }
      localStorage.setItem('smm_room_groups', JSON.stringify(remaining));
      return remaining;
    });

    return true;
  };

  const handleLeaveRoom = async (roomId: string): Promise<boolean> => {
    const token = localStorage.getItem('smm_auth_token') || '';
    const headers: Record<string, string> = { 'x-user-id': currentUser?.id || 'guest' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to leave room.');
        return false;
      }
    } catch (err) {
      console.warn('Network issue leaving room on server:', err);
    }

    setRoomGroups((prev) => {
      const remaining = (prev || []).filter((r) => r && r.id !== roomId);
      if (activeRoomId === roomId) {
        const nextId = remaining.length > 0 ? remaining[0].id : null;
        setActiveRoomId(nextId);
        if (nextId) localStorage.setItem('smm_active_room_id', nextId);
        else localStorage.removeItem('smm_active_room_id');
      }
      localStorage.setItem('smm_room_groups', JSON.stringify(remaining));
      return remaining;
    });

    return true;
  };

  // 4. Udhaar Handlers (Personal Loans / Khatabook)
  const handleAddUdhaar = (newRecord: UdhaarRecord) => {
    setUdhaarRecords((prev) => [newRecord, ...prev]);
  };

  const handleEditUdhaar = (updated: UdhaarRecord) => {
    setUdhaarRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleDeleteUdhaar = (id: string) => {
    setUdhaarRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSettleUdhaar = (id: string, mode?: PaymentMode | string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setUdhaarRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'settled',
              settledDate: todayStr,
              paymentMode: (mode as any) || r.paymentMode || 'UPI',
            }
          : r
      )
    );
  };

  const handleReopenUdhaar = (id: string) => {
    setUdhaarRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'pending', settledDate: undefined } : r))
    );
  };

  // Personal Notes Handlers (Private, Scoped strictly to Authenticated User)
  const handleAddPersonalNote = (note: PersonalNote) => {
    setPersonalNotes((prev) => {
      const next = [note, ...prev];
      if (currentUser?.id) {
        saveUserNotes(currentUser.id, next);
      }
      return next;
    });

    if (currentUser?.id) {
      const token = localStorage.getItem('smm_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      safeFetchJson('/api/notes', {
        method: 'POST',
        headers,
        body: JSON.stringify(note),
      }, 3000).catch(() => {});
    }
  };

  const handleUpdatePersonalNote = (note: PersonalNote) => {
    setPersonalNotes((prev) => {
      const next = prev.map((n) => (n.id === note.id ? note : n));
      if (currentUser?.id) {
        saveUserNotes(currentUser.id, next);
      }
      return next;
    });

    if (currentUser?.id) {
      const token = localStorage.getItem('smm_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      safeFetchJson(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(note),
      }, 3000).catch(() => {});
    }
  };

  const handleDeletePersonalNote = (id: string) => {
    setPersonalNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (currentUser?.id) {
        saveUserNotes(currentUser.id, next);
      }
      return next;
    });

    if (currentUser?.id) {
      const token = localStorage.getItem('smm_auth_token');
      const headers: Record<string, string> = {
        'x-user-id': currentUser.id,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      safeFetchJson(`/api/notes/${id}`, {
        method: 'DELETE',
        headers,
      }, 3000).catch(() => {});
    }
  };

  // 5. Bill Handlers
  const handleAddBill = (newBill: BillReminder) => {
    setBills((prev) => [newBill, ...prev]);
  };

  const handlePayBill = (billId: string, mode: PaymentMode) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, isPaid: true } : b))
    );

    handleAddTransaction({
      title: `Paid Bill: ${bill.title}`,
      amount: bill.amount,
      type: 'expense',
      category: bill.category as ExpenseCategory,
      paymentMode: mode,
      date: todayStr,
      notes: `Bill payment (${bill.frequency})`,
    });
  };

  const handleDeleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
  };

  // 6. Mess Handlers
  const handleToggleMeal = (
    date: string,
    mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner'
  ) => {
    setMeals((prev) =>
      prev.map((m) => {
        if (m.date !== date) return m;
        return { ...m, [mealType]: !m[mealType] };
      })
    );
  };

  const handleAddGuestMeal = (date: string) => {
    setMeals((prev) =>
      prev.map((m) => {
        if (m.date !== date) return m;
        return { ...m, guestMeals: (m.guestMeals || 0) + 1 };
      })
    );
  };

  // 7. Savings Goals Handlers
  const handleAddGoal = (newGoal: SavingsGoal) => {
    setGoals((prev) => [newGoal, ...prev]);
  };

  const handleDepositToGoal = (goalId: string, amount: number, fromWallet: PaymentMode) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      )
    );

    handleAddTransaction({
      title: `Saved for: ${goal.title}`,
      amount,
      type: 'expense',
      category: 'Shopping',
      paymentMode: fromWallet,
      date: todayStr,
      notes: 'Savings deposit',
    });
  };

  // Start Clean Slate / Reset
  const handleStartCleanRealData = async () => {
    const clean = getCleanUserData(0, { cash: 0, upi: 0 });
    setMonthlyPocketMoney(0);
    setWallets(clean.wallets);
    setTransactions([]);
    setRoomGroups([]);
    setActiveRoomId(null);
    setMeals([]);
    setUdhaarRecords([]);
    setBills([]);
    setGoals([]);
    setIsSampleMode(false);
    localStorage.setItem('smm_is_sample_mode', 'false');

    if (currentUser?.id) {
      try {
        await fetch('/api/user/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
          body: JSON.stringify({ mode: 'clean' }),
        });
      } catch (err) {
        console.error('Server clean reset error:', err);
      }
    }
  };

  // Optional Load Sample Data for demo preview
  const handleLoadSampleData = async () => {
    const sample = getSampleUserData();
    setMonthlyPocketMoney(sample.monthlyPocketMoney);
    setWallets(sample.wallets);
    setTransactions(sample.transactions);
    setRoomGroups(sample.roomGroups);
    if (sample.roomGroups.length > 0) setActiveRoomId(sample.roomGroups[0].id);
    setMeals(sample.meals);
    setMessConfig(sample.messConfig);
    setUdhaarRecords(sample.udhaarRecords);
    setBills(sample.bills);
    setGoals(sample.goals);
    setIsSampleMode(true);
    localStorage.setItem('smm_is_sample_mode', 'true');

    if (currentUser?.id) {
      try {
        await fetch('/api/user/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
          body: JSON.stringify({ mode: 'sample' }),
        });
      } catch (err) {
        console.error('Server sample load error:', err);
      }
    }
  };

  const handleUpdateUserProfile = async (updated: StudentUser) => {
    setCurrentUser(updated);
    localStorage.setItem('smm_current_user', JSON.stringify(updated));
    try {
      const token = localStorage.getItem('smm_auth_token');
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-id': updated.id,
        },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Could not sync user profile to server:', e);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-150">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <RadialLoader size={62} />
          <p className="text-xs font-semibold text-slate-600 tracking-normal">
            Loading PocketBuddy...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        initialMode={authInitialMode}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans overflow-x-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2.5">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <BrandLogo size="md" />
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Scan UPI Screenshot */}
            <button
              id="header-scan-slip-btn"
              onClick={() => setIsScannerOpen(true)}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Verify & add expense from UPI payment receipt"
            >
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Scan Receipt</span>
            </button>

            {/* Voice Input */}
            <button
              id="header-voice-btn"
              onClick={() => setIsVoiceOpen(true)}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Record expense by voice"
            >
              <Mic className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Voice</span>
            </button>

            {/* Quick Add Manual Expense (Desktop only - mobile has central + button in bottom nav) */}
            <button
              id="header-add-expense-btn"
              onClick={() => {
                setEditingTransaction(null);
                setIsManualOpen(true);
              }}
              className="hidden sm:inline-flex h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Expense</span>
            </button>

            {/* Student Account / Profile Button */}
            <button
              id="header-student-profile-btn"
              onClick={() => setIsProfileOpen(true)}
              className="h-9 px-2 sm:px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition inline-flex items-center gap-2 cursor-pointer text-left"
              title="Student Profile & Settings"
            >
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-lg object-cover shrink-0 border border-slate-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-red-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 leading-none truncate max-w-[130px]">
                  {currentUser.collegeName || 'Settings & Profile'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Bar - Only shown on Tablet/Desktop (hidden on mobile to prevent duplicate 'My Money' nav) */}
        <div className="hidden md:block max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="flex items-center gap-1.5 sm:gap-2 py-2 overflow-x-auto no-scrollbar">
            <button
              id="tab-overview"
              onClick={() => setCurrentTab('overview')}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                currentTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>My Money</span>
            </button>

            <button
              id="tab-room"
              onClick={() => setCurrentTab('room')}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                currentTab === 'room'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>
                My Room
                {currentActiveRoom ? ` (${currentActiveRoom.name})` : ''}
              </span>
            </button>

            <button
              id="tab-udhaar"
              onClick={() => setCurrentTab('udhaar')}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                currentTab === 'udhaar'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Your Notes</span>
            </button>

            <button
              id="tab-history"
              onClick={() => setCurrentTab('history')}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                currentTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 md:pb-12 space-y-4 sm:space-y-6">
        {/* Render Tab Views */}
        {currentTab === 'overview' && (
          <div className="space-y-3.5 sm:space-y-6">
            {/* Page Title Section - Compact, Professional Finance Heading */}
            <div className="pb-0.5 sm:pb-2">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight [text-wrap:balance]">
                Student Monthly Budget &amp; Daily Expenses
              </h1>
              <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">
                Track daily kharcha, monitor in-hand liquidity, and stay effortlessly within your monthly budget.
              </p>
            </div>

            {/* 1. Unified Smart Money Hub (4 Clear Pillars: Monthly Budget, Kharch Hua, Bacha Hai, 1 Din Ka Limit + Wallets & Quick Actions) */}
            <SmartMoneyHub
              allowance={monthlyPocketMoney}
              fixedCommitted={totalFixedCommitted}
              unpaidBillsReserve={pendingBillsTotal}
              variableSpent={totalSpentThisMonth}
              discretionaryRemaining={discretionaryRemaining}
              todaySpent={todaySpent}
              wallets={wallets}
              bills={safeBills}
              transactions={safeTransactions}
              onUpdateAllowance={(newAllowance) => {
                handleUpdateWalletsAndAllowance(wallets, newAllowance);
              }}
              onUpdateWallets={(newWallets, newAllowance) => {
                handleUpdateWalletsAndAllowance(newWallets, newAllowance);
              }}
              onTransferWallets={handleTransferWallets}
              onUpdateWalletBalance={handleUpdateWalletBalance}
              onAddMoneyToWallet={handleAddMoneyToWallet}
              onOpenBills={() => setCurrentTab('bills')}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenVoice={() => setIsVoiceOpen(true)}
              onOpenManual={() => {
                setEditingTransaction(null);
                setIsManualOpen(true);
              }}
            />

            {/* 2. Full-Width: Recent Ledger Outflows */}
            <div className="w-full">
              <TransactionsList
                transactions={safeTransactions}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={(t) => {
                  setEditingTransaction(t);
                  setIsManualOpen(true);
                }}
                onAddExpense={() => {
                  setEditingTransaction(null);
                  setIsManualOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Room Expenses Tab (Clean & Useful: Roommate Add, Splits, Who Bought What) */}
        {currentTab === 'room' && (
          <RoomExpenseManager
            currentRoom={currentActiveRoom}
            allRooms={safeRoomGroups}
            currentUser={currentUser}
            currentUserName={currentUser?.name || 'You'}
            currentUserUpi={currentUser?.upiId}
            currentUserPhone={currentUser?.phone}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onSelectRoom={handleSelectRoom}
            onAddOrUpdateExpense={handleAddOrUpdateExpense}
            onDeleteExpense={handleDeleteRoomExpense}
            onAddRoommate={handleAddRoommateToRoom}
            onRemoveRoommate={handleRemoveRoommateFromRoom}
            onSettleDebt={handleSettleRoomDebt}
            onDeleteSettlement={handleDeleteRoomSettlement}
            onDeleteRoom={handleDeleteRoomGroup}
            onLeaveRoom={handleLeaveRoom}
            onRefreshRooms={() => fetchRooms(currentUser?.id)}
            onOpenAiCoach={(query) => {
              setInitialAiPrompt(query);
              setIsQuickAiOpen(true);
            }}
          />
        )}

        {/* Your Notes Tab (Clean & Independent) */}
        {currentTab === 'udhaar' && (
          <CoolNotepad
            notes={personalNotes}
            onAddNote={handleAddPersonalNote}
            onUpdateNote={handleUpdatePersonalNote}
            onDeleteNote={handleDeletePersonalNote}
          />
        )}

        {/* Unified History Tab: Both My Money & My Room with monthly, day, and total views */}
        {currentTab === 'history' && (
          <UnifiedHistoryTab
            transactions={safeTransactions}
            roomGroups={safeRoomGroups}
            currentRoom={currentActiveRoom}
            currentUser={currentUser}
            onEditTransaction={(t) => {
              setEditingTransaction(t);
              setIsManualOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onViewRoom={() => setCurrentTab('room')}
            onViewMyMoney={() => setCurrentTab('overview')}
            onNavigateToTab={(tab) => setCurrentTab(tab as TabType)}
          />
        )}

        {/* Fixed Bills & Rent Tab (if accessed directly via reminders) */}
        {currentTab === 'bills' && (
          <BillRemindersTab
            bills={safeBills}
            onAddBill={handleAddBill}
            onPayBill={handlePayBill}
          />
        )}
      </main>

      {/* Modals */}
      <ScreenshotScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddTransaction={handleAddTransaction}
        existingTransactions={transactions}
        wallets={wallets}
        availableUpi={availableUpi}
      />

      {isVoiceOpen && (
        <VoiceInputModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          onAddTransaction={handleAddTransaction}
          wallets={wallets}
          availableBalances={{ cash: availableCash, upi: availableUpi }}
        />
      )}

      <ManualExpenseModal
        isOpen={isManualOpen}
        editingTransaction={editingTransaction}
        onClose={() => {
          setIsManualOpen(false);
          setEditingTransaction(null);
        }}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        wallets={wallets}
        availableBalances={{ cash: availableCash, upi: availableUpi }}
      />

      {/* First-Time Student Setup Wizard */}
      <FirstTimeSetupModal
        isOpen={isSetupWizardOpen}
        initialName={currentUser?.name || ''}
        onComplete={handleCompleteFirstTimeSetup}
      />

      {/* Student ID Card & Profile Modal */}
      {currentUser && (
        <StudentProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={currentUser}
          onUpdateUser={handleUpdateUserProfile}
          onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
          onResetData={handleStartCleanRealData}
          onLogout={handleLogout}
        />
      )}

      {/* Quick AI Assistant Modal */}
      <QuickAiModal
        isOpen={isQuickAiOpen}
        onClose={() => {
          setIsQuickAiOpen(false);
          setInitialAiPrompt(undefined);
        }}
        monthlyPocketMoney={monthlyPocketMoney}
        totalSpent={totalSpentThisMonth}
        todaySpent={todaySpent}
        pendingUdhaarTotal={pendingUdhaarLenaHai}
        upcomingBillsTotal={pendingBillsTotal}
        roomGroup={currentActiveRoom}
        currentUserName={currentUser?.name || 'You'}
        initialPrompt={initialAiPrompt}
      />

      {/* Compact Clean Footer */}
      <footer id="app-footer" className="mt-auto bg-[#0d1627] text-slate-400 py-2.5 px-4 border-t border-slate-800/80 pb-16 md:pb-2.5 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <BrandLogo size="xs" showWordmark={true} tagline={false} variant="dark" />
            <span className="text-[10px] sm:text-[11px] text-slate-400">&copy; {new Date().getFullYear()} PocketBuddy, Inc.</span>
          </div>

          <div className="footer-socials flex items-center gap-3 text-slate-400">
            <a
              href="https://www.facebook.com/wadityasingh"
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://www.instagram.com/wadityasingh"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://github.com/wadityasingh"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://wa.me/918957190542"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://www.linkedin.com/in/aditya-singh-a84486315"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Splitwise/Tricount inspired product UX) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden flex items-center justify-around py-1.5 px-1 shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <button
          id="mobile-nav-overview"
          type="button"
          onClick={() => setCurrentTab('overview')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${
            currentTab === 'overview' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px]">My Money</span>
        </button>

        <button
          id="mobile-nav-room"
          type="button"
          onClick={() => setCurrentTab('room')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition relative ${
            currentTab === 'room' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">My Room</span>
          {safeRoomGroups.length > 0 && (
            <span className="absolute top-0 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        {/* Central Quick Add Action */}
        <button
          id="mobile-nav-quick-add"
          type="button"
          onClick={() => {
            setEditingTransaction(null);
            setIsManualOpen(true);
          }}
          className="w-11 h-11 -mt-4 rounded-full bg-indigo-600 text-white shadow-md flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition cursor-pointer"
          title="Add Expense"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          id="mobile-nav-udhaar"
          type="button"
          onClick={() => setCurrentTab('udhaar')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition relative ${
            currentTab === 'udhaar' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px]">Notes</span>
        </button>

        <button
          id="mobile-nav-history"
          type="button"
          onClick={() => setCurrentTab('history')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition relative ${
            currentTab === 'history' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-[10px]">History</span>
        </button>
      </nav>
    </div>
  );
}
