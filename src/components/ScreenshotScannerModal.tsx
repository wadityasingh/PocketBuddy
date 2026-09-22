import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  Copy,
  Check,
  ShoppingBag,
  Store,
  Wallet,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import { Transaction, PaymentMode, ExpenseCategory, WalletBalances } from '../types';

interface ScreenshotScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => boolean | void;
  existingTransactions?: Transaction[];
  wallets?: WalletBalances;
  availableUpi?: number;
}

interface ParsedReceiptData {
  isRealPaymentReceipt: boolean;
  securityCheckPassed: boolean;
  securityReason: string;
  appDetected: string;
  payee: string;
  payeeUpiId?: string;
  amount: number;
  date: string;
  time?: string;
  utr?: string;
  transactionId?: string;
  debitedAccount?: string;
  transferMessage?: string;
  suggestedPurpose?: string;
  category: ExpenseCategory;
}

// Authentic UPI Provider Logos
const PhonePeLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#5F259F" />
    <path
      d="M14.5 6.2H9.2C8.5 6.2 8 6.7 8 7.4V17.5C8 17.8 8.2 18 8.5 18H10.5C10.8 18 11 17.8 11 17.5V13.8H14.5C16.8 13.8 18.5 12.1 18.5 9.8C18.5 7.6 16.8 6.2 14.5 6.2ZM14.3 11.4H11V8.6H14.3C15.1 8.6 15.8 9.2 15.8 10C15.8 10.8 15.1 11.4 14.3 11.4Z"
      fill="#FFFFFF"
    />
  </svg>
);

const GooglePayLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <path
      d="M12 10.2V13.8H16.8C16.6 14.9 15.9 15.8 15 16.4L17.7 18.5C19.3 17 20.3 14.8 20.3 12.1C20.3 11.4 20.2 10.8 20.1 10.2H12Z"
      fill="#4285F4"
    />
    <path
      d="M6.3 14.7L3.6 16.8C5.3 20.1 8.8 22.3 12.9 22.3C15.7 22.3 18.1 21.4 19.8 19.8L17.1 17.7C16.1 18.4 14.7 18.8 12.9 18.8C9.9 18.8 7.3 16.9 6.3 14.7Z"
      fill="#34A853"
    />
    <path
      d="M6.3 9.3C7.3 7.1 9.9 5.2 12.9 5.2C14.7 5.2 16.2 5.9 17.3 6.9L19.9 4.3C18.1 2.6 15.7 1.7 12.9 1.7C8.8 1.7 5.3 3.9 3.6 7.2L6.3 9.3Z"
      fill="#EA4335"
    />
    <path
      d="M3.6 7.2C2.9 8.6 2.5 10.2 2.5 12C2.5 13.8 2.9 15.4 3.6 16.8L6.3 14.7C6.1 13.8 6 12.9 6 12C6 11.1 6.1 10.2 6.3 9.3L3.6 7.2Z"
      fill="#FBBC05"
    />
  </svg>
);

const PaytmLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#002E6E" />
    <text
      x="5.5"
      y="16"
      fill="#FFFFFF"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="10"
    >
      P
    </text>
    <text
      x="12"
      y="16"
      fill="#00BAF2"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="10"
    >
      tm
    </text>
  </svg>
);

const BhimLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#007934" />
    <path d="M7 17L13 7H9L7 17Z" fill="#FF7900" />
    <path d="M12 17L18 7H14L12 17Z" fill="#FFFFFF" />
  </svg>
);

const BankUpiLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#0F172A" />
    <path d="M5 9L12 5L19 9H5Z" fill="#F59E0B" />
    <path d="M6 10H8V15H6V10ZM11 10H13V15H11V10ZM16 10H18V15H16V10ZM5 16H19V18H5V16Z" fill="#FFFFFF" />
  </svg>
);

/**
 * Normalizes and compresses images client-side before sending over network.
 * Android cameras capture 12MP-48MP photos (4MB-15MB), which can timeout on mobile cellular networks,
 * hit proxy payload limits, or exhaust server memory.
 * This helper resizes to max 1600px dimension and outputs a sharp, lightweight JPEG (~200KB)
 * preserving 100% of OCR legibility for UTR numbers and receipt text.
 */
