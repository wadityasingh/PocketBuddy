import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Edit2,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Smartphone,
  Banknote,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface TransactionsListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onAddExpense?: () => void;
}

interface MonthGroup {
  key: string;
  label: string;
  year: number;
  month: number;
  totalSpent: number;
  upiSpent: number;
  cashSpent: number;
  moneyAdded: number;
  items: Transaction[];
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions = [],
  onDeleteTransaction,
  onEditTransaction,
  onAddExpense,
}) => {
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const safeTransactions = useMemo(() => {
    const list = Array.isArray(transactions) ? transactions : [];
    const seenIds = new Set<string>();
    return list.filter((t) => {
      if (!t || !t.id) return false;
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });
  }, [transactions]);

  // Search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return safeTransactions;
    const q = search.toLowerCase().trim();
    return safeTransactions.filter((t) => {
      if (!t) return false;
      const titleMatch = (t.title || '').toLowerCase().includes(q);
      const personMatch = (t.person || '').toLowerCase().includes(q);
      const notesMatch = (t.notes || '').toLowerCase().includes(q);
      const modeMatch = (t.paymentMode || '').toLowerCase().includes(q);
      const amountMatch = String(t.amount || '').includes(q);
      return titleMatch || personMatch || notesMatch || modeMatch || amountMatch;
    });
  }, [safeTransactions, search]);

  // Group transactions by month (divided by month with UPI & Cash breakdown)
  const groupedByMonth = useMemo(() => {
    const groups: MonthGroup[] = [];
    const map: Record<string, MonthGroup> = {};

    // Sort newest date first
    const sorted = [...filtered].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });

    sorted.forEach((t) => {
      let key = 'undated';
      let label = 'Other / Undated';
      let year = 0;
      let month = 0;

      if (t.date) {
        try {
          const d = new Date(t.date);
          if (!isNaN(d.getTime())) {
            year = d.getFullYear();
            month = d.getMonth() + 1;
            key = `${year}-${String(month).padStart(2, '0')}`;
            label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
          }
        } catch {
          // ignore date parse fallback
        }
      }

      if (!map[key]) {
        map[key] = {
          key,
          label,
          year,
          month,
          totalSpent: 0,
          upiSpent: 0,
          cashSpent: 0,
          moneyAdded: 0,
          items: [],
        };
        groups.push(map[key]);
      }

      map[key].items.push(t);

      const amt = Number(t.amount) || 0;
      if (t.type === 'expense') {
        map[key].totalSpent += amt;
        if (t.paymentMode === 'Cash') {
          map[key].cashSpent += amt;
        } else {
          map[key].upiSpent += amt;
        }
      } else if (t.type === 'income') {
        map[key].moneyAdded += amt;
      }
    });

    return groups;
  }, [filtered]);

  const formatTitle = (title: string = '') => {
    if (!title) return 'Expense';
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  return (
    <div
      id="transactions-list-container"
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5 sm:space-y-4"
    >
      {/* 1. Header: Title + Small Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
            Transaction History
          </h3>
        </div>

        {/* Small, clean search input */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="transactions-search-input"
            type="text"
            placeholder="Search description, note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8.5 text-xs pl-8.5 pr-7 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 transition placeholder:text-slate-400 font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Monthly Divided Ledger List */}
      <div className="space-y-5">
        {safeTransactions.length === 0 ? (
          <div
            id="transactions-empty-state"
            className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
              <Wallet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Transactions Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3.5 leading-relaxed">
              Add your daily expenses or record money added to start tracking.
            </p>
            {onAddExpense && (
              <button
                id="empty-add-first-expense-btn"
                type="button"
                onClick={onAddExpense}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                + Record Expense
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <p className="text-xs font-bold text-slate-700">No transactions match &ldquo;{search}&rdquo;</p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          groupedByMonth.map((monthGroup) => (
            <div key={monthGroup.key} className="space-y-2">
              {/* Month Divider Bar with UPI & Cash Spent Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 py-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {monthGroup.label}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({monthGroup.items.length})
                  </span>
                </div>

                {/* Month UPI and Cash summary badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {monthGroup.totalSpent > 0 && (
                    <span className="text-[11px] font-bold text-slate-700">
                      Spent: {formatINR(monthGroup.totalSpent)}
                    </span>
                  )}
                  {monthGroup.upiSpent > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-lg">
                      <Smartphone className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span>UPI: {formatINR(monthGroup.upiSpent)}</span>
                    </span>
                  )}
                  {monthGroup.cashSpent > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-100 px-2 py-0.5 rounded-lg">
                      <Banknote className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Cash: {formatINR(monthGroup.cashSpent)}</span>
                    </span>
                  )}
                  {monthGroup.moneyAdded > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50/60 px-1.5 py-0.5 rounded">
                      +{formatINR(monthGroup.moneyAdded)} added
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions in this month */}
              <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {monthGroup.items.map((t) => {
                  const isIncome = t.type === 'income';
                  const displayTitle = formatTitle(t.title);

                  return (
                    <div
                      key={t.id}
                      id={`transaction-row-${t.id}`}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                    >
                      {/* Left: Icon + Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isIncome
                              ? 'bg-emerald-50 border-emerald-200/80 text-emerald-600'
                              : 'bg-slate-50 border-slate-200/80 text-slate-700'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-slate-600" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {displayTitle}
                            </span>
                            {t.person && (
                              <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.2 rounded whitespace-nowrap">
                                {t.person}
                              </span>
                            )}
                            {t.isFixedBill && (
                              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded whitespace-nowrap">
                                Bill
                              </span>
                            )}
                          </div>

                          {/* Subtitle: Date & Payment Mode Symbol */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span>{formatDate(t.date)}</span>
                            <span className="text-slate-300">•</span>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                t.paymentMode === 'Cash'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                              }`}
                            >
                              {t.paymentMode === 'Cash' ? (
                                <Banknote className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : (
                                <Smartphone className="w-3 h-3 text-indigo-600 shrink-0" />
                              )}
                              <span>{t.paymentMode}</span>
                            </span>
                            {isIncome && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-semibold text-emerald-600">
                                  Money Added
                                </span>
                              </>
                            )}
                            {t.notes && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="italic truncate text-slate-400 max-w-xs">
                                  &ldquo;{t.notes}&rdquo;
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount + Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-right">
                          <div
                            className={`text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap ${
                              isIncome ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {isIncome ? `+${formatINR(t.amount)}` : `-${formatINR(t.amount)}`}
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-0.5">
                          {onEditTransaction && (
                            <button
                              type="button"
                              onClick={() => onEditTransaction(t)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirmDeleteId === t.id) {
                                onDeleteTransaction(t.id);
                                setConfirmDeleteId(null);
                              } else {
                                setConfirmDeleteId(t.id);
                                setTimeout(() => {
                                  setConfirmDeleteId((prev) => (prev === t.id ? null : prev));
                                }, 3500);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              confirmDeleteId === t.id
                                ? 'bg-rose-600 text-white font-bold text-[10px] px-2'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={confirmDeleteId === t.id ? 'Click to confirm delete' : 'Delete transaction'}
                          >
                            {confirmDeleteId === t.id ? 'Delete?' : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
