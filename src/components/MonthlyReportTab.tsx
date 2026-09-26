import React from 'react';
import { PieChart, TrendingDown, ArrowDownRight, Coffee, CreditCard, Banknote, Landmark } from 'lucide-react';
import { Transaction } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface MonthlyReportTabProps {
  transactions: Transaction[];
  monthlyPocketMoney: number;
}

export const MonthlyReportTab: React.FC<MonthlyReportTabProps> = ({
  transactions = [],
  monthlyPocketMoney = 0,
}) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const expenseTransactions = safeTransactions.filter((t) => t && t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + (t?.amount || 0), 0);

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Payment Mode breakdown
  const modeTotals = { Cash: 0, UPI: 0, Bank: 0 };
  expenseTransactions.forEach((t) => {
    if (modeTotals[t.paymentMode] !== undefined) {
      modeTotals[t.paymentMode] += t.amount;
    }
  });

  // Daily spend in current month (group by date)
  const dailySpend: Record<string, number> = {};
  expenseTransactions.forEach((t) => {
    dailySpend[t.date] = (dailySpend[t.date] || 0) + t.amount;
  });

  const dailyEntries = Object.entries(dailySpend)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7); // Last 7 days with spend

  const maxDaily = Math.max(...Object.values(dailySpend), 1);

  // Top expense
  const maxExpenseItem = expenseTransactions.reduce(
    (max, t) => (t.amount > (max?.amount || 0) ? t : max),
    null as Transaction | null
  );

  // Canteen leak: "Canteen & Chai"
  const canteenTotal = categoryTotals['Canteen & Chai'] || 0;

  return (
    <div id="monthly-report-tab" className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-400">
              <PieChart className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-300">Monthly Spending Audit</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">&quot;Where Did My Money Go?&quot; Report</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Clear visual breakdown of your pocket money burn across canteen chai, PG rent, mess, auto fares, and SIM recharge.
          </p>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent This Month</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{formatINR(totalExpense)}</div>
        </div>
      </div>

      {/* Key Takeaways Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Coffee className="w-4 h-4 text-amber-600" />
            <span>Canteen &amp; Chai Leak</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(canteenTotal)}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {totalExpense > 0 ? Math.round((canteenTotal / totalExpense) * 100) : 0}% of all monthly expenses
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span>Daily Spending Average</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {formatINR(Math.round(totalExpense / Math.max(1, new Date().getDate())))}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">per day in current month</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
            <span>Single Largest Expense</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {maxExpenseItem ? formatINR(maxExpenseItem.amount) : '₹0'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {maxExpenseItem ? maxExpenseItem.title : 'None yet'}
          </p>
        </div>
      </div>

      {/* Two column layout: Category Breakdown + Mode Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Expenses by Category</span>
            <span className="text-xs font-normal text-slate-500">{sortedCategories.length} categories</span>
          </h3>

          <div className="space-y-3">
            {sortedCategories.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">{cat.category}</span>
                  <span className="font-bold text-slate-900">
                    {formatINR(cat.amount)} <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Modes Split */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Payment Modes (Cash vs UPI vs Bank)</h3>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-violet-50 rounded-xl border border-violet-200">
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center mx-auto mb-1">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-violet-900 block">UPI</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">{formatINR(modeTotals.UPI)}</div>
              <span className="text-[10px] text-slate-500">
                {totalExpense > 0 ? Math.round((modeTotals.UPI / totalExpense) * 100) : 0}%
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
                <Banknote className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-900 block">Cash</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">{formatINR(modeTotals.Cash)}</div>
              <span className="text-[10px] text-slate-500">
                {totalExpense > 0 ? Math.round((modeTotals.Cash / totalExpense) * 100) : 0}%
              </span>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-1">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-sky-900 block">Bank</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">{formatINR(modeTotals.Bank)}</div>
              <span className="text-[10px] text-slate-500">
                {totalExpense > 0 ? Math.round((modeTotals.Bank / totalExpense) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Daily Trend Sparklines */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
              Recent Daily Spending:
            </span>
            <div className="space-y-2">
              {dailyEntries.map(([date, amt]) => {
                const barWidth = Math.round((amt / maxDaily) * 100);
                return (
                  <div key={date} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-slate-500 flex-shrink-0 text-[11px] font-medium">{formatDate(date).split(',')[0]}</span>
                    <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-red-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-bold text-slate-800 text-[11px]">{formatINR(amt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