function optimizeImageForMobile(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file from device.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      if (!rawDataUrl) {
        return reject(new Error('Selected image file was empty.'));
      }

      // Check if browser Image loading is available
      const img = new Image();
      img.onerror = () => {
        // Fallback safely to raw data URL if Image element cannot parse
        const detectedMime =
          file.type && file.type.startsWith('image/')
            ? file.type === 'image/jpg' ? 'image/jpeg' : file.type
            : 'image/jpeg';
        resolve({ base64: rawDataUrl, mimeType: detectedMime });
      };

      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        // Downscale proportionally if larger than MAX_DIM
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: rawDataUrl, mimeType: 'image/jpeg' });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Fill white background before drawing, so transparent PNGs/screenshots don't turn into black boxes in JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-quality JPEG (0.90 quality provides razor-sharp text with minimal size ~150-250KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve({ base64: compressedDataUrl, mimeType: 'image/jpeg' });
      };

      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const ScreenshotScannerModal: React.FC<ScreenshotScannerModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  existingTransactions = [],
  wallets,
  availableUpi: propAvailableUpi,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authHint, setAuthHint] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Extracted data or Fallback Manual Mode (Requirement 8)
  const [parsedData, setParsedData] = useState<ParsedReceiptData | null>(null);
  const [isFallbackManual, setIsFallbackManual] = useState(false);

  // User-editable fields
  const [itemPurpose, setItemPurpose] = useState<string>('');
  const [editableAmount, setEditableAmount] = useState<number>(0);
  const [editablePayee, setEditablePayee] = useState<string>('');
  const [editableDate, setEditableDate] = useState<string>('');
  const [editableTime, setEditableTime] = useState<string>('');
  const [editableUtr, setEditableUtr] = useState<string>('');

  const availableUpi = propAvailableUpi !== undefined ? propAvailableUpi : (wallets?.upi ?? 0);
  const isInsufficientUpi = editableAmount > availableUpi;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste (Ctrl+V) support for desktop
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Clean reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setParsedData(null);
      setIsFallbackManual(false);
      setError(null);
      setAuthHint(null);
      setIsAnalyzing(false);
      setItemPurpose('');
      setEditableAmount(0);
      setEditablePayee('');
      setEditableUtr('');
      setEditableDate('');
      setEditableTime('');
      setIsPreviewExpanded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process uploaded image file with robust Android / mobile validation
  const processFile = async (file: File) => {
    if (!file) {
      setError('No file selected. Please choose a receipt image.');
      return;
    }

    // Android gallery/camera files may have empty or generic MIME types
    const fileName = (file.name || '').toLowerCase();
    const isImageMime = Boolean(file.type && file.type.startsWith('image/'));
    const isImageExt = /\.(png|jpe?g|webp|bmp|heic|heif|jfif)$/i.test(fileName);
    const isGenericMime = !file.type || file.type === 'application/octet-stream' || file.type === 'binary/octet-stream';

    if (!isImageMime && !isImageExt && !isGenericMime) {
      setError('Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    // Safety guard against massive corrupt files
    if (file.size > 25 * 1024 * 1024) {
      setError('File is too large (>25MB). Please upload a standard receipt screenshot or photo.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      // Optimize image client-side to ensure smooth mobile network upload
      const { base64, mimeType } = await optimizeImageForMobile(file);
      setSelectedImage(base64);
      await analyzeScreenshot(base64, mimeType);
    } catch (err: any) {
      console.error('Mobile image processing error:', err);
      setError(err?.message || 'Could not process the selected image. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Crucial for Android Chrome: Reset input value so selecting the same file triggers onChange
    e.target.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Call server to verify and parse receipt
  const analyzeScreenshot = async (base64Image: string, mime: string) => {
    setIsAnalyzing(true);
    setError(null);

    const controller = new AbortController();
    // 45s timeout to gracefully absorb Render cold-start delays & mobile network upload
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('/api/ai/parse-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: mime,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let resData: any = null;
      try {
        resData = await response.json();
      } catch {
        resData = {
          success: false,
          error: `Server responded with status ${response.status}. You can enter details manually below.`,
          fallbackAllowed: true,
        };
      }

      if (!response.ok || !resData.success || !resData.isRealPaymentReceipt) {
        const errorMsg =
          resData.error ||
          'AI Vision could not verify this receipt automatically. You can enter details manually below.';
        setError(errorMsg);
        setAuthHint(resData.authHint || null);

        // MOBILE FALLBACK (Requirement 8):
        // Keep the uploaded receipt image available, populate default manual fields, and let user proceed!
        setIsFallbackManual(true);
        setEditableDate(new Date().toISOString().split('T')[0]);
        setEditableTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        return;
      }

      const data: ParsedReceiptData = resData.data;
      setParsedData(data);
      setIsFallbackManual(false);
      setEditableAmount(data.amount || 0);
      setEditablePayee(data.payee || 'Merchant');
      setEditableUtr(data.utr || data.transactionId || '');
      setItemPurpose(data.suggestedPurpose || '');
      setEditableDate(data.date || new Date().toISOString().split('T')[0]);
      setEditableTime(
        data.time ||
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Receipt verification error:', err);

      let friendlyError =
        'AI verification service encountered a network issue. Your receipt is attached — please enter amount & payee manually below.';
      if (err.name === 'AbortError') {
        friendlyError =
          'Request timed out while waiting for server. Your receipt is saved — please enter amount & payee manually below.';
      }

      setError(friendlyError);

      // MOBILE FALLBACK (Requirement 8):
      // Keep receipt image and show manual entry fields so user is never blocked
      setIsFallbackManual(true);
      setEditableDate(new Date().toISOString().split('T')[0]);
      setEditableTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Duplicate check
  const duplicateTx =
    (parsedData || isFallbackManual) && (editableUtr || parsedData?.utr)
      ? existingTransactions.find(
          (t) =>
            (editableUtr && t.refId === editableUtr) ||
            (parsedData?.utr && t.refId === parsedData.utr)
        )
      : undefined;

  // Copy UTR
  const handleCopyUtr = (utrText: string) => {
    if (navigator.clipboard && utrText) {
      navigator.clipboard.writeText(utrText);
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    }
  };

  // Submit transaction
  const handleConfirmAdd = () => {
    if (editableAmount <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    // Insufficient Balance check for UPI
    if (editableAmount > availableUpi) {
      setError(
        `Insufficient UPI Balance! You only have ₹${availableUpi.toLocaleString('en-IN')} in your UPI balance, but this transaction is ₹${editableAmount.toFixed(2)}. Please top up your UPI wallet.`
      );
      return;
    }

    const trimmedPayee = editablePayee.trim() || 'UPI Merchant';
    const trimmedPurpose = itemPurpose.trim();

    // Title formatting: "Item Name (Payee)" or just "Item Name" or "Payee"
    const title = trimmedPurpose
      ? `${trimmedPurpose} (${trimmedPayee})`
      : trimmedPayee;

    const noteDetails = [
      parsedData?.appDetected ? `${parsedData.appDetected} UPI` : 'UPI Transfer',
      editableUtr ? `Ref: ${editableUtr}` : undefined,
      trimmedPurpose ? `Purpose: ${trimmedPurpose}` : undefined,
    ]
      .filter(Boolean)
      .join(' • ');

    const success = onAddTransaction({
      title,
      amount: editableAmount,
      type: 'expense',
      paymentMode: 'UPI' as PaymentMode,
      date: editableDate || new Date().toISOString().split('T')[0],
      time: editableTime || undefined,
      person: trimmedPayee,
      refId: editableUtr || undefined,
      notes: noteDetails,
      receiptImage: selectedImage || undefined,
    });

    if (success === false) return;

    onClose();
  };

  const showDetailForm = Boolean(parsedData || isFallbackManual);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div
        id="screenshot-scanner-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Upload UPI Receipt
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Extract payment details automatically and deduct from UPI balance
            </p>
          </div>

          <button
            type="button"
            id="close-screenshot-modal-btn"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Notification / Error Banner */}
          {error && (
            <div
              id="scanner-compact-error"
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs animate-fade-in space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold leading-tight">{error}</span>
                    {authHint && (
                      <p className="mt-1 text-[11px] text-amber-800 leading-relaxed font-normal bg-amber-100/70 p-2 rounded-lg border border-amber-200/60">
                        💡 {authHint}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAuthHint(null);
                  }}
                  className="text-amber-500 hover:text-amber-800 shrink-0 cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Dropzone (When not yet uploaded) */}
          {!showDetailForm && (
            <div className="space-y-3">
              <label
                htmlFor="upi-screenshot-input"
                id="upi-screenshot-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 block ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50 active:bg-slate-100'
                }`}
              >
                <input
                  id="upi-screenshot-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
                  className="sr-only"
                  onChange={handleFileInputChange}
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700">
                  <Upload className="w-5 h-5 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Tap to upload receipt from Gallery or Camera
                  </p>
                  <p className="text-xs text-slate-400">
                    PNG, JPG, or WEBP • Auto-compressed for mobile
                  </p>
                </div>
              </label>

              {/* Supported UPI Providers with Authentic Logos */}
              <div className="pt-1">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-400 mr-1">
                    Supports:
                  </span>

                  {/* PhonePe */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
                    <PhonePeLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>PhonePe</span>
                  </span>

                  {/* Google Pay */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
                    <GooglePayLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>Google Pay</span>
                  </span>

                  {/* Paytm */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
                    <PaytmLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>Paytm</span>
                  </span>

                  {/* BHIM */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
                    <BhimLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>BHIM</span>
                  </span>

                  {/* Any Bank UPI */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
                    <BankUpiLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>Bank UPI</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {isAnalyzing && (
            <div
              id="scanner-analyzing-card"
              className="p-6 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 animate-fade-in"
            >
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <div className="text-xs font-semibold text-slate-200">
                Verifying and extracting receipt details...
              </div>
            </div>
          )}

          {/* Extracted Details & User Edit Section (Also acts as Mobile Fallback) */}
          {showDetailForm && (
            <div
              id="verified-receipt-details-card"
              className="space-y-4 animate-fade-in"
            >
              {/* Receipt Preview Thumbnail (Requirement 8: Keep image available) */}
              {selectedImage && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800">
                        {isFallbackManual ? 'Attached Receipt (Manual Verification)' : 'Verified UPI Receipt'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs cursor-pointer"
                      >
                        {isPreviewExpanded ? (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-500" />
                            <span>Collapse</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-indigo-600" />
                            <span>View Image</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setParsedData(null);
                          setIsFallbackManual(false);
                          setSelectedImage(null);
                          setError(null);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Expandable Image Preview */}
                  {isPreviewExpanded && (
                    <div className="mt-1 rounded-lg overflow-hidden border border-slate-200 bg-slate-900/5 max-h-64 flex items-center justify-center">
                      <img
                        src={selectedImage}
                        alt="Receipt preview"
                        className="max-h-64 object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Duplicate Receipt Notice if applicable */}
              {duplicateTx && (
                <div
                  id="duplicate-receipt-warning"
                  className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-xs"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    A transaction with reference <span className="font-mono font-bold">{editableUtr}</span> was already recorded on {duplicateTx.date}.
                  </p>
                </div>
              )}

              {/* What Did You Buy? (Item / Purpose Input) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label
                  htmlFor="receipt-purpose-input"
                  className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>What did you buy? (Item / Purpose)</span>
                </label>
                <input
                  id="receipt-purpose-input"
                  type="text"
                  autoFocus
                  value={itemPurpose}
                  onChange={(e) => setItemPurpose(e.target.value)}
                  placeholder="e.g. Vegetables, Grocery, Lunch, Coffee, Stationery..."
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400"
                />
              </div>

              {/* Extracted / Editable Details Grid */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-500" />
                    <span>Transaction Details</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {parsedData?.appDetected ? `${parsedData.appDetected} Verified` : 'UPI Payment'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {/* Paid To */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Paid To (Recipient)
                    </label>
                    <input
                      id="receipt-payee-input"
                      type="text"
                      value={editablePayee}
                      onChange={(e) => setEditablePayee(e.target.value)}
                      placeholder="e.g. Ramu Kirana, Zomato"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">₹</span>
                      <input
                        id="receipt-amount-input"
                        type="number"
                        step="any"
                        value={editableAmount || ''}
                        onChange={(e) => setEditableAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Date
                    </label>
                    <input
                      id="receipt-date-input"
                      type="date"
                      value={editableDate}
                      onChange={(e) => setEditableDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  {/* Time (Optional) */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Time
                    </label>
                    <input
                      id="receipt-time-input"
                      type="text"
                      value={editableTime}
                      onChange={(e) => setEditableTime(e.target.value)}
                      placeholder="e.g. 10:30 PM"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* UTR / Ref ID */}
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    UPI Reference / UTR (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="receipt-utr-input"
                      type="text"
                      value={editableUtr}
                      onChange={(e) => setEditableUtr(e.target.value)}
                      placeholder="12-digit UTR or Transaction Ref"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    {editableUtr && (
                      <button
                        type="button"
                        onClick={() => handleCopyUtr(editableUtr)}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy UTR"
                      >
                        {copiedUtr ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Source Notice & Live UPI Balance */}
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>UPI Balance Available: <strong className="text-slate-900">₹{availableUpi.toLocaleString('en-IN')}</strong></span>
                    </span>
                    <span className={`font-bold ${isInsufficientUpi ? 'text-rose-600' : 'text-slate-700'}`}>
                      -₹{(editableAmount || 0).toFixed(2)}
                    </span>
                  </div>

                  {isInsufficientUpi && (
                    <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-semibold">
                        Insufficient UPI Balance! Available: ₹{availableUpi.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Expense Button */}
              <button
                id="confirm-parsed-expense-btn"
                type="button"
                disabled={editableAmount <= 0 || isInsufficientUpi}
                onClick={handleConfirmAdd}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                  isInsufficientUpi
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer active:scale-[0.99]'
                }`}
              >
                <span>
                  {isInsufficientUpi
                    ? `Insufficient UPI Balance (Avail: ₹${availableUpi.toLocaleString('en-IN')})`
                    : `Add Expense • ₹${(editableAmount || 0).toFixed(2)}`}
                </span>
                {!isInsufficientUpi && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Footer cancel when not parsed */}
          {!showDetailForm && (
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                id="cancel-scanner-modal-btn"
                onClick={onClose}
                className="py-1.5 px-3.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

