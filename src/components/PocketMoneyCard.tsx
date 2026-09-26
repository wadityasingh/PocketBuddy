import React, { useState } from 'react';
import { Wallet, AlertTriangle, CheckCircle2, TrendingUp, Calendar, Edit3 } from 'lucide-react';
import { formatINR, calculateRemainingDaysThisMonth } from '../utils/formatters';

interface PocketMoneyCardProps {
  monthlyPocketMoney?: number;
  monthlyBudget?: number;
  spentThisMonth?: number;
  totalSpent?: number;
  todaySpent?: number;
  onUpdateAllowance?: (newAllowance: number) => void;
  onUpdateBudget?: (newBudget: number) => void;
}

export const PocketMoneyCard: React.FC<PocketMoneyCardProps> = ({
  monthlyPocketMoney,
  monthlyBudget,
  spentThisMonth,
  totalSpent,
  todaySpent = 0,
  onUpdateAllowance,
  onUpdateBudget,
}) => {
  const allowance = monthlyPocketMoney ?? monthlyBudget ?? 10000;
  const spent = spentThisMonth ?? totalSpent ?? 0;
  const updateBudget = onUpdateAllowance ?? onUpdateBudget ?? (() => {});

  const [isEditing, setIsEditing] = useState(false);
  const [tempAllowance, setTempAllowance] = useState(allowance.toString());

  React.useEffect(() => {
    setTempAllowance(allowance.toString());
  }, [allowance]);

  const remainingPocketMoney = Math.max(0, allowance - spent);
  const daysLeft = calculateRemainingDaysThisMonth();
  const safeDailyLimit = Math.max(0, Math.round(remainingPocketMoney / daysLeft));
  const safeWeeklyLimit = safeDailyLimit * 7;

  const spentPercentage = Math.min(100, Math.round((spent / (allowance || 1)) * 100));
  const isOverDailyLimit = todaySpent > safeDailyLimit && safeDailyLimit > 0;
  const isCloseToDailyLimit = todaySpent > safeDailyLimit * 0.8 && !isOverDailyLimit;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempAllowance);
    if (!isNaN(val) && val > 0) {
      updateBudget(val);
      setIsEditing(false);
    }
  };

  return (
    <div
      id="pocket-money-card"
      className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden border border-slate-800"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-red-600/20 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-red-400">Pocket Money Mode</span>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-red-500/20 text-red-300 rounded-full border border-red-400/20">
                {daysLeft} days left
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Monthly Student Allowance</h2>
          </div>
        </div>

        <button
          id="edit-pocket-money-btn"
          onClick={() => {
            setTempAllowance(allowance.toString());
            setIsEditing(!isEditing);
          }}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-slate-300 hover:text-white"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel' : 'Edit Budget'}</span>
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="mb-4 bg-zinc-900/90 p-3 rounded-xl border border-red-500/30 relative z-10">
          <label className="text-xs text-slate-300 mb-1 block">Set Monthly Pocket Money (₹)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={tempAllowance}
              onChange={(e) => setTempAllowance(e.target.value)}
              className="bg-black/60 border border-zinc-700 focus:border-red-500 rounded-lg px-3 py-1.5 text-white font-bold text-base w-full focus:outline-none focus:ring-2 focus:ring-red-500/40"
              placeholder="e.g. 10000"
              autoFocus
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition"
            >
              Save
            </button>
          </div>
        </form>
      ) : null}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10 mb-4">
        {/* Remaining Pocket Money */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
          <div className="text-xs text-slate-300 font-medium">Remaining to Spend</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
            {formatINR(remainingPocketMoney)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>of {formatINR(allowance)} received</span>
          </div>
        </div>

        {/* Dynamic Safe Daily Spending Limit */}
        <div className={`backdrop-blur-sm rounded-xl p-3.5 border transition ${
          isOverDailyLimit 
            ? 'bg-rose-500/20 border-rose-500/40' 
            : isCloseToDailyLimit 
            ? 'bg-amber-500/20 border-amber-500/40' 
            : 'bg-emerald-500/15 border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-200 font-medium">Safe Daily Spending Cap</span>
            {isOverDailyLimit ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 uppercase px-1.5 py-0.5 bg-rose-500/30 rounded">
                <AlertTriangle className="w-3 h-3" /> Overspent
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 uppercase px-1.5 py-0.5 bg-emerald-500/30 rounded">
                <CheckCircle2 className="w-3 h-3" /> Safe
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
            {formatINR(safeDailyLimit)}
            <span className="text-xs font-normal text-slate-300 ml-1">/ day</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Weekly safe budget: <span className="font-semibold text-white">{formatINR(safeWeeklyLimit)}</span>
          </div>
        </div>

        {/* Today's Spend Monitor */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
          <div className="text-xs text-slate-300 font-medium">Spent Today</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
            {formatINR(todaySpent)}
          </div>
          <div className="text-[11px] mt-1 text-slate-300">
            {isOverDailyLimit ? (
              <span className="text-rose-300 font-semibold">
                ⚠️ ₹{todaySpent - safeDailyLimit} above daily safe cap!
              </span>
            ) : (
              <span className="text-emerald-300 font-medium">
                ₹{Math.max(0, safeDailyLimit - todaySpent)} room left today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pocket Money Burn Progress Bar */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
          <span>Month Budget Spent: <strong className="text-white">{formatINR(spent)}</strong> ({spentPercentage}%)</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Next pocket money on 1st</span>
          </span>
        </div>
        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              spentPercentage > 85
                ? 'bg-rose-500'
                : spentPercentage > 65
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${spentPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
