import React, { useState } from 'react';
import { Target, Plus, Laptop, Plane, ShieldCheck, Smartphone, GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';
import { SavingsGoal, PaymentMode } from '../types';
import { formatINR, formatDate, generateId } from '../utils/formatters';

interface GoalsTabProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: SavingsGoal) => void;
  onDepositToGoal: (goalId: string, amount: number, fromWallet: PaymentMode) => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  onAddGoal,
  onDepositToGoal,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<'laptop' | 'phone' | 'trip' | 'fees' | 'other'>('laptop');

  // Deposit modal state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositWallet, setDepositWallet] = useState<PaymentMode>('Bank');

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0 || !title.trim()) return;

    const newGoal: SavingsGoal = {
      id: generateId(),
      title: title.trim(),
      targetAmount: target,
      currentAmount: 0,
      deadline: deadline || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      category,
      icon: category === 'laptop' ? 'Laptop' : category === 'trip' ? 'Plane' : category === 'fees' ? 'GraduationCap' : 'Target',
    };

    onAddGoal(newGoal);
    setIsAddOpen(false);
    setTitle('');
    setTargetAmount('');
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    onDepositToGoal(depositGoalId, amt, depositWallet);
    setDepositGoalId(null);
    setDepositAmount('');
  };

  return (
    <div id="goals-tab" className="space-y-5">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Target className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Savings &amp; Dreams</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Student Goals &amp; Piggy Bank</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Save small amounts from daily canteen and mess money for your semester exam fees, phone, or laptop.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Set New Goal</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Saved So Far</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatINR(totalSaved)}</div>
          <span className="text-[11px] text-slate-400">across all goals</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Dream Target</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatINR(totalTarget)}</div>
          <span className="text-[11px] text-slate-400">cumulative targets</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Overall Progress</span>
          <div className="text-2xl font-black text-red-600 mt-1">
            {Math.round((totalSaved / (totalTarget || 1)) * 100)}%
          </div>
          <span className="text-[11px] text-red-500 font-medium">Consistent daily drops fill the bucket</span>
        </div>
      </div>

      {/* Add Goal Form */}
      {isAddOpen && (
        <form onSubmit={handleAddSubmit} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Create Student Savings Goal</h4>
            <button type="button" onClick={() => setIsAddOpen(false)} className="text-xs text-slate-500">Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Goal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. MacBook Air M2, Goa Trip"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Amount (₹) *</label>
              <input
                type="number"
                required
                placeholder="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Deadline *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
              >
                <option value="laptop">Coding Laptop 💻</option>
                <option value="phone">New Smartphone 📱</option>
                <option value="trip">Vacation / Goa Trip 🏖️</option>
                <option value="fees">Semester Fee Buffer 🎓</option>
                <option value="other">General Goal 🎯</option>
              </select>
            </div>

            <button type="submit" className="text-xs font-bold px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">
              Start Saving
            </button>
          </div>
        </form>
      )}

      {/* Deposit Modal */}
      {depositGoalId && (
        <form onSubmit={handleDepositSubmit} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Deposit Money into Goal
            </span>
            <button type="button" onClick={() => setDepositGoalId(null)} className="text-xs text-slate-500">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Amount to Add (₹) *</label>
              <input
                type="number"
                required
                autoFocus
                placeholder="e.g. 500"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full text-sm font-bold bg-white border border-emerald-300 rounded-lg p-2 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Deduct From Wallet</label>
              <select
                value={depositWallet}
                onChange={(e) => setDepositWallet(e.target.value as PaymentMode)}
                className="w-full text-xs font-bold bg-white border border-emerald-300 rounded-lg p-2"
              >
                <option value="Bank">Bank Account</option>
                <option value="UPI">UPI App</option>
                <option value="Cash">Cash in Hand</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm">
              Confirm Deposit
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    {goal.category === 'laptop' ? <Laptop className="w-5 h-5" /> : goal.category === 'trip' ? <Plane className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                    {progress}%
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-3">{goal.title}</h3>
                <div className="text-xs text-slate-500 mt-0.5">Target deadline: {formatDate(goal.deadline)}</div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-slate-600">Saved: <strong className="text-slate-900 font-extrabold">{formatINR(goal.currentAmount)}</strong></span>
                    <span className="text-slate-400">of {formatINR(goal.targetAmount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {remaining > 0 ? `₹${remaining} left` : 'Target Achieved! 🎉'}
                </span>
                <button
                  onClick={() => setDepositGoalId(goal.id)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Deposit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
