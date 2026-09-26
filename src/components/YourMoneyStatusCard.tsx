import React from 'react';
import { ShieldCheck, AlertTriangle, Flame, Calendar, Clock, ArrowRight } from 'lucide-react';
import { BillReminder } from '../types';
import { formatINR } from '../utils/formatters';

interface YourMoneyStatusCardProps {
  discretionaryRemaining?: number;
  todaySpent?: number;
  bills?: BillReminder[];
  monthlyAllowance?: number;
  fixedBillsCommitted?: number;
  discretionarySpent?: number;
  totalWalletInHand?: number;
  onAddExpense?: () => void;
  onOpenBills?: () => void;
}

export const YourMoneyStatusCard: React.FC<YourMoneyStatusCardProps> = ({
  discretionaryRemaining: propDiscretionaryRemaining,
  todaySpent = 0,
  bills = [],
  monthlyAllowance = 0,
  fixedBillsCommitted = 0,
  discretionarySpent = 0,
  totalWalletInHand,
  onAddExpense,
  onOpenBills,
}) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = Math.max(1, totalDaysInMonth - currentDay + 1);

  // Compute discretionary remaining if not passed directly
  const discretionaryRemaining =
    propDiscretionaryRemaining !== undefined
      ? propDiscretionaryRemaining
      : Math.max(0, monthlyAllowance - fixedBillsCommitted - discretionarySpent);

  // Safe daily spending limit based on remaining days
  const safeDailyBudget = Math.max(0, Math.round(discretionaryRemaining / daysLeft));

  // Spending warning calculation
  const isExceededToday = safeDailyBudget > 0 && todaySpent > safeDailyBudget;
  const isCriticallyLow = discretionaryRemaining <= 0 && daysLeft > 1;
  const isHighSpend = isExceededToday || isCriticallyLow;

  // Next upcoming unpaid fixed bill
  const todayStr = now.toISOString().split('T')[0];
  const safeBills = Array.isArray(bills) ? bills : [];
  const upcomingUnpaidBills = safeBills
    .filter((b) => !b.isPaid)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const nextBill = upcomingUnpaidBills[0];

  return (
    <div id="your-money-status-card" className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Your Money Status</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time daily budget pacing for {now.toLocaleString('default', { month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            <Calendar className="w-3.5 h-3.5" />
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in month
          </span>
        </div>
      </div>

      {/* Warning Banner if spending is too high */}
      {isHighSpend && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-900">
              {isCriticallyLow
                ? 'Pocket Money Budget Exhausted!'
                : `Today's spending (₹${todaySpent}) exceeded your safe limit of ₹${safeDailyBudget}!`}
            </p>
            <p className="text-amber-800/90">
              {isCriticallyLow
                ? 'You have ₹0 spendable allowance remaining for this month. Restrict non-essential expenses.'
                : 'Control further discretionary spending today to keep your budget on track until the next allowance.'}
            </p>
          </div>
        </div>
      )}

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Money Remaining */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Money Remaining
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
            {formatINR(discretionaryRemaining)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            After deducting fixed expenses & daily spends
          </p>
        </div>

        {/* Safe Daily Budget */}
        <div className={`p-4 rounded-2xl border ${isExceededToday ? 'bg-amber-50/50 border-amber-200' : 'bg-red-50/40 border-red-200/70'}`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Safe Daily Budget
            </div>
            {todaySpent > 0 && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${isExceededToday ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                Today: ₹{todaySpent}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-950 mt-1.5 tracking-tight">
            {formatINR(safeDailyBudget)}
            <span className="text-xs font-semibold text-red-600 ml-1">/ day</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Spendable amount per day across {daysLeft} remaining days
          </p>
        </div>

        {/* Upcoming Fixed Payment */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Upcoming Fixed Bill
            </div>
            {nextBill ? (
              <div className="mt-1.5">
                <div className="text-base font-extrabold text-slate-900 truncate">
                  {nextBill.title}
                </div>
                <div className="text-xs font-bold text-red-600 mt-0.5">
                  {formatINR(nextBill.amount)} • Due {nextBill.dueDate}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All fixed bills paid or none added yet</span>
              </div>
            )}
          </div>

          {onOpenBills && (
            <button
              onClick={onOpenBills}
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition cursor-pointer self-start"
            >
              <span>Manage fixed bills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
