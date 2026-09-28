import {
  Transaction,
  WalletBalances,
  RoomExpense,
  Roommate,
  RoomGroup,
  DailyMealEntry,
  MessConfig,
  UdhaarRecord,
  BillReminder,
  SavingsGoal,
  PersonalNote,
} from '../types';

// Default 100% clean initial state - Strict zero demo/test data
export const INITIAL_WALLETS: WalletBalances = {
  cash: 0,
  upi: 0,
};

export const INITIAL_POCKET_MONEY = 0;
export const INITIAL_CREDIT_DAY = 1;

export const INITIAL_ROOMMATES: Roommate[] = [];
export const INITIAL_ROOM_GROUPS: RoomGroup[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_ROOM_EXPENSES: RoomExpense[] = [];
export const INITIAL_UDHAAR: UdhaarRecord[] = [];
export const INITIAL_BILLS: BillReminder[] = [];
export const INITIAL_MEALS: DailyMealEntry[] = [];
export const INITIAL_GOALS: SavingsGoal[] = [];
export const INITIAL_PERSONAL_NOTES: PersonalNote[] = [];

export const INITIAL_MESS_CONFIG: MessConfig = {
  monthlyMessFee: 0,
  mealsPerDay: 3,
  rebatePerSkippedMeal: 40,
  rebateRuleNoticeHours: 24,
};

// All sample constants are empty to guarantee zero test data anywhere
export const SAMPLE_POCKET_MONEY = 0;
export const SAMPLE_WALLETS: WalletBalances = { cash: 0, upi: 0 };
export const SAMPLE_ROOMMATES: Roommate[] = [];
export const SAMPLE_ROOM_EXPENSES: RoomExpense[] = [];
export const SAMPLE_ROOM_GROUPS: RoomGroup[] = [];
export const SAMPLE_TRANSACTIONS: Transaction[] = [];
export const SAMPLE_BILLS: BillReminder[] = [];
export const SAMPLE_UDHAAR: UdhaarRecord[] = [];
export const SAMPLE_PERSONAL_NOTES: PersonalNote[] = [];

// Helper to generate a 100% clean slate for real student data
export const getCleanUserData = (
  allowance = 0,
  wallets: WalletBalances = { cash: 0, upi: 0 },
  _userName = 'You',
  _userUpiId = 'student@upi'
) => {
  return {
    monthlyPocketMoney: allowance,
    wallets: wallets,
    transactions: [] as Transaction[],
    roomExpenses: [] as RoomExpense[],
    roommates: [] as Roommate[],
    roomGroups: [] as RoomGroup[],
    activeRoomId: undefined as string | undefined,
    meals: [] as DailyMealEntry[],
    messConfig: INITIAL_MESS_CONFIG,
    udhaarRecords: [] as UdhaarRecord[],
    bills: [] as BillReminder[],
    goals: [] as SavingsGoal[],
  };
};

export const getSampleUserData = () => {
  return getCleanUserData();
};

// Alias exports for camelCase compatibility
export const initialWallets = INITIAL_WALLETS;
export const initialPocketMoney = INITIAL_POCKET_MONEY;
export const initialRoommates = INITIAL_ROOMMATES;
export const initialTransactions = INITIAL_TRANSACTIONS;
export const initialRoomExpenses = INITIAL_ROOM_EXPENSES;
export const initialUdhaarRecords = INITIAL_UDHAAR;
export const initialBillReminders = INITIAL_BILLS;
export const initialMessConfig = INITIAL_MESS_CONFIG;
export const initialMealAttendance = INITIAL_MEALS;
export const initialSavingsGoals = INITIAL_GOALS;
