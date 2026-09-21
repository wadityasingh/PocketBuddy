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

// Default 100% clean initial state - No fake or pre-filled data!
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

// Optional Sample Data — Loaded ONLY when user explicitly clicks "Load Sample Data"
export const SAMPLE_POCKET_MONEY = 10000;

export const SAMPLE_WALLETS: WalletBalances = {
  cash: 500,
  upi: 3500,
};

export const SAMPLE_ROOMMATES: Roommate[] = [
  { id: 'rm-1', name: 'Aditya (You)', isSelf: true, upiId: 'aditya@okhdfcbank', phone: '9876543201' },
  { id: 'rm-2', name: 'Aman', upiId: 'aman@paytm', phone: '9876543202' },
  { id: 'rm-3', name: 'Rahul', upiId: 'rahul@oksbi', phone: '9876543203' },
  { id: 'rm-4', name: 'Neeraj', upiId: 'neeraj@icici', phone: '9876543204' },
];

const today = new Date().toISOString().split('T')[0];

export const SAMPLE_ROOM_EXPENSES: RoomExpense[] = [
  {
    id: 're-1',
    roomId: 'room-sample-1',
    title: 'Room Rent',
    totalAmount: 12000,
    paidBy: 'Aditya (You)',
    splitType: 'equal',
    category: 'Rent',
    date: today,
    participants: [
      { name: 'Aditya (You)', share: 3000, hasPaid: true },
      { name: 'Aman', share: 3000, hasPaid: false },
      { name: 'Rahul', share: 3000, hasPaid: false },
      { name: 'Neeraj', share: 3000, hasPaid: false },
    ],
    status: 'pending',
    notes: 'Monthly flat rent paid to landlord',
  },
  {
    id: 're-2',
    roomId: 'room-sample-1',
    title: 'Electricity Bill',
    totalAmount: 1200,
    paidBy: 'Aman',
    splitType: 'equal',
    category: 'Electricity',
    date: today,
    participants: [
      { name: 'Aditya (You)', share: 300, hasPaid: false },
      { name: 'Aman', share: 300, hasPaid: true },
      { name: 'Rahul', share: 300, hasPaid: false },
      { name: 'Neeraj', share: 300, hasPaid: false },
    ],
    status: 'pending',
    notes: 'Power corporation bill',
  },
  {
    id: 're-3',
    roomId: 'room-sample-1',
    title: 'Room Wi-Fi 200Mbps',
    totalAmount: 800,
    paidBy: 'Rahul',
    splitType: 'equal',
    category: 'Wi-Fi',
    date: today,
    participants: [
      { name: 'Aditya (You)', share: 200, hasPaid: false },
      { name: 'Aman', share: 200, hasPaid: false },
      { name: 'Rahul', share: 200, hasPaid: true },
      { name: 'Neeraj', share: 200, hasPaid: false },
    ],
    status: 'pending',
    notes: 'Monthly fiber recharge',
  },
];

export const SAMPLE_ROOM_GROUPS: RoomGroup[] = [
  {
    id: 'room-sample-1',
    name: 'Krishna PG Room 204',
    inviteCode: 'PG-204-791',
    members: SAMPLE_ROOMMATES,
    expenses: SAMPLE_ROOM_EXPENSES,
    settlements: [],
    createdAt: today,
  },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'st-1',
    title: 'Monthly Pocket Money from Parents',
    amount: 10000,
    type: 'income',
    category: 'Pocket Money',
    paymentMode: 'UPI',
    date: today,
    notes: 'Credited to UPI account',
  },
  {
    id: 'st-2',
    title: 'Campus Canteen Chai & Samosa',
    amount: 40,
    type: 'expense',
    category: 'Canteen & Chai',
    paymentMode: 'Cash',
    date: today,
    notes: 'Break with friends',
  },
  {
    id: 'st-3',
    title: 'Auto Kiraya to College',
    amount: 50,
    type: 'expense',
    category: 'Travel & Auto',
    paymentMode: 'UPI',
    date: today,
    notes: 'Shared rickshaw to gate 2',
  },
  {
    id: 'st-4',
    title: 'Lab Manual & Project Xerox',
    amount: 85,
    type: 'expense',
    category: 'College & Books',
    paymentMode: 'UPI',
    date: today,
    notes: 'Photocopy shop',
  },
];

