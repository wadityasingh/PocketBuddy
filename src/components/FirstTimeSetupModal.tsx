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
  ShieldCheck,
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

  // Step 3: Current balances in hand (Cash & UPI only - Bank Savings Account removed)
  const [cash, setCash] = useState('');
  const [upi, setUpi] = useState('');

  // Step 4: Living situation
  const [livingSituation, setLivingSituation] = useState<'alone' | 'roommates'>('roommates');
  const [roomChoice, setRoomChoice] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Review confirmation step
  const [isReady, setIsReady] = useState(false);

  if (!isOpen) return null;

  const totalStartingBalance = (parseFloat(cash) || 0) + (parseFloat(upi) || 0);

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
          bank: 0, // Bank savings account removed per request
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

  const allowanceSuggestions = [3000, 5000, 8000, 10000];

  const stepTitles = [
    { num: 1, title: 'Profile' },
    { num: 2, title: 'Budget' },
    { num: 3, title: 'Balances' },
    { num: 4, title: 'Living Setup' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6 transition-all">
        
        {/* Authentic Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between gap-3">
            <BrandLogo size="xs" showWordmark={true} tagline={false} />
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Quick Setup
            </span>
          </div>

          {/* Stepper Progress Bar */}
          {!isReady && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span className="text-slate-900 font-semibold">
                  Step {step} of 4: <span className="text-red-600">{stepTitles[step - 1]?.title}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Takes ~1 min</span>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s === step
                        ? 'bg-red-600'
                        : s < step
                        ? 'bg-slate-800'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isReady ? (
            <div className="space-y-6">
              
              {/* STEP 1: Student Name */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Welcome! What should we call you?
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Used on your student dashboard, wallet cards, and shared roommate split receipts.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="setup-step1-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      You can change or add your college details anytime in Settings.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: Monthly Pocket Money / Allowance */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Monthly Pocket Money / Budget
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      How much budget or allowance do you receive per month to spend?
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Monthly Allowance (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                        ₹
                      </div>
                      <input
                        id="setup-step2-allowance"
                        type="number"
                        min="0"
                        value={allowance}
                        onChange={(e) => setAllowance(e.target.value)}
                        placeholder="Enter monthly budget (e.g. 5000)"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                        autoFocus
                      />
                    </div>

                    {/* Quick Select Pills */}
                    <div className="mt-3">
                      <div className="text-[11px] font-medium text-slate-500 mb-1.5">Common student budgets:</div>
                      <div className="flex flex-wrap items-center gap-2">
                        {allowanceSuggestions.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAllowance(amt.toString())}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              allowance === amt.toString()
                                ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-600/20'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            ₹{amt.toLocaleString('en-IN')}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setAllowance('0')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                            allowance === '0'
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          No Fixed Limit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Current Starting Balances (Cash & UPI Only, NO Bank Savings Account) */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Current Starting Balances
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Enter what you currently have in hand. We'll set these up as your Day 1 wallet balances.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Cash in Hand */}
                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-emerald-600" />
                          <span>Cash in Pocket / Physical Wallet</span>
                        </span>
                        <span className="text-[11px] font-normal text-slate-400">Notes & Coins</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                          ₹
                        </div>
                        <input
                          id="setup-step3-cash"
                          type="number"
                          min="0"
                          value={cash}
                          onChange={(e) => setCash(e.target.value)}
                          placeholder="0"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* UPI Balance */}
                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-red-600" />
                          <span>UPI Apps Balance</span>
                        </span>
                        <span className="text-[11px] font-normal text-slate-400">GPay, PhonePe, Paytm</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                          ₹
                        </div>
                        <input
                          id="setup-step3-upi"
                          type="number"
                          min="0"
                          value={upi}
                          onChange={(e) => setUpi(e.target.value)}
                          placeholder="0"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Total Real-time Starting Balance Bar */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="font-medium text-slate-600">Total Starting Money:</span>
                      <span className="font-bold text-sm text-slate-900">
                        {formatINR(totalStartingBalance)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      You can add or update your balances anytime from the Wallets section.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: Living Situation */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Living Arrangement
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Are you living independently or sharing expenses with roommates?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="setup-living-alone"
                      type="button"
                      onClick={() => setLivingSituation('alone')}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        livingSituation === 'alone'
                          ? 'border-red-600 bg-red-50/60 ring-1 ring-red-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <User className={`w-5 h-5 mb-2 ${livingSituation === 'alone' ? 'text-red-600' : 'text-slate-500'}`} />
                      <div className="text-xs font-bold text-slate-900">Living Alone</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Single room or hostel</div>
                    </button>

                    <button
                      id="setup-living-roommates"
                      type="button"
                      onClick={() => setLivingSituation('roommates')}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        livingSituation === 'roommates'
                          ? 'border-red-600 bg-red-50/60 ring-1 ring-red-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Users className={`w-5 h-5 mb-2 ${livingSituation === 'roommates' ? 'text-red-600' : 'text-slate-500'}`} />
                      <div className="text-xs font-bold text-slate-900">With Roommates</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Shared flat or PG</div>
                    </button>
                  </div>

                  {/* Roommates Sub-options */}
                  {livingSituation === 'roommates' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRoomChoice('create')}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            roomChoice === 'create'
                              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Create New Room
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoomChoice('join')}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                            roomChoice === 'join'
                              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Join with Code
                        </button>
                      </div>

                      {roomChoice === 'create' ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Room or Flat Name
                          </label>
                          <input
                            id="setup-create-room-name"
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder="e.g. Flat 302 or Ganga Hostel"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            6-Digit Invite Code
                          </label>
                          <input
                            id="setup-join-room-code"
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="e.g. ROOM42"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-red-600 uppercase tracking-wider transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {step > 1 ? (
                  <button
                    id="setup-back-btn"
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold transition cursor-pointer"
                >
                  <span>{step === 4 ? 'Review & Finish' : 'Next'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* READY CONFIRMATION SCREEN */
            <div className="py-2 space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Your PocketBuddy is ready</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your personalized student workspace has been set up with the following preferences:
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-semibold text-slate-900">{name || initialName || 'You'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Monthly Budget:</span>
                  <span className="font-semibold text-slate-900">{formatINR(parseFloat(allowance) || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Cash in Pocket:</span>
                  <span className="font-semibold text-slate-900">{formatINR(parseFloat(cash) || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">UPI Balance:</span>
                  <span className="font-semibold text-slate-900">{formatINR(parseFloat(upi) || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Living Setup:</span>
                  <span className="font-semibold text-slate-900">
                    {livingSituation === 'alone'
                      ? 'Living Alone'
                      : `With Roommates (${roomChoice === 'create' ? roomName || 'New Room' : 'Join with Code'})`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReady(false)}
                  className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Edit
                </button>
                <button
                  id="setup-open-dashboard-btn"
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs shadow-red-600/20"
                >
                  {isSubmitting ? (
                    <span>Opening Dashboard...</span>
                  ) : (
                    <>
                      <span>Open Main Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
