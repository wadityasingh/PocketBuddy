import React, { useState } from 'react';
import { UtensilsCrossed, Check, X, Plus, DollarSign, Coffee, Calendar, Info } from 'lucide-react';
import { DailyMealEntry, MessConfig } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface MessTrackerTabProps {
  meals: DailyMealEntry[];
  messConfig: MessConfig;
  onToggleMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner') => void;
  onAddGuestMeal: (date: string) => void;
  onUpdateConfig: (config: MessConfig) => void;
}

export const MessTrackerTab: React.FC<MessTrackerTabProps> = ({
  meals,
  messConfig,
  onToggleMeal,
  onAddGuestMeal,
  onUpdateConfig,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const monthlyFee = messConfig?.monthlyMessFee ?? 3000;
  const rebatePerMeal = messConfig?.rebatePerSkippedMeal ?? 40;

  const [tempFee, setTempFee] = useState(monthlyFee.toString());
  const [tempRebate, setTempRebate] = useState(rebatePerMeal.toString());

  // Calculate stats
  // Number of skipped meals: lunch or dinner unchecked
  let totalSkippedMeals = 0;
  let totalGuestMeals = 0;

  (meals || []).forEach((m) => {
    if (!m.breakfast) totalSkippedMeals += 1;
    if (!m.lunch) totalSkippedMeals += 1;
    if (!m.dinner) totalSkippedMeals += 1;
    totalGuestMeals += m.guestMeals || 0;
  });

  const totalRebateSaved = totalSkippedMeals * rebatePerMeal;
  const effectiveMessFee = Math.max(0, monthlyFee - totalRebateSaved + totalGuestMeals * rebatePerMeal);
  const costPerDay = Math.round(effectiveMessFee / 30);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...(messConfig || {}),
      monthlyMessFee: parseFloat(tempFee) || 3000,
      rebatePerSkippedMeal: parseFloat(tempRebate) || 40,
    });
    setIsConfigOpen(false);
  };

  return (
    <div id="mess-tracker-tab" className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <UtensilsCrossed className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Hostel &amp; Tiffin Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Hostel Mess &amp; Meal Tracker</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Track daily hostel meals, calculate skipped meal rebates, and claim your mess money back.
          </p>
        </div>

        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition self-start sm:self-auto cursor-pointer"
        >
          {isConfigOpen ? 'Close Settings' : 'Mess Fee & Rebate Settings'}
        </button>
      </div>

      {/* Mess Settings Panel */}
      {isConfigOpen && (
        <form onSubmit={handleSaveConfig} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure Hostel Mess Plan</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Monthly Mess Advance Fee (₹)</label>
              <input
                type="number"
                value={tempFee}
                onChange={(e) => setTempFee(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Rebate refund per skipped meal (₹)</label>
              <input
                type="number"
                value={tempRebate}
                onChange={(e) => setTempRebate(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="text-xs font-bold px-4 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
              Update Mess Rates
            </button>
          </div>
        </form>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Monthly Mess Plan</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(monthlyFee)}</div>
          <span className="text-[11px] text-slate-500">Fixed hostel bill</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
          <span className="text-xs text-emerald-800 font-medium block">Rebate Refund Earned</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">+{formatINR(totalRebateSaved)}</div>
          <span className="text-[11px] text-emerald-700 font-medium">{totalSkippedMeals} meals skipped &amp; saved</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
          <span className="text-xs text-amber-900 font-medium block">Guest Meals Cost</span>
          <div className="text-xl font-extrabold text-amber-800 mt-1">
            +{formatINR(totalGuestMeals * rebatePerMeal)}
          </div>
          <span className="text-[11px] text-amber-800">{totalGuestMeals} guest diets added</span>
        </div>

        <div className="p-4 rounded-xl bg-red-50 border border-red-200 shadow-sm">
          <span className="text-xs text-red-900 font-medium block">Effective Monthly Cost</span>
          <div className="text-xl font-extrabold text-red-700 mt-1">{formatINR(effectiveMessFee)}</div>
          <span className="text-[11px] text-red-700 font-semibold">≈ ₹{costPerDay}/day per head</span>
        </div>
      </div>

      {/* Rebate Tip Box */}
      <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Student Hack:</strong> If you're studying late or visiting home on weekends,
          make sure to untick the meal! Each skipped meal earns ₹{messConfig.rebatePerSkippedMeal} off your warden bill.
        </div>
      </div>

      {/* Daily Meal Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Daily Meal Check-in (This Week)</h3>

        <div className="space-y-2.5">
          {meals.map((meal) => {
            return (
              <div
                key={meal.date}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 gap-3 transition"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">{formatDate(meal.date)}</div>
                  {meal.notes && <div className="text-[11px] text-slate-500">{meal.notes}</div>}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Breakfast */}
                  <button
                    onClick={() => onToggleMeal(meal.date, 'breakfast')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      meal.breakfast
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-white text-slate-400 border border-slate-200 line-through'
                    }`}
                  >
                    <span>🍳 Breakfast</span>
                    {meal.breakfast ? <Check className="w-3 h-3 text-amber-700" /> : <X className="w-3 h-3" />}
                  </button>

                  {/* Lunch */}
                  <button
                    onClick={() => onToggleMeal(meal.date, 'lunch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      meal.lunch
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : 'bg-white text-slate-400 border border-slate-200 line-through'
                    }`}
                  >
                    <span>🍛 Lunch</span>
                    {meal.lunch ? <Check className="w-3 h-3 text-orange-700" /> : <X className="w-3 h-3" />}
                  </button>

                  {/* Evening Chai / Snacks */}
                  <button
                    onClick={() => onToggleMeal(meal.date, 'snacks')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      meal.snacks
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-white text-slate-400 border border-slate-200 line-through'
                    }`}
                  >
                    <span>☕ Chai</span>
                    {meal.snacks ? <Check className="w-3 h-3 text-amber-700" /> : <X className="w-3 h-3" />}
                  </button>

                  {/* Dinner */}
                  <button
                    onClick={() => onToggleMeal(meal.date, 'dinner')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      meal.dinner
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-white text-slate-400 border border-slate-200 line-through'
                    }`}
                  >
                    <span>🍲 Dinner</span>
                    {meal.dinner ? <Check className="w-3 h-3 text-red-700" /> : <X className="w-3 h-3" />}
                  </button>

                  {/* Guest count */}
                  <button
                    onClick={() => onAddGuestMeal(meal.date)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                    title="Add guest meal"
                  >
                    + Guest ({meal.guestMeals || 0})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
