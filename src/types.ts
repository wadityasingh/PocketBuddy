export type PaymentMode = 'Cash' | 'UPI';

export type TransactionType = 'expense' | 'income' | 'lent' | 'borrowed' | 'transfer';

export type ExpenseCategory =
  | 'General Expense'
  | 'Canteen & Chai'
  | 'Mess & Food'
  | 'Room & Rent'
  | 'Recharge & Wi-Fi'
  | 'Travel & Auto'
  | 'College & Books'
  | 'Groceries'
  | 'Shopping'
  | 'Entertainment'
  | 'Medical'
  | 'Udhaar'
  | 'Pocket Money'
  | 'Top-up'
  | 'Transfer'
  | 'Other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category?: ExpenseCategory | string;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  time?: string;
  notes?: string;
  person?: string;
  refId?: string;
  receiptImage?: string;
  isFixedBill?: boolean;
}

export interface WalletBalances {
  cash: number; // Cash in pocket
  upi: number;  // UPI balance
}

export interface RoomParticipant {
  userId?: string;
  memberId?: string;
  name: string;
  share: number;
  percentage?: number;
  hasPaid?: boolean;
}

export type RoomSplitMethod = 'equal' | 'exact' | 'custom' | 'percentage';

export interface RoomExpense {
  id: string;
  roomId?: string;
  title: string;
  totalAmount: number;
  amount?: number;
  paidByUserId?: string;
  paidBy: string;
  createdByUserId?: string;
  createdBy?: string;
  splitType: RoomSplitMethod;
  participants: RoomParticipant[];
  date: string;
  category?: string;
  notes?: string;
  receipt?: string;
  createdAt?: string;
  status?: 'pending' | 'settled';
}

export interface RoomSettlement {
  id: string;
  roomId: string;
  createdBy?: string;
  ownerId?: string;
  debtorId?: string;
  creditorId?: string;
  fromUserId: string;
  from: string;
  toUserId: string;
  to: string;
  amount: number;
  date: string;
  mode?: 'UPI' | 'Cash';
  status?: 'completed' | 'pending' | 'cancelled';
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomActivity {
  id: string;
  roomId?: string;
  text: string;
  time: string;
  type: 'join' | 'expense' | 'settlement' | 'member' | 'edit';
}

export interface Roommate {
  id: string;
  userId?: string;
  name: string;
  upiId?: string;
  phone?: string;
  email?: string;
  role?: 'owner' | 'member';
  joinedAt?: string;
  isSelf?: boolean;
}

export interface RoomGroup {
  id: string;
  name: string;
  type?: 'Hostel' | 'Flat' | 'PG' | 'Apartment' | 'Other';
  inviteCode: string;
  ownerId?: string;
  members: Roommate[];
  expenses: RoomExpense[];
  settlements: RoomSettlement[];
  activities?: RoomActivity[];
  createdAt: string;
}

export interface DailyMealEntry {
  date: string; // YYYY-MM-DD
  breakfast: boolean;
  lunch: boolean;
  snacks: boolean;
  dinner: boolean;
  guestMeals: number;
  rebateClaimed: boolean;
  notes?: string;
}

export interface MessConfig {
  monthlyMessFee: number; // e.g. 3000
  mealsPerDay: number;    // default 3 or 4
  rebatePerSkippedMeal: number; // e.g. 35
  rebateRuleNoticeHours: number; // e.g. 24
}

export interface UdhaarRecord {
  id: string;
  type: 'give' | 'take'; // 'give' = lent (you will receive), 'take' = borrowed (you must pay)
  person: string;
  amount: number;
  reason: string;
  notes?: string; // Private personal note
  date: string;
  dueDate: string;
  status: 'pending' | 'settled';
  phone?: string;
  upiId?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Other';
  settledDate?: string;
}

export interface PersonalNote {
  id: string;
  title: string;
  content: string;
  date: string; // e.g. "15 Oct"
  colorScheme: 'dark' | 'terracotta' | 'sage' | 'olive' | 'sand';
  isPrivate?: boolean; // Password protected
  password?: string; // Optional password for this note
  isPinned?: boolean;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category?: string;
  isPaid: boolean;
  frequency: 'monthly' | 'one-time' | 'semester';
  preferredMode: PaymentMode;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'laptop' | 'phone' | 'trip' | 'fees' | 'emergency' | 'other';
  icon: string;
}

export interface CoachInsight {
  summary: string;
  status: 'healthy' | 'warning' | 'danger';
  burnRateAlert: string;
  hacks: string[];
  safeDailyCap: number;
  chatReply?: string;
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  time: string;
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  collegeName?: string;
  course?: string;
  branch?: string;
  yearOfStudy?: string;
  upiId?: string;
  roomSplit?: string;
  photoUrl?: string;
  monthlyPocketMoney: number;
  initialCash?: number;
  initialUpi?: number;
  hasCompletedTour: boolean;
  createdAt: string;
}

export interface UserAppData {
  monthlyPocketMoney: number;
  wallets: WalletBalances;
  transactions: Transaction[];
  roomExpenses: RoomExpense[];
  roommates: Roommate[];
  roomGroups?: RoomGroup[];
  activeRoomId?: string;
  meals: DailyMealEntry[];
  messConfig: MessConfig;
  udhaarRecords: UdhaarRecord[];
  bills: BillReminder[];
  goals: SavingsGoal[];
  hasCompletedTour: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: StudentUser;
  data?: UserAppData;
  error?: string;
}
