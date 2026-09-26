import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  ScanLine,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Trash2,
  Edit2,
  Calendar,
  Lock,
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  FileText,
  Eye,
  Check,
  Smartphone,
  Banknote,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { UdhaarRecord, PaymentMode, PersonalNote } from '../types';
import { formatINR, formatDate, generateId } from '../utils/formatters';
import { CoolNotepad } from './CoolNotepad';

interface UdhaarKhatabookTabProps {
  records: UdhaarRecord[];
  onAddUdhaar: (record: UdhaarRecord) => void;
  onEditUdhaar?: (record: UdhaarRecord) => void;
  onDeleteUdhaar?: (id: string) => void;
  onSettleUdhaar: (id: string, mode?: PaymentMode | string) => void;
  onReopenUdhaar?: (id: string) => void;
  notes?: PersonalNote[];
  onAddNote?: (note: PersonalNote) => void;
  onUpdateNote?: (note: PersonalNote) => void;
  onDeleteNote?: (id: string) => void;
}

type FilterTab = 'all' | 'give' | 'take' | 'settled';

export const UdhaarKhatabookTab: React.FC<UdhaarKhatabookTabProps> = ({
  records = [],
  onAddUdhaar,
  onEditUdhaar,
  onDeleteUdhaar,
  onSettleUdhaar,
  onReopenUdhaar,
  notes = [],
  onAddNote = () => {},
  onUpdateNote = () => {},
  onDeleteNote = () => {},
}) => {
  // Toggle between 'notepad' (Your Notes based on reference image) and 'loans' (Personal Loans Khatabook)
  const [activeView, setActiveView] = useState<'notepad' | 'loans'>('notepad');
  // Ensure array safety
  const safeRecords = useMemo(
    () => (Array.isArray(records) ? records.filter(Boolean) : []),
    [records]
  );

  // -------------------------------------------------------------
  // 1. CALCULATIONS: Pending Balances & Settled Items
  // -------------------------------------------------------------
  // TO RECEIVE = sum of unpaid money lent ('give')
  const toReceive = useMemo(() => {
    return safeRecords
      .filter((r) => r.type === 'give' && r.status === 'pending')
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [safeRecords]);

  // TO REPAY = sum of unpaid money borrowed ('take')
  const toRepay = useMemo(() => {
    return safeRecords
      .filter((r) => r.type === 'take' && r.status === 'pending')
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [safeRecords]);

  // NET BALANCE = To Receive - To Repay
  const netBalance = toReceive - toRepay;

  // -------------------------------------------------------------
  // 2. SEARCH & FILTER STATE
  // -------------------------------------------------------------
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered records
  const filteredRecords = useMemo(() => {
    return safeRecords.filter((r) => {
      // Tab filter
      if (activeFilter === 'give') {
        if (r.type !== 'give' || r.status !== 'pending') return false;
      } else if (activeFilter === 'take') {
        if (r.type !== 'take' || r.status !== 'pending') return false;
      } else if (activeFilter === 'settled') {
        if (r.status !== 'settled') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const personMatch = (r.person || '').toLowerCase().includes(q);
        const reasonMatch = (r.reason || '').toLowerCase().includes(q);
        const notesMatch = (r.notes || '').toLowerCase().includes(q);
        const amountMatch = String(r.amount || '').includes(q);
        return personMatch || reasonMatch || notesMatch || amountMatch;
      }

      return true;
    });
  }, [safeRecords, activeFilter, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    const receiveCount = safeRecords.filter(
      (r) => r.type === 'give' && r.status === 'pending'
    ).length;
    const repayCount = safeRecords.filter(
      (r) => r.type === 'take' && r.status === 'pending'
    ).length;
    const settledCount = safeRecords.filter((r) => r.status === 'settled').length;
    return {
      all: safeRecords.length,
      give: receiveCount,
      take: repayCount,
      settled: settledCount,
    };
  }, [safeRecords]);

  // -------------------------------------------------------------
  // 3. ADD / EDIT LOAN MODAL STATE
  // -------------------------------------------------------------
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<UdhaarRecord | null>(null);

  const [formType, setFormType] = useState<'give' | 'take'>('give');
  const [formPerson, setFormPerson] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<'Cash' | 'UPI' | 'Other'>('UPI');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingLoan(null);
    setFormType('give');
    setFormPerson('');
    setFormAmount('');
    setFormReason('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDueDate('');
    setFormPaymentMode('UPI');
    setFormNotes('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (loan: UdhaarRecord) => {
    setEditingLoan(loan);
    setFormType(loan.type);
    setFormPerson(loan.person || '');
    setFormAmount(loan.amount ? String(loan.amount) : '');
    setFormReason(loan.reason || '');
    setFormDate(loan.date || new Date().toISOString().split('T')[0]);
    setFormDueDate(loan.dueDate || '');
    setFormPaymentMode(loan.paymentMode || 'UPI');
    setFormNotes(loan.notes || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formPerson.trim()) {
      setFormError("Friend's name is required");
      return;
    }

    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₹0');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingLoan) {
        const updated: UdhaarRecord = {
          ...editingLoan,
          type: formType,
          person: formPerson.trim(),
          amount: numAmount,
          reason: formReason.trim() || (formType === 'give' ? 'Money Lent' : 'Money Borrowed'),
          date: formDate || new Date().toISOString().split('T')[0],
          dueDate: formDueDate.trim(),
          paymentMode: formPaymentMode,
          notes: formNotes.trim(),
        };
        onEditUdhaar?.(updated);
        // Also update detail view if active
        if (selectedLoan && selectedLoan.id === editingLoan.id) {
          setSelectedLoan(updated);
        }
      } else {
        const newRecord: UdhaarRecord = {
          id: generateId('loan'),
          type: formType,
          person: formPerson.trim(),
          amount: numAmount,
          reason: formReason.trim() || (formType === 'give' ? 'Money Lent' : 'Money Borrowed'),
          date: formDate || new Date().toISOString().split('T')[0],
          dueDate: formDueDate.trim(),
          status: 'pending',
          paymentMode: formPaymentMode,
          notes: formNotes.trim(),
        };
        onAddUdhaar(newRecord);
      }

      setIsFormOpen(false);
      setEditingLoan(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 4. INDIVIDUAL LOAN DETAILS MODAL & PRIVATE NOTE UX
  // -------------------------------------------------------------
  const [selectedLoan, setSelectedLoan] = useState<UdhaarRecord | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  const handleOpenDetail = (loan: UdhaarRecord) => {
    setSelectedLoan(loan);
    setIsEditingNote(false);
    setNoteDraft(loan.notes || '');
  };

  const handleSavePrivateNote = () => {
    if (!selectedLoan) return;
    const updated: UdhaarRecord = {
      ...selectedLoan,
      notes: noteDraft.trim(),
    };
    onEditUdhaar?.(updated);
    setSelectedLoan(updated);
    setIsEditingNote(false);
  };

  const handleDeletePrivateNote = () => {
    if (!selectedLoan) return;
    const updated: UdhaarRecord = {
      ...selectedLoan,
      notes: '',
    };
    onEditUdhaar?.(updated);
    setSelectedLoan(updated);
    setNoteDraft('');
    setIsEditingNote(false);
  };

  // -------------------------------------------------------------
  // 5. SETTLEMENT & DELETION CONFIRMATION DIALOGS
  // -------------------------------------------------------------
  const [settleTarget, setSettleTarget] = useState<UdhaarRecord | null>(null);
  const [settlePaymentMode, setSettlePaymentMode] = useState<PaymentMode>('UPI');

  const [deleteTarget, setDeleteTarget] = useState<UdhaarRecord | null>(null);

  const confirmSettle = () => {
    if (!settleTarget) return;
    onSettleUdhaar(settleTarget.id, settlePaymentMode);
    if (selectedLoan && selectedLoan.id === settleTarget.id) {
      setSelectedLoan({
        ...selectedLoan,
        status: 'settled',
        settledDate: new Date().toISOString().split('T')[0],
      });
    }
    setSettleTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteUdhaar?.(deleteTarget.id);
    if (selectedLoan && selectedLoan.id === deleteTarget.id) {
      setSelectedLoan(null);
    }
    setDeleteTarget(null);
  };

  // -------------------------------------------------------------
  // 6. SCAN HANDWRITTEN LOAN NOTE (OCR SCANNER)
  // -------------------------------------------------------------
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanStep, setScanStep] = useState<'upload' | 'scanning' | 'review' | 'error'>('upload');
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [scanErrorMsg, setScanErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Review fields for scanned loan note
  const [scannedPerson, setScannedPerson] = useState('');
  const [scannedAmount, setScannedAmount] = useState('');
  const [scannedType, setScannedType] = useState<'give' | 'take'>('give');
  const [scannedReason, setScannedReason] = useState('');
  const [scannedDate, setScannedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scannedDueDate, setScannedDueDate] = useState('');
  const [scannedNotes, setScannedNotes] = useState('');
  const [scannedConfidence, setScannedConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [scannedPaymentMode, setScannedPaymentMode] = useState<'Cash' | 'UPI' | 'Other'>('Cash');
  const [reviewError, setReviewError] = useState('');

  const handleOpenScan = () => {
    setScanStep('upload');
    setScannedImage(null);
    setScanErrorMsg('');
    setReviewError('');
    setIsScanModalOpen(true);
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScanErrorMsg('Please select an image file (photo, screenshot, or handwritten chit)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setScannedImage(result);
      setScanErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const processImageOCR = async () => {
    if (!scannedImage) return;

    setScanStep('scanning');
    setScanErrorMsg('');

    try {
      const res = await fetch('/api/ocr/loan-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: scannedImage,
          mimeType: 'image/jpeg',
        }),
      });

      const data = await res.json();

      if (data.success && data.result) {
        const r = data.result;
        setScannedPerson(r.person || '');
        setScannedAmount(r.amount ? String(r.amount) : '');
        setScannedType(r.type === 'take' ? 'take' : 'give');
        setScannedReason(r.reason || 'Personal Loan');
        setScannedDate(r.date || new Date().toISOString().split('T')[0]);
        setScannedDueDate(r.dueDate || '');
        setScannedNotes(r.notes || r.rawText || '');
        setScannedConfidence(r.confidence || 'medium');
        setScannedPaymentMode('Cash');
        setScanStep('review');
      } else {
        setScanErrorMsg(
          data.error || 'We could not read this note clearly. Please enter the details manually.'
        );
        setScanStep('error');
      }
    } catch {
      setScanErrorMsg('We could not read this note clearly. Please enter the details manually.');
      setScanStep('error');
    }
  };

  const handleSaveScannedLoan = () => {
    if (!scannedPerson.trim()) {
      setReviewError("Friend's name is required");
      return;
    }

    const numAmt = parseFloat(scannedAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setReviewError('Please enter a valid amount greater than ₹0');
      return;
    }

    const newLoan: UdhaarRecord = {
      id: generateId('loan'),
      type: scannedType,
      person: scannedPerson.trim(),
      amount: numAmt,
      reason: scannedReason.trim() || (scannedType === 'give' ? 'Money Lent' : 'Money Borrowed'),
      date: scannedDate || new Date().toISOString().split('T')[0],
      dueDate: scannedDueDate.trim(),
      status: 'pending',
      paymentMode: scannedPaymentMode,
      notes: scannedNotes.trim(),
    };

    onAddUdhaar(newLoan);
    setIsScanModalOpen(false);
    setScannedImage(null);
  };

  const handleFallbackManualEntry = () => {
    setIsScanModalOpen(false);
    setEditingLoan(null);
    setFormType(scannedType);
    setFormPerson(scannedPerson);
    setFormAmount(scannedAmount);
    setFormReason(scannedReason || '');
    setFormDate(scannedDate || new Date().toISOString().split('T')[0]);
    setFormDueDate(scannedDueDate);
    setFormPaymentMode(scannedPaymentMode);
    setFormNotes(scannedNotes);
    setFormError('');
    setIsFormOpen(true);
  };

  // -------------------------------------------------------------
  // RENDER: CLEAN, MINIMALIST & MOBILE-OPTIMIZED KHATABOOK + NOTEPAD
  // -------------------------------------------------------------
  return (
    <div id="udhaar-khatabook-tab" className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Top View Mode Switcher: Your Notes (Notepad) vs Personal Loans (Khatabook) */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-stone-200/60 rounded-2xl border border-stone-300/80">
        <button
          type="button"
          onClick={() => setActiveView('notepad')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeView === 'notepad'
              ? 'bg-[#1e1b19] text-white shadow-sm'
              : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#c4684d]" />
          <span>Your Notes (Notepad)</span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-stone-300 font-normal">
            No history tracked
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('loans')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeView === 'loans'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-stone-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          <span>Loans &amp; Khatabook</span>
          {(toReceive > 0 || toRepay > 0) && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              ₹{Math.round(toReceive + toRepay)}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: COOL NOTEPAD (Inspired by User's Reference Image) */}
      {activeView === 'notepad' ? (
        <CoolNotepad
          notes={notes}
          onAddNote={onAddNote}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
        />
      ) : (
        /* VIEW 2: PERSONAL LOANS KHATABOOK */
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          {/* ========================================================
              1. HEADER & TOP THREE COMPACT SUMMARY CARDS
              ======================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Personal Loans
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep track of money you lend or borrow from friends.
            </p>
          </div>
        </div>

        {/* 3 Compact Summary Cards: TO RECEIVE, TO REPAY, NET BALANCE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: TO RECEIVE */}
          <div
            id="card-to-receive"
            onClick={() => setActiveFilter('give')}
            className={`p-3.5 rounded-xl border transition cursor-pointer ${
              activeFilter === 'give'
                ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>TO RECEIVE</span>
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
              {formatINR(toReceive)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Money friends owe me.</p>
          </div>

          {/* Card 2: TO REPAY */}
          <div
            id="card-to-repay"
            onClick={() => setActiveFilter('take')}
            className={`p-3.5 rounded-xl border transition cursor-pointer ${
              activeFilter === 'take'
                ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                <span>TO REPAY</span>
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-700 mt-1">
              {formatINR(toRepay)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Money I need to pay friends.</p>
          </div>

          {/* Card 3: NET BALANCE */}
          <div
            id="card-net-balance"
            onClick={() => setActiveFilter('all')}
            className={`p-3.5 rounded-xl border transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-100/80 border-slate-300'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                NET BALANCE
              </span>
            </div>
            <div
              className={`text-lg sm:text-xl font-black mt-1 ${
                netBalance > 0
                  ? 'text-emerald-700'
                  : netBalance < 0
                  ? 'text-rose-700'
                  : 'text-slate-900'
              }`}
            >
              {netBalance > 0 ? `+${formatINR(netBalance)}` : formatINR(netBalance)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total amount to receive minus total amount to repay.
            </p>
          </div>
        </div>

        {/* Two Primary Action Buttons: Add Loan & Scan Loan Note */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            id="btn-add-loan"
            type="button"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Loan</span>
          </button>

          <button
            id="btn-scan-loan-note"
            type="button"
            onClick={handleOpenScan}
            className="flex-1 sm:flex-initial h-11 px-4.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 active:scale-[0.99] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ScanLine className="w-4 h-4 text-red-600" />
            <span>Scan Loan Note</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. CLEAN LOAN LIST (MY LOANS)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        {/* List Header: Title, Filter Tabs & Compact Search Field */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              My Loans
            </h3>
          </div>

          {/* Search field */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-loans"
              type="text"
              placeholder="Search by friend or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 text-xs pl-8.5 pr-7 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 transition placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            id="tab-filter-all"
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer min-h-[34px] ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            id="tab-filter-receive"
            type="button"
            onClick={() => setActiveFilter('give')}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer min-h-[34px] ${
              activeFilter === 'give'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            To Receive ({counts.give})
          </button>
          <button
            id="tab-filter-repay"
            type="button"
            onClick={() => setActiveFilter('take')}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer min-h-[34px] ${
              activeFilter === 'take'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
            }`}
          >
            To Repay ({counts.take})
          </button>
          <button
            id="tab-filter-settled"
            type="button"
            onClick={() => setActiveFilter('settled')}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer min-h-[34px] ${
              activeFilter === 'settled'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            Settled ({counts.settled})
          </button>
        </div>

        {/* Loan Records Display */}
        <div className="space-y-2.5">
          {safeRecords.length === 0 ? (
            /* True Clean Empty State */
            <div
              id="empty-state-no-loans"
              className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-800">
                No personal loans yet.
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                Add a loan to start tracking money lent or borrowed from friends.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="h-10 px-4.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Loan</span>
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            /* Filter/Search No Match */
            <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <p className="text-xs font-bold text-slate-700">No loans found.</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredRecords.map((loan) => {
              const isGive = loan.type === 'give';
              const isSettled = loan.status === 'settled';

              return (
                <div
                  key={loan.id}
                  id={`loan-row-${loan.id}`}
                  className={`p-3.5 sm:p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSettled
                      ? 'bg-slate-50/80 border-slate-200 text-slate-600 opacity-90'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Left: Friend Name, Direction, Amount, Reason, Due Date */}
                  <div
                    onClick={() => handleOpenDetail(loan)}
                    className="min-w-0 flex-1 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-red-600 transition">
                        {loan.person}
                      </span>

                      {/* Direction & Amount label */}
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                          isGive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}
                      >
                        {isGive ? (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-rose-600 shrink-0" />
                        )}
                        <span>
                          {isGive ? `You lent ${formatINR(loan.amount)}` : `You borrowed ${formatINR(loan.amount)}`}
                        </span>
                      </span>

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isSettled
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        }`}
                      >
                        {isSettled ? 'Settled' : 'Pending'}
                      </span>
                    </div>

                    {/* Metadata line: Reason & Due Date */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      {loan.reason && (
                        <span>
                          <strong className="text-slate-600 font-semibold">Reason:</strong>{' '}
                          {loan.reason}
                        </span>
                      )}

                      {loan.dueDate && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Due: {formatDate(loan.dueDate)}</span>
                          </span>
                        </>
                      )}

                      {isSettled && loan.settledDate && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-600 font-medium">
                            Paid on: {formatDate(loan.settledDate)}
                          </span>
                        </>
                      )}

                      {loan.paymentMode && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-400 inline-flex items-center gap-0.5">
                            {loan.paymentMode === 'Cash' ? (
                              <Banknote className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Smartphone className="w-3 h-3 text-red-600" />
                            )}
                            <span>{loan.paymentMode}</span>
                          </span>
                        </>
                      )}

                      {loan.notes && (
                        <span
                          title="Contains private note"
                          className="inline-flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-100"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private Note</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions (View, Edit, Mark Paid) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(loan)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer inline-flex items-center gap-1"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(loan)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer inline-flex items-center gap-1"
                      title="Edit Loan"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {!isSettled ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSettleTarget(loan);
                          setSettlePaymentMode(loan.paymentMode === 'Cash' ? 'Cash' : 'UPI');
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition cursor-pointer inline-flex items-center gap-1"
                        title="Mark as Paid"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Mark Paid</span>
                      </button>
                    ) : (
                      onReopenUdhaar && (
                        <button
                          type="button"
                          onClick={() => onReopenUdhaar(loan.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          title="Reopen Loan"
                        >
                          Reopen
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          3. ADD / EDIT LOAN MODAL (BOTTOM SHEET ON MOBILE)
          ======================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            id="modal-add-edit-loan"
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingLoan ? 'Edit Loan Record' : 'Add Loan'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveLoan} className="space-y-3.5">
              {/* Loan Type Switcher: I Lent Money vs I Borrowed Money */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Loan Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('give')}
                    className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      formType === 'give'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>I Lent Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('take')}
                    className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      formType === 'take'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>I Borrowed Money</span>
                  </button>
                </div>
              </div>

              {/* Friend Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Friend Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="input-form-person"
                  type="text"
                  placeholder="e.g. Aman, Rahul, Neeraj"
                  value={formPerson}
                  onChange={(e) => {
                    setFormPerson(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 font-semibold transition"
                  required
                />
              </div>

              {/* Amount ₹ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount ₹ <span className="text-rose-600">*</span>
                </label>
                <input
                  id="input-form-amount"
                  type="number"
                  step="any"
                  placeholder="e.g. 800"
                  value={formAmount}
                  onChange={(e) => {
                    setFormAmount(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 font-bold transition"
                  required
                />
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason / Note (Optional)
                </label>
                <input
                  id="input-form-reason"
                  type="text"
                  placeholder="e.g. Dinner, Travel ticket, Books"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 font-medium transition"
                />
              </div>

              {/* Date & Due Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Cash', 'Other'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormPaymentMode(m)}
                      className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                        formPaymentMode === m
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m === 'Cash' ? (
                        <Banknote className="w-3 h-3" />
                      ) : m === 'UPI' ? (
                        <Smartphone className="w-3 h-3" />
                      ) : (
                        <HelpCircle className="w-3 h-3" />
                      )}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Private Personal Note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-red-600" />
                    <span>Private Note (Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Visible only to you</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Bhai ne bola hai salary aane par dega..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 font-medium transition placeholder:text-slate-400"
                />
              </div>

              {/* Action Buttons: Cancel and Save */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingLoan ? 'Save Changes' : 'Save Loan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          4. INDIVIDUAL LOAN DETAILS MODAL
          ======================================================== */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            id="modal-loan-detail"
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedLoan.person}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5 ${
                    selectedLoan.status === 'settled'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                  }`}
                >
                  {selectedLoan.status === 'settled' ? 'Settled' : 'Pending Payment'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Amount Card */}
            <div
              className={`p-4 rounded-xl border text-center ${
                selectedLoan.type === 'give'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {selectedLoan.type === 'give' ? 'You Lent' : 'You Borrowed'}
              </div>
              <div
                className={`text-2xl font-black mt-0.5 ${
                  selectedLoan.type === 'give' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatINR(selectedLoan.amount)}
              </div>
              {selectedLoan.reason && (
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Reason: {selectedLoan.reason}
                </div>
              )}
            </div>

            {/* Loan Information Grid */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Created Date:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedLoan.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-bold text-slate-800">
                  {selectedLoan.dueDate ? formatDate(selectedLoan.dueDate) : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800">
                  {selectedLoan.paymentMode || 'UPI'}
                </span>
              </div>
              {selectedLoan.status === 'settled' && selectedLoan.settledDate && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Settled on:</span>
                  <span className="font-bold">{formatDate(selectedLoan.settledDate)}</span>
                </div>
              )}
            </div>

            {/* Private Note Section (Account-Isolated) */}
            <div className="rounded-xl border border-red-100 bg-red-50/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                  <Lock className="w-3 h-3 text-red-600" />
                  <span>Private Note</span>
                </div>
                <span className="text-[10px] text-red-600 font-medium">Visible only to you</span>
              </div>

              {isEditingNote ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Write a private note..."
                    className="w-full p-2 text-xs bg-white border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 text-slate-900 font-medium"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePrivateNote}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-md cursor-pointer shadow-2xs shadow-red-600/20"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : selectedLoan.notes ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-red-100/80 font-medium italic">
                    &ldquo;{selectedLoan.notes}&rdquo;
                  </p>
                  <div className="flex items-center justify-end gap-2 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setNoteDraft(selectedLoan.notes || '');
                        setIsEditingNote(true);
                      }}
                      className="text-red-700 hover:underline cursor-pointer"
                    >
                      Edit Note
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleDeletePrivateNote}
                      className="text-rose-600 hover:underline cursor-pointer"
                    >
                      Delete Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-1">
                  <p className="text-xs text-slate-500 mb-2">No private note added.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteDraft('');
                      setIsEditingNote(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-white border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 transition cursor-pointer"
                  >
                    + Add Private Note
                  </button>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              {selectedLoan.status !== 'settled' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSettleTarget(selectedLoan);
                    setSettlePaymentMode(selectedLoan.paymentMode === 'Cash' ? 'Cash' : 'UPI');
                  }}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Paid</span>
                </button>
              ) : (
                onReopenUdhaar && (
                  <button
                    type="button"
                    onClick={() => {
                      onReopenUdhaar(selectedLoan.id);
                      setSelectedLoan({
                        ...selectedLoan,
                        status: 'pending',
                        settledDate: undefined,
                      });
                    }}
                    className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reopen Loan (Mark as Pending)</span>
                  </button>
                )
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const loan = selectedLoan;
                    setSelectedLoan(null);
                    handleOpenEdit(loan);
                  }}
                  className="h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Loan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(selectedLoan)}
                  className="h-9 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Loan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          5. SCAN LOAN NOTE (AI OCR MODAL WITH USER CONFIRMATION)
          ======================================================== */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            id="modal-scan-loan-note"
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <ScanLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Scan Loan Note</h3>
                  <p className="text-[11px] text-slate-500">Handwritten chits, receipts, or chat notes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScanModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden file input supporting camera & gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelected}
              className="hidden"
            />

            {/* Step 1: Upload / Take Photo */}
            {scanStep === 'upload' && (
              <div className="space-y-3.5">
                {!scannedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-red-50/20 rounded-2xl p-6 text-center cursor-pointer transition space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Take Photo or Upload Image
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Capture a handwritten note like &ldquo;Aditya gave Aman ₹800 for dinner&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                      <img
                        src={scannedImage}
                        alt="Scanned Chit Preview"
                        className="object-contain w-full max-h-56"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScannedImage(null);
                          fileInputRef.current?.click();
                        }}
                        className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                      >
                        Retake / Change
                      </button>
                      <button
                        type="button"
                        onClick={processImageOCR}
                        className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs shadow-red-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ScanLine className="w-3.5 h-3.5" />
                        <span>Extract Details</span>
                      </button>
                    </div>
                  </div>
                )}

                {scanErrorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{scanErrorMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Scanning State */}
            {scanStep === 'scanning' && (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto animate-pulse">
                  <ScanLine className="w-6 h-6 animate-spin" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Reading Handwritten Note...</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Extracting friend name, amount, direction, and promise note.
                </p>
              </div>
            )}

            {/* Step 3: Review Scanned Loan (MANDATORY CONFIRMATION BEFORE SAVING) */}
            {scanStep === 'review' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-900 text-xs">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Review Scanned Loan</span>
                  </div>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Verify and edit the extracted details before saving.
                  </p>
                </div>

                {reviewError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {reviewError}
                  </div>
                )}

                {/* Scanned Direction Switcher */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScannedType('give')}
                      className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                        scannedType === 'give'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>I Lent Money</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScannedType('take')}
                      className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                        scannedType === 'take'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>I Borrowed Money</span>
                    </button>
                  </div>
                </div>

                {/* Friend Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Friend Name</label>
                  <input
                    type="text"
                    value={scannedPerson}
                    onChange={(e) => setScannedPerson(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-bold"
                  />
                </div>

                {/* Amount ₹ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount ₹</label>
                  <input
                    type="number"
                    value={scannedAmount}
                    onChange={(e) => setScannedAmount(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-bold"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                  <input
                    type="text"
                    value={scannedReason}
                    onChange={(e) => setScannedReason(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
                  />
                </div>

                {/* Date & Due Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={scannedDate}
                      onChange={(e) => setScannedDate(e.target.value)}
                      className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={scannedDueDate}
                      onChange={(e) => setScannedDueDate(e.target.value)}
                      className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                    />
                  </div>
                </div>

                {/* Private Note / Extracted Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Private Note (From Note / Chit)
                  </label>
                  <textarea
                    rows={2}
                    value={scannedNotes}
                    onChange={(e) => setScannedNotes(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                {/* Buttons: Cancel and Save Loan */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setScanStep('upload')}
                    className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveScannedLoan}
                    className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Loan</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Scan Error / Fallback */}
            {scanStep === 'error' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Could Not Read Clearly</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    {scanErrorMsg ||
                      'We could not read this note clearly. Please enter the details manually.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScanStep('upload')}
                    className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Try Another Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleFallbackManualEntry}
                    className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Enter Manually
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          6. MARK AS PAID CONFIRMATION DIALOG
          ======================================================== */}
      {settleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            id="modal-confirm-settle"
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4"
          >
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Mark this loan as fully paid?</h4>
              <p className="text-xs text-slate-500">
                {settleTarget.type === 'give'
                  ? `Confirm that ${settleTarget.person} paid you ${formatINR(settleTarget.amount)}.`
                  : `Confirm that you repaid ${formatINR(settleTarget.amount)} to ${settleTarget.person}.`}
              </p>
            </div>

            {/* Payment Method Selector for Settlement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Settled Via</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettlePaymentMode('UPI')}
                  className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                    settlePaymentMode === 'UPI'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettlePaymentMode('Cash')}
                  className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                    settlePaymentMode === 'Cash'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSettleTarget(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSettle}
                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. DELETE LOAN CONFIRMATION DIALOG
          ======================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            id="modal-confirm-delete"
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-5 space-y-3.5"
          >
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Delete this loan record?</h4>
              <p className="text-xs text-slate-500">
                Your personal loan history will be updated.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
