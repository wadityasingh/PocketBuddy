import React, { useMemo } from 'react';
import {
  Wallet,
  Smartphone,
  Banknote,
  PlusCircle,
  Camera,
  Mic,
  Home,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Transaction, WalletBalances, RoomGroup, StudentUser } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface StudentDashboardViewProps {
  monthlyPocketMoney: number;
  wallets: WalletBalances;
  availableCash: number;
  availableUpi: number;
  transactions: Transaction[];
  roomGroups: RoomGroup[];
  currentRoom: RoomGroup | null;
  currentUser: StudentUser;
  onNavigateTab: (tab: 'overview' | 'room' | 'history' | 'udhaar') => void;
  onOpenAddExpense: () => void;
  onOpenAddMoney: () => void;
  onOpenScanner: () => void;
  onOpenVoice: () => void;
  onDeleteTransaction?: (id: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  monthlyPocketMoney,
  wallets,
  availableCash,
  availableUpi,
  transactions = [],
  roomGroups = [],
  currentRoom,
  currentUser,
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddMoney,
  onOpenScanner,
  onOpenVoice,
  onDeleteTransaction,
}) => {
  const availableTotal = availableCash + availableUpi;

  // Real calculations based on user's actual transactions
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysPassed = Math.max(1, now.getDate());
  const daysRemaining = Math.max(1, totalDaysInMonth - now.getDate() + 1);

  const safeTxList = useMemo(() => {
    return Array.isArray(transactions) ? transactions : [];
  }, [transactions]);

  // Expenses this month
  const thisMonthExpenses = useMemo(() => {
    return safeTxList.filter((t) => {
      if (!t || t.type !== 'expense' || !t.date) return false;
      const parts = t.date.split('-');
      if (parts.length < 2) return true;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === currentYear && m === currentMonth;
    });
  }, [safeTxList, currentYear, currentMonth]);

  const totalSpentThisMonth = useMemo(() => {
    return thisMonthExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [thisMonthExpenses]);

  const upiSpent = useMemo(() => {
    return thisMonthExpenses
      .filter((t) => t.paymentMode === 'UPI' || t.paymentMode === 'Bank')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [thisMonthExpenses]);

  const cashSpent = useMemo(() => {
    return thisMonthExpenses
      .filter((t) => t.paymentMode === 'Cash')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [thisMonthExpenses]);

  // Real Category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of thisMonthExpenses) {
      const cat = t.category || 'Expense';
      map[cat] = (map[cat] || 0) + (Number(t.amount) || 0);
    }
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries;
  }, [thisMonthExpenses]);

  const highestCategory = categoryStats.length > 0 ? categoryStats[0][0] : null;

  // Real daily spending rate
  const dailyBurnRate = Math.round(totalSpentThisMonth / daysPassed);
  const safeDailyBudget = Math.max(0, Math.round(availableTotal / daysRemaining));

  // Recent transactions (last 6)
  const recentTransactions = useMemo(() => {
    return safeTxList.slice(0, 6);
  }, [safeTxList]);

  // Room debts summary if in active room
  const roomDebtSummary = useMemo(() => {
    if (!currentRoom || !Array.isArray(currentRoom.expenses) || currentRoom.expenses.length === 0) {
      return null;
    }
    const memberCount = currentRoom.members?.length || 1;
    let myPaid = 0;
    let totalRoomSpend = 0;

    for (const exp of currentRoom.expenses) {
      const amt = Number(exp.amount) || 0;
      totalRoomSpend += amt;
      if (exp.paidByUserId === currentUser?.id || exp.paidBy === currentUser?.name) {
        myPaid += amt;
      }
    }

    const myShare = totalRoomSpend / Math.max(1, memberCount);
    const balance = myPaid - myShare;

    return {
      totalRoomSpend,
      myPaid,
      balance: Math.round(balance),
      memberCount,
    };
  }, [currentRoom, currentUser]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Greeting & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time student liquidity, spending pacing, and roommate settlements.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500 self-start sm:self-auto flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-red-600" />
          <span>
            {new Date().toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-red-600 font-bold">{daysRemaining} days left</span>
        </div>
      </div>

      {/* 2. Main 4 Financial Pillars (Required by Brief) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Monthly Pocket Money */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 truncate flex items-center justify-between">
            <span>Monthly Pocket Money</span>
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 tabular-nums">
            {formatINR(monthlyPocketMoney)}
          </div>
          <div className="text-[10px] text-slate-400">Total monthly budget</div>
        </div>

        {/* Metric 2: Available Balance */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 truncate flex items-center justify-between">
            <span>Available Balance</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-base sm:text-2xl font-black text-zinc-950 tabular-nums">
            {formatINR(availableTotal)}
          </div>
          <div className="text-[10px] text-zinc-500 font-medium truncate">
            {formatINR(safeDailyBudget)}/day safe limit
          </div>
        </div>

        {/* Metric 3: UPI Balance */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-zinc-200 bg-zinc-50/40 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-zinc-800 truncate flex items-center justify-between">
            <span>UPI Balance</span>
            <Smartphone className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-base sm:text-2xl font-black text-zinc-950 tabular-nums">
            {formatINR(availableUpi)}
          </div>
          <div className="text-[10px] text-zinc-500 font-medium">Digital wallet &amp; apps</div>
        </div>

        {/* Metric 4: Cash Balance */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-emerald-100 bg-emerald-50/20 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-800 truncate flex items-center justify-between">
            <span>Cash Balance</span>
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base sm:text-2xl font-black text-emerald-950 tabular-nums">
            {formatINR(availableCash)}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">Physical in-hand cash</div>
        </div>
      </div>

      {/* 3. Quick Actions Bar (Required: Add Money, Add Expense, Scan Receipt, Voice Expense, My Room) */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-slate-500 shrink-0 px-2 hidden sm:inline">
          Quick Actions:
        </span>

        <button
          id="qa-add-expense"
          type="button"
          onClick={onOpenAddExpense}
          className="shrink-0 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-red-600/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>

        <button
          id="qa-add-money"
          type="button"
          onClick={onOpenAddMoney}
          className="shrink-0 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5 text-red-600" />
          <span>Add Money</span>
        </button>

        <button
          id="qa-scan-receipt"
          type="button"
          onClick={onOpenScanner}
          className="shrink-0 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-slate-600" />
          <span>Scan Receipt</span>
        </button>

        <button
          id="qa-voice-expense"
          type="button"
          onClick={onOpenVoice}
          className="shrink-0 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5 text-slate-600" />
          <span>Voice Expense</span>
        </button>

        <button
          id="qa-my-room"
          type="button"
          onClick={() => onNavigateTab('room')}
          className="shrink-0 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <Home className="w-3.5 h-3.5 text-red-600" />
          <span>My Room</span>
        </button>
      </div>

      {/* 4. AI Spending Insights ("PocketBuddy Insights" - Required by Section 8) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-200/70 text-red-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              PocketBuddy Insights
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Real Activity Analysis</span>
        </div>

        {/* Real Insight Cards */}
        {thisMonthExpenses.length < 2 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center space-y-1 text-slate-500">
            <Info className="w-4 h-4 mx-auto text-slate-400" />
            <p className="text-xs font-medium">
              Add a few transactions to unlock spending insights.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Insight 1: Monthly Total */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="text-[10px] font-bold text-slate-500">Monthly Spending</div>
              <div className="text-xs font-semibold text-slate-800">
                You spent <strong className="text-slate-950 font-bold">{formatINR(totalSpentThisMonth)}</strong> this month.
              </div>
            </div>

            {/* Insight 2: Category Driver */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="text-[10px] font-bold text-slate-500">Highest Category</div>
              <div className="text-xs font-semibold text-slate-800">
                {highestCategory ? (
                  <>
                    <strong className="text-red-600 font-bold">{highestCategory}</strong> is currently your highest spending category.
                  </>
                ) : (
                  'Spending is evenly balanced across categories.'
                )}
              </div>
            </div>

            {/* Insight 3: Payment Split */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="text-[10px] font-bold text-slate-500">Payment Breakdown</div>
              <div className="text-xs font-semibold text-slate-800">
                {upiSpent >= cashSpent
                  ? 'Your UPI spending is higher than your cash spending.'
                  : 'Your cash spending is higher than your UPI spending.'}
              </div>
            </div>

            {/* Insight 4: Daily Burn Pace */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="text-[10px] font-bold text-slate-500">Daily Burn Rate</div>
              <div className="text-xs font-semibold text-slate-800">
                Your current spending rate is approximately{' '}
                <strong className="text-slate-950 font-bold">{formatINR(dailyBurnRate)}</strong> per day.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Middle Split: Spending Breakdown & Room Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Spending Summary & Category Outflow */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Monthly Spending Summary
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('overview')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage in My Money</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
            <div>
              <div className="text-[10px] font-bold text-slate-500">Total Outflow</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                {formatINR(totalSpentThisMonth)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-700">UPI Spent</div>
              <div className="text-sm sm:text-base font-extrabold text-zinc-950 mt-0.5">
                {formatINR(upiSpent)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-700">Cash Spent</div>
              <div className="text-sm sm:text-base font-extrabold text-emerald-900 mt-0.5">
                {formatINR(cashSpent)}
              </div>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">Top Categories</div>
            {categoryStats.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">No expenses recorded this month.</div>
            ) : (
              <div className="space-y-1.5">
                {categoryStats.slice(0, 4).map(([cat, amt]) => {
                  const pct = totalSpentThisMonth > 0 ? Math.round((amt / totalSpentThisMonth) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{cat}</span>
                        <span className="font-bold text-slate-900">
                          {formatINR(amt)} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600 rounded-full"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Room Status Glance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-red-600" />
                <span>My Room</span>
              </span>
              {currentRoom && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {currentRoom.name}
                </span>
              )}
            </div>

            {currentRoom ? (
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Room Code</span>
                    <span className="font-mono font-bold text-red-700 bg-white px-2 py-0.5 rounded border border-red-200/60">
                      {currentRoom.inviteCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Members</span>
                    <span className="font-semibold text-slate-800">
                      {currentRoom.members?.length || 0} roommates
                    </span>
                  </div>
                </div>

                {roomDebtSummary ? (
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500">Your Room Settlement Status</div>
                    <div className="text-xs font-bold">
                      {roomDebtSummary.balance > 0 ? (
                        <span className="text-emerald-700">
                          You are owed {formatINR(roomDebtSummary.balance)} by roommates
                        </span>
                      ) : roomDebtSummary.balance < 0 ? (
                        <span className="text-rose-700">
                          You owe {formatINR(Math.abs(roomDebtSummary.balance))} to roommates
                        </span>
                      ) : (
                        <span className="text-slate-700">All room balances are fully settled!</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-1">
                    No shared room expenses recorded yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <Users className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs text-slate-500">
                  You are not in a room yet. Create or join a room to split shared expenses.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('room')}
            className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/90 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{currentRoom ? 'Open Room Expenses' : 'Join or Create Room'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* 6. Recent Transactions List (Compact, Real Ledger) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Recent Transactions
            </h2>
            <p className="text-[11px] text-slate-400">Latest activity from your personal ledger</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('overview')}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-1">
            <Clock className="w-5 h-5 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700">No transactions recorded yet</p>
            <p className="text-[11px] text-slate-400">
              Tap &ldquo;Add Expense&rdquo; or &ldquo;Scan Receipt&rdquo; to add your first expense.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isCash = tx.paymentMode === 'Cash';

              return (
                <div
                  key={tx.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isCash ? (
                        <Banknote className="w-3.5 h-3.5" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">
                        {tx.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>{formatDate(tx.date)}</span>
                        <span>·</span>
                        <span>{tx.paymentMode}</span>
                        {tx.category && (
                          <>
                            <span>·</span>
                            <span>{tx.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold tabular-nums ${
                        isIncome ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
