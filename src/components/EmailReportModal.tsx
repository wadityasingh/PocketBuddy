import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  X,
  FileDown,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  Receipt,
  ShieldCheck,
  User,
  Settings,
  ChevronDown,
  ChevronUp,
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
  saveEmailJsConfig,
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

export type DateRangePreset = 'all' | 'this_month' | 'last_30_days' | 'last_90_days' | 'custom';

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
  const [recipientName, setRecipientName] = useState('');

  // Room selection (for room report)
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Date range presets
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // EmailJS configuration state (defaults to verified credentials)
  const [showConfig, setShowConfig] = useState(false);
  const [serviceIdInput, setServiceIdInput] = useState('');
  const [templateIdInput, setTemplateIdInput] = useState('');
  const [publicKeyInput, setPublicKeyInput] = useState('');

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

      // Load active EmailJS config
      const activeCfg = getActiveEmailJsConfig();
      setServiceIdInput(activeCfg.serviceId);
      setTemplateIdInput(activeCfg.templateId);
      setPublicKeyInput(activeCfg.publicKey);

      // Pre-fill recipient details from authenticated user
      if (currentUser?.email) {
        setRecipientEmail(currentUser.email);
      }
      if (currentUser?.name) {
        setRecipientName(currentUser.name);
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
        dateRangeLabel: `Last 30 Days (${past30} to ${today})`,
      };
    }

    if (dateRangePreset === 'last_90_days') {
      const past90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      return {
        startDate: past90,
        endDate: today,
        dateRangeLabel: `Last 90 Days (${past90} to ${today})`,
      };
    }

    if (dateRangePreset === 'custom') {
      const s = customStartDate || today;
      const e = customEndDate || today;
      return {
        startDate: s,
        endDate: e,
        dateRangeLabel: `Custom Range (${s} to ${e})`,
      };
    }

    return {
      startDate: undefined,
      endDate: undefined,
      dateRangeLabel: 'All Time History',
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
      const inc = filtered.filter((t) => t.type === 'income').reduce((a, t) => a + (Number(t.amount) || 0), 0);
      return {
        count: filtered.length,
        totalAmount: exp,
        incomeAmount: inc,
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
        incomeAmount: 0,
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

    // Persist any updated configuration
    saveEmailJsConfig({
      serviceId: serviceIdInput,
      templateId: templateIdInput,
      publicKey: publicKeyInput,
    });

    setIsSending(true);

    try {
      // 1. Generate the PDF and get Data URI
      let pdfResult;
      let emailSubject = '';
      let reportTypeTitle: 'Personal Expense Report' | 'Room Shared Expense Report';

      if (reportType === 'mymoney') {
        pdfResult = createLedgerPDFDoc({
          transactions: personalTransactions,
          studentName: currentUser?.name || recipientName || 'Student',
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

      // 2. Dispatch via EmailJS with real PDF attachment
      const sendRes = await sendEmailExpenseReport({
        toEmail: emailTrimmed,
        toName: recipientName.trim() || emailTrimmed.split('@')[0],
        subject: emailSubject,
        reportType: reportTypeTitle,
        dateRange: dateRangeLabel,
        filename: pdfResult.filename,
        pdfDataUri: pdfResult.dataUri,
        customServiceId: serviceIdInput.trim() || undefined,
        customTemplateId: templateIdInput.trim() || undefined,
        customPublicKey: publicKeyInput.trim() || undefined,
      });

      if (sendRes.success) {
        setStatusMessage({
          type: 'success',
          text: `Expense report successfully sent to your email address (${emailTrimmed}).`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: sendRes.message || 'Failed to send email. Please check your EmailJS setup.',
        });
      }
    } catch (err: any) {
      console.error('Email send exception:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'An unexpected error occurred while generating or sending the PDF.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const isRoomMode = reportType === 'myroom';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-left relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                isRoomMode
                  ? 'bg-gradient-to-br from-rose-50 to-red-100 text-red-600 border border-rose-200'
                  : 'bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 border border-indigo-200'
              }`}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {isRoomMode ? 'Email Room Expense Statement' : 'Email My Money Expense Report'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isRoomMode
                  ? 'Send complete roommate splits & settlement ledger as PDF'
                  : 'Send personal cash & UPI transaction statement as PDF'}
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSendEmail} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Status Banners */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-start gap-2.5 transition animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-snug">
                <span>{statusMessage.text}</span>
              </div>
            </div>
          )}

          {/* 1. Recipient Details */}
          <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Recipient Information
            </span>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="e.g., student@university.edu"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={isSending}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white transition disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g., Aditya Singh"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={isSending}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white transition disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* 2. Room Selection (Only for Room Report) */}
          {isRoomMode && (
            <div className="space-y-1.5 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100">
              <label className="block text-xs font-bold text-slate-800">
                Select Room *
              </label>
              {roomGroups.length === 0 ? (
                <p className="text-xs text-rose-700">No rooms found. Please create or join a room first.</p>
              ) : (
                <div className="relative">
                  <Building2 className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    disabled={isSending}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-rose-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 bg-white transition disabled:opacity-60"
                  >
                    {roomGroups.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.members?.length || 0} members • Code: {r.inviteCode || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 3. Date Range Selector */}
          <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Select Date Range
              </span>
              <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {dateRangeLabel}
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'this_month', label: 'This Month' },
                { id: 'last_30_days', label: 'Last 30 Days' },
                { id: 'last_90_days', label: 'Last 90 Days' },
                { id: 'all', label: 'All Time' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={isSending}
                  onClick={() => setDateRangePreset(p.id as DateRangePreset)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    dateRangePreset === p.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range button & inputs */}
            <div className="pt-1">
              <button
                type="button"
                disabled={isSending}
                onClick={() => setDateRangePreset('custom')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                  dateRangePreset === 'custom'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Specify Custom Start & End Date</span>
              </button>

              {dateRangePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/80 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      disabled={isSending}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      disabled={isSending}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Preview / Summary Box */}
          <div className="p-3 rounded-2xl bg-slate-100/70 border border-slate-200/90 text-xs flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500" />
              <span>
                Statement contains <strong>{previewStats.count}</strong> {isRoomMode ? 'shared expenses' : 'transactions'}
              </span>
            </div>
            <span className="font-extrabold text-slate-900">
              Total: ₹{Math.round(previewStats.totalAmount).toLocaleString('en-IN')}
            </span>
          </div>

          {/* 5. Collapsible EmailJS Configuration */}
          <div className="rounded-2xl border border-slate-200/90 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between text-slate-600 font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>EmailJS Setup (Template: <code className="text-indigo-600 font-mono font-bold">{templateIdInput || 'template_bdkyd5o'}</code>)</span>
              </div>
              {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showConfig && (
              <div className="p-3 bg-white space-y-2.5 border-t border-slate-200 animate-in fade-in">
                <p className="text-[11px] text-slate-500 leading-tight">
                  Configured from your EmailJS dashboard. You can edit these values anytime if you create a new template.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Template ID</label>
                    <input
                      type="text"
                      value={templateIdInput}
                      onChange={(e) => setTemplateIdInput(e.target.value)}
                      placeholder="template_bdkyd5o"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px] bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Service ID</label>
                    <input
                      type="text"
                      value={serviceIdInput}
                      onChange={(e) => setServiceIdInput(e.target.value)}
                      placeholder="service_lwtnlfj"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px] bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Public Key</label>
                  <input
                    type="text"
                    value={publicKeyInput}
                    onChange={(e) => setPublicKeyInput(e.target.value)}
                    placeholder="3_T_VU-UbX05S1yd2"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px] bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Security & Attachment note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Real PDF file will be attached directly to the email via EmailJS with your verified data.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            {/* Direct Download button */}
            <button
              type="button"
              disabled={isSending || isDownloading}
              onClick={handleDownloadPDF}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </button>

            {/* Email Send button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !recipientEmail.trim() || (isRoomMode && !activeRoom)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 ${
                  isRoomMode
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800'
                }`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending PDF Report...</span>
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
