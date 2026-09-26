import React from 'react';
import { ShieldCheck, AlertTriangle, TrendingDown, Lightbulb, Compass } from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface MonthEndPacingCardProps {
  allowance: number;
  fixedCommitted: number;
  variableSpent: number;
  remainingInHand?: number;
  discretionaryRemaining?: number;
  todaySpent: number;
}

export const MonthEndPacingCard: React.FC<MonthEndPacingCardProps> = ({
  allowance,
  fixedCommitted,
  variableSpent,
  discretionaryRemaining: propDiscretionaryRemaining,
  todaySpent,
}) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = Math.max(1, totalDaysInMonth - currentDay + 1);

  // Compute remaining discretionary pool safely
  const discretionaryRemaining =
    propDiscretionaryRemaining !== undefined
      ? propDiscretionaryRemaining
      : Math.max(0, allowance - fixedCommitted - variableSpent);

  // Safe daily spending cap to comfortably survive till month end
  const safeDailyBudget = Math.max(0, Math.round(discretionaryRemaining / daysLeft));

  // Current burn rate & pacing comparison
  const daysPassed = Math.max(1, currentDay);
  const monthProgressPct = Math.round((currentDay / totalDaysInMonth) * 100);
  const spendPool = Math.max(1, allowance - fixedCommitted);
  const budgetUsedPct = Math.min(100, Math.round((variableSpent / spendPool) * 100));

  // Status calculation
  const isHealthy = todaySpent <= safeDailyBudget && budgetUsedPct <= monthProgressPct + 5;
  const isTight = !isHealthy && budgetUsedPct <= monthProgressPct + 20;
  const isCritical = budgetUsedPct > monthProgressPct + 20 || (discretionaryRemaining <= 0 && daysLeft > 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Compass className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Month-End Spending Pacing</h3>
            <p className="text-xs text-slate-500">Keep daily kharcha on track till {now.toLocaleString('default', { month: 'short' })} 30th/31st</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Day {currentDay} of {totalDaysInMonth} • {daysLeft}d left
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Safe Daily Cap */}
        <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/80">
          <div className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
            Safe Daily Limit
          </div>
          <div className="text-2xl font-black text-red-700 mt-1">
            {formatINR(safeDailyBudget)}
            <span className="text-xs font-semibold text-red-600"> / day</span>
          </div>
          <p className="text-[11px] text-red-800/80 mt-1">
            Spend under this cap to make allowance last full month.
          </p>
        </div>

        {/* Today's Spend */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Spent Today
          </div>
          <div className={`text-2xl font-black mt-1 ${todaySpent > safeDailyBudget ? 'text-amber-600' : 'text-slate-900'}`}>
            {formatINR(todaySpent)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {todaySpent === 0
              ? 'No expenses recorded yet today.'
              : todaySpent <= safeDailyBudget
              ? `Healthy! ${formatINR(safeDailyBudget - todaySpent)} room left today.`
              : `Alert: ${formatINR(todaySpent - safeDailyBudget)} above today's safe cap.`}
          </p>
        </div>

        {/* Discretionary Remaining */}
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
          <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
            Free Spending Pool
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatINR(discretionaryRemaining)}
          </div>
          <p className="text-[11px] text-emerald-800/80 mt-1">
            After reserving {formatINR(fixedCommitted)} for room rent &amp; bills.
          </p>
        </div>
      </div>

      {/* Month Timeline & Spending Gauge */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            Month Progress: <strong>{monthProgressPct}%</strong> of days passed
          </span>
          <span className={`font-bold ${budgetUsedPct > monthProgressPct ? 'text-amber-700' : 'text-emerald-700'}`}>
            Budget Burn: {budgetUsedPct}% used
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
          {/* Days passed indicator marker */}
          <div
            style={{ width: `${budgetUsedPct}%` }}
            className={`h-full transition-all duration-300 ${
              isCritical ? 'bg-rose-500' : isTight ? 'bg-amber-500' : 'bg-red-600'
            }`}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Day 1</span>
          <span>Day {currentDay} (Now)</span>
          <span>Day {totalDaysInMonth}</span>
        </div>
      </div>

      {/* Pacing Advice Banner */}
      <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
        isCritical
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : isTight
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}>
        <div className="shrink-0 mt-0.5">
          {isCritical ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : isTight ? (
            <TrendingDown className="w-4 h-4 text-amber-600" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          )}
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">
            {isCritical
              ? 'High Burn Rate: Slow Down'
              : isTight
              ? 'Moderate Pace: Watch Daily Discretionary Expenses'
              : 'Ideal Pace: On Track Till Month-End'}
          </h4>
          <p className="text-xs mt-0.5 leading-relaxed">
            {isCritical
              ? `You have used ${budgetUsedPct}% of your spendable allowance while only ${monthProgressPct}% of the month has passed. Pause non-essential food deliveries and cab rides to avoid running out before the 30th.`
              : isTight
              ? `You are spending close to your daily limit of ₹${safeDailyBudget}. Maintain control on canteen chai and snacks so you have sufficient buffer next week.`
              : `Your spending is comfortably aligned with your calendar days! At ₹${safeDailyBudget}/day, your allowance will smoothly last until next month's pocket money.`}
          </p>
        </div>
      </div>
    </div>
  );
};
