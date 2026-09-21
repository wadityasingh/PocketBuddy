import React, { useState, useEffect } from 'react';
import { Edit3, Check, TrendingDown, Wallet, ArrowDownRight, Layers } from 'lucide-react';
import { WalletBalances } from '../types';
import { formatINR } from '../utils/formatters';

interface MonthlyAllowanceHeroProps {
  allowance: number;
  fixedCommitted: number;
  variableSpent: number;
  wallets: WalletBalances;
  onUpdateAllowance: (newAllowance: number) => void;
  onUpdateWallets: (wallets: WalletBalances) => void;
}

export const MonthlyAllowanceHero: React.FC<MonthlyAllowanceHeroProps> = ({
  allowance,
  fixedCommitted,
  variableSpent,
  wallets,
  onUpdateAllowance,
  onUpdateWallets,
}) => {
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [tempAllowance, setTempAllowance] = useState(allowance.toString());

  const [isEditingWallets, setIsEditingWallets] = useState(false);
  const [tempCash, setTempCash] = useState((wallets?.cash ?? 0).toString());
  const [tempUpi, setTempUpi] = useState((wallets?.upi ?? 0).toString());

  useEffect(() => {
    setTempAllowance(allowance.toString());
  }, [allowance]);

  useEffect(() => {
    setTempCash((wallets?.cash ?? 0).toString());
    setTempUpi((wallets?.upi ?? 0).toString());
  }, [wallets]);

  const handleSaveAllowance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempAllowance);
    if (!isNaN(val) && val >= 0) {
      onUpdateAllowance(val);
      setIsEditingAllowance(false);
    }
  };

  const handleSaveWallets = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(tempCash) || 0;
    const u = parseFloat(tempUpi) || 0;
    onUpdateWallets({ cash: c, upi: u });
    setIsEditingWallets(false);
  };

  const totalAvailable = (wallets?.cash ?? 0) + (wallets?.upi ?? 0);
  const remainingAllowance = Math.max(0, allowance - variableSpent);
  const spentPercentage = allowance > 0 ? Math.min(100, Math.round((variableSpent / allowance) * 100)) : 0;

  return (
    <div id="monthly-allowance-hero" className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
      {/* Top Section: Monthly Allowance & Total Available In Hand */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Monthly Student Allowance
          </div>
          <div className="flex items-center gap-3 mt-1">
            {isEditingAllowance ? (
              <form onSubmit={handleSaveAllowance} className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">₹</span>
                <input
                  type="number"
                  min="0"
                  value={tempAllowance}
                  onChange={(e) => setTempAllowance(e.target.value)}
                  className="w-36 text-2xl font-black px-2 py-0.5 rounded-lg border-2 border-indigo-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold transition cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAllowance(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  {formatINR(allowance)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingAllowance(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Change monthly allowance amount"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monthly allowance or stipend for personal expenses
          </p>
        </div>

        {/* Total Available In Hand (Cash + UPI) */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Available
            </div>
            <div className="text-xl font-black text-slate-900">{formatINR(totalAvailable)}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingWallets(!isEditingWallets)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 ml-2 cursor-pointer"
          >
            {isEditingWallets ? 'Close' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Quick Wallet Edit Panel */}
      {isEditingWallets && (
        <form onSubmit={handleSaveWallets} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Update Balances</h4>
            <span className="text-xs text-slate-400">Cash and UPI</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Cash (₹)</label>
              <input
                type="number"
                min="0"
                value={tempCash}
                onChange={(e) => setTempCash(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-white border border-slate-300"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">UPI (₹)</label>
              <input
                type="number"
                min="0"
                value={tempUpi}
                onChange={(e) => setTempUpi(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-white border border-slate-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingWallets(false)}
              className="px-3 py-1.5 text-xs text-slate-500 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Save Balances
            </button>
          </div>
        </form>
      )}

      {/* 4 Core Metrics: Monthly Allowance, Total Available, Spent This Month, Remaining */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Monthly Allowance */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Monthly Allowance
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {formatINR(allowance)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Budget for this month</p>
        </div>

        {/* Total Available */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
            Total Available
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-950 mt-1">
            {formatINR(totalAvailable)}
          </div>
          <p className="text-[10px] text-indigo-600 mt-0.5">Cash + UPI in hand</p>
        </div>

        {/* Spent This Month */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
            <span>Spent This Month</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-900 mt-1">
            {formatINR(variableSpent)}
          </div>
          <p className="text-[10px] text-rose-700 mt-0.5">Personal daily expenses</p>
        </div>

        {/* Remaining Allowance */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Remaining</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-900 mt-1">
            {formatINR(remainingAllowance)}
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Allowance minus spent</p>
        </div>
      </div>

      {/* Allowance Spending Progress Bar */}
      {allowance > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Allowance usage: <strong>{formatINR(variableSpent)}</strong> spent of{' '}
              <strong>{formatINR(allowance)}</strong>
            </span>
            <span className="font-bold text-slate-800">{spentPercentage}% spent</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${spentPercentage}%` }}
              className={`h-full transition-all duration-300 ${
                spentPercentage > 85
                  ? 'bg-rose-500'
                  : spentPercentage > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
