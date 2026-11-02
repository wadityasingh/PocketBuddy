import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  X,
  FileDown,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Receipt,
} from 'lucide-react';
import { Transaction, RoomGroup, StudentUser } from '../types';
import {
  createLedgerPDFDoc,
  createRoomLedgerPDFDoc,
  generateLedgerPDF,
  generateRoomLedgerPDF,
} from '../utils/pdfGenerator';
import {
  sendEmailExpenseReport,
  isValidEmail,
  getActiveEmailJsConfig,
} from '../utils/emailService';

export interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'mymoney' | 'myroom';
  currentUser: StudentUser | null;
  personalTransactions?: Transaction[];
  roomGroups?: RoomGroup[];
  currentRoom?: RoomGroup | null;
}

export type DateRangePreset = 'this_month' | 'last_30_days' | 'all' | 'custom';

export const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  currentUser,
  personalTransactions = [],
  roomGroups = [],
  currentRoom = null,
}) => {
  // Recipient form state
  const [recipientEmail, setRecipientEmail] = useState('');

  // Room selection (for room report)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Date range presets
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Status & Feedback
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize defaults on modal open
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setIsSending(false);
      setIsDownloading(false);

      // Pre-fill recipient details from authenticated user
      if (currentUser?.email) {
        setRecipientEmail(currentUser.email);
      }

      // Default selected room
      if (currentRoom?.id) {
        setSelectedRoomId(currentRoom.id);
      } else if (roomGroups.length > 0) {
        setSelectedRoomId(roomGroups[0].id);
      }

      // Initialize dates for custom picker
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];
      setCustomStartDate(firstDayOfMonth);
      setCustomEndDate(today);
    }
  }, [isOpen, currentUser, currentRoom, roomGroups]);

  // Compute active date boundaries
  const { startDate, endDate, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (dateRangePreset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthName = now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return {
        startDate: start,
        endDate: today,
        dateRangeLabel: `This Month (${monthName})`,
      };
    }

    if (dateRangePreset === 'last_30_days') {
      const past30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      return {
        startDate: past30,
        endDate: today,
        dateRangeLabel: 'Last 30 Days',
      };
    }

    if (dateRangePreset === 'custom') {
      const s = customStartDate || today;
      const e = customEndDate || today;
      return {
        startDate: s,
        endDate: e,
        dateRangeLabel: `${s} to ${e}`,
      };
    }

    return {
      startDate: undefined,
      endDate: undefined,
      dateRangeLabel: 'All Time',
    };
  }, [dateRangePreset, customStartDate, customEndDate]);

  // Active room instance
  const activeRoom = useMemo(() => {
    if (!selectedRoomId) return currentRoom || (roomGroups.length > 0 ? roomGroups[0] : null);
    return roomGroups.find((r) => r.id === selectedRoomId) || currentRoom || null;
  }, [selectedRoomId, roomGroups, currentRoom]);

  // Filter preview counts
  const previewStats = useMemo(() => {
    if (reportType === 'mymoney') {
      let filtered = personalTransactions;
      if (startDate) filtered = filtered.filter((t) => !t.date || t.date.split('T')[0] >= startDate);
      if (endDate) filtered = filtered.filter((t) => !t.date || t.date.split('T')[0] <= endDate);

      const exp = filtered.filter((t) => t.type === 'expense').reduce((a, t) => a + (Number(t.amount) || 0), 0);
      return {
        count: filtered.length,
        totalAmount: exp,
      };
    } else {
      const expList = Array.isArray(activeRoom?.expenses) ? activeRoom.expenses : [];
      let filtered = expList;
      if (startDate) filtered = filtered.filter((e) => !e.date || e.date.split('T')[0] >= startDate);
      if (endDate) filtered = filtered.filter((e) => !e.date || e.date.split('T')[0] <= endDate);

      const total = filtered.reduce((a, e) => a + (Number(e.totalAmount ?? e.amount) || 0), 0);
      return {
        count: filtered.length,
        totalAmount: total,
      };
    }
  }, [reportType, personalTransactions, activeRoom, startDate, endDate]);

  if (!isOpen) return null;

  // Handle direct download
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    setStatusMessage(null);
    try {
      if (reportType === 'mymoney') {
        generateLedgerPDF({
          transactions: personalTransactions,
          studentName: currentUser?.name || 'Student',
          startDate,
          endDate,
          dateRangeLabel,
        });
      } else {
        if (!activeRoom) throw new Error('No active room selected.');
        generateRoomLedgerPDF({
          room: activeRoom,
          currentUserName: currentUser?.name || 'You',
          currentUserId: currentUser?.id,
          startDate,
          endDate,
          dateRangeLabel,
        });
      }
    } catch (err: any) {
      console.error('Download error:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to generate PDF.' });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle sending email with real PDF attachment via EmailJS
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const emailTrimmed = recipientEmail.trim();
    if (!emailTrimmed || !isValidEmail(emailTrimmed)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }

    if (reportType === 'myroom' && !activeRoom) {
      setStatusMessage({ type: 'error', text: 'Please select a room to generate the report.' });
      return;
    }

    setIsSending(true);

    try {
      let pdfResult;
      let emailSubject = '';
      let reportTypeTitle: 'Personal Expense Report' | 'Room Shared Expense Report';

      if (reportType === 'mymoney') {
        pdfResult = createLedgerPDFDoc({
          transactions: personalTransactions,
          studentName: currentUser?.name || 'Student',
          startDate,
          endDate,
          dateRangeLabel,
        });
        emailSubject = `PocketBuddy Personal Expense Report (${dateRangeLabel})`;
        reportTypeTitle = 'Personal Expense Report';
      } else {
        pdfResult = createRoomLedgerPDFDoc({
          room: activeRoom!,
          currentUserName: currentUser?.name || 'You',
          currentUserId: currentUser?.id,
          startDate,
          endDate,
          dateRangeLabel,
        });
        emailSubject = `PocketBuddy Room Expense Report: ${activeRoom?.name} (${dateRangeLabel})`;
        reportTypeTitle = 'Room Shared Expense Report';
      }

      // Dispatch via EmailJS (template_bdkyd5o)
      const sendRes = await sendEmailExpenseReport({
        toEmail: emailTrimmed,
        toName: currentUser?.name || emailTrimmed.split('@')[0],
        subject: emailSubject,
        reportType: reportTypeTitle,
        dateRange: dateRangeLabel,
        filename: pdfResult.filename,
        pdfDataUri: pdfResult.dataUri,
      });

      if (sendRes.success) {
        setStatusMessage({
          type: 'success',
          text: `Expense report successfully sent to ${emailTrimmed}.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: sendRes.message || 'Failed to send email. Please check your network.',
        });
      }
    } catch (err: any) {
      console.error('Email send exception:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'An error occurred while sending the PDF report.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const isRoomMode = reportType === 'myroom';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 text-left relative overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                isRoomMode
                  ? 'bg-rose-50 text-red-600 border border-rose-200/80'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-200/80'
              }`}
            >
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                {isRoomMode ? 'Email Room Statement' : 'Email Expense Report'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isRoomMode ? `Shared Room: ${activeRoom?.name || 'Selected Room'}` : 'Personal Money Statement (PDF)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Form */}
        <form onSubmit={handleSendEmail} className="mt-3.5 space-y-3.5">
          {/* Status Banners */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* 1. Recipient Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Send PDF to Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="your.email@gmail.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={isSending}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-white transition disabled:opacity-60 shadow-2xs"
              />
            </div>
          </div>

          {/* 2. Room Selection (Only if Room Report) */}
          {isRoomMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  disabled={isSending}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-rose-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 bg-white transition disabled:opacity-60 shadow-2xs"
                >
                  {roomGroups.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.members?.length || 0} members)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 3. Date Range (Clean Segmented Pills) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Statement Period
              </label>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {dateRangeLabel}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'this_month', label: 'This Month' },
                { id: 'last_30_days', label: '30 Days' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={isSending}
                  onClick={() => setDateRangePreset(p.id as DateRangePreset)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                    dateRangePreset === p.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Dates (Only if Custom Selected) */}
            {dateRangePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">From</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    disabled={isSending}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">To</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    disabled={isSending}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Compact Summary Chip */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {previewStats.count} {isRoomMode ? 'room expenses' : 'transactions'}
              </span>
            </div>
            <span className="font-black text-slate-900">
              Total: ₹{Math.round(previewStats.totalAmount).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            {/* Quick Download PDF */}
            <button
              type="button"
              disabled={isSending || isDownloading}
              onClick={handleDownloadPDF}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download PDF directly"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </button>

            {/* Email Send Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !recipientEmail.trim() || (isRoomMode && !activeRoom)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 ${
                  isRoomMode
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
