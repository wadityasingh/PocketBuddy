import React, { useState } from 'react';
import {
  Bell,
  Plus,
  CheckCircle,
  Calendar,
  AlertTriangle,
  ArrowRight,
  QrCode,
  Smartphone,
  Banknote,
  Clock,
  Check,
} from 'lucide-react';
import { BillReminder, PaymentMode } from '../types';
import { formatINR, formatDate, generateId } from '../utils/formatters';

interface BillRemindersTabProps {
  bills: BillReminder[];
  onAddBill: (bill: BillReminder) => void;
  onPayBill: (billId: string, mode: PaymentMode) => void;
}

export const BillRemindersTab: React.FC<BillRemindersTabProps> = ({
  bills = [],
  onAddBill,
  onPayBill,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [preferredMode, setPreferredMode] = useState<PaymentMode>('UPI');
  const [frequency, setFrequency] = useState<'monthly' | 'one-time' | 'semester'>('monthly');

  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [selectedPayMode, setSelectedPayMode] = useState<PaymentMode>('UPI');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  const safeBills = Array.isArray(bills) ? bills : [];
  const pendingBills = safeBills.filter((b) => b && !b.isPaid);
  const totalPendingAmount = pendingBills.reduce((acc, b) => acc + (b?.amount || 0), 0);

  const filteredBills = safeBills.filter((b) => {
    if (!b) return false;
    if (filterStatus === 'pending' && b.isPaid) return false;
    if (filterStatus === 'paid' && !b.isPaid) return false;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !title.trim()) return;

    const newBill: BillReminder = {
      id: generateId(),
      title: title.trim(),
      amount: parsedAmount,
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      isPaid: false,
      frequency,
      preferredMode,
    };

    onAddBill(newBill);
    setIsAddOpen(false);
    setTitle('');
    setAmount('');
  };

  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div id="bill-reminders-tab" className="space-y-3.5 sm:space-y-6">
      {/* Top Banner: Refined, human-crafted slate-900 card */}
      <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-indigo-300">
              Fixed Commitments
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
            Rent &amp; Student Bill Reminders
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-lg">
            Track PG room rent, hostel mess dues, Wi-Fi broadband, and college fees with real UPI payments.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-800/80 sm:border-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Dues
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 block leading-tight">
              {formatINR(totalPendingAmount)}
            </span>
            <span className="text-[10px] text-slate-400">{pendingBills.length} active bills</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Filter & Metric Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Bills ({safeBills.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending ({pendingBills.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === 'paid'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Paid ({safeBills.filter((b) => b.isPaid).length})
          </button>
        </div>
      </div>

      {/* Add Bill Form Modal / Card */}
      {isAddOpen && (
        <form
          onSubmit={handleAddSubmit}
          className="p-5 sm:p-6 bg-white rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>Add Student Bill / Rent Reminder</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Bill Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. PG Room Rent, Jio 5G, Mess"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 3500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold"
              >
                <option value="monthly">Monthly Recurring</option>
                <option value="semester">Every Semester (6 Months)</option>
                <option value="one-time">One-time Due</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Payment Mode</label>
              <select
                value={preferredMode}
                onChange={(e) => setPreferredMode(e.target.value as PaymentMode)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
              >
                <option value="UPI">Pay via UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Pay via Cash in Hand</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer shadow-xs"
            >
              Save Bill Reminder
            </button>
          </div>
        </form>
      )}

      {/* Bills List */}
      <div className="space-y-3">
        {filteredBills.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No bills found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add your upcoming PG room rent, hostel mess, Wi-Fi, or tuition fees to keep your monthly pocket money protected.
            </p>
          </div>
        ) : (
          filteredBills.map((bill) => {
            const daysLeft = getDaysDiff(bill.dueDate);
            const isOverdue = daysLeft < 0 && !bill.isPaid;
            const isDueSoon = daysLeft >= 0 && daysLeft <= 3 && !bill.isPaid;

            return (
              <div
                key={bill.id}
                className={`p-4 rounded-2xl bg-white border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  bill.isPaid
                    ? 'opacity-65 border-slate-200 bg-slate-50/40'
                    : isOverdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : isDueSoon
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      bill.isPaid
                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 text-sm">{bill.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs mt-1 text-slate-500">
                      <span>Due: {formatDate(bill.dueDate)}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600 capitalize">
                        {bill.frequency}
                      </span>
                      {!bill.isPaid && (
                        <>
                          <span>•</span>
                          <span
                            className={`font-bold text-[11px] flex items-center gap-1 ${
                              isOverdue
                                ? 'text-rose-600'
                                : isDueSoon
                                ? 'text-amber-600'
                                : 'text-slate-600'
                            }`}
                          >
                            {isOverdue ? (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5" /> Overdue by {Math.abs(daysLeft)} days
                              </>
                            ) : daysLeft === 0 ? (
                              'Due Today!'
                            ) : (
                              `In ${daysLeft} days`
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div
                      className={`text-lg font-black tracking-tight ${
                        bill.isPaid ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}
                    >
                      {formatINR(bill.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-end gap-1">
                      {bill.preferredMode === 'UPI' ? (
                        <span className="text-indigo-600">via UPI</span>
                      ) : (
                        <span className="text-emerald-600">via Cash</span>
                      )}
                    </div>
                  </div>

                  {bill.isPaid ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> Paid
                    </span>
                  ) : payingBillId === bill.id ? (
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                      <select
                        value={selectedPayMode}
                        onChange={(e) => setSelectedPayMode(e.target.value as PaymentMode)}
                        className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
                      >
                        <option value="UPI">UPI Wallet</option>
                        <option value="Cash">Cash in Hand</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          onPayBill(bill.id, selectedPayMode);
                          setPayingBillId(null);
                        }}
                        className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayingBillId(null)}
                        className="text-xs text-slate-400 hover:text-slate-700 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPayingBillId(bill.id);
                        setSelectedPayMode(bill.preferredMode);
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Pay &amp; Record</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
