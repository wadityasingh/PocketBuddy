import React, { useState } from 'react';
import { Smartphone, Banknote, Edit2, Check, ArrowRightLeft, Plus } from 'lucide-react';
import { WalletBalances, PaymentMode } from '../types';
import { formatINR } from '../utils/formatters';

interface WalletsCardProps {
  wallets: WalletBalances;
  onTransfer?: (from: PaymentMode, to: PaymentMode, amount: number) => void;
  onUpdateBalance?: (mode: PaymentMode, newBalance: number) => void;
  onUpdateWallet?: (walletKey: keyof WalletBalances, newAmount: number) => void;
  onAddMoney?: (mode: PaymentMode, amount: number) => void;
}

export const WalletsCard: React.FC<WalletsCardProps> = ({
  wallets,
  onTransfer,
  onUpdateBalance,
  onUpdateWallet,
  onAddMoney,
}) => {
  const [editingMode, setEditingMode] = useState<PaymentMode | null>(null);
  const [editValue, setEditValue] = useState('');

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<PaymentMode>('UPI');
  const [transferAmount, setTransferAmount] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<PaymentMode>('UPI');
  const [addAmount, setAddAmount] = useState('');

  const cash = wallets?.cash ?? 0;
  const upi = wallets?.upi ?? 0;
  const totalAvailable = cash + upi;

  const startEdit = (mode: PaymentMode) => {
    setEditingMode(mode);
    setEditValue((mode === 'Cash' ? cash : upi).toString());
  };

  const handleSaveEdit = (mode: PaymentMode) => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      if (onUpdateBalance) onUpdateBalance(mode, val);
      if (onUpdateWallet) {
        const key = mode.toLowerCase() as keyof WalletBalances;
        onUpdateWallet(key, val);
      }
    }
    setEditingMode(null);
    setEditValue('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!isNaN(amt) && amt > 0 && onTransfer) {
      const transferTo = transferFrom === 'Cash' ? 'UPI' : 'Cash';
      onTransfer(transferFrom, transferTo, amt);
      setIsTransferOpen(false);
      setTransferAmount('');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addAmount);
    if (!isNaN(amt) && amt > 0) {
      if (onAddMoney) {
        onAddMoney(addTarget, amt);
      } else if (onUpdateBalance) {
        const curr = addTarget === 'Cash' ? cash : upi;
        onUpdateBalance(addTarget, curr + amt);
      }
      setIsAddOpen(false);
      setAddAmount('');
    }
  };

  return (
    <div id="my-money-card" className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">MY MONEY</h3>
          <p className="text-xs text-slate-500 font-medium">
            Cash in pocket and UPI balance available for daily spending
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onTransfer && (
            <button
              onClick={() => {
                setIsTransferOpen(!isTransferOpen);
                setIsAddOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Shift Cash/UPI</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsAddOpen(!isAddOpen);
              setIsTransferOpen(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Money</span>
          </button>
        </div>
      </div>

      {/* Quick Transfer Form (Cash <-> UPI) */}
      {isTransferOpen && (
        <form onSubmit={handleTransferSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="text-xs font-bold text-slate-700">Shift Funds Between Cash and UPI</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">From</label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value as PaymentMode)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
              >
                <option value="UPI">UPI (to Cash)</option>
                <option value="Cash">Cash (to UPI)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="py-2 px-3 rounded-xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Quick Add Money Form */}
      {isAddOpen && (
        <form onSubmit={handleAddSubmit} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
          <div className="text-xs font-bold text-indigo-900">Add Money (Allowance or Top-up)</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Account</label>
              <select
                value={addTarget}
                onChange={(e) => setAddTarget(e.target.value as PaymentMode)}
                className="w-full px-2.5 py-2 rounded-xl border border-indigo-200 font-bold bg-white text-slate-800"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 1000"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-indigo-200 font-bold bg-white text-slate-800"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition cursor-pointer"
              >
                Add to {addTarget}
              </button>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="py-2 px-3 rounded-xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Wallets Breakdown: Cash, UPI, and Total Available */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cash Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <span className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-700">
                <Banknote className="w-4 h-4" />
              </span>
              <span>Cash</span>
            </div>
            <button
              onClick={() => (editingMode === 'Cash' ? handleSaveEdit('Cash') : startEdit('Cash'))}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
              title="Edit cash balance"
            >
              {editingMode === 'Cash' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Edit2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {editingMode === 'Cash' ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-600">₹</span>
              <input
                type="number"
                min="0"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('Cash')}
                autoFocus
                className="w-full px-2 py-1 text-base font-black rounded-lg border border-emerald-500 bg-white focus:outline-none"
              />
            </div>
          ) : (
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {formatINR(cash)}
            </div>
          )}
          <div className="text-[11px] text-slate-500">Physical notes in pocket/wallet</div>
        </div>

        {/* UPI Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <span className="p-1.5 rounded-lg bg-indigo-100/70 text-indigo-700">
                <Smartphone className="w-4 h-4" />
              </span>
              <span>UPI</span>
            </div>
            <button
              onClick={() => (editingMode === 'UPI' ? handleSaveEdit('UPI') : startEdit('UPI'))}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
              title="Edit UPI balance"
            >
              {editingMode === 'UPI' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Edit2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {editingMode === 'UPI' ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-600">₹</span>
              <input
                type="number"
                min="0"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('UPI')}
                autoFocus
                className="w-full px-2 py-1 text-base font-black rounded-lg border border-indigo-500 bg-white focus:outline-none"
              />
            </div>
          ) : (
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {formatINR(upi)}
            </div>
          )}
          <div className="text-[11px] text-slate-500">GPay, PhonePe, Paytm balance</div>
        </div>

        {/* Total Available Card */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Total Available
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
              Cash + UPI
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight">
            {formatINR(totalAvailable)}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium">Ready for payments &amp; expenses</div>
        </div>
      </div>
    </div>
  );
};
