import React, { useState } from 'react';
import { Home, Users, Plus, MessageCircle, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { RoomExpense, Roommate } from '../types';
import { formatINR, formatDate, generateId } from '../utils/formatters';

interface RoomSplitTabProps {
  roomExpenses: RoomExpense[];
  roommates: Roommate[];
  onAddRoomExpense: (expense: RoomExpense) => void;
  onSettleShare: (expenseId: string, participantName: string) => void;
  onAddRoommate: (name: string, upiId?: string, phone?: string) => void;
}

export const RoomSplitTab: React.FC<RoomSplitTabProps> = ({
  roomExpenses,
  roommates,
  onAddRoomExpense,
  onSettleShare,
  onAddRoommate,
}) => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddRoommateOpen, setIsAddRoommateOpen] = useState(false);

  // New Roommate form
  const [newRoommateName, setNewRoommateName] = useState('');
  const [newRoommateUpi, setNewRoommateUpi] = useState('');
  const [newRoommatePhone, setNewRoommatePhone] = useState('');

  // New Expense form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('You');
  const [category, setCategory] = useState('Rent');
  const [notes, setNotes] = useState('');

  // Calculate net balances: for each person, how much they paid vs how much their share was
  const netBalances: Record<string, { paidTotal: number; shareTotal: number; net: number }> = {};
  roommates.forEach((r) => {
    netBalances[r.name] = { paidTotal: 0, shareTotal: 0, net: 0 };
  });

  roomExpenses.forEach((exp) => {
    if (!netBalances[exp.paidBy]) {
      netBalances[exp.paidBy] = { paidTotal: 0, shareTotal: 0, net: 0 };
    }
    netBalances[exp.paidBy].paidTotal += exp.totalAmount;

    exp.participants.forEach((p) => {
      if (!netBalances[p.name]) {
        netBalances[p.name] = { paidTotal: 0, shareTotal: 0, net: 0 };
      }
      netBalances[p.name].shareTotal += p.share;
    });
  });

  Object.keys(netBalances).forEach((name) => {
    netBalances[name].net = netBalances[name].paidTotal - netBalances[name].shareTotal;
  });

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0 || !title.trim()) return;

    const sharePerPerson = Math.round((total / roommates.length) * 100) / 100;
    const participants = roommates.map((r) => ({
      name: r.name,
      share: sharePerPerson,
      hasPaid: r.name === paidBy,
    }));

    const newExp: RoomExpense = {
      id: generateId(),
      title: title.trim(),
      totalAmount: total,
      paidBy,
      splitType: 'equal',
      participants,
      date: new Date().toISOString().split('T')[0],
      category,
      notes: notes.trim() || undefined,
    };

    onAddRoomExpense(newExp);
    setIsAddExpenseOpen(false);
    setTitle('');
    setAmount('');
    setNotes('');
  };

  const handleAddRoommateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoommateName.trim()) return;
    onAddRoommate(newRoommateName.trim(), newRoommateUpi.trim(), newRoommatePhone.trim());
    setNewRoommateName('');
    setNewRoommateUpi('');
    setNewRoommatePhone('');
    setIsAddRoommateOpen(false);
  };

  const generateWhatsAppReminder = (participantName: string, expenseTitle: string, shareAmount: number) => {
    const roommate = roommates.find((r) => r.name === participantName);
    const phone = roommate?.phone ? roommate.phone.replace(/\D/g, '') : '';
    const myUpi = 'student@okhdfcbank';
    const text = encodeURIComponent(
      `Bhai ${participantName}! Room expense "${expenseTitle}" ka ₹${shareAmount} pending hai. GPay/PhonePe kar de: ${myUpi} 👍`
    );
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div id="room-split-tab" className="space-y-5">
      {/* Top Banner & Action */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Home className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Shared Flat &amp; PG Expenses</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Room &amp; Flat Expense Split</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Split PG rent, Wi-Fi, electricity, water bottles, and shared groceries fairly among flatmates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setIsAddRoommateOpen(!isAddRoommateOpen)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Roommates ({roommates.length})</span>
          </button>
          <button
            id="add-room-bill-btn"
            onClick={() => setIsAddExpenseOpen(!isAddExpenseOpen)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Split New Bill</span>
          </button>
        </div>
      </div>

      {/* Add Roommate Modal / Panel */}
      {isAddRoommateOpen && (
        <form onSubmit={handleAddRoommateSubmit} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Roommate / Flatmate</h4>
            <button type="button" onClick={() => setIsAddRoommateOpen(false)} className="text-xs text-slate-500">Close</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              placeholder="Name (e.g. Mohit, Priya)"
              value={newRoommateName}
              onChange={(e) => setNewRoommateName(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
            />
            <input
              type="text"
              placeholder="UPI ID (e.g. mohit@oksbi)"
              value={newRoommateUpi}
              onChange={(e) => setNewRoommateUpi(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
            />
            <input
              type="tel"
              placeholder="Phone (10 digits)"
              value={newRoommatePhone}
              onChange={(e) => setNewRoommatePhone(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="text-xs font-bold px-4 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Save Roommate
            </button>
          </div>
        </form>
      )}

      {/* Add Bill Form */}
      {isAddExpenseOpen && (
        <form onSubmit={handleAddExpenseSubmit} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Add Shared Room Bill</h4>
            <button type="button" onClick={() => setIsAddExpenseOpen(false)} className="text-xs text-slate-500">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Bill Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Electricity, Wi-Fi, Water Can"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Total Bill (₹) *</label>
              <input
                type="number"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Who Paid? *</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold"
              >
                {roommates.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium"
              >
                <option value="Rent">Room/Flat Rent 🏠</option>
                <option value="Electricity">Electricity Bill ⚡</option>
                <option value="Internet">Wi-Fi &amp; Fibernet 📶</option>
                <option value="Groceries">Drinking Water &amp; Groceries 🛒</option>
                <option value="Maid/Cook">Maid / Cook / Cleaning 🧹</option>
                <option value="Other">Other 📦</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Split equally among all {roommates.length} roommates ({amount ? formatINR(parseFloat(amount) / roommates.length) : '₹0'}/person)
            </span>
            <button type="submit" className="text-xs font-bold px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">
              Split Bill Now
            </button>
          </div>
        </form>
      )}

      {/* Room Net Balance Summary Cards */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Roommates Ledger</h3>
          <span className="text-[11px] text-slate-600">Net balances automatically calculated</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {roommates.map((r) => {
            const data = netBalances[r.name] || { net: 0, paidTotal: 0, shareTotal: 0 };
            const isOwed = data.net > 0; // they paid more than their share
            const owes = data.net < 0; // they owe money
            return (
              <div key={r.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs truncate">{r.name}</span>
                  {r.name === 'You' && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">You</span>
                  )}
                </div>
                <div className="mt-1.5">
                  <div className={`text-base font-black ${isOwed ? 'text-emerald-600' : owes ? 'text-rose-600' : 'text-slate-500'}`}>
                    {isOwed ? `+${formatINR(data.net)}` : owes ? `-${formatINR(Math.abs(data.net))}` : 'All Settled'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isOwed ? 'Gets back' : owes ? 'Owes to room' : 'Clean sheet'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared Bills List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Recent Room Expenses</h3>
        {roomExpenses.map((exp) => (
          <div key={exp.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{exp.title}</span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    {exp.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paid by <strong className="text-slate-800">{exp.paidBy}</strong> on {formatDate(exp.date)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold text-slate-900">{formatINR(exp.totalAmount)}</div>
                <div className="text-[11px] text-slate-500">
                  {formatINR(exp.participants[0]?.share || 0)} / person
                </div>
              </div>
            </div>

            {/* Participants Status Chips */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Roommate Settlement:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {exp.participants.map((p) => {
                  return (
                    <div
                      key={p.name}
                      className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                        p.hasPaid
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div>
                        <div className="font-bold truncate">{p.name}</div>
                        <div className="text-[11px] font-semibold">{formatINR(p.share)}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        {p.hasPaid ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Paid
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => onSettleShare(exp.id, p.name)}
                              className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-bold text-[10px] transition"
                              title="Mark as paid"
                            >
                              Settle
                            </button>
                            {p.name !== 'You' && (
                              <button
                                onClick={() => generateWhatsAppReminder(p.name, exp.title, p.share)}
                                className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-200/50 rounded-md transition"
                                title="Send WhatsApp reminder"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
