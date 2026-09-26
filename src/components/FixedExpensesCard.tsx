import React, { useState } from 'react';
import { Home, Calendar, Plus, CheckCircle2, Clock, Trash2, Zap, Wifi, Bus, CreditCard } from 'lucide-react';
import { BillReminder, PaymentMode } from '../types';
import { formatINR, generateId } from '../utils/formatters';

interface FixedExpensesCardProps {
  bills: BillReminder[];
  onAddBill: (bill: BillReminder) => void;
  onPayBill: (billId: string, mode: PaymentMode) => void;
  onDeleteBill?: (billId: string) => void;
}

export const FixedExpensesCard: React.FC<FixedExpensesCardProps> = ({
  bills = [],
  onAddBill,
  onPayBill,
  onDeleteBill,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [category, setCategory] = useState('Room Rent');
  const [payMode, setPayMode] = useState<PaymentMode>('UPI');

  const safeBills = Array.isArray(bills) ? bills : [];
  const totalFixedAmount = safeBills.reduce((sum, b) => sum + (b?.amount || 0), 0);
  const paidFixedAmount = safeBills.filter((b) => b && b.isPaid).reduce((sum, b) => sum + (b?.amount || 0), 0);
  const pendingFixedAmount = totalFixedAmount - paidFixedAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    // Generate ISO date with the chosen day of month
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth(), parseInt(dayOfMonth) || 5);
    const dateStr = targetDate.toISOString().split('T')[0];

    const newBill: BillReminder = {
      id: generateId(),
      title: title.trim(),
      amount: numAmount,
      dueDate: dateStr,
      category,
      isPaid: false,
      frequency: 'monthly',
      preferredMode: payMode,
    };

    onAddBill(newBill);
    setTitle('');
    setAmount('');
    setIsAdding(false);
  };

  const getCategoryIcon = (cat: string, name: string) => {
    const text = (cat + ' ' + name).toLowerCase();
    if (text.includes('rent') || text.includes('room') || text.includes('hostel') || text.includes('pg')) {
      return <Home className="w-4 h-4 text-amber-600" />;
    }
    if (text.includes('kiraya') || text.includes('bus') || text.includes('metro') || text.includes('auto') || text.includes('travel')) {
      return <Bus className="w-4 h-4 text-emerald-600" />;
    }
    if (text.includes('wifi') || text.includes('sim') || text.includes('recharge') || text.includes('net')) {
      return <Wifi className="w-4 h-4 text-blue-600" />;
    }
    if (text.includes('electric') || text.includes('bill') || text.includes('power') || text.includes('water')) {
      return <Zap className="w-4 h-4 text-yellow-600" />;
    }
    return <CreditCard className="w-4 h-4 text-red-600" />;
  };

  const formatDueText = (dueDateStr: string) => {
    try {
      const parts = dueDateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        return `${day}${getOrdinalSuffix(day)} of every month`;
      }
      return dueDateStr;
    } catch {
      return dueDateStr;
    }
  };

  const getOrdinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Home className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">Fixed Monthly Expenses</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Room rent, kiraya, Wi-Fi &amp; electricity bills deducted from your allowance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fixed</div>
            <div className="text-base font-extrabold text-slate-900">{formatINR(totalFixedAmount)}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fixed</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Fixed Monthly Commitment</h4>
            <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Expense Name (e.g. Room Rent, Bus Pass, Wi-Fi)</label>
              <input
                type="text"
                placeholder="e.g. Room Rent / Kiraya"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Monthly Amount (₹)</label>
              <input
                type="number"
                placeholder="3500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Due Day of Month</label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {[1, 2, 3, 5, 7, 10, 15, 20, 25, 28, 30].map((d) => (
                  <option key={d} value={d}>
                    Every {d}{getOrdinalSuffix(d)} of the month
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="Room Rent">Room / PG Rent</option>
                <option value="Kiraya & Travel">Bus / Metro Commute</option>
                <option value="Electricity & Bill">Electricity &amp; Water Bill</option>
                <option value="Recharge & Wi-Fi">Wi-Fi / Mobile Recharge</option>
                <option value="Mess & Food">Hostel Mess Fee</option>
                <option value="Tuition / Coaching">Coaching / Books</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Default Payment Mode</label>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs shadow-red-600/20 cursor-pointer"
          >
            Save Fixed Expense
          </button>
        </form>
      )}

      {/* List of Fixed Commitments */}
      {bills.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          No fixed monthly commitments added yet. Add your room rent, kiraya, or Wi-Fi bill above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                bill.isPaid
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  bill.isPaid ? 'bg-emerald-100' : 'bg-white border border-slate-200'
                }`}>
                  {getCategoryIcon(bill.category, bill.title)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{bill.title}</span>
                    {bill.isPaid ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Paid
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        Due
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDueText(bill.dueDate)}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">{bill.preferredMode}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900">{formatINR(bill.amount)}</div>
                </div>

                {!bill.isPaid ? (
                  <button
                    type="button"
                    onClick={() => onPayBill(bill.id, bill.preferredMode)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Mark this fixed expense as paid"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Pay</span>
                  </button>
                ) : (
                  <div className="text-emerald-600" title="Paid this month">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}

                {onDeleteBill && (
                  <button
                    type="button"
                    onClick={() => onDeleteBill(bill.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                    title="Delete fixed commitment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary note */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>
            Paid so far: <strong className="text-slate-900">{formatINR(paidFixedAmount)}</strong> • Pending to pay: <strong className="text-rose-600">{formatINR(pendingFixedAmount)}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          This fixed amount is automatically reserved from your monthly allowance.
        </span>
      </div>
    </div>
  );
};
