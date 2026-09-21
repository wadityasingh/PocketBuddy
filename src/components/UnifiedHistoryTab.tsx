import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Edit2,
  Trash2,
  FileDown,
  Check,
  Loader2,
  X,
  Home,
  Calendar,
} from 'lucide-react';
import { Transaction, RoomGroup, RoomExpense } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { generateLedgerPDF } from '../utils/pdfGenerator';

export type HistoryScope = 'mymoney' | 'myroom' | 'all';
export type HistoryFilter = 'all' | 'income' | 'expense';
export type RoomFilter = 'all' | 'paid_by_me' | 'paid_by_others';

interface UnifiedHistoryTabProps {
  transactions: Transaction[];
  roomGroups: RoomGroup[];
  currentRoom?: RoomGroup | null;
  currentUser?: { name?: string; upiId?: string; phone?: string; id?: string } | null;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onViewRoom?: () => void;
  onViewMyMoney?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

interface PersonalHistoryItem {
  id: string;
  source: 'mymoney';
  date: string;
  timestamp: number;
  title: string;
  category?: string;
  amount: number;
  paymentMode?: 'Cash' | 'UPI';
  type: 'expense' | 'income' | 'lent' | 'borrowed' | 'transfer';
  notes?: string;
  rawTransaction: Transaction;
}

interface RoomHistoryItem {
  id: string;
  source: 'myroom';
  date: string;
  timestamp: number;
  title: string;
  category?: string;
  amount: number; // Total room bill
  userShare: number; // User's personal share
  paidBy: string;
  isPaidByCurrentUser: boolean;
  roomName?: string;
  roomId?: string;
  participantsCount?: number;
  notes?: string;
  rawRoomExpense: RoomExpense;
}

export const UnifiedHistoryTab: React.FC<UnifiedHistoryTabProps> = ({
  transactions = [],
  roomGroups = [],
  currentRoom,
  currentUser,
  onEditTransaction,
  onDeleteTransaction,
  onViewRoom,
  onViewMyMoney,
}) => {
  // Source switcher: My Money vs My Room
  const [scope, setScope] = useState<'mymoney' | 'myroom'>('mymoney');

  // Compact filters for each scope
  const [personalFilter, setPersonalFilter] = useState<HistoryFilter>('all');
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');

  // Search query
  const [search, setSearch] = useState('');

  // Delete confirmation state (to prevent accidental deletes)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // PDF Export state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Modal to inspect room expense details
  const [viewingRoomExpense, setViewingRoomExpense] = useState<RoomExpense | null>(null);

  const effectiveUserName = currentUser?.name?.trim() || 'You';

  // 1. Process My Money personal transactions
  const personalItems = useMemo<PersonalHistoryItem[]>(() => {
    const list: PersonalHistoryItem[] = [];
    const safeTx = Array.isArray(transactions) ? transactions : [];

    safeTx.forEach((t) => {
      if (!t || !t.id) return;
      const amt = Number(t.amount) || 0;
      let ts = 0;
      try {
        ts = new Date(t.date || '').getTime() || 0;
      } catch {
        ts = 0;
      }

      list.push({
        id: `mm_${t.id}`,
        source: 'mymoney',
        date: t.date ? t.date.split('T')[0] : '',
        timestamp: ts,
        title: t.title?.trim() || (t.type === 'income' ? 'Money Added' : 'Personal Expense'),
        category: t.category,
        amount: amt,
        paymentMode: t.paymentMode || 'UPI',
        type: t.type || 'expense',
        notes: t.notes,
        rawTransaction: t,
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  // 2. Process My Room shared expenses
  const roomItems = useMemo<RoomHistoryItem[]>(() => {
    const list: RoomHistoryItem[] = [];
    const safeRooms = Array.isArray(roomGroups) ? roomGroups : [];

    safeRooms.forEach((room) => {
      if (!room || !Array.isArray(room.expenses)) return;
      room.expenses.forEach((exp) => {
        if (!exp || !exp.id) return;
        const totalAmt = Number(exp.totalAmount ?? exp.amount) || 0;
        let ts = 0;
        try {
          ts = new Date(exp.date || '').getTime() || 0;
        } catch {
          ts = 0;
        }

        const isMe =
          Boolean(exp.paidByUserId && currentUser?.id && (exp.paidByUserId === currentUser.id || exp.paidByUserId === 'rm_' + currentUser.id)) ||
          exp.paidBy?.toLowerCase() === effectiveUserName.toLowerCase() ||
          exp.paidBy?.toLowerCase() === 'you';

        let userShare = 0;
        if (Array.isArray(exp.participants)) {
          const myP = exp.participants.find(
            (p) =>
              (p.userId && currentUser?.id && (p.userId === currentUser.id || p.userId === 'rm_' + currentUser.id)) ||
              p.name.toLowerCase() === effectiveUserName.toLowerCase() ||
              p.name.toLowerCase() === 'you'
          );
          if (myP) {
            userShare = Number(myP.share) || 0;
          } else if (exp.participants.length > 0 && exp.splitType === 'equal') {
            userShare = Math.round((totalAmt / exp.participants.length) * 100) / 100;
          }
        }

        list.push({
          id: `room_${room.id}_${exp.id}`,
          source: 'myroom',
          date: exp.date ? exp.date.split('T')[0] : '',
          timestamp: ts,
          title: exp.title || 'Room Purchase',
          category: exp.category,
          amount: totalAmt,
          userShare: userShare > 0 ? userShare : totalAmt,
          paidBy: exp.paidBy || 'Roommate',
          isPaidByCurrentUser: isMe,
          roomName: room.name,
          roomId: room.id,
          participantsCount: Array.isArray(exp.participants) ? exp.participants.length : 0,
          notes: exp.notes,
          rawRoomExpense: exp,
        });
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [roomGroups, effectiveUserName]);

  // 3. Filtered Personal items for My Money
  const filteredPersonalItems = useMemo(() => {
    return personalItems.filter((item) => {
      // Filter by type: All, Income, Expense
      if (personalFilter === 'income' && item.type !== 'income') return false;
      if (personalFilter === 'expense' && item.type === 'income') return false;

      // Filter by search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCategory = (item.category || '').toLowerCase().includes(q);
        const matchMode = (item.paymentMode || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCategory && !matchMode && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [personalItems, personalFilter, search]);

  // 4. Filtered Room items for My Room
  const filteredRoomItems = useMemo(() => {
    return roomItems.filter((item) => {
      // Filter by payer: All, Paid by Me, Others
      if (roomFilter === 'paid_by_me' && !item.isPaidByCurrentUser) return false;
      if (roomFilter === 'paid_by_others' && item.isPaidByCurrentUser) return false;

      // Filter by search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCategory = (item.category || '').toLowerCase().includes(q);
        const matchPayer = item.paidBy.toLowerCase().includes(q);
        const matchRoom = (item.roomName || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCategory && !matchPayer && !matchRoom && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [roomItems, roomFilter, search]);

  // Today & Yesterday helpers for clean date grouping
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Helper to format Month and Year
  const getMonthLabel = (mKey: string) => {
    if (!mKey || mKey === 'undated') return 'Undated';
    try {
      const [year, month] = mKey.split('-').map(Number);
      if (!year || !month) return mKey;
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return mKey;
    }
  };

  // Group items by Month, then by Date, tracking total spent for each date and month
  const groupedPersonalMonths = useMemo(() => {
    const monthMap: Record<
      string,
      {
        monthKey: string;
        monthLabel: string;
        totalSpent: number;
        totalIncome: number;
        dateGroups: {
          dateKey: string;
          displayDate: string;
          totalSpent: number;
          totalIncome: number;
          items: PersonalHistoryItem[];
        }[];
      }
    > = {};
    const monthOrder: string[] = [];

    filteredPersonalItems.forEach((item) => {
      const dKey = item.date || 'no-date';
      const mKey = dKey !== 'no-date' && dKey.length >= 7 ? dKey.slice(0, 7) : 'undated';

      if (!monthMap[mKey]) {
        monthMap[mKey] = {
          monthKey: mKey,
          monthLabel: getMonthLabel(mKey),
          totalSpent: 0,
          totalIncome: 0,
          dateGroups: [],
        };
        monthOrder.push(mKey);
      }

      const monthObj = monthMap[mKey];
      if (item.type === 'income') {
        monthObj.totalIncome += item.amount;
      } else {
        monthObj.totalSpent += item.amount;
      }

      let dateGroup = monthObj.dateGroups.find((dg) => dg.dateKey === dKey);
      if (!dateGroup) {
        let friendlyDate = dKey;
        if (dKey === todayDateStr) {
          friendlyDate = `Today, ${formatDate(dKey)}`;
        } else if (dKey === yesterdayDateStr) {
          friendlyDate = `Yesterday, ${formatDate(dKey)}`;
        } else if (dKey !== 'no-date') {
          friendlyDate = formatDate(dKey);
        } else {
          friendlyDate = 'Undated';
        }

        dateGroup = {
          dateKey: dKey,
          displayDate: friendlyDate,
          totalSpent: 0,
          totalIncome: 0,
          items: [],
        };
        monthObj.dateGroups.push(dateGroup);
      }

      if (item.type === 'income') {
        dateGroup.totalIncome += item.amount;
      } else {
        dateGroup.totalSpent += item.amount;
      }
      dateGroup.items.push(item);
    });

    return monthOrder.map((key) => monthMap[key]);
  }, [filteredPersonalItems, todayDateStr, yesterdayDateStr]);

  const groupedRoomMonths = useMemo(() => {
    const monthMap: Record<
      string,
      {
        monthKey: string;
        monthLabel: string;
        totalSpent: number;
        totalUserShare: number;
        dateGroups: {
          dateKey: string;
          displayDate: string;
          totalSpent: number;
          totalUserShare: number;
          items: RoomHistoryItem[];
        }[];
      }
    > = {};
    const monthOrder: string[] = [];

    filteredRoomItems.forEach((item) => {
      const dKey = item.date || 'no-date';
      const mKey = dKey !== 'no-date' && dKey.length >= 7 ? dKey.slice(0, 7) : 'undated';

      if (!monthMap[mKey]) {
        monthMap[mKey] = {
          monthKey: mKey,
          monthLabel: getMonthLabel(mKey),
          totalSpent: 0,
          totalUserShare: 0,
          dateGroups: [],
        };
        monthOrder.push(mKey);
      }

      const monthObj = monthMap[mKey];
      monthObj.totalSpent += item.amount;
      monthObj.totalUserShare += item.userShare;

      let dateGroup = monthObj.dateGroups.find((dg) => dg.dateKey === dKey);
      if (!dateGroup) {
        let friendlyDate = dKey;
        if (dKey === todayDateStr) {
          friendlyDate = `Today, ${formatDate(dKey)}`;
        } else if (dKey === yesterdayDateStr) {
          friendlyDate = `Yesterday, ${formatDate(dKey)}`;
        } else if (dKey !== 'no-date') {
          friendlyDate = formatDate(dKey);
        } else {
          friendlyDate = 'Undated';
        }

        dateGroup = {
          dateKey: dKey,
          displayDate: friendlyDate,
          totalSpent: 0,
          totalUserShare: 0,
          items: [],
        };
        monthObj.dateGroups.push(dateGroup);
      }

      dateGroup.totalSpent += item.amount;
      dateGroup.totalUserShare += item.userShare;
      dateGroup.items.push(item);
    });

    return monthOrder.map((key) => monthMap[key]);
  }, [filteredRoomItems, todayDateStr, yesterdayDateStr]);

  // Handle PDF Export
  const handleExportStatement = () => {
    setIsGeneratingPdf(true);
    try {
      const transactionsToExport = filteredPersonalItems
        .filter((i) => i.rawTransaction)
        .map((i) => i.rawTransaction);

      const targetList = transactionsToExport.length > 0 ? transactionsToExport : transactions;

      if (targetList.length > 0) {
        generateLedgerPDF({
          transactions: targetList,
          filterMode: personalFilter,
          searchQuery: search,
          studentName: effectiveUserName,
        });
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper to resolve clean indicator icon
  const getCategoryIcon = (_category?: string, type: string = 'expense') => {
    if (type === 'income') {
      return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
    }
    return <ArrowUpRight className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-3 sm:space-y-4 pb-20">
      {/* 1. Header: Small, clean heading with secondary PDF Export */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Transaction History
          </h1>
          <p className="text-xs text-slate-500">
            {scope === 'mymoney' ? 'Personal finances' : 'Shared room expenses'}
          </p>
        </div>

        {/* Secondary Action: Export PDF (Preserved) */}
        {transactions.length > 0 && (
          <button
            id="btn-export-history-pdf"
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleExportStatement}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-2xs ${
              downloadSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Download Statement"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">
              {downloadSuccess ? 'Downloaded' : 'Export PDF'}
            </span>
          </button>
        )}
      </div>

      {/* 2. Source Switcher: My Money vs My Room (Segmented Control) */}
      <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
        <button
          id="history-tab-mymoney"
          type="button"
          onClick={() => {
            setScope('mymoney');
            setConfirmDeleteId(null);
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
            scope === 'mymoney'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>My Money</span>
        </button>

        <button
          id="history-tab-myroom"
          type="button"
          onClick={() => {
            setScope('myroom');
            setConfirmDeleteId(null);
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
            scope === 'myroom'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>My Room</span>
        </button>
      </div>

      {/* 3. Search Bar: Works dynamically for selected source */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="history-search-input"
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs pl-8.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 font-medium transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4. Filter Tabs: Compact clean pills without entry numbers */}
      {scope === 'mymoney' ? (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'income', 'expense'] as const).map((filterType) => {
            const label = filterType === 'all' ? 'All' : filterType === 'income' ? 'Income' : 'Expense';
            const isActive = personalFilter === filterType;

            return (
              <button
                key={filterType}
                id={`filter-mymoney-${filterType}`}
                type="button"
                onClick={() => setPersonalFilter(filterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'paid_by_me', 'paid_by_others'] as const).map((filterType) => {
            const label =
              filterType === 'all'
                ? 'All'
                : filterType === 'paid_by_me'
                ? 'Paid by You'
                : 'Other Roommates';
            const isActive = roomFilter === filterType;

            return (
              <button
                key={filterType}
                id={`filter-myroom-${filterType}`}
                type="button"
                onClick={() => setRoomFilter(filterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Transaction List: Clear, minimal, mobile-first */}
      {scope === 'mymoney' ? (
        filteredPersonalItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-2 shadow-2xs">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {personalItems.length === 0 ? 'No transactions yet.' : 'No matching transactions.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {personalItems.length === 0
                ? 'Add your first transaction to start tracking your money.'
                : 'Try adjusting your search query or switching filters.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-2 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedPersonalMonths.map((month) => (
              <div key={month.monthKey} className="space-y-3">
                {/* Month Section Header with Total Monthly Spent */}
                <div className="flex items-center justify-between pt-2 pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                      {month.monthLabel}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                    Monthly Spent: <strong className="text-slate-900 font-extrabold">{formatINR(month.totalSpent)}</strong>
                  </span>
                </div>

                {/* Date Groups in this month */}
                {month.dateGroups.map((group) => (
                  <div key={group.dateKey} className="space-y-1.5">
                    {/* Date Header with Total Amount Spent */}
                    <div className="flex items-center justify-between px-1 text-xs pt-1">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-700">
                        {group.displayDate}
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                        Total Spent: <strong className="font-extrabold text-rose-600">{formatINR(group.totalSpent)}</strong>
                      </span>
                    </div>

                    {/* Date Group Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                      {group.items.map((item) => {
                        const isIncome = item.type === 'income';

                        return (
                          <div
                            key={item.id}
                            className="p-3 sm:p-3.5 hover:bg-slate-50/70 transition flex items-center justify-between gap-2.5"
                          >
                            {/* Left: Icon + Title + Subtitle */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isIncome
                                    ? 'bg-emerald-50 border border-emerald-200/70 text-emerald-600'
                                    : 'bg-slate-100 border border-slate-200/60 text-slate-700'
                                }`}
                              >
                                {getCategoryIcon(item.category, item.type)}
                              </div>

                              <div className="min-w-0 flex-1">
                                {/* Title */}
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {item.title}
                                </h4>

                                {/* Subtitle: Date · Payment Mode (· Category if meaningful) */}
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate flex-wrap">
                                  <span>{formatDate(item.date)}</span>
                                  {item.paymentMode && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="font-semibold text-slate-600">
                                        {item.paymentMode}
                                      </span>
                                    </>
                                  )}
                                  {isIncome && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                                        Money Added
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Amount + Actions */}
                            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                              <div className="text-right">
                                <div
                                  className={`text-xs sm:text-sm font-black tracking-tight ${
                                    isIncome ? 'text-emerald-600' : 'text-slate-900'
                                  }`}
                                >
                                  {isIncome ? `+${formatINR(item.amount)}` : `-${formatINR(item.amount)}`}
                                </div>
                              </div>

                              {/* Edit & Delete actions */}
                              <div className="flex items-center gap-0.5">
                                {onEditTransaction && item.rawTransaction && (
                                  <button
                                    type="button"
                                    onClick={() => onEditTransaction(item.rawTransaction)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                    title="Edit transaction"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onDeleteTransaction && item.rawTransaction && (
                                  confirmDeleteId === item.rawTransaction.id ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteTransaction(item.rawTransaction.id);
                                        setConfirmDeleteId(null);
                                      }}
                                      className="px-2 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition cursor-pointer"
                                      title="Confirm delete"
                                    >
                                      Delete?
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmDeleteId(item.rawTransaction.id);
                                        setTimeout(() => {
                                          setConfirmDeleteId((prev) =>
                                            prev === item.rawTransaction.id ? null : prev
                                          );
                                        }, 4000);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                      title="Delete transaction"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      ) : (
        /* My Room List */
        filteredRoomItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-2 shadow-2xs">
            <Home className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              {roomItems.length === 0 ? 'No room transactions yet.' : 'No matching room expenses.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {roomItems.length === 0
                ? 'Shared expenses added in My Room will appear here.'
                : 'Try adjusting your search query or switching filters.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-2 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedRoomMonths.map((month) => (
              <div key={month.monthKey} className="space-y-3">
                {/* Month Section Header with Room Total */}
                <div className="flex items-center justify-between pt-2 pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                      {month.monthLabel}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
                    Room Total: <strong className="text-slate-900 font-extrabold">{formatINR(month.totalSpent)}</strong>
                    {month.totalUserShare > 0 && (
                      <span className="ml-2 text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded text-[10px]">
                        Your Share: {formatINR(month.totalUserShare)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date Groups in this month */}
                {month.dateGroups.map((group) => (
                  <div key={group.dateKey} className="space-y-1.5">
                    {/* Date Header with Total Spent */}
                    <div className="flex items-center justify-between px-1 text-xs pt-1">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-700">
                        {group.displayDate}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                        <span className="text-slate-500">
                          Total Spent: <strong className="font-extrabold text-rose-600">{formatINR(group.totalSpent)}</strong>
                        </span>
                        {group.totalUserShare > 0 && (
                          <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded text-[10px]">
                            Your Share: {formatINR(group.totalUserShare)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date Group Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 sm:p-3.5 hover:bg-slate-50/70 transition flex items-center justify-between gap-2.5"
                        >
                          {/* Left: Icon + Title + Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-600">
                              <Home className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {item.title}
                              </h4>

                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate flex-wrap">
                                <span>{formatDate(item.date)}</span>
                                <span className="text-slate-300">•</span>
                                <span
                                  className={`font-semibold ${
                                    item.isPaidByCurrentUser ? 'text-indigo-700' : 'text-slate-600'
                                  }`}
                                >
                                  Paid by {item.isPaidByCurrentUser ? 'You' : item.paidBy}
                                </span>
                                {item.roomName && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500">{item.roomName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Amounts + Details button */}
                          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                            <div className="text-right">
                              <div className="text-xs sm:text-sm font-black text-slate-900">
                                {formatINR(item.userShare)}
                                <span className="text-[10px] font-normal text-slate-400 block -mt-0.5">
                                  your share
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Total {formatINR(item.amount)}
                              </div>
                            </div>

                            {/* View breakdown modal */}
                            <button
                              type="button"
                              onClick={() => {
                                if (item.rawRoomExpense) {
                                  setViewingRoomExpense(item.rawRoomExpense);
                                } else if (onViewRoom) {
                                  onViewRoom();
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="View split breakdown"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      )}

      {/* 6. Room Expense Detail Modal */}
      {viewingRoomExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Shared Room Purchase
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                  {viewingRoomExpense.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingRoomExpense(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Bill</span>
                  <div className="text-base font-black text-slate-900">
                    {formatINR(viewingRoomExpense.totalAmount ?? viewingRoomExpense.amount ?? 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Paid By</span>
                  <div className="text-sm font-bold text-slate-800">
                    {viewingRoomExpense.paidBy}
                  </div>
                </div>
              </div>

              {/* Split Breakdown */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Roommates Share Breakdown:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {Array.isArray(viewingRoomExpense.participants) &&
                    viewingRoomExpense.participants.map((p, idx) => {
                      const isMe =
                        p.name.toLowerCase() === effectiveUserName.toLowerCase() ||
                        p.name.toLowerCase() === 'you';
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                            isMe
                              ? 'bg-indigo-50 border border-indigo-200/80 font-bold'
                              : 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>
                            {p.name} {isMe && '(You)'}
                          </span>
                          <span className={isMe ? 'text-indigo-900 font-black' : 'text-slate-900 font-bold'}>
                            {formatINR(p.share)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {viewingRoomExpense.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                  <strong>Notes:</strong> {viewingRoomExpense.notes}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {onViewRoom && (
                <button
                  type="button"
                  onClick={() => {
                    setViewingRoomExpense(null);
                    onViewRoom();
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Go to My Room</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingRoomExpense(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

