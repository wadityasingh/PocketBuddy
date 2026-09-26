import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ArrowRight,
  Smartphone,
  Banknote,
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Receipt,
  Wallet,
} from 'lucide-react';
import { Transaction, PaymentMode, TransactionType, WalletBalances } from '../types';

interface ManualExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => boolean | void;
  editingTransaction?: Transaction | null;
  onUpdateTransaction?: (transaction: Transaction) => boolean | void;
  wallets?: WalletBalances;
  availableBalances?: { cash: number; upi: number };
}

export const ManualExpenseModal: React.FC<ManualExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  editingTransaction,
  onUpdateTransaction,
  wallets,
  availableBalances,
}) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [date, setDate] = useState(getTodayString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
    setIsSubmitting(false);
    if (editingTransaction) {
      setType(editingTransaction.type === 'income' ? 'income' : 'expense');
      setAmount(editingTransaction.amount ? editingTransaction.amount.toString() : '');
      setTitle(editingTransaction.title || '');
      setPaymentMode(editingTransaction.paymentMode || 'UPI');
      setDate(editingTransaction.date || getTodayString());
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setPaymentMode('UPI');
      setDate(getTodayString());
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  // Real-time Available Balances (Cash & UPI remaining after expenses)
  const baseCash = availableBalances ? availableBalances.cash : (wallets?.cash ?? 0);
  const baseUpi = availableBalances ? availableBalances.upi : (wallets?.upi ?? 0);

  const availableCash = baseCash + (
    editingTransaction &&
    (editingTransaction.type === 'expense' || editingTransaction.type === 'lent') &&
    editingTransaction.paymentMode === 'Cash'
      ? Number(editingTransaction.amount) || 0
      : 0
  );

  const availableUpi = baseUpi + (
    editingTransaction &&
    (editingTransaction.type === 'expense' || editingTransaction.type === 'lent') &&
    editingTransaction.paymentMode === 'UPI'
      ? Number(editingTransaction.amount) || 0
      : 0
  );

  const currentAvailable = paymentMode === 'Cash' ? availableCash : availableUpi;
  const isInsufficient = type === 'expense' && numAmount > currentAvailable;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    // STRICT BALANCE CHECK: Prevent adding expense exceeding available balance
    if (type === 'expense' && parsedAmount > currentAvailable) {
      setError(
        `Insufficient ${paymentMode} Balance! You only have ₹${currentAvailable.toLocaleString('en-IN')} in ${paymentMode}, but tried to add an expense of ₹${parsedAmount.toLocaleString('en-IN')}. Please reduce the amount or add money to your ${paymentMode} balance.`
      );
      return;
    }

    if (!title.trim()) {
      setError(
        type === 'expense'
          ? 'Please enter where this amount was spent.'
          : 'Please enter the source or description of this deposit.'
      );
      return;
    }

    setIsSubmitting(true);
    let success: boolean | void = true;

    try {
      if (editingTransaction && onUpdateTransaction) {
        success = onUpdateTransaction({
          ...editingTransaction,
          title: title.trim(),
          amount: parsedAmount,
          type,
          category: type === 'income' ? 'Income' : 'Expense',
          paymentMode,
          date: date || getTodayString(),
          notes: undefined,
        });
      } else {
        success = onAddTransaction({
          title: title.trim(),
          amount: parsedAmount,
          type,
          category: type === 'income' ? 'Income' : 'Expense',
          paymentMode,
          date: date || getTodayString(),
          notes: undefined,
        });
      }

      if (success === false) {
        setIsSubmitting(false);
        return;
      }

      // Reset form state cleanly
      setAmount('');
      setTitle('');
      setError(null);
      onClose();
    } finally {
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        id="manual-expense-modal"
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] transition-all"
      >
        {/* Header - Real Product Feel */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                type === 'expense'
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}
            >
              {type === 'expense' ? (
                <Receipt className="w-4.5 h-4.5 stroke-[2.2]" />
              ) : (
                <Wallet className="w-4.5 h-4.5 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm tracking-tight leading-snug">
                {editingTransaction
                  ? 'Edit Entry'
                  : type === 'expense'
                  ? 'Record Expense'
                  : 'Add Funds'}
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {type === 'expense'
                  ? 'Debit from your pocket or UPI'
                  : 'Credit into your wallet balance'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-expense-modal-btn"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body & Form */}
        <div className="p-6 overflow-y-auto space-y-4.5">
          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
            <button
              id="type-expense-btn"
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'expense'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className={`w-3.5 h-3.5 ${type === 'expense' ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Expense</span>
            </button>
            <button
              id="type-income-btn"
              type="button"
              onClick={() => setType('income')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'income'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${type === 'income' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Add Money</span>
            </button>
          </div>

          {error && (
            <div
              id="manual-expense-error"
              className="px-3.5 py-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isInsufficient
                ? 'bg-rose-50/30 border-rose-300 focus-within:bg-white focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500'
                : 'bg-slate-50/70 border-slate-200 focus-within:bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-500 block">
                  Amount
                </label>
                {type === 'expense' && (
                  <span className={`text-[11px] font-semibold ${isInsufficient ? 'text-rose-600' : 'text-slate-500'}`}>
                    Available in {paymentMode}: ₹{currentAvailable.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-semibold select-none ${isInsufficient ? 'text-rose-400' : 'text-slate-400'}`}>₹</span>
                <input
                  id="manual-expense-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full bg-transparent border-0 focus:outline-none text-2xl font-bold placeholder:text-slate-300 tracking-tight ${
                    isInsufficient ? 'text-rose-600' : 'text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              {/* Real-time Insufficient Balance Alert */}
              {isInsufficient && (
                <div className="mt-2.5 pt-2 border-t border-rose-200/80 space-y-2 text-xs text-rose-700 font-medium animate-fade-in">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Insufficient {paymentMode} Balance!</span>
                    </span>
                    <span className="text-[11px] font-bold text-rose-800 bg-rose-100/90 border border-rose-200/60 px-2 py-0.5 rounded-md">
                      Max: ₹{currentAvailable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-600 font-semibold leading-tight">
                    Insufficient Balance: Only ₹{currentAvailable.toLocaleString('en-IN')} available in {paymentMode}.
                  </p>
                  {/* Smart suggestion: if alternate wallet has enough balance */}
                  {paymentMode === 'Cash' && availableUpi >= numAmount && (
                    <button
                      type="button"
                      onClick={() => setPaymentMode('UPI')}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Pay via UPI instead (₹{availableUpi.toLocaleString('en-IN')} available)</span>
                      <ArrowRight className="w-3 h-3 text-red-600" />
                    </button>
                  )}
                  {paymentMode === 'UPI' && availableCash >= numAmount && (
                    <button
                      type="button"
                      onClick={() => setPaymentMode('Cash')}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Pay via Cash instead (₹{availableCash.toLocaleString('en-IN')} available)</span>
                      <ArrowRight className="w-3 h-3 text-red-600" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Description Input */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                {type === 'expense' ? 'Description' : 'Source / Description'}
              </label>
              <input
                id="manual-expense-title-input"
                type="text"
                required
                placeholder={
                  type === 'expense'
                    ? 'Enter description (canteen, groceries, travel, rent, books)'
                    : 'Enter source of funds (allowance, stipend, family)'
                }
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              />
            </div>

            {/* Payment Method Cards */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Online / UPI Card */}
                <button
                  id="payment-mode-upi-btn"
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    paymentMode === 'UPI'
                      ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMode === 'UPI'
                        ? 'bg-zinc-900 text-red-400'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${paymentMode === 'UPI' ? 'text-white' : 'text-zinc-900'}`}>
                        Online / UPI
                      </span>
                      {paymentMode === 'UPI' && (
                        <Check className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
                      )}
                    </div>
                    <span className={`text-[10px] block truncate ${paymentMode === 'UPI' ? 'text-zinc-300 font-semibold' : 'text-zinc-500 font-medium'}`}>
                      Avail: ₹{availableUpi.toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>

                {/* Cash Card */}
                <button
                  id="payment-mode-cash-btn"
                  type="button"
                  onClick={() => setPaymentMode('Cash')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    paymentMode === 'Cash'
                      ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMode === 'Cash'
                        ? 'bg-zinc-900 text-red-400'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${paymentMode === 'Cash' ? 'text-white' : 'text-zinc-900'}`}>
                        Cash
                      </span>
                      {paymentMode === 'Cash' && (
                        <Check className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
                      )}
                    </div>
                    <span className={`text-[10px] block truncate ${paymentMode === 'Cash' ? 'text-zinc-300 font-semibold' : 'text-zinc-500 font-medium'}`}>
                      Avail: ₹{availableCash.toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                Date
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  id="manual-expense-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="save-manual-transaction-btn"
                type="submit"
                disabled={isInsufficient || isSubmitting}
                className={`flex-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs ${
                  isInsufficient || isSubmitting
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed opacity-75'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white cursor-pointer shadow-xs shadow-red-600/30'
                }`}
              >
                <span>
                  {isInsufficient
                    ? `Insufficient ${paymentMode} (₹${currentAvailable.toLocaleString('en-IN')})`
                    : editingTransaction
                    ? 'Save Changes'
                    : type === 'expense'
                    ? `Save Expense ${numAmount > 0 ? `• ₹${numAmount.toLocaleString('en-IN')}` : ''}`
                    : `Add Money ${numAmount > 0 ? `• ₹${numAmount.toLocaleString('en-IN')}` : ''}`}
                </span>
                {!isInsufficient && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
