import React, { useState, useEffect } from 'react';
import {
  Edit3,
  ArrowRight,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  Plus,
  X,
} from 'lucide-react';
import { WalletBalances, PaymentMode, BillReminder, Transaction } from '../types';
import { formatINR } from '../utils/formatters';

interface SmartMoneyHubProps {
  allowance: number;
  fixedCommitted: number;
  unpaidBillsReserve?: number;
  variableSpent: number;
  discretionaryRemaining?: number;
  todaySpent?: number;
  wallets?: WalletBalances;
  bills?: BillReminder[];
  transactions?: Transaction[];
  onUpdateAllowance: (newAllowance: number) => void;
  onUpdateWallets?: (wallets: WalletBalances, newAllowance?: number) => void;
  onTransferWallets?: (from: PaymentMode, to: PaymentMode, amount: number) => void;
  onUpdateWalletBalance?: (mode: PaymentMode, newBalance: number) => void;
  onAddMoneyToWallet?: (mode: PaymentMode, amount: number, addToAllowance?: boolean) => void;
  onOpenBills: () => void;
  onOpenScanner?: () => void;
  onOpenVoice?: () => void;
  onOpenManual?: () => void;
}

export const SmartMoneyHub: React.FC<SmartMoneyHubProps> = ({
  allowance,
  unpaidBillsReserve = 0,
  variableSpent,
  discretionaryRemaining: propDiscretionaryRemaining,
  todaySpent = 0,
  wallets = { cash: 0, upi: 0 },
  bills = [],
  transactions = [],
  onUpdateAllowance,
  onUpdateWallets,
  onTransferWallets,
  onAddMoneyToWallet,
  onOpenBills,
}) => {
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [tempAllowance, setTempAllowance] = useState(allowance.toString());

  // Dedicated editable state for UPI Money and Fixed Cash in card-monthly-budget
  const [editUpiVal, setEditUpiVal] = useState((wallets?.upi ?? 0).toString());
  const [editCashVal, setEditCashVal] = useState((wallets?.cash ?? 0).toString());

  // Wallet action modal state
  const [activeWalletModal, setActiveWalletModal] = useState<'none' | 'edit' | 'transfer' | 'add'>('none');

  // Edit wallets state
  const [tempCash, setTempCash] = useState((wallets?.cash ?? 0).toString());
  const [tempUpi, setTempUpi] = useState((wallets?.upi ?? 0).toString());

  // Transfer state
  const [transferFrom, setTransferFrom] = useState<PaymentMode>('UPI');
  const [transferAmount, setTransferAmount] = useState('');

  // Add money state
  const [addTarget, setAddTarget] = useState<PaymentMode>('UPI');
  const [addAmount, setAddAmount] = useState('');
  const [addType, setAddType] = useState<'allowance' | 'topup'>('allowance');
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);

  useEffect(() => {
    setTempAllowance(allowance.toString());
  }, [allowance]);

  useEffect(() => {
    const cash = wallets?.cash ?? 0;
    const upi = wallets?.upi ?? 0;
    setTempCash(cash.toString());
    setTempUpi(upi.toString());

    // If allowance exists but both wallets are 0, initialize UPI with allowance
    if (upi === 0 && cash === 0 && allowance > 0) {
      setEditUpiVal(allowance.toString());
      setEditCashVal('0');
    } else {
      setEditUpiVal(upi.toString());
      setEditCashVal(cash.toString());
    }
  }, [wallets?.cash, wallets?.upi, allowance]);

  // Calendar math
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = Math.max(1, totalDaysInMonth - currentDay + 1);

  // Unpaid bills count
  const unpaidBillsList = (bills || []).filter((b) => !b.isPaid);
  const unpaidBillsCount = unpaidBillsList.length;

  // 1. Fixed Wallet Balances (Original added amounts, never reduced by expenses)
  const fixedCash = wallets?.cash ?? 0;
  const fixedUpi = wallets?.upi ?? 0;
  const totalOriginalMoney = fixedCash + fixedUpi;

  // 2. Track Cash & UPI Outflows (Expenses)
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const thisMonthExpenses = safeTransactions.filter((t) => {
    if (!t || t.type !== 'expense') return false;
    if (!t.date) return true;
    const parts = t.date.split('-');
    if (parts.length < 2) return true;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === year && m === month;
  });

  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

  const cashSpentThisMonth = thisMonthExpenses
    .filter((t) => t.paymentMode === 'Cash')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const upiSpentThisMonth = thisMonthExpenses
    .filter((t) => t.paymentMode === 'UPI' || t.paymentMode === 'Bank')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // Total spent is sum of UPI spent + Cash spent (or variableSpent if greater)
  const totalSpentCalculated = upiSpentThisMonth + cashSpentThisMonth;
  const totalSpent = variableSpent > 0 ? Math.max(variableSpent, totalSpentCalculated) : totalSpentCalculated;

  // 3. Current Remaining Available Balances after expenses
  const availableCash = Math.max(0, fixedCash - cashSpentThisMonth);
  const availableUpi = Math.max(0, fixedUpi - upiSpentThisMonth);
  // Calculate remaining balance separately from total spending:
  const availableInHandBalance = Math.max(
    0,
    (totalOriginalMoney > 0 ? totalOriginalMoney : allowance) - totalSpent - (unpaidBillsReserve || 0)
  );

  const safeDailyBudget = Math.max(0, Math.round(availableInHandBalance / daysLeft));
  const effectiveAllowance = totalOriginalMoney > 0 ? totalOriginalMoney : (allowance > 0 ? allowance : totalSpent + availableInHandBalance);
  const spentPct = effectiveAllowance > 0 ? Math.min(100, Math.round((totalSpent / effectiveAllowance) * 100)) : 0;
  const remainingPct = Math.max(0, 100 - spentPct);

  // Cash and Money Added Calculations
  const cashAddedThisMonth = safeTransactions
    .filter((t) => {
      if (!t || t.type !== 'income' || t.paymentMode !== 'Cash') return false;
      if (!t.date) return true;
      const parts = t.date.split('-');
      if (parts.length < 2) return true;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === year && m === month;
    })
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const totalCashAddedAll = safeTransactions
    .filter((t) => t && t.type === 'income' && t.paymentMode === 'Cash')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const totalMoneyAddedThisMonth = safeTransactions
    .filter((t) => {
      if (!t || t.type !== 'income') return false;
      if (!t.date) return true;
      const parts = t.date.split('-');
      if (parts.length < 2) return true;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === year && m === month;
    })
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const displayCashAdded =
    cashAddedThisMonth > 0
      ? cashAddedThisMonth
      : totalCashAddedAll > 0
      ? totalCashAddedAll
      : totalMoneyAddedThisMonth;

  const handleSaveAllowance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempAllowance);
    if (!isNaN(val) && val >= 0) {
      onUpdateAllowance(val);
      setIsEditingAllowance(false);
    }
  };

  const handleSaveBudgetUpiAndCash = (e: React.FormEvent) => {
    e.preventDefault();
    const upiNum = Math.max(0, parseFloat(editUpiVal) || 0);
    const cashNum = Math.max(0, parseFloat(editCashVal) || 0);
    const totalBudget = upiNum + cashNum;

    if (onUpdateWallets) {
      onUpdateWallets({
        upi: upiNum,
        cash: cashNum,
      }, totalBudget);
    } else {
      onUpdateAllowance(totalBudget);
    }
    setIsEditingAllowance(false);
  };

  const handleSaveWallets = (e: React.FormEvent) => {
    e.preventDefault();
    const c = Math.max(0, parseFloat(tempCash) || 0);
    const u = Math.max(0, parseFloat(tempUpi) || 0);
    const totalBudget = c + u;
    if (onUpdateWallets) {
      onUpdateWallets({
        cash: c,
        upi: u,
      }, totalBudget);
    } else {
      onUpdateAllowance(totalBudget);
    }
    setActiveWalletModal('none');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingWallet) return;
    const amt = parseFloat(transferAmount);
    if (!isNaN(amt) && amt > 0 && onTransferWallets) {
      setIsSubmittingWallet(true);
      try {
        const toMode: PaymentMode = transferFrom === 'Cash' ? 'UPI' : 'Cash';
        onTransferWallets(transferFrom, toMode, amt);
        setTransferAmount('');
        setActiveWalletModal('none');
      } finally {
        setTimeout(() => setIsSubmittingWallet(false), 600);
      }
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingWallet) return;
    const amt = parseFloat(addAmount);
    if (!isNaN(amt) && amt > 0 && onAddMoneyToWallet) {
      setIsSubmittingWallet(true);
      try {
        onAddMoneyToWallet(addTarget, amt, addType === 'allowance');
        setAddAmount('');
        setActiveWalletModal('none');
      } finally {
        setTimeout(() => setIsSubmittingWallet(false), 600);
      }
    }
  };

  return (
    <div
      id="smart-money-hub"
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 transition-all space-y-3 sm:space-y-3.5"
    >
      {/* 1. Top Section: Available In-Hand Balance & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block whitespace-nowrap">
            Available In-Hand Balance
          </span>
          <div className="flex items-baseline gap-2 sm:gap-3 mt-0.5 flex-wrap">
            <span
              id="hub-total-liquidity-value"
              className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap"
            >
              {formatINR(availableInHandBalance)}
            </span>
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setTempCash(fixedCash.toString());
                  setTempUpi(fixedUpi.toString());
                  setActiveWalletModal(activeWalletModal === 'edit' ? 'none' : 'edit');
                }}
                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold hover:bg-emerald-100 transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs"
                title="Available Cash in Hand (Click to adjust fixed wallet)"
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Cash: {formatINR(availableCash)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTempCash(fixedCash.toString());
                  setTempUpi(fixedUpi.toString());
                  setActiveWalletModal(activeWalletModal === 'edit' ? 'none' : 'edit');
                }}
                className="px-2 py-1 rounded-lg bg-zinc-950 text-white border border-zinc-950 font-semibold hover:bg-black transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs shadow-2xs"
                title="Available UPI Balance (Click to adjust fixed wallet)"
              >
                <Smartphone className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>UPI: {formatINR(availableUpi)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons - Mobile friendly full-width touch layout */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
          <button
            id="btn-wallet-add"
            type="button"
            onClick={() => setActiveWalletModal(activeWalletModal === 'add' ? 'none' : 'add')}
            className="flex-1 sm:flex-initial h-9 px-3.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition cursor-pointer shadow-xs shadow-red-600/30 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span>Add Money</span>
          </button>

          <button
            id="btn-wallet-transfer"
            type="button"
            onClick={() => setActiveWalletModal(activeWalletModal === 'transfer' ? 'none' : 'transfer')}
            className="flex-1 sm:flex-initial h-9 px-3 rounded-xl text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-300 transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs"
            title="Transfer between Cash & UPI"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span>Transfer</span>
          </button>

          <button
            id="btn-wallet-edit"
            type="button"
            onClick={() => {
              setTempCash(fixedCash.toString());
              setTempUpi(fixedUpi.toString());
              setActiveWalletModal(activeWalletModal === 'edit' ? 'none' : 'edit');
            }}
            className="h-9 w-9 rounded-xl text-zinc-600 hover:text-zinc-950 bg-white hover:bg-zinc-100 border border-zinc-300 transition inline-flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
            title="Edit Fixed Wallet Balances"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Budget Summary: 3-column clean grid (UPI & Cash Budget, Spent, Daily Limit) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3.5">
        {/* Metric 1: UPI & Fixed Cash Budget */}
        <div
          id="card-monthly-budget"
          className="bg-slate-50/70 rounded-xl p-2 sm:p-3.5 border border-slate-200/80 flex flex-col justify-between min-w-0"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-600 mb-1">
            <span className="truncate text-slate-700">Budget</span>
            {!isEditingAllowance && (
              <button
                id="edit-allowance-btn"
                type="button"
                onClick={() => {
                  setEditUpiVal(fixedUpi.toString());
                  setEditCashVal(fixedCash.toString());
                  setIsEditingAllowance(true);
                }}
                className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer -mr-1"
                title="Edit UPI & Cash Budget"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>

          {isEditingAllowance ? (
            <form onSubmit={handleSaveBudgetUpiAndCash} className="mt-1 space-y-1.5">
              <div>
                <label className="text-[9px] font-bold text-zinc-900 block flex items-center gap-0.5 truncate">
                  <Smartphone className="w-2.5 h-2.5 text-red-600 shrink-0" />
                  <span>UPI Money (₹)</span>
                </label>
                <input
                  id="input-upi-money"
                  type="number"
                  min="0"
                  value={editUpiVal}
                  onChange={(e) => setEditUpiVal(e.target.value)}
                  className="w-full text-xs font-bold px-1.5 py-1 rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-zinc-900 block flex items-center gap-0.5 truncate">
                  <Banknote className="w-2.5 h-2.5 text-zinc-700 shrink-0" />
                  <span>Fixed Cash (₹)</span>
                </label>
                <input
                  id="input-fixed-cash"
                  type="number"
                  min="0"
                  value={editCashVal}
                  onChange={(e) => setEditCashVal(e.target.value)}
                  className="w-full text-xs font-bold px-1.5 py-1 rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="submit"
                  className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition shadow-xs shadow-red-600/30"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAllowance(false)}
                  className="px-1.5 py-1 text-slate-500 hover:text-slate-700 text-[10px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div
              onClick={() => {
                setEditUpiVal(fixedUpi.toString());
                setEditCashVal(fixedCash.toString());
                setIsEditingAllowance(true);
              }}
              className="space-y-1 cursor-pointer group"
              title="Click to edit UPI & Cash Budget"
            >
              {/* UPI Row */}
              <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold text-zinc-900 bg-zinc-100/90 hover:bg-zinc-200/90 border border-zinc-200/70 px-1.5 py-0.5 rounded-lg transition">
                <span className="flex items-center gap-0.5 truncate shrink-0">
                  <Smartphone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 shrink-0" />
                  <span>UPI</span>
                </span>
                <span className="font-extrabold text-slate-900 shrink-0">{formatINR(fixedUpi)}</span>
              </div>

              {/* Fixed Cash Row: 100% visible on mobile preview, never truncated to Fixed... */}
              <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold text-emerald-900 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/70 px-1.5 py-0.5 rounded-lg transition">
                <span className="flex items-center gap-0.5 truncate shrink-0">
                  <Banknote className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" />
                  <span>Cash</span>
                </span>
                <span className="font-extrabold text-slate-900 shrink-0">{formatINR(fixedCash)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Metric 2: Spent */}
        <div
          id="card-total-spent"
          className="bg-slate-50/70 rounded-xl p-2 sm:p-3.5 border border-slate-200/80 flex flex-col justify-between min-w-0"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500">
            <span className="truncate">Total Spent</span>
          </div>
          <div
            id="display-total-spent"
            className="text-sm sm:text-base md:text-xl font-black text-slate-900 mt-1 truncate"
            title={`Total spent: ${formatINR(totalSpent)}`}
          >
            {formatINR(totalSpent)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 truncate">
            This Month
          </div>
        </div>

        {/* Metric 3: Safe Daily Budget */}
        <div
          id="card-remaining-balance"
          className="bg-slate-50/70 rounded-xl p-2 sm:p-3.5 border border-slate-200/80 flex flex-col justify-between min-w-0"
        >
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500">
            <span className="truncate" title="Safe Daily Spending Limit">Daily Safe</span>
          </div>
          <div
            id="display-remaining-balance"
            className="text-sm sm:text-base md:text-xl font-black text-slate-900 mt-1 truncate"
            title={`Safe Daily Limit: ${formatINR(safeDailyBudget)}/day`}
          >
            {formatINR(safeDailyBudget)}
          </div>
          <div className="text-[9px] sm:text-[10px] text-red-600 font-bold mt-0.5 truncate">
            {daysLeft} days left
          </div>
        </div>
      </div>

      {/* 3. Unpaid Bills Reserved Banner (Only if pending bills exist) */}
      {unpaidBillsReserve > 0 && (
        <button
          id="bills-reserve-alert-btn"
          type="button"
          onClick={onOpenBills}
          className="w-full inline-flex items-center justify-between text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/90 border border-amber-200/80 px-3 py-2 rounded-xl transition cursor-pointer"
        >
          <span>{formatINR(unpaidBillsReserve)} reserved for {unpaidBillsCount} unpaid bill(s)</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
        </button>
      )}

      {/* Inline Modal: Adjust Exact Balances */}
      {activeWalletModal === 'edit' && (
        <form
          onSubmit={handleSaveWallets}
          className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-300 space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900">Set Fixed Wallet Balances</span>
            <button
              type="button"
              onClick={() => setActiveWalletModal('none')}
              className="text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">Fixed Cash (₹)</label>
              <input
                id="input-edit-cash"
                type="number"
                min="0"
                value={tempCash}
                onChange={(e) => setTempCash(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:border-red-600 focus:outline-none bg-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">UPI Money (₹)</label>
              <input
                id="input-edit-upi"
                type="number"
                min="0"
                value={tempUpi}
                onChange={(e) => setTempUpi(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:border-red-600 focus:outline-none bg-white"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveWalletModal('none')}
              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-edit-wallets"
              type="submit"
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer shadow-xs shadow-red-600/30"
            >
              Save Balances
            </button>
          </div>
        </form>
      )}

      {/* Inline Modal: Transfer between Cash & UPI */}
      {activeWalletModal === 'transfer' && (
        <form
          onSubmit={handleTransferSubmit}
          className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-300 space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900">Transfer Money (ATM Withdrawal / Bank Deposit)</span>
            <button
              type="button"
              onClick={() => setActiveWalletModal('none')}
              className="text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">From</label>
              <select
                id="select-transfer-from"
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value as PaymentMode)}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
              >
                <option value="UPI">UPI (Bank / ATM)</option>
                <option value="Cash">Cash in Hand</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">To</label>
              <input
                type="text"
                disabled
                value={transferFrom === 'UPI' ? 'Cash in Hand' : 'UPI (Bank)'}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">Amount (₹)</label>
              <input
                id="input-transfer-amount"
                type="number"
                min="1"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="500"
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:border-red-600 focus:outline-none bg-white"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveWalletModal('none')}
              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-transfer-wallets"
              type="submit"
              disabled={!transferAmount || parseFloat(transferAmount) <= 0 || isSubmittingWallet}
              className="px-3.5 py-1.5 bg-zinc-950 disabled:opacity-50 text-white rounded-lg text-xs font-bold hover:bg-black cursor-pointer shadow-xs"
            >
              {isSubmittingWallet ? 'Transferring...' : 'Complete Transfer'}
            </button>
          </div>
        </form>
      )}

      {/* Inline Modal: Add Money / Allowance */}
      {activeWalletModal === 'add' && (
        <form
          onSubmit={handleAddSubmit}
          className="p-3.5 bg-zinc-50/80 rounded-xl border border-red-200 space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900">Add Money (Allowance / Freelance / Gift)</span>
            <button
              type="button"
              onClick={() => setActiveWalletModal('none')}
              className="text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">Deposit To</label>
              <select
                id="select-add-target"
                value={addTarget}
                onChange={(e) => setAddTarget(e.target.value as PaymentMode)}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Bank)</option>
                <option value="Cash">Physical Cash</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">Amount (₹)</label>
              <input
                id="input-add-amount"
                type="number"
                min="1"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="2000"
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-300 focus:border-red-600 focus:outline-none bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">Type</label>
              <select
                id="select-add-type"
                value={addType}
                onChange={(e) => setAddType(e.target.value as 'allowance' | 'topup')}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
              >
                <option value="allowance">Add to Monthly Budget (+Allowance)</option>
                <option value="topup">Wallet Top-up Only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveWalletModal('none')}
              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-add-money"
              type="submit"
              disabled={!addAmount || parseFloat(addAmount) <= 0 || isSubmittingWallet}
              className="px-3.5 py-1.5 bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer shadow-xs shadow-red-600/30"
            >
              {isSubmittingWallet ? 'Adding...' : 'Add to Wallet'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
