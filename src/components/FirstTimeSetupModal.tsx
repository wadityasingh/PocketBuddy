import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  User,
  IndianRupee,
  Smartphone,
  Banknote,
  Landmark,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { BrandLogo } from './BrandLogo';

interface FirstTimeSetupModalProps {
  isOpen: boolean;
  initialName?: string;
  onComplete: (setupData: {
    name: string;
    monthlyPocketMoney: number;
    wallets: { cash: number; upi: number; bank: number };
    livingSituation: 'alone' | 'roommates';
    roomAction?: 'create' | 'join';
    roomName?: string;
    inviteCode?: string;
    fixedExpenses?: { name: string; amount: number; category: string }[];
  }) => Promise<void> | void;
}

export const FirstTimeSetupModal: React.FC<FirstTimeSetupModalProps> = ({
  isOpen,
  initialName = '',
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Student Name
  const [name, setName] = useState(initialName || '');

  // Step 2: Monthly Pocket Money / Allowance
  const [allowance, setAllowance] = useState('');

  // Step 3: Current balances in hand
  const [cash, setCash] = useState('');
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState('');

  // Step 4: Living situation
  const [livingSituation, setLivingSituation] = useState<'alone' | 'roommates'>('roommates');
  const [roomChoice, setRoomChoice] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Step 5 removed per user request: Ready confirmation screen
  const [isReady, setIsReady] = useState(false);

  if (!isOpen) return null;

  const totalStartingBalance =
    (parseFloat(cash) || 0) + (parseFloat(upi) || 0) + (parseFloat(bank) || 0);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsReady(true);
    }
  };

  const handleBack = () => {
    if (isReady) {
      setIsReady(false);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onComplete({
        name: name.trim() || initialName || 'You',
        monthlyPocketMoney: parseFloat(allowance) || 0,
        wallets: {
          cash: parseFloat(cash) || 0,
          upi: parseFloat(upi) || 0,
          bank: parseFloat(bank) || 0,
        },
        livingSituation,
        roomAction: livingSituation === 'roommates' ? roomChoice : undefined,
        roomName: roomChoice === 'create' ? roomName.trim() : undefined,
        inviteCode: roomChoice === 'join' ? inviteCode.trim().toUpperCase() : undefined,
        fixedExpenses: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allowanceSuggestions = [5000, 8000, 10000, 15000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-[28px] sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-6 animate-fade-in">
        
        {/* Top Header with PocketBuddy Branding */}
        <div className="p-5 sm:p-6 bg-[#0d1627] text-white relative border-b border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-2">
            <BrandLogo size="xs" showWordmark={true} tagline={false} variant="dark" />
            <div className="text-[11px] font-semibold text-slate-400">
              Personalized Setup
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 font-medium">
            Configure your student wallet and room preferences to get started.
          </p>

          {/* 4-Step Progress Indicator */}
          {!isReady && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                <span>Step {step} of 4</span>
                <span>{step === 1 ? 'Profile' : step === 2 ? 'Budget' : step === 3 ? 'Wallets' : 'Room Setup'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                      s === step
                        ? 'bg-indigo-500 shadow-xs'
                        : s < step
                        ? 'bg-emerald-400'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {!isReady ? (
            <div className="space-y-5">
              {/* STEP 1: Student Name */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Step 1 of 4
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">What should PocketBuddy call you?</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Used on your student financial card, expense logs, and shared room split records.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        id="setup-step1-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Monthly Pocket Money / Allowance */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Step 2 of 4
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      Monthly Pocket Money / Budget
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter the monthly budget you receive from family, stipend, or personal earnings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Monthly Budget Limit (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        id="setup-step2-allowance"
                        type="number"
                        min="0"
                        value={allowance}
                        onChange={(e) => setAllowance(e.target.value)}
                        placeholder="Enter monthly budget (₹)"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        autoFocus
                      />
                    </div>
                    
                    {/* Realistic Quick Suggestion Chips */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Select:</span>
                      {allowanceSuggestions.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAllowance(amt.toString())}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            allowance === amt.toString()
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ₹{amt.toLocaleString('en-IN')}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAllowance('0')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          allowance === '0'
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        No Fixed Limit
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2">
                      Set to 0 if you prefer open tracking without a fixed monthly spending limit.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: Real Starting Balances */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Step 3 of 4
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      Current Starting Balances
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter what you currently have so your wallet balances reflect reality from Day 1.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Cash */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5">
                        <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                          <Banknote className="w-3.5 h-3.5" />
                        </div>
                        <span>Cash in Pocket / Physical Wallet (₹)</span>
                      </label>
                      <input
                        id="setup-step3-cash"
                        type="number"
                        min="0"
                        value={cash}
                        onChange={(e) => setCash(e.target.value)}
                        placeholder="Enter cash amount"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                    </div>

                    {/* UPI */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5">
                        <div className="w-5 h-5 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <span>UPI Balance (GPay, PhonePe, Paytm) (₹)</span>
                      </label>
                      <input
                        id="setup-step3-upi"
                        type="number"
                        min="0"
                        value={upi}
                        onChange={(e) => setUpi(e.target.value)}
                        placeholder="Enter UPI balance"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                    </div>

                    {/* Bank */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5">
                        <div className="w-5 h-5 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700">
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                        <span>Bank Savings Account (₹)</span>
                      </label>
                      <input
                        id="setup-step3-bank"
                        type="number"
                        min="0"
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        placeholder="Enter bank savings balance"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                    </div>

                    {/* Total Real-time Badge */}
                    <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-900">
                      <span>Total Starting Balance:</span>
                      <span className="text-sm font-black text-indigo-700">
                        {formatINR(totalStartingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Living Situation */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Step 4 of 4
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      What is your living situation?
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      PocketBuddy supports both personal finance and shared roommate bill splitting.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="setup-living-alone"
                      type="button"
                      onClick={() => setLivingSituation('alone')}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                        livingSituation === 'alone'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <User className="w-6 h-6 text-indigo-600 mb-2" />
                      <div className="text-xs font-bold text-slate-900">Living Alone</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Single room or hostel</div>
                    </button>

                    <button
                      id="setup-living-roommates"
                      type="button"
                      onClick={() => setLivingSituation('roommates')}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                        livingSituation === 'roommates'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <Users className="w-6 h-6 text-indigo-600 mb-2" />
                      <div className="text-xs font-bold text-slate-900">With Roommates</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Shared flat or PG</div>
                    </button>
                  </div>

                  {/* Roommates sub-options */}
                  {livingSituation === 'roommates' && (
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                      <p className="text-xs font-bold text-indigo-950">
                        Select room option:
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRoomChoice('create')}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                            roomChoice === 'create'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Create New Room
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoomChoice('join')}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                            roomChoice === 'join'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Join with Code
                        </button>
                      </div>

                      {roomChoice === 'create' ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Room or Flat Name
                          </label>
                          <input
                            id="setup-create-room-name"
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="Enter room or PG name"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Room Invite Code
                          </label>
                          <input
                            id="setup-join-room-code"
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="Enter 6-digit room code"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 uppercase tracking-wider transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {step > 1 ? (
                  <button
                    id="setup-back-btn"
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  id="setup-next-btn"
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
                >
                  <span>{step === 4 ? 'Review & Finish' : 'Next'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* READY SCREEN */
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Your PocketBuddy is ready.</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your personalized student workspace is configured. Track your expenses, manage balances, and split room bills seamlessly.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-900">{name || initialName || 'You'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Monthly Budget:</span>
                  <span className="font-bold text-slate-900">{formatINR(parseFloat(allowance) || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Starting Total Balances:</span>
                  <span className="font-bold text-emerald-600">
                    {formatINR(totalStartingBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Living Arrangement:</span>
                  <span className="font-bold text-slate-900">
                    {livingSituation === 'alone'
                      ? 'Living Alone'
                      : `Roommates (${roomChoice === 'create' ? roomName || 'New Room' : 'Join with Code'})`}
                  </span>
                </div>
              </div>

              <button
                id="setup-open-dashboard-btn"
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Opening Your Dashboard...</span>
                ) : (
                  <>
                    <span>Open Main Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