export const SAMPLE_BILLS: BillReminder[] = [
  {
    id: 'sb-1',
    title: 'Room Rent Share',
    amount: 3000,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    category: 'Room Rent',
    isPaid: false,
    frequency: 'monthly',
    preferredMode: 'UPI',
  },
  {
    id: 'sb-2',
    title: 'Unlimited 5G SIM Recharge',
    amount: 349,
    dueDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
    category: 'Recharge & Wi-Fi',
    isPaid: false,
    frequency: 'monthly',
    preferredMode: 'UPI',
  },
];

export const SAMPLE_UDHAAR: UdhaarRecord[] = [
  {
    id: 'su-1',
    type: 'give',
    person: 'Rohan Sharma',
    amount: 250,
    reason: 'Lunch bill share at college canteen',
    date: today,
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    phone: '9876543299',
    upiId: 'rohan@oksbi',
  },
];

// Helper to generate a 100% clean slate for real student data
export const getCleanUserData = (
  allowance = 0,
  wallets: WalletBalances = { cash: 0, upi: 0 },
  userName = 'You',
  userUpiId = 'student@upi'
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

export const SAMPLE_PERSONAL_NOTES: import('../types').PersonalNote[] = [
  {
    id: 'note-1',
    title: 'Work Summary',
    content: 'Project handoff completed; awaiting final feedback from mentor. Need to prepare slide deck by Friday afternoon.',
    date: '15 Oct',
    colorScheme: 'dark',
    isPinned: true,
    isPrivate: false,
    createdAt: '2026-10-15T10:30:00Z',
  },
  {
    id: 'note-2',
    title: 'All Account & Room Xerox',
    content: 'Room Xerox bill paid. Collect ₹120 share from roommates before weekend.',
    date: '16 Oct',
    colorScheme: 'terracotta',
    isPinned: false,
    isPrivate: false,
    createdAt: '2026-10-16T12:15:00Z',
  },
  {
    id: 'note-3',
    title: 'Travel Plans (Diwali Break)',
    content: 'Key deliverables before Diwali trip: Submit DBMS assignment, collect xerox notes from library, book bus tickets.',
    date: '17 Oct',
    colorScheme: 'sage',
    isPinned: false,
    isPrivate: false,
    createdAt: '2026-10-17T09:45:00Z',
  },
  {
    id: 'note-4',
    title: 'Private Locker & Stash Memo',
    content: 'Emergency reserve cash (₹1,500) kept inside the brown diary behind hostel wardrobe. For urgent end-of-month expenses.',
    date: '14 Oct',
    colorScheme: 'olive',
    isPinned: true,
    isPrivate: true,
    password: '1234',
    createdAt: '2026-10-14T21:00:00Z',
  },
  {
    id: 'note-5',
    title: 'Still Ground',
    content: "A minimalist student notes space designed for peace of mind. A place to pause, breathe, and jot down thoughts without affecting any wallet balance.",
    date: '12 Oct',
    colorScheme: 'sand',
    isPinned: false,
    isPrivate: false,
    createdAt: '2026-10-12T15:20:00Z',
  },
];

export const getSampleUserData = () => {
  return {
    monthlyPocketMoney: SAMPLE_POCKET_MONEY,
    wallets: SAMPLE_WALLETS,
    transactions: SAMPLE_TRANSACTIONS,
    roomExpenses: SAMPLE_ROOM_EXPENSES,
    roommates: SAMPLE_ROOMMATES,
    roomGroups: SAMPLE_ROOM_GROUPS,
    activeRoomId: SAMPLE_ROOM_GROUPS[0].id,
    meals: [] as DailyMealEntry[],
    messConfig: INITIAL_MESS_CONFIG,
    udhaarRecords: SAMPLE_UDHAAR,
    bills: SAMPLE_BILLS,
    goals: [] as SavingsGoal[],
  };
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
