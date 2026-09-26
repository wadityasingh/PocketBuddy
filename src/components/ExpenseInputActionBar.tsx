import React from 'react';
import { Camera, Mic, PlusCircle, ArrowUpRight } from 'lucide-react';

interface ExpenseInputActionBarProps {
  onOpenScanner: () => void;
  onOpenVoice: () => void;
  onOpenManual: () => void;
}

export const ExpenseInputActionBar: React.FC<ExpenseInputActionBarProps> = ({
  onOpenScanner,
  onOpenVoice,
  onOpenManual,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Quick Add Transactions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log expenses instantly via receipt scan, voice recording, or manual entry
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
        {/* UPI Screenshot Scan */}
        <button
          type="button"
          onClick={onOpenScanner}
          className="p-3.5 rounded-xl border border-slate-200 hover:border-red-400 bg-slate-50/50 hover:bg-white text-left transition duration-150 flex items-start gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <Camera className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                Scan Receipt / UPI
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Extract amount and merchant details from payment receipts.
            </p>
          </div>
        </button>

        {/* Voice Input */}
        <button
          type="button"
          onClick={onOpenVoice}
          className="p-3.5 rounded-xl border border-slate-200 hover:border-violet-400 bg-slate-50/50 hover:bg-white text-left transition duration-150 flex items-start gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
            <Mic className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                Voice Expense
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Speak naturally in Hindi or English: &ldquo;₹80 for auto rickshaw&rdquo;.
            </p>
          </div>
        </button>

        {/* Manual Write */}
        <button
          type="button"
          onClick={onOpenManual}
          className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-white text-left transition duration-150 flex items-start gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-900 group-hover:text-slate-900 transition-colors">
                Manual Entry
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Add custom title, category, date, and payment mode.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
