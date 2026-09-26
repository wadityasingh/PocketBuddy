import React from 'react';
import { ShieldCheck, Calendar, Zap, Bell } from 'lucide-react';
import { BillReminder } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface MoneyStatusCardProps {
  moneyRemaining: number;
  daysLeft: number;
  safeDailySpending: number;
  nextBill: BillReminder | null;
}

export const MoneyStatusCard: React.FC<MoneyStatusCardProps> = ({
  moneyRemaining,
  daysLeft,
  safeDailySpending,
  nextBill,
}) => {
  return (
    <div id="money-status-card" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Money Status</h3>
            <p className="text-[11px] text-slate-500 font-medium">Daily spending guide for this month</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Money Remaining */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Money Remaining
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {formatINR(moneyRemaining)}
          </div>
        </div>

        {/* Days Left */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Days Left</span>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {daysLeft} days
          </div>
        </div>

        {/* Safe Daily Spending */}
        <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-200/80">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-red-600" />
            <span>Safe Daily Spending</span>
          </div>
          <div className="text-base sm:text-lg font-black text-red-950 mt-1">
            {formatINR(safeDailySpending)} <span className="text-[10px] font-bold text-red-600">/day</span>
          </div>
        </div>

        {/* Next Bill */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Bell className="w-3 h-3 text-amber-500" />
            <span>Next Bill</span>
          </div>
          {nextBill ? (
            <div className="mt-1">
              <div className="text-xs font-bold text-slate-900 truncate" title={nextBill.title}>
                {nextBill.title}
              </div>
              <div className="text-[11px] font-extrabold text-amber-700">
                {formatINR(nextBill.amount)}{' '}
                <span className="font-normal text-slate-400 text-[10px]">
                  ({formatDate(nextBill.dueDate)})
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-400 mt-1">None pending</div>
          )}
        </div>
      </div>
    </div>
  );
};
