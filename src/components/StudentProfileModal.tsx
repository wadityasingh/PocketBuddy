import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Camera,
  LogOut,
  Pencil,
  Check,
  X,
  ShieldCheck,
  Crown,
  Trash2,
} from 'lucide-react';
import { StudentUser } from '../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StudentUser;
  onUpdateUser?: (updated: StudentUser) => void;
  onLogout: () => void;
  onOpenGuide?: () => void;
  onOpenSetupWizard?: () => void;
  onResetData?: () => void;
}

/**
 * Optimizes profile photos client-side to ensure smooth upload and snappy rendering.
 */
function optimizeProfilePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (!dataUrl) return reject(new Error('Empty image file.'));

      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

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
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Crisp UPI icon component matching the official NPCI chevron symbol
 */
const UpiIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M5 18L11 6H14.5L8.5 18H5Z" fill="currentColor" />
    <path d="M12 18L18 6H21.5L15.5 18H12Z" fill="currentColor" opacity="0.8" />
  </svg>
);

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
}) => {
  // Fields: ONLY Name, College, and UPI ID
  const [name, setName] = useState(user.name || '');
  const [collegeName, setCollegeName] = useState(user.collegeName || '');
  const [upiId, setUpiId] = useState(user.upiId || '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(user.photoUrl);

  // Active editing field: 'name' | 'college' | 'upi' | null
  const [editingField, setEditingField] = useState<'name' | 'college' | 'upi' | null>(null);
  const [tempValue, setTempValue] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleStartEdit = (field: 'name' | 'college' | 'upi') => {
    setEditingField(field);
    if (field === 'name') setTempValue(name);
    if (field === 'college') setTempValue(collegeName);
    if (field === 'upi') setTempValue(upiId);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleSaveField = (field: 'name' | 'college' | 'upi') => {
    const val = tempValue.trim();
    let updatedName = name;
    let updatedCollege = collegeName;
    let updatedUpi = upiId;

    if (field === 'name') {
      if (!val) return;
      setName(val);
      updatedName = val;
    } else if (field === 'college') {
      setCollegeName(val);
      updatedCollege = val;
    } else if (field === 'upi') {
      setUpiId(val);
      updatedUpi = val;
    }

    setEditingField(null);
    setTempValue('');

    const updatedUser: StudentUser = {
      ...user,
      name: updatedName,
      collegeName: updatedCollege || undefined,
      upiId: updatedUpi || undefined,
      photoUrl: photoUrl || undefined,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);
      const optimized = await optimizeProfilePhoto(file);
      setPhotoUrl(optimized);

      const updatedUser: StudentUser = {
        ...user,
        photoUrl: optimized,
      };
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Photo optimization error:', err);
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
    const updatedUser: StudentUser = {
      ...user,
      photoUrl: undefined,
    };
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-fade-in">
      <div
        id="settings-profile-modal"
        className="relative w-full h-full sm:h-auto sm:max-w-md bg-[#840a2a] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[100vh] sm:max-h-[92vh] border-0 sm:border sm:border-rose-900/40"
      >
        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* Top Header with Crimson Gradient matching screenshot */}
        <div className="bg-gradient-to-r from-[#7a0624] via-[#940b30] to-[#c21845] px-5 pt-6 pb-6 text-white shrink-0 relative overflow-hidden">
          {/* Subtle background glow/circle */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            {/* Left: Back Button & Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="close-settings-modal-btn"
                onClick={onClose}
                className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 transition-colors cursor-pointer active:scale-95"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                  Settings
                </h2>
                <p className="text-xs text-rose-100/90 font-normal">
                  Manage your account
                </p>
              </div>
            </div>

            {/* Right: Cursive Script */}
            <div className="text-right pointer-events-none select-none">
              <span className="font-serif italic text-rose-100/90 text-xs sm:text-sm tracking-wide transform -rotate-2 inline-block">
                Save More Smarter Money
              </span>
            </div>
          </div>
        </div>

        {/* Main Content White Container */}
        <div className="bg-white flex-1 rounded-t-[28px] -mt-3 overflow-y-auto p-4 sm:p-5 space-y-4 relative z-10">
          
          {/* Top Profile Card matching screenshot */}
          <div className="bg-gradient-to-b from-rose-50/50 via-white to-white border border-rose-100/70 rounded-3xl p-4 flex items-start justify-between relative shadow-xs">
            {/* Left: Avatar & User Info */}
            <div className="flex items-center gap-3.5">
              {/* Avatar Circle with Camera Badge */}
              <div className="relative shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-white shadow-md overflow-hidden bg-rose-100 flex items-center justify-center cursor-pointer hover:opacity-95 transition active:scale-95"
                  title="Tap to change profile photo"
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={name || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-600 to-red-700 text-white font-extrabold text-2xl flex items-center justify-center">
                      {name ? name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                {/* Camera Badge Icon */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center border-2 border-white shadow-sm cursor-pointer transition active:scale-90"
                  title="Upload photo"
                  aria-label="Change photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              {/* Text Info */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Hello,
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  {name || 'Student'}
                </h3>
                <span className="text-xs text-slate-400 font-medium block">
                  Student
                </span>

                {/* PocketBuddy User Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100/80 text-rose-700 font-bold text-[10px] mt-1">
                  <Crown className="w-3 h-3 text-rose-600" />
                  <span>PocketBuddy User</span>
                </div>
              </div>
            </div>

            {/* Right: Quote Block matching screenshot */}
            <div className="text-right pt-0.5">
              <span className="text-rose-600 text-2xl font-serif font-black leading-none block -mb-1">
                “
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium italic leading-tight max-w-[100px]">
                Track today for a better tomorrow
              </p>
              <div className="w-10 h-0.5 bg-rose-300 rounded-full ml-auto mt-1" />
            </div>
          </div>

          {/* Photo Actions if photo uploaded */}
          {photoUrl && (
            <div className="flex justify-center items-center gap-3 text-[11px] text-slate-400 -mt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="text-rose-600 font-semibold hover:underline cursor-pointer"
              >
                {photoUploading ? 'Uploading...' : 'Change photo'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove photo</span>
              </button>
            </div>
          )}

          {/* Personal Information Section Header */}
          <div className="pt-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Personal Information
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Keep your details up to date
            </p>
          </div>

          {/* Success Toast */}
          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Details saved successfully!</span>
            </div>
          )}

          {/* 3 Detail Cards: Name, College, UPI ID */}
          <div className="space-y-3">
            
            {/* 1. NAME ROW */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between hover:border-rose-300 transition-colors shadow-xs">
              <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                {/* Red Circular Icon */}
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <User className="w-5 h-5" />
                </div>

                {editingField === 'name' ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="Enter your name"
                      autoFocus
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-rose-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('name');
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveField('name')}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleStartEdit('name')}
                  >
                    <span className="text-[11px] text-slate-400 font-medium block">
                      Name
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                      {name || 'Add your name'}
                    </span>
                  </div>
                )}
              </div>

              {editingField !== 'name' && (
                <button
                  type="button"
                  onClick={() => handleStartEdit('name')}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="Edit Name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 2. COLLEGE ROW */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between hover:border-rose-300 transition-colors shadow-xs">
              <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                {/* Red Circular Icon */}
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>

                {editingField === 'college' ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="e.g. ABC College, Gorakhpur"
                      autoFocus
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-rose-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('college');
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveField('college')}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleStartEdit('college')}
                  >
                    <span className="text-[11px] text-slate-400 font-medium block">
                      College
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                      {collegeName || 'ABC College, Gorakhpur'}
                    </span>
                  </div>
                )}
              </div>

              {editingField !== 'college' && (
                <button
                  type="button"
                  onClick={() => handleStartEdit('college')}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="Edit College"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 3. UPI ID ROW */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between hover:border-rose-300 transition-colors shadow-xs">
              <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                {/* Red Circular UPI Icon */}
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <UpiIcon className="w-5 h-5" />
                </div>

                {editingField === 'upi' ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="e.g. test1@upi"
                      autoFocus
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-rose-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('upi');
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveField('upi')}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleStartEdit('upi')}
                  >
                    <span className="text-[11px] text-slate-400 font-medium block">
                      UPI ID
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                      {upiId || 'test1@upi'}
                    </span>
                  </div>
                )}
              </div>

              {editingField !== 'upi' && (
                <button
                  type="button"
                  onClick={() => handleStartEdit('upi')}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="Edit UPI ID"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Log Out Button matching screenshot */}
          <div className="pt-1">
            <button
              id="settings-logout-btn"
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full py-3.5 px-4 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/90 text-red-600 hover:text-red-700 text-sm font-bold transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] shadow-xs"
            >
              <LogOut className="w-4 h-4 text-red-600 stroke-[2.5]" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Shield Trust Badge matching screenshot */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-600 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-700 leading-tight">
                Your data is safe with us
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Manage your account securely
              </div>
            </div>
          </div>

          {/* PocketBuddy Branding Footer matching screenshot */}
          <div className="pt-2 pb-2 text-center flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" stroke="currentColor" strokeWidth="1">
                  <path d="M21 7H3a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2zm-2 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                </svg>
              </div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                Pocket<span className="text-red-600">Buddy</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              v1.0.0 • Built for Students
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
